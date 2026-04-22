'use server';

import pool from '../lib/db';

export interface VoterRecord {
  voter_id: string;
  serial_no: string;
  name: string;
  ward: string;
  booth: string;
}

export async function searchByVoterId(voterId: string): Promise<{ success: boolean; data?: VoterRecord; error?: string }> {
  const trimmed = voterId.trim().toUpperCase();
  if (!trimmed) return { success: false, error: 'empty' };

  try {
    const result = await pool.query<VoterRecord>(
      `SELECT
         voter_id,
         serial_no,
         name,
         ward,
         booth_id::TEXT AS booth
       FROM electors_2026
       WHERE UPPER(voter_id) = $1
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
