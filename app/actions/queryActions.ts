'use server';

import pool from '../lib/db';

export type QueryResult = {
  columns: string[];
  rows: any[];
  rowCount: number;
};

/**
 * Execute a SQL query
 */
export async function executeQuery(query: string): Promise<{
  success: boolean;
  data?: QueryResult;
  error?: string;
}> {
  try {
    // Basic validation to prevent dangerous operations
    const trimmedQuery = query.trim().toLowerCase();
    
    // Block certain dangerous operations
    const dangerousKeywords = ['drop', 'truncate', 'delete from', 'alter table'];
    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        return {
          success: false,
          error: `Query contains potentially dangerous keyword: "${keyword}". This operation is not allowed.`,
        };
      }
    }

    const result = await pool.query(query);
    
    // Extract column names from the result
    const columns = result.fields?.map(field => field.name) || [];
    
    return {
      success: true,
      data: {
        columns,
        rows: result.rows,
        rowCount: result.rowCount || 0,
      },
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute query',
    };
  }
}

/**
 * Get list of tables in the database
 */
export async function getTables(): Promise<{
  success: boolean;
  tables?: string[];
  error?: string;
}> {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const result = await pool.query(query);
    const tables = result.rows.map(row => row.table_name);
    
    return {
      success: true,
      tables,
    };
  } catch (error) {
    console.error('Get tables error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tables',
    };
  }
}

/**
 * Get columns for a specific table
 */
export async function getTableColumns(tableName: string): Promise<{
  success: boolean;
  columns?: Array<{ name: string; type: string }>;
  error?: string;
}> {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [tableName]);
    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
    }));
    
    return {
      success: true,
      columns,
    };
  } catch (error) {
    console.error('Get table columns error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get columns',
    };
  }
}

/**
 * Save a query to the database
 */
export async function saveQuery(name: string, query: string, groupName?: string): Promise<{
  success: boolean;
  id?: number;
  error?: string;
}> {
  try {
    const result = await pool.query(
      `INSERT INTO saved_queries (name, query, group_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id`,
      [name, query, groupName || null]
    );
    
    return {
      success: true,
      id: result.rows[0].id,
    };
  } catch (error) {
    console.error('Save query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save query',
    };
  }
}

/**
 * Get all saved queries
 */
export async function getSavedQueries(): Promise<{
  success: boolean;
  queries?: Array<{
    id: number;
    name: string;
    query: string;
    groupName: string | null;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const result = await pool.query(
      `SELECT id, name, query, group_name, created_at 
       FROM saved_queries 
       ORDER BY group_name NULLS LAST, created_at DESC`
    );
    
    const queries = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      query: row.query,
      groupName: row.group_name,
      createdAt: row.created_at,
    }));
    
    return {
      success: true,
      queries,
    };
  } catch (error) {
    console.error('Get saved queries error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get saved queries',
    };
  }
}

/**
 * Delete a saved query
 */
export async function deleteSavedQuery(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await pool.query('DELETE FROM saved_queries WHERE id = $1', [id]);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete query',
    };
  }
}

/**
 * Get all unique group names
 */
export async function getQueryGroups(): Promise<{
  success: boolean;
  groups?: string[];
  error?: string;
}> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT group_name 
       FROM saved_queries 
       WHERE group_name IS NOT NULL 
       ORDER BY group_name`
    );
    
    const groups = result.rows.map(row => row.group_name);
    
    return {
      success: true,
      groups,
    };
  } catch (error) {
    console.error('Get query groups error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get query groups',
    };
  }
}

/**
 * Import CSV data into a table
 */
export async function importCsvData(
  tableName: string,
  columns: string[],
  rows: string[][]
): Promise<{
  success: boolean;
  insertedCount?: number;
  error?: string;
}> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Filter out 'id' column if present (it's auto-generated)
    const filteredColumns = columns.filter(col => col.toLowerCase() !== 'id');
    const idIndex = columns.findIndex(col => col.toLowerCase() === 'id');
    
    let insertedCount = 0;
    const placeholders = filteredColumns.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO ${tableName} (${filteredColumns.join(', ')}) VALUES (${placeholders})`;
    
    for (const row of rows) {
      try {
        // Remove id column value from row if it exists
        const filteredRow = idIndex >= 0 
          ? row.filter((_, i) => i !== idIndex)
          : row;
        
        await client.query(insertQuery, filteredRow);
        insertedCount++;
      } catch (rowError) {
        console.error(`Error inserting row:`, rowError);
        // Continue with other rows
      }
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      insertedCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import CSV error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import CSV data',
    };
  } finally {
    client.release();
  }
}
