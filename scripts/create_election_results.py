"""
Election Results Import Script
--------------------------------
Creates the election_results table and inserts data from Sheet1-Table 1.csv.

Usage:
    python3 scripts/create_election_results.py
    python3 scripts/create_election_results.py --dry-run
"""

import argparse
import os
import sys
from urllib.parse import urlparse

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:ASzfsdpoXmeHSmrovzuRAEdLgrryeKIB@metro.proxy.rlwy.net:59255/railway",
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "Sheet1-Table 1.csv")

COLUMN_MAP = {
    "Constituency Name": "constituency_name",
    "Winner Party":      "lead_party",
    "Winner Votes":      "lead_count",
    "Runner Party":      "runner_party",
    "Runner Votes":      "runner_count",
    "Total Votes Polled":"total_counted",
    "Win Alliance":      "win_alliance",
}

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS election_results (
    id                       SERIAL PRIMARY KEY,
    constituency_name        TEXT    NOT NULL,
    lead_party               TEXT,
    lead_count               INTEGER,
    runner_party             TEXT,
    runner_count             INTEGER,
    total_counted            INTEGER,
    win_alliance             TEXT,
    lead_party_2026          TEXT,
    lead_party_votes_2026    INTEGER,
    runner_party_2026        TEXT,
    runner_party_votes_2026  INTEGER,
    votes_counted_2026       INTEGER,
    lead_alliance_2026       TEXT
);
"""

INSERT_SQL = """
INSERT INTO election_results
    (constituency_name, lead_party, lead_count, runner_party, runner_count, total_counted, win_alliance)
VALUES %s
ON CONFLICT DO NOTHING;
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
    df = pd.read_csv(CSV_PATH, dtype=str)

    missing = [c for c in COLUMN_MAP if c not in df.columns]
    if missing:
        print(f"Missing expected columns: {missing}")
        sys.exit(1)

    df = df[list(COLUMN_MAP.keys())].rename(columns=COLUMN_MAP)

    for col in ("lead_count", "runner_count", "total_counted"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    df = df.where(pd.notna(df), None)
    return df


def main():
    parser = argparse.ArgumentParser(description="Create and populate election_results table")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, no DB writes")
    args = parser.parse_args()

    print(f"Loading {CSV_PATH} ...")
    df = load_and_clean()
    print(f"  {len(df)} rows ready")
    print(df.head(3).to_string(index=False))

    if args.dry_run:
        print("\n[dry-run] Skipping DB write.")
        return

    print("\nConnecting to database ...")
    conn = connect()
    print("  Connected")

    with conn.cursor() as cur:
        print("Creating table if not exists ...")
        cur.execute(CREATE_TABLE_SQL)

        rows = [
            (
                row.constituency_name,
                row.lead_party,
                int(row.lead_count) if row.lead_count is not None else None,
                row.runner_party,
                int(row.runner_count) if row.runner_count is not None else None,
                int(row.total_counted) if row.total_counted is not None else None,
                row.win_alliance,
            )
            for row in df.itertuples(index=False)
        ]

        execute_values(cur, INSERT_SQL, rows, page_size=100)
        print(f"  Inserted {len(rows)} rows into election_results")

    conn.commit()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
