"""
Parties Import Script
-----------------------
Creates the parties table from Sheet3-Table 1.csv.
This table is used to auto-resolve alliance names when
filling election_results 2026 columns.

Usage:
    python3 scripts/create_parties.py
    python3 scripts/create_parties.py --dry-run
"""

import argparse
import os
from urllib.parse import urlparse

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:ASzfsdpoXmeHSmrovzuRAEdLgrryeKIB@metro.proxy.rlwy.net:59255/railway",
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "Sheet3-Table 1.csv")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS parties (
    id               SERIAL PRIMARY KEY,
    party_short_name TEXT NOT NULL,
    party_full_name  TEXT NOT NULL,
    alliance         TEXT NOT NULL,
    UNIQUE (party_short_name)
);
"""

INSERT_SQL = """
INSERT INTO parties (party_short_name, party_full_name, alliance)
VALUES %s
ON CONFLICT (party_short_name) DO UPDATE SET
    party_full_name = EXCLUDED.party_full_name,
    alliance        = EXCLUDED.alliance;
"""


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


def load_and_clean() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, header=None, usecols=[0, 1, 2], dtype=str)
    df.columns = ["party_short_name", "party_full_name", "alliance"]
    for col in df.columns:
        df[col] = df[col].str.strip()
    df = df.dropna(subset=["party_short_name"])
    return df


def main():
    parser = argparse.ArgumentParser(description="Create and populate parties table")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, no DB writes")
    args = parser.parse_args()

    print(f"Loading {CSV_PATH} ...")
    df = load_and_clean()
    print(f"  {len(df)} parties found")
    print(df.to_string(index=False))

    if args.dry_run:
        print("\n[dry-run] Skipping DB write.")
        return

    print("\nConnecting to database ...")
    conn = connect()
    print("  Connected")

    rows = list(df.itertuples(index=False, name=None))

    with conn.cursor() as cur:
        print("Creating table if not exists ...")
        cur.execute(CREATE_TABLE_SQL)
        execute_values(cur, INSERT_SQL, rows)
        print(f"  Upserted {len(rows)} rows into parties")

    conn.commit()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
