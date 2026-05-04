"""
ECI Election Results Scraper
------------------------------
Scrapes https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22{n}.htm
for all 234 Tamil Nadu constituencies and updates election_results table.

Run on election day from your Mac (site is geo-restricted to India):
    python3 scripts/scraper.py

Loops every 15 minutes automatically until you stop it with Ctrl+C.
"""

import os
import time
import psycopg2
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from datetime import datetime

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:ASzfsdpoXmeHSmrovzuRAEdLgrryeKIB@metro.proxy.rlwy.net:59255/railway",
)

BASE_URL = "https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22{n}.htm"
TOTAL_CONSTITUENCIES = 234
INTERVAL_MINUTES = 15

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,ta;q=0.8",
    "Referer": "https://results.eci.gov.in/",
}


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


def ensure_log_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cron_log (
            id      SERIAL PRIMARY KEY,
            ran_at  TIMESTAMP DEFAULT NOW(),
            status  TEXT,
            message TEXT
        )
    """)


def log_run(cur, status: str, message: str):
    cur.execute(
        "INSERT INTO cron_log (status, message) VALUES (%s, %s)",
        (status, message),
    )
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {status}: {message}")


def fetch_page(n: int) -> BeautifulSoup | None:
    url = BASE_URL.format(n=n)
    try:
        session = requests.Session()
        # First hit the main page to get cookies
        session.get("https://results.eci.gov.in/", headers=HEADERS, timeout=15)
        resp = session.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"  [{n}] HTTP {resp.status_code} — skipping")
            return None
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"  [{n}] Fetch error: {e}")
        return None


def parse_constituency(soup: BeautifulSoup) -> dict | None:
    """
    Parse ECI candidateswise page.
    Returns dict with constituency result or None if not parseable.
    """
    try:
        # Constituency name — usually in <div class="cand-name"> or page heading
        name_tag = (
            soup.find("div", class_="cand-name") or
            soup.find("h2") or
            soup.find("div", id="div1")
        )
        constituency_name = name_tag.get_text(strip=True) if name_tag else None

        # Find the results table
        table = soup.find("table", class_="table") or soup.find("table")
        if not table:
            return None

        rows = table.find_all("tr")
        candidates = []
        for row in rows[1:]:  # skip header
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) >= 5:
                # Typical columns: SNo, Candidate, Party, EVM Votes, Postal Votes, Total Votes
                party      = cols[2] if len(cols) > 2 else ""
                total_col  = cols[5] if len(cols) > 5 else cols[-1]
                try:
                    total_votes = int(total_col.replace(",", ""))
                except ValueError:
                    continue
                if party and total_votes > 0:
                    candidates.append({"party": party, "votes": total_votes})

        if not candidates:
            return None

        candidates.sort(key=lambda x: x["votes"], reverse=True)
        lead   = candidates[0]
        runner = candidates[1] if len(candidates) > 1 else None

        # Check if result is declared
        status_text = soup.get_text().lower()
        counting_completed = "result declared" in status_text or "elected" in status_text

        total_counted = sum(c["votes"] for c in candidates)

        return {
            "constituency_name":        constituency_name,
            "lead_party_2026":          lead["party"],
            "lead_party_votes_2026":    lead["votes"],
            "runner_party_2026":        runner["party"] if runner else None,
            "runner_party_votes_2026":  runner["votes"] if runner else None,
            "votes_counted_2026":       total_counted,
            "counting_completed":       counting_completed,
        }
    except Exception as e:
        print(f"  Parse error: {e}")
        return None


def update_result(cur, data: dict):
    cur.execute("""
        UPDATE election_results SET
            lead_party_2026         = %s,
            lead_party_votes_2026   = %s,
            runner_party_2026       = %s,
            runner_party_votes_2026 = %s,
            votes_counted_2026      = %s,
            counting_completed      = %s,
            lead_alliance_2026      = (SELECT alliance FROM parties WHERE party_short_name = %s),
            last_updated            = NOW()
        WHERE constituency_name ILIKE %s
        RETURNING constituency_name
    """, (
        data["lead_party_2026"],
        data["lead_party_votes_2026"],
        data["runner_party_2026"],
        data["runner_party_votes_2026"],
        data["votes_counted_2026"],
        data["counting_completed"],
        data["lead_party_2026"],
        data["constituency_name"],
    ))
    return cur.fetchone()


def scrape_all(conn):
    updated = 0
    skipped = 0

    with conn.cursor() as cur:
        ensure_log_table(cur)

        for n in range(1, TOTAL_CONSTITUENCIES + 1):
            soup = fetch_page(n)
            if not soup:
                skipped += 1
                continue

            data = parse_constituency(soup)
            if not data or not data.get("constituency_name"):
                skipped += 1
                continue

            matched = update_result(cur, data)
            if matched:
                print(f"  [{n}] {matched[0]} — {data['lead_party_2026']} {data['lead_party_votes_2026']:,} | done={data['counting_completed']}")
                updated += 1
            else:
                print(f"  [{n}] No DB match for: {data['constituency_name']}")
                skipped += 1

            time.sleep(0.5)  # be polite to ECI server

        log_run(cur, "OK", f"Updated {updated}, skipped {skipped}")
        conn.commit()

    return updated, skipped


def main():
    print(f"Starting ECI scraper — runs every {INTERVAL_MINUTES} minutes. Press Ctrl+C to stop.\n")

    while True:
        print(f"\n{'='*50}")
        print(f"Run started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*50}")

        try:
            conn = connect()
            updated, skipped = scrape_all(conn)
            conn.close()
            print(f"\nDone — updated: {updated}, skipped: {skipped}")
        except Exception as e:
            print(f"ERROR: {e}")

        print(f"\nNext run in {INTERVAL_MINUTES} minutes...")
        time.sleep(INTERVAL_MINUTES * 60)


if __name__ == "__main__":
    main()
