'use server';

import pool from '../lib/db';

export type SearchResult = {
  id: number;
  sequence?: number;
  serial_no?: number;
  name: string;
  relation?: string;
  relative_name?: string;
  gender?: string;
  age?: number;
  epic?: string;
  booth_no?: number;
};

export type SearchParams = {
  name?: string;
  relativeName?: string;
  relation?: string;
  boothNumber?: string;
  gender?: string;
  age?: number;
  epic?: string;
};

/**
 * Search for voters by name or other parameters
 */
export async function searchElectors(params: SearchParams): Promise<{ 
  success: boolean; 
  data?: SearchResult[]; 
  error?: string 
}> {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause based on provided parameters
    if (params.name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      values.push(`%${params.name}%`);
      paramIndex++;
    }

    if (params.relativeName) {
      conditions.push(`relative_name ILIKE $${paramIndex}`);
      values.push(`%${params.relativeName}%`);
      paramIndex++;
    }

    if (params.relation) {
      conditions.push(`relation ILIKE $${paramIndex}`);
      values.push(`%${params.relation}%`);
      paramIndex++;
    }

    if (params.boothNumber) {
      conditions.push(`booth_no = $${paramIndex}`);
      values.push(parseInt(params.boothNumber));
      paramIndex++;
    }

    if (params.gender) {
      conditions.push(`gender ILIKE $${paramIndex}`);
      values.push(`%${params.gender}%`);
      paramIndex++;
    }

    if (params.age) {
      conditions.push(`age = $${paramIndex}`);
      values.push(params.age);
      paramIndex++;
    }

    if (params.epic) {
      conditions.push(`epic ILIKE $${paramIndex}`);
      values.push(`%${params.epic}%`);
      paramIndex++;
    }

    // Base query
    let query = `
      SELECT 
        id,
        sequence,
        serial_no,
        name,
        relation,
        relative_name,
        gender,
        age,
        epic,
        booth_no
      FROM prev_voters
    `;

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY and LIMIT
    query += ' ORDER BY sequence LIMIT 1200';

    console.log('Executing query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);

    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('Database search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<{ 
  success: boolean; 
  message?: string; 
  error?: string 
}> {
  try {
    const result = await pool.query('SELECT NOW()');
    return {
      success: true,
      message: `Connected successfully at ${result.rows[0].now}`
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}
