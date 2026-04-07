'use server';

import pool from '../lib/db';

export async function getPaguthis() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT pagudhi
      FROM booth_mapping 
      WHERE pagudhi IS NOT NULL 
      ORDER BY pagudhi ASC
    `);
    // Add 'All' option at the beginning
    const data = [{ pagudhi: 'All' }, ...result.rows.map(row => ({ pagudhi: row.pagudhi }))];
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching paguthis:', error);
    return { success: false, error: 'Failed to fetch paguthis' };
  }
}

export async function getAllBooths() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT booth
      FROM booth_mapping 
      WHERE booth IS NOT NULL
      ORDER BY booth ASC
    `);
    // Add 'All' option at the beginning, convert booth to string
    const data = [{ booth: 'All' }, ...result.rows.map(row => ({ booth: String(row.booth) }))];
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching all booths:', error);
    return { success: false, error: 'Failed to fetch booths' };
  }
}

export async function getAllWards() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ward
      FROM booth_mapping
      WHERE ward IS NOT NULL
      ORDER BY ward ASC
    `);
    // Add 'All' option at the beginning
    const data = [{ ward: 'All' }, ...result.rows.map(row => ({ ward: row.ward }))];
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching all wards:', error);
    return { success: false, error: 'Failed to fetch wards' };
  }
}

export async function getWardsByPaguthi(pagudhi?: string) {
  try {
    // If pagudhi is 'All' or not provided, return all wards
    if (!pagudhi || pagudhi === 'All') {
      return getAllWards();
    }
    
    let query = `
      SELECT DISTINCT ward
      FROM booth_mapping 
      WHERE ward IS NOT NULL AND pagudhi = $1
      ORDER BY ward ASC
    `;
    
    const result = await pool.query(query, [pagudhi]);
    // Add 'All' option at the beginning
    const data = [{ ward: 'All' }, ...result.rows.map(row => ({ ward: row.ward }))];
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching wards by paguthi:', error);
    return { success: false, error: 'Failed to fetch wards' };
  }
}

export async function getBoothsByWard(ward?: string, pagudhi?: string) {
  try {
    // If ward is 'All' or not provided
    if (!ward || ward === 'All') {
      // If pagudhi is also 'All' or not specified, return all booths
      if (!pagudhi || pagudhi === 'All') {
        return getAllBooths();
      }
      
      // If pagudhi is specified, return booths for that pagudhi only
      const query = `
        SELECT DISTINCT booth
        FROM booth_mapping 
        WHERE booth IS NOT NULL AND pagudhi = $1
        ORDER BY booth ASC
      `;
      const result = await pool.query(query, [pagudhi]);
      const data = [{ booth: 'All' }, ...result.rows.map(row => ({ booth: String(row.booth) }))];
      return { success: true, data };
    }
    
    let query = `
      SELECT DISTINCT booth
      FROM booth_mapping 
      WHERE booth IS NOT NULL AND ward = $1
    `;
    const params: any[] = [ward];
    let paramCount = 2;
    
    if (pagudhi && pagudhi !== 'All') {
      query += ` AND pagudhi = $${paramCount}`;
      params.push(pagudhi);
    }
    
    query += ` ORDER BY booth ASC`;
    
    const result = await pool.query(query, params);
    // Add 'All' option at the beginning, convert booth to string
    const data = [{ booth: 'All' }, ...result.rows.map(row => ({ booth: String(row.booth) }))];
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching booths by ward:', error);
    return { success: false, error: 'Failed to fetch booths' };
  }
}

export async function getPaguthisByWard(wardNumber?: number, boothNumber?: number) {
  try {
    let query = `
      SELECT DISTINCT paguthi_number, paguthi_name 
      FROM booth_mapping 
      WHERE paguthi_number IS NOT NULL
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (boothNumber) {
      query += ` AND booth_number = $${paramCount}`;
      params.push(boothNumber);
      paramCount++;
    }
    
    if (wardNumber) {
      query += ` AND ward_number = $${paramCount}`;
      params.push(wardNumber);
    }
    
    query += ` ORDER BY paguthi_number ASC`;
    
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching paguthis:', error);
    return { success: false, error: 'Failed to fetch paguthis' };
  }
}

