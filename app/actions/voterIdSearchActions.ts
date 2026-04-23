'use server';

import pool from '../lib/db';

export interface VoterRecord {
  voter_id: string;
  serial_no: string;
  name: string;
  ward: string;
  booth: string;
  polling_station: string | null;
}

export async function searchByVoterId(voterId: string): Promise<{ success: boolean; data?: VoterRecord; error?: string }> {
  const trimmed = voterId.trim().toUpperCase();
  if (!trimmed) return { success: false, error: 'empty' };

  try {
    const result = await pool.query<VoterRecord>(
      `SELECT
         e.voter_id,
         e.serial_no,
         e.name,
         e.ward,
         e.booth_id::TEXT AS booth,
         ps.polling_station
       FROM electors_2026 e
       LEFT JOIN polling_stations ps ON e.booth_id::TEXT = ps.booth_no::TEXT
       WHERE UPPER(e.voter_id) = $1
       LIMIT 1`,
      [trimmed]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error searching voter:', error);
    return { success: false, error: 'Database error' };
  }
}
