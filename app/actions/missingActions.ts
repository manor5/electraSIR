'use server';

import pool from '../lib/db';

export type MissingRecord = {
  id: number;
  localid?: string;
  ac?: string;
  part?: string;
  serial?: string;
  epic?: string;
  name?: string;
  gender?: string;
  relname?: string;
  rln_type?: string;
  age?: number;
  name_tam?: string;
  relname_tam?: string;
  is_completed?: boolean;
  is_mapped: boolean;
  constituency?: number;
  booth_no?: number;
  serial_no?: number;
  best_match?: string;
};

/**
 * Fetch unmapped records from batch_missing table
 */
export async function fetchUnmappedRecords(params: {
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: MissingRecord[];
  total?: number;
  error?: string;
}> {
  try {
    const tableName = process.env.BATCH_MISSING_TABLE || 'batch_missing_copy';
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${tableName}
      WHERE is_mapped = false
    `;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated data
    const dataQuery = `
      SELECT 
        id,
        localid,
        ac,
        part,
        serial,
        epic,
        name,
        gender,
        relname,
        rln_type,
        age,
        name_tam,
        relname_tam,
        is_completed,
        is_mapped,
        constituency,
        booth_no,
        serial_no,
        best_match
      FROM ${tableName}
      WHERE is_mapped = false
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(dataQuery, [limit, offset]);

    return {
      success: true,
      data: result.rows,
      total,
    };
  } catch (error) {
    console.error('Fetch unmapped records error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch records',
    };
  }
}

/**
 * Mark a record as mapped with best_match = 5
 */
export async function markAsMapped(recordId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tableName = process.env.BATCH_MISSING_TABLE || 'batch_missing_copy';
    
    const updateQuery = `
      UPDATE ${tableName}
      SET is_mapped = true, best_match = '5'
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [recordId]);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Mark as mapped error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update record',
    };
  }
}

/**
 * Map a record to a search result with matched data
 */
export async function mapToResult(params: {
  recordId: number;
  constituency: string;
  boothNo: number;
  serialNo: number;
  bestMatch?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tableName = process.env.BATCH_MISSING_TABLE || 'batch_missing_copy';
    const { recordId, constituency, boothNo, serialNo, bestMatch = '1' } = params;
    
    const updateQuery = `
      UPDATE ${tableName}
      SET is_mapped = true, 
          best_match = $2,
          constituency = $3,
          booth_no = $4,
          serial_no = $5
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [recordId, bestMatch, constituency, boothNo, serialNo]);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Map to result error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to map record',
    };
  }
}

/**
 * Unmark a record (set is_mapped = false and best_match = null)
 */
export async function unmarkAsMapped(recordId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tableName = process.env.BATCH_MISSING_TABLE || 'batch_missing_copy';
    
    const updateQuery = `
      UPDATE ${tableName}
      SET is_mapped = false, 
          best_match = NULL,
          constituency = NULL,
          booth_no = NULL,
          serial_no = NULL
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [recordId]);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Unmark as mapped error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update record',
    };
  }
}

export type MatchResult = {
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
  door_no?: string;
  constituency?: string;
};

/**
 * Search for matches in trichy2_import for Trichy-II (constituency 166)
 * First searches with exact age, then with age+20 if no results
 */
export async function searchTrichyIIMatches(params: {
  nameTamil: string;
  relnameTamil?: string;
  age?: number;
}): Promise<{
  success: boolean;
  data?: MatchResult[];
  ageAdjusted?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const tableName = process.env.TRICHY_TABLE || 'trichy2_import';
    const { nameTamil, relnameTamil, age } = params;

    // Build dynamic WHERE clause
    const conditions = [`name ILIKE $1`, `constituency = '166'`];
    const values: any[] = [`%${nameTamil}%`];
    let paramIndex = 2;

    if (relnameTamil) {
      conditions.push(`relative_name ILIKE $${paramIndex}`);
      values.push(`%${relnameTamil}%`);
      paramIndex++;
    }

    if (age) {
      conditions.push(`age = $${paramIndex}`);
      values.push(age);
      paramIndex++;
    }

    // First search with exact criteria
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
        booth_no,
        door_no,
        constituency
      FROM ${tableName}
      WHERE ${conditions.join(' AND ')}
      ORDER BY sequence
      LIMIT 100
    `;

    let result = await pool.query(query, values);

    // If no results and age was provided, search with age + 20
    if (result.rows.length === 0 && age) {
      const adjustedAge = age + 20;
      const adjustedValues = [...values];
      adjustedValues[adjustedValues.length - 1] = adjustedAge;
      result = await pool.query(query, adjustedValues);
      
      if (result.rows.length > 0) {
        return {
          success: true,
          data: result.rows,
          ageAdjusted: true,
          message: `பொருத்தமான பதிவு ${adjustedAge} வயதில் கண்டறியப்பட்டது (அசல் வயது + 20)`
        };
      }
    }

    return {
      success: true,
      data: result.rows,
      ageAdjusted: false,
    };
  } catch (error) {
    console.error('Search Trichy-II matches error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search matches',
    };
  }
}

/**
 * Search for matches in trichy2_import for other constituencies (not 166)
 * Only uses name and relative name, no age filter
 */
export async function searchMatch2(params: {
  nameTamil: string;
  relnameTamil?: string;
}): Promise<{
  success: boolean;
  data?: MatchResult[];
  error?: string;
}> {
  try {
    const tableName = process.env.TRICHY_TABLE || 'trichy2_import';
    const { nameTamil, relnameTamil } = params;

    // Build dynamic WHERE clause
    const conditions = [`name ILIKE $1`, `constituency != '166'`];
    const values: any[] = [`%${nameTamil}%`];

    if (relnameTamil) {
      conditions.push(`relative_name ILIKE $2`);
      values.push(`%${relnameTamil}%`);
    }

    const query = `
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
        booth_no,
        door_no,
        constituency
      FROM ${tableName}
      WHERE ${conditions.join(' AND ')}
      ORDER BY constituency, sequence
      LIMIT 100
    `;

    const result = await pool.query(query, values);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error('Search Match-2 error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search matches',
    };
  }
}
