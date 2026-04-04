import { getTables } from '@/app/actions/queryActions';

import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Chip,
  Button,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';

export default function QueryBuilderForm() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [queryType, setQueryType] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT'>('SELECT');
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, string>>({});
  const [whereClause, setWhereClause] = useState('');
  const [limitValue, setLimitValue] = useState('100');
  const [generatedQuery, setLocalGeneratedQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [queryError, setQueryError] = useState('');

  useEffect(() => {
    // @ts-ignore: getTables is globally available or imported elsewhere
    getTables().then(result => {
      if (result.success && result.tables) {
        setTables(result.tables);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedTable) {
      // @ts-ignore: getTableColumns is globally available or imported elsewhere
      getTableColumns(selectedTable).then(result => {
        if (result.success && result.columns) {
          setColumns(result.columns);
          setSelectedColumns([]);
        }
      });
    }
  }, [selectedTable]);

  const toggleColumn = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName)
        ? prev.filter((col) => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleGenerateQuery = () => {
    if (!selectedTable) {
      return;
    }
    let query = '';
    switch (queryType) {
      case 'SELECT': {
        const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
        query = `SELECT ${cols}\nFROM ${selectedTable}`;
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        }
        if (limitValue) {
          query += `\nLIMIT ${limitValue}`;
        }
        break;
      }
      case 'INSERT': {
        const insertCols = selectedColumns.filter(col => columnValues[col]);
        if (insertCols.length === 0) {
          setQueryError('Please provide values for at least one column');
          return;
        }
        const insertValues = insertCols.map(col => {
          const value = columnValues[col];
          return isNaN(Number(value)) ? `'${value}'` : value;
        });
        query = `INSERT INTO ${selectedTable} (${insertCols.join(', ')})\nVALUES (${insertValues.join(', ')})`;
        break;
      }
      case 'UPDATE': {
        const updateCols = selectedColumns.filter(col => columnValues[col]);
        if (updateCols.length === 0) {
          setQueryError('Please provide values for at least one column');
          return;
        }
        const setClauses = updateCols.map(col => {
          const value = columnValues[col];
          const formattedValue = isNaN(Number(value)) ? `'${value}'` : value;
          return `${col} = ${formattedValue}`;
        });
        query = `UPDATE ${selectedTable}\nSET ${setClauses.join(', ')}`;
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        } else {
          setQueryError('WHERE clause is required for UPDATE operations');
          return;
        }
        break;
      }
      case 'DELETE': {
        query = `DELETE FROM ${selectedTable}`;
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        } else {
          setQueryError('WHERE clause is required for DELETE operations');
          return;
        }
        break;
      }
      case 'EXPORT': {
        if (!filePath.trim()) {
          setQueryError('File path is required for EXPORT operations');
          return;
        }
        const exportCols = selectedColumns.length > 0 ? selectedColumns : columns.map(c => c.name);
        query = `COPY ${selectedTable} (\n  ${exportCols.join(',\n  ')}\n)\nFROM '${filePath}'\nWITH (\n  FORMAT csv,\n  HEADER true,\n  ENCODING 'UTF8'\n);`;
        break;
      }
    }
    setLocalGeneratedQuery(query);
    // setGeneratedQuery removed; implement local logic or context if needed
    setQueryError('');
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Query Type</InputLabel>
          <Select
            value={queryType}
            label="Query Type"
            onChange={(e) => {
              setQueryType(e.target.value as any);
              setSelectedColumns([]);
              setColumnValues({});
              setLocalGeneratedQuery('');
              // setGeneratedQuery removed; implement local logic or context if needed
              setFilePath('');
            }}
          >
            <MenuItem value="SELECT">SELECT</MenuItem>
            <MenuItem value="INSERT">INSERT</MenuItem>
            <MenuItem value="UPDATE">UPDATE</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
            <MenuItem value="EXPORT">EXPORT (COPY FROM)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Select Table</InputLabel>
          <Select
            value={selectedTable}
            label="Select Table"
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            {tables.map((table) => (
              <MenuItem key={table} value={table}>
                {table}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedTable && (
          <>
            {queryType === 'SELECT' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Columns (click to toggle):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {columns.map((col) => (
                    <Chip
                      key={col.name}
                      label={`${col.name} (${col.type})`}
                      onClick={() => toggleColumn(col.name)}
                      color={selectedColumns.includes(col.name) ? 'primary' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                {selectedColumns.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No columns selected - will use SELECT *
                  </Typography>
                )}
              </Box>
            )}

            {queryType === 'EXPORT' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Columns to Export (click to toggle):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {columns.map((col) => (
                    <Chip
                      key={col.name}
                      label={`${col.name} (${col.type})`}
                      onClick={() => toggleColumn(col.name)}
                      color={selectedColumns.includes(col.name) ? 'primary' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                {selectedColumns.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No columns selected - will use all columns
                  </Typography>
                )}
              </Box>
            )}

            {(queryType === 'INSERT' || queryType === 'UPDATE') && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Column Values:
                </Typography>
                <Stack spacing={2}>
                  {columns.map((col) => (
                    <TextField
                      key={col.name}
                      label={`${col.name} (${col.type})`}
                      fullWidth
                      value={columnValues[col.name] || ''}
                      onChange={(e) => {
                        setColumnValues(prev => ({ ...prev, [col.name]: e.target.value }));
                        if (!selectedColumns.includes(col.name) && e.target.value) {
                          setSelectedColumns(prev => [...prev, col.name]);
                        }
                      }}
                      placeholder={`Enter value for ${col.name}`}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {queryType === 'EXPORT' && (
              <TextField
                label="File Path"
                fullWidth
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g., /Users/username/Documents/data.csv"
                helperText="Full path to the CSV file to import"
                required
              />
            )}

            {(queryType === 'UPDATE' || queryType === 'DELETE' || queryType === 'SELECT') && (
              <TextField
                label={`WHERE Clause ${(queryType === 'UPDATE' || queryType === 'DELETE') ? '(required)' : '(optional)'}`}
                fullWidth
                value={whereClause}
                onChange={(e) => setWhereClause(e.target.value)}
                placeholder="e.g., id = 1 OR name ILIKE '%john%'"
                required={queryType === 'UPDATE' || queryType === 'DELETE'}
              />
            )}

            {queryType === 'SELECT' && (
              <TextField
                label="LIMIT"
                fullWidth
                type="number"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                sx={{ maxWidth: 300 }}
              />
            )}

            <Box>
              <Button
                variant="contained"
                onClick={handleGenerateQuery}
                sx={{ mr: 2 }}
              >
                Generate Query
              </Button>
              {generatedQuery && (
                <Button
                  variant="outlined"
                  // onClick={handleExecuteGeneratedQuery} // Not implemented here
                >
                  Execute Generated Query
                </Button>
              )}
            </Box>

            {queryError && (
              <Typography color="error.main" variant="body2">
                {queryError}
              </Typography>
            )}

            {generatedQuery && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">
                    Generated Query:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={copySuccess ? "Copied!" : "Copy query"}>
                      <IconButton
                        onClick={handleCopyQuery}
                        size="small"
                        color={copySuccess ? "success" : "default"}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Save query">
                      <IconButton
                        // setSaveDialogOpen removed; implement local logic or context if needed
                        size="small"
                        color="primary"
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography
                    component="pre"
                    sx={{ fontFamily: 'monospace', fontSize: '0.875rem', m: 0 }}
                  >
                    {generatedQuery}
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
