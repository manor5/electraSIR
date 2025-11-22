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
  door_no?: string;
};

export type SearchParams = {
  name?: string;
  relativeName?: string;
  relation?: string;
  boothNumber?: string;
  gender?: string;
  age?: number;
  epic?: string;
  constituencyId?: string;
  birthYear?: string;
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
      // Split by comma and parse each booth number
      const boothNumbers = params.boothNumber.split(',').map(b => parseInt(b.trim())).filter(b => !isNaN(b));
      
      if (boothNumbers.length === 1) {
        conditions.push(`booth_no = $${paramIndex}`);
        values.push(boothNumbers[0]);
        paramIndex++;
      } else if (boothNumbers.length > 1) {
        const placeholders = boothNumbers.map((_, index) => `$${paramIndex + index}`).join(', ');
        conditions.push(`booth_no IN (${placeholders})`);
        values.push(...boothNumbers);
        paramIndex += boothNumbers.length;
      }
    }

    if (params.gender) {
      conditions.push(`gender ILIKE $${paramIndex}`);
      //`(gender = 'M' AND $${paramIndex} = 'ஆ') OR (gender = 'F' AND $${paramIndex} = 'பெ'
      values.push(`%${params.gender=='M'?'ஆ':'பெ'}%`);
      paramIndex++;
    }

    // if (params.age) {
    //   // Search for age range: age-1, age, age+1
    //   const ageValue = params.age;
    //   conditions.push(`age IN ($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
    //   values.push(ageValue - 1, ageValue, ageValue + 1);
    //   paramIndex += 3;
    // } else 
        if (params.birthYear && params.constituencyId) {
      // Compute age based on birth year and constituency
      const birthYear = parseInt(params.birthYear);
      const referenceYear = params.constituencyId === '167' || params.constituencyId === '166' ? 2005 : 2002;
      const computedAge = referenceYear - birthYear;
      
      // Search for age range: computedAge-1, computedAge, computedAge+1
      conditions.push(`age IN ($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
      values.push(computedAge - 1, computedAge, computedAge + 1);
      paramIndex += 3;
    }

    if (params.epic) {
      conditions.push(`epic ILIKE $${paramIndex}`);
      values.push(`%${params.epic}%`);
      paramIndex++;
    }

    // If constituencyId provided, restrict to that constituency column
    if (params.constituencyId) {
      // constituency column in DB may be integer; parse if numeric
      const raw = params.constituencyId;
      const numeric = /^\d+$/.test(raw);
      conditions.push(`constituency = $${paramIndex}`);
      values.push(numeric ? parseInt(raw) : raw);
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
        booth_no,
        door_no
      FROM trichy2_import
    `;

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY and LIMIT
    query += ' ORDER BY sequence LIMIT 1200';


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
 * Search for family members based on door number and relative name
 */
export async function searchFamilyMembers(params: {
  doorNo?: string;
  relativeName?: string;
  memberName?: string;
  constituencyId?: string;
  boothNo?: string | number;
}): Promise<{ 
  success: boolean; 
  data?: SearchResult[]; 
  error?: string 
}> {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Family members are identified by:
    // 1. Same door_no AND relative_name matches (exact)
    // 2. Same door_no AND relative_name matches with member's name (exact)
    if (params.doorNo && (params.relativeName || params.memberName)) {
      conditions.push(`door_no = $${paramIndex}`);
      values.push(params.doorNo);
      paramIndex++;

      if (params.relativeName && params.memberName) {
        conditions.push(`(relative_name = $${paramIndex} OR relative_name = $${paramIndex + 1})`);
        values.push(params.relativeName);
        values.push(params.memberName);
        paramIndex += 2;
      } else if (params.relativeName) {
        conditions.push(`relative_name = $${paramIndex}`);
        values.push(params.relativeName);
        paramIndex++;
      }
    }

    // If booth number provided, restrict to same booth as well
    if (params.boothNo !== undefined && params.boothNo !== null && params.boothNo !== '') {
      const boothNum = typeof params.boothNo === 'string' ? parseInt(params.boothNo as string) : (params.boothNo as number);
      if (!isNaN(boothNum)) {
        conditions.push(`booth_no = $${paramIndex}`);
        values.push(boothNum);
        paramIndex++;
      }
    }

    if (conditions.length === 0) {
      return {
        success: true,
        data: []
      };
    }

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
        door_no
      FROM trichy2_import
      WHERE ${conditions.join(' AND ')}
      ORDER BY sequence
      LIMIT 50
    `;


    const result = await pool.query(query, values);

    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('Family search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Increment operation counter
 */
export async function incrementOperationCounter(): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    await pool.query(`
      UPDATE operation_counter 
      SET count_value = count_value + 1 
      WHERE id = 1
    `);
    return {
      success: true
    };
  } catch (error) {
    console.error('Operation counter increment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment counter'
    };
  }
}

/**
 * Get operation counter value
 */
export async function getOperationCounter(): Promise<{ 
  success: boolean; 
  count?: number;
  error?: string 
}> {
  try {
    const result = await pool.query(`
      SELECT count_value 
      FROM operation_counter 
      WHERE id = 1
    `);
    
    return {
      success: true,
      count: result.rows[0]?.count_value || 0
    };
  } catch (error) {
    console.error('Operation counter fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch counter'
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
