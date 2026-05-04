'use server';

import pool from '../lib/db';

export interface ElectionResult {
  id: number;
  constituency_name: string;
  lead_party: string | null;
  lead_count: number | null;
  runner_party: string | null;
  runner_count: number | null;
  total_counted: number | null;
  win_alliance: string | null;
  lead_party_2026: string | null;
  lead_party_votes_2026: number | null;
  runner_party_2026: string | null;
  runner_party_votes_2026: number | null;
  votes_counted_2026: number | null;
  lead_alliance_2026: string | null;
  counting_completed: boolean;
  last_updated: string | null;
  region: string | null;
}

export type ResultFilter = 'all' | 'delta' | 'tirunelveli_salem' | 'others';

const REGION_CONDITIONS: Record<ResultFilter, string> = {
  all: '',
  delta: `AND cr.region = 'Delta'`,
  tirunelveli_salem: `AND cr.region IN ('Tirunelveli', 'Salem')`,
  others: `AND (cr.region IS NULL OR cr.region NOT IN ('Delta', 'Tirunelveli', 'Salem'))`,
};

export interface RecentResult {
  constituency_name: string;
  lead_party_2026: string | null;
  lead_party_votes_2026: number | null;
  runner_party_2026: string | null;
  runner_party_votes_2026: number | null;
  lead_alliance_2026: string | null;
  last_updated: string | null;
}

export interface AllianceTally {
  alliance: string;
  won: number;
  leading: number;
  total: number;
}

export async function getRecentlyUpdated(): Promise<{ success: boolean; data?: RecentResult[] }> {
  try {
    const result = await pool.query<RecentResult>(`
      SELECT
        constituency_name,
        lead_party_2026,
        lead_party_votes_2026,
        runner_party_2026,
        runner_party_votes_2026,
        lead_alliance_2026,
        TO_CHAR(last_updated, 'HH24:MI') AS last_updated
      FROM election_results
      WHERE lead_party_2026 IS NOT NULL
      ORDER BY last_updated DESC
      LIMIT 20
    `);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching recent results:', error);
    return { success: false };
  }
}

export async function getAllianceTally(): Promise<{ success: boolean; data?: AllianceTally[] }> {
  try {
    const result = await pool.query<AllianceTally>(`
      SELECT
        lead_alliance_2026 AS alliance,
        COUNT(*) FILTER (WHERE counting_completed = TRUE)  AS won,
        COUNT(*) FILTER (WHERE counting_completed = FALSE) AS leading,
        COUNT(*) AS total
      FROM election_results
      WHERE lead_alliance_2026 IS NOT NULL AND lead_party_2026 IS NOT NULL
      GROUP BY lead_alliance_2026
      ORDER BY total DESC
    `);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching alliance tally:', error);
    return { success: false };
  }
}

export interface Party {
  party_short_name: string;
  alliance: string;
}

export async function getParties(): Promise<{ success: boolean; data?: Party[] }> {
  try {
    const result = await pool.query<Party>(
      `SELECT party_short_name, alliance FROM parties ORDER BY alliance, party_short_name`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching parties:', error);
    return { success: false };
  }
}

export async function updateConstituencyResult(
  id: number,
  fields: {
    lead_party_2026: string | null;
    lead_party_votes_2026: number | null;
    runner_party_2026: string | null;
    runner_party_votes_2026: number | null;
    votes_counted_2026: number | null;
    counting_completed: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query(
      `UPDATE election_results SET
        lead_party_2026         = $1,
        lead_party_votes_2026   = $2,
        runner_party_2026       = $3,
        runner_party_votes_2026 = $4,
        votes_counted_2026      = $5,
        counting_completed      = $6,
        lead_alliance_2026      = (SELECT alliance FROM parties WHERE party_short_name = $1),
        last_updated            = NOW()
       WHERE id = $7`,
      [
        fields.lead_party_2026 || null,
        fields.lead_party_votes_2026 || null,
        fields.runner_party_2026 || null,
        fields.runner_party_votes_2026 || null,
        fields.votes_counted_2026 || null,
        fields.counting_completed,
        id,
      ]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating result:', error);
    return { success: false, error: 'Update failed' };
  }
}

export async function getElectionResults(filter: ResultFilter): Promise<{
  success: boolean;
  data?: ElectionResult[];
  counts?: { completed: number; total: number };
  error?: string;
}> {
  try {
    const regionCondition = REGION_CONDITIONS[filter];

    const query = `
      SELECT
        er.id,
        er.constituency_name,
        er.lead_party,
        er.lead_count,
        er.runner_party,
        er.runner_count,
        er.total_counted,
        er.win_alliance,
        er.lead_party_2026,
        er.lead_party_votes_2026,
        er.runner_party_2026,
        er.runner_party_votes_2026,
        er.votes_counted_2026,
        er.lead_alliance_2026,
        er.counting_completed,
        TO_CHAR(er.last_updated, 'DD-Mon-YYYY HH24:MI') AS last_updated,
        cr.region
      FROM election_results er
      LEFT JOIN constituency_regions cr ON er.constituency_name = cr.constituency_name
      WHERE 1=1 ${regionCondition}
      ORDER BY er.constituency_name ASC
    `;

    const result = await pool.query<ElectionResult>(query);

    const completed = result.rows.filter((r) => r.counting_completed).length;

    return {
      success: true,
      data: result.rows,
      counts: { completed, total: result.rows.length },
    };
  } catch (error) {
    console.error('Error fetching election results:', error);
    return { success: false, error: 'Failed to fetch election results' };
  }
}
