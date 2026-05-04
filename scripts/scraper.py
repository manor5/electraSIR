"""
Election Results Scraper
-------------------------
Runs on a schedule via Railway cron job.
Currently in test mode - logs a heartbeat to the DB.
Replace the scrape() function with real scraping logic when the results site is live.
"""

import os
import psycopg2
from urllib.parse import urlparse
from datetime import datetime

DATABASE_URL = os.environ["DATABASE_URL"]


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
            id         SERIAL PRIMARY KEY,
            ran_at     TIMESTAMP DEFAULT NOW(),
            status     TEXT,
            message    TEXT
        )
    """)


def log(cur, status: str, message: str):
    cur.execute(
        "INSERT INTO cron_log (status, message) VALUES (%s, %s)",
        (status, message)
    )
    print(f"[{datetime.now().isoformat()}] {status}: {message}")


def scrape():
    """
    TODO: Replace with real scraping logic once the results website is live.
    Return a list of dicts like:
    [
        {
            "constituency_name": "Srirangam",
            "lead_party_2026": "DMK",
            "lead_party_votes_2026": 98000,
            "runner_party_2026": "ADMK",
            "runner_party_votes_2026": 72000,
            "votes_counted_2026": 175000,
            "counting_completed": False,
        },
        ...
    ]
    """
    return []   # no-op until results site is live


def update_results(cur, results: list):
    for r in results:
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
            WHERE constituency_name = %s
        """, (
            r["lead_party_2026"],
            r["lead_party_votes_2026"],
            r["runner_party_2026"],
            r["runner_party_votes_2026"],
            r["votes_counted_2026"],
            r["counting_completed"],
            r["lead_party_2026"],
            r["constituency_name"],
        ))


def main():
    conn = connect()
    try:
        with conn.cursor() as cur:
            ensure_log_table(cur)

            results = scrape()

            if results:
                update_results(cur, results)
                log(cur, "OK", f"Updated {len(results)} constituencies")
            else:
                log(cur, "HEARTBEAT", "Scraper ran — no results yet (site not live)")

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
