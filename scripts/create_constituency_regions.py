"""
Constituency Regions Import Script
------------------------------------
Reads Sheet2-Table 1.csv (Delta / Tirunelveli / Salem columns),
creates the constituency_regions table and inserts all mappings.

Usage:
    python3 scripts/create_constituency_regions.py
    python3 scripts/create_constituency_regions.py --dry-run
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

CSV_PATH = os.path.join(os.path.dirname(__file__), "Sheet2-Table 1.csv")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS constituency_regions (
    id                SERIAL PRIMARY KEY,
    constituency_name TEXT NOT NULL,
    region            TEXT NOT NULL,
    UNIQUE (constituency_name)
);
"""

INSERT_SQL = """
INSERT INTO constituency_regions (constituency_name, region)
VALUES %s
ON CONFLICT (constituency_name) DO UPDATE SET region = EXCLUDED.region;
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


def load_and_clean() -> list[tuple[str, str]]:
    df = pd.read_csv(CSV_PATH, usecols=["Delta", "Tirunelveli", "Salem"], dtype=str)

    rows: list[tuple[str, str]] = []
    for region in ("Delta", "Tirunelveli", "Salem"):
        constituencies = df[region].dropna().str.strip()
        constituencies = constituencies[constituencies != ""]
        for name in constituencies:
            rows.append((name, region))

    return rows


def main():
    parser = argparse.ArgumentParser(description="Create and populate constituency_regions table")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, no DB writes")
    args = parser.parse_args()

    print(f"Loading {CSV_PATH} ...")
    rows = load_and_clean()
    print(f"  {len(rows)} constituency-region mappings found")

    by_region: dict[str, list[str]] = {}
    for name, region in rows:
        by_region.setdefault(region, []).append(name)
    for region, names in by_region.items():
        print(f"  {region}: {len(names)} constituencies")

    if args.dry_run:
        print("\n[dry-run] Sample rows:")
        for r in rows[:6]:
            print(f"  {r}")
        print("\n[dry-run] Skipping DB write.")
        return

    print("\nConnecting to database ...")
    conn = connect()
    print("  Connected")

    with conn.cursor() as cur:
        print("Creating table if not exists ...")
        cur.execute(CREATE_TABLE_SQL)
        execute_values(cur, INSERT_SQL, rows, page_size=100)
        print(f"  Upserted {len(rows)} rows into constituency_regions")

    conn.commit()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