export async function getGenderWiseData(
  booth?: string,
  ward?: string,
  pagudhi?: string,
  limit: number = 10,
  offset: number = 0
) {
  try {
    let countQuery = `
      SELECT COUNT(*) FROM electors_2026 e
      LEFT JOIN booth_mapping b ON CAST(e.booth_id AS TEXT) = b.booth::TEXT
      WHERE 1=1
    `;
    let dataQuery = `
      SELECT 
        b.pagudhi,
        e.ward,
        CAST(e.booth_id AS TEXT) as booth,
        e.voter_id,
        e.serial_no,
        e.name,
        e.relation_name,
        e.relation_type,
        e.age,
        e.year,
        e.status_2025,
        e.new_migrant,
        e.party_support,
        e.family_leader
      FROM electors_2026 e
      LEFT JOIN booth_mapping b ON CAST(e.booth_id AS TEXT) = b.booth::TEXT
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (booth && booth !== 'All') {
      countQuery += ` AND CAST(e.booth_id AS TEXT) = $${paramCount}`;
      dataQuery += ` AND CAST(e.booth_id AS TEXT) = $${paramCount}`;
      params.push(booth);
      paramCount++;
    }
    
    if (ward && ward !== 'All') {
      countQuery += ` AND e.ward = $${paramCount}`;
      dataQuery += ` AND e.ward = $${paramCount}`;
      params.push(ward);
      paramCount++;
    }
    
    if (pagudhi && pagudhi !== 'All') {
      countQuery += ` AND b.pagudhi = $${paramCount}`;
      dataQuery += ` AND b.pagudhi = $${paramCount}`;
      params.push(pagudhi);
      paramCount++;
    }
    
    dataQuery += ` ORDER BY e.voter_id ASC`;
    dataQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    
    // Get total count
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(dataQuery, dataParams);
    
    return {
      success: true,
      data: {
        rows: dataResult.rows,
        total: total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching elector data:', error);
    return { success: false, error: 'Failed to fetch elector data' };
  }
}

export async function getGenderWiseDataForDownload(
  booth?: string,
  ward?: string,
  pagudhi?: string
) {
  try {
    let query = `
      SELECT 
        b.pagudhi,
        e.ward,
        CAST(e.booth_id AS TEXT) as booth,
        e.voter_id,
        e.serial_no,
        e.name,
        e.relation_name,
        e.relation_type,
        e.age,
        e.year,
        e.status_2025,
        e.new_migrant,
        e.party_support,
        e.family_leader
      FROM electors_2026 e
      LEFT JOIN booth_mapping b ON CAST(e.booth_id AS TEXT) = b.booth::TEXT
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (booth && booth !== 'All') {
      query += ` AND CAST(e.booth_id AS TEXT) = $${paramCount}`;
      params.push(booth);
      paramCount++;
    }
    
    if (ward && ward !== 'All') {
      query += ` AND e.ward = $${paramCount}`;
      params.push(ward);
      paramCount++;
    }
    
    if (pagudhi && pagudhi !== 'All') {
      query += ` AND b.pagudhi = $${paramCount}`;
      params.push(pagudhi);
    }
    
    query += ` ORDER BY e.voter_id ASC`;
    
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching download data:', error);
    return { success: false, error: 'Failed to fetch download data' };
  }
}

export async function getGenderWiseAggregatedData(
  booth?: string,
  ward?: string,
  pagudhi?: string
) {
  try {
    let query = `
      SELECT 
        b.pagudhi,
        e.ward,
        CAST(e.booth_id AS TEXT) as booth,
        SUM(CASE WHEN e.gender = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN e.gender = 'F' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN e.gender NOT IN ('M', 'F') THEN 1 ELSE 0 END) as third_count,
        COUNT(*) as total_count
      FROM electors_2026 e
      LEFT JOIN booth_mapping b ON CAST(e.booth_id AS TEXT) = b.booth::TEXT
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (booth && booth !== 'All') {
      query += ` AND CAST(e.booth_id AS TEXT) = $${paramCount}`;
      params.push(booth);
      paramCount++;
    }
    
    if (ward && ward !== 'All') {
      query += ` AND e.ward = $${paramCount}`;
      params.push(ward);
      paramCount++;
    }
    
    if (pagudhi && pagudhi !== 'All') {
      query += ` AND b.pagudhi = $${paramCount}`;
      params.push(pagudhi);
      paramCount++;
    }
    
    query += ` GROUP BY b.pagudhi, e.ward, CAST(e.booth_id AS TEXT) ORDER BY b.pagudhi, e.ward, CAST(e.booth_id AS TEXT)`;
    
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching aggregated data:', error);
    return { success: false, error: 'Failed to fetch aggregated data' };
  }
}

export async function getStreetWiseElectors(booth?: string, ward?: string, pagudhi?: string) {
  try {
    let query = `
      SELECT 
        swe.id,
        swe.booth,
        swe.ward,
        swe.pagudhi,
        swe.section_name,
        swe.total_electors,
        COALESCE(ps.polling_station, 'N/A') as polling_station
      FROM street_wise_electors swe
      LEFT JOIN polling_station ps ON swe.booth = ps.booth
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramCount = 1;
    
    if (booth && booth !== 'All') {
      query += ` AND swe.booth = $${paramCount}`;
      params.push(booth);
      paramCount++;
    }
    
    if (ward && ward !== 'All') {
      query += ` AND swe.ward = $${paramCount}`;
      params.push(ward);
      paramCount++;
    }
    
    if (pagudhi && pagudhi !== 'All') {
      query += ` AND swe.pagudhi = $${paramCount}`;
      params.push(pagudhi);
      paramCount++;
    }
    
    query += ` ORDER BY swe.pagudhi, swe.ward, swe.booth, swe.section_name`;
    
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching street-wise electors:', error);
    return { success: false, error: 'Failed to fetch street-wise electors' };
  }
}
