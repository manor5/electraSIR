"""
Electors 2026 Data Import Script
----------------------------------
Reads a CSV or Excel file, cleans the data with pandas,
and upserts records into the electors_2026 table.

Usage:
    python3 scripts/import_electors.py --file path/to/data.csv
    python3 scripts/import_electors.py --file path/to/data.xlsx --dry-run

Expected columns in source file (case-insensitive):
    voter_id, serial_no, name, relation_name, relation_type,
    age, year, status_2025, new_migrant, party_support,
    family_leader, booth_id, ward, gender
"""

import argparse
import sys
import os
from urllib.parse import urlparse

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:ASzfsdpoXmeHSmrovzuRAEdLgrryeKIB@metro.proxy.rlwy.net:59255/railway",
)

EXPECTED_COLUMNS = [
    "voter_id",
    "serial_no",
    "name",
    "relation_name",
    "relation_type",
    "age",
    "year",
    "status_2025",
    "new_migrant",
    "party_support",
    "family_leader",
    "booth_id",
    "ward",
    "gender",
]


def connect():
    url = urlparse(DATABASE_URL)
    return psycopg2.connect(
        host=url.hostname,
        port=url.port,
        dbname=url.path.lstrip("/"),
        user=url.username,
        password=url.password,
        sslmode="require",
    )


def load_file(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(path, dtype=str)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(path, dtype=str)
    else:
        print(f"Unsupported file type: {ext}. Use .csv, .xlsx, or .xls")
        sys.exit(1)
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    # Normalise column names
    df.columns = df.columns.str.strip().str.lower().str.replace(r"\s+", "_", regex=True)

    # Check required columns exist
    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        print(f"Missing columns in source file: {missing}")
        print(f"Found columns: {list(df.columns)}")
        sys.exit(1)

    df = df[EXPECTED_COLUMNS].copy()

    # Strip whitespace from all string fields
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    # Uppercase voter_id
    df["voter_id"] = df["voter_id"].str.upper()

    # Normalise gender
    df["gender"] = df["gender"].str.upper().map({"M": "M", "F": "F", "MALE": "M", "FEMALE": "F"})

    # Convert numeric columns
    for col in ("age", "year", "serial_no", "booth_id", "ward"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop rows without voter_id
    before = len(df)
    df = df.dropna(subset=["voter_id"])
    dropped = before - len(df)
    if dropped:
        print(f"  Dropped {dropped} rows with missing voter_id")

    # Deduplicate on voter_id (keep last)
    before = len(df)
    df = df.drop_duplicates(subset=["voter_id"], keep="last")
    dupes = before - len(df)
    if dupes:
        print(f"  Removed {dupes} duplicate voter_id rows (kept last)")

    # Replace pandas NA with None for psycopg2
    df = df.where(pd.notna(df), None)

    return df


def upsert(df: pd.DataFrame, conn, dry_run: bool):
    rows = [tuple(row) for row in df[EXPECTED_COLUMNS].itertuples(index=False)]

    sql = """
        INSERT INTO electors_2026 (
            voter_id, serial_no, name, relation_name, relation_type,
            age, year, status_2025, new_migrant, party_support,
            family_leader, booth_id, ward, gender
        ) VALUES %s
        ON CONFLICT (voter_id) DO UPDATE SET
            serial_no      = EXCLUDED.serial_no,
            name           = EXCLUDED.name,
            relation_name  = EXCLUDED.relation_name,
            relation_type  = EXCLUDED.relation_type,
            age            = EXCLUDED.age,
            year           = EXCLUDED.year,
            status_2025    = EXCLUDED.status_2025,
            new_migrant    = EXCLUDED.new_migrant,
            party_support  = EXCLUDED.party_support,
            family_leader  = EXCLUDED.family_leader,
            booth_id       = EXCLUDED.booth_id,
            ward           = EXCLUDED.ward,
            gender         = EXCLUDED.gender
    """

    if dry_run:
        print(f"  [dry-run] Would upsert {len(rows)} rows — no changes written.")
        return

    with conn.cursor() as cur:
        execute_values(cur, sql, rows, page_size=500)
    conn.commit()
    print(f"  Upserted {len(rows)} rows into electors_2026.")


def main():
    parser = argparse.ArgumentParser(description="Import electors data into electors_2026 table")
    parser.add_argument("--file", required=True, help="Path to CSV or Excel file")
    parser.add_argument("--dry-run", action="store_true", help="Clean and validate without writing to DB")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"File not found: {args.file}")
        sys.exit(1)

    print(f"Loading {args.file} ...")
    df = load_file(args.file)
    print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")

    print("Cleaning data ...")
    df = clean(df)
    print(f"  {len(df)} rows ready after cleaning")

    print("Connecting to database ...")
    conn = connect()
    print("  Connected")

    upsert(df, conn, dry_run=args.dry_run)

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
