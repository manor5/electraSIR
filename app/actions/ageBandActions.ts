import pool from '../lib/db';

export async function getAgeBandAggregatedData(booth?: string, ward?: string, pagudhi?: string) {
  // Age bands: 18-25, 26-35, 36-45, 46-60, 61-80, 80+
  try {
    let baseQuery = `
      SELECT 
        CASE 
          WHEN e.age BETWEEN 18 AND 25 THEN '18-25'
          WHEN e.age BETWEEN 26 AND 35 THEN '26-35'
          WHEN e.age BETWEEN 36 AND 45 THEN '36-45'
          WHEN e.age BETWEEN 46 AND 60 THEN '46-60'
          WHEN e.age BETWEEN 61 AND 80 THEN '61-80'
          WHEN e.age > 80 THEN '80+'
          ELSE 'Unknown'
        END as age_band,
        e.gender
      FROM electors_2026 e
      LEFT JOIN booth_mapping b ON CAST(e.booth_id AS TEXT) = b.booth::TEXT
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    if (booth && booth !== 'All') {
      baseQuery += ` AND CAST(e.booth_id AS TEXT) = $${paramCount}`;
      params.push(booth);
      paramCount++;
    }
    if (ward && ward !== 'All') {
      baseQuery += ` AND e.ward = $${paramCount}`;
      params.push(ward);
      paramCount++;
    }
    if (pagudhi && pagudhi !== 'All') {
      baseQuery += ` AND b.pagudhi = $${paramCount}`;
      params.push(pagudhi);
      paramCount++;
    }

    // Wrap as subquery to group by age_band
    const query = `
      SELECT age_band,
        SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'F' THEN 1 ELSE 0 END) as female_count,
        COUNT(*) as total_count
      FROM (
        ${baseQuery}
      ) as sub
      GROUP BY age_band
      ORDER BY 
        CASE age_band 
          WHEN '18-25' THEN 1
          WHEN '26-35' THEN 2
          WHEN '36-45' THEN 3
          WHEN '46-60' THEN 4
          WHEN '61-80' THEN 5
          WHEN '80+' THEN 6
          ELSE 7
        END
    `;
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching age band aggregated data:', error);
    return { success: false, error: 'Failed to fetch age band aggregated data' };
  }
}
