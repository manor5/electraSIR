'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Autocomplete,
  ListSubheader,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import { executeQuery, getTables, getTableColumns, saveQuery, getSavedQueries, deleteSavedQuery, getQueryGroups, importCsvData } from '@/app/actions/queryActions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`query-tabpanel-${index}`}
      aria-labelledby={`query-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function QueryInterface() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Execute Query tab state
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');
  const [executeSentinel, setExecuteSentinel] = useState('');

  // Query Builder tab state
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [queryType, setQueryType] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT'>('SELECT');
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, string>>({});
  const [whereClause, setWhereClause] = useState('');
  const [limitValue, setLimitValue] = useState('100');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [filePath, setFilePath] = useState('');
  
  // Saved queries state
  const [savedQueries, setSavedQueries] = useState<Array<{id: number, name: string, query: string, groupName: string | null, createdAt: Date}>>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryGroup, setQueryGroup] = useState<string>('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueriesSentinel, setSavedQueriesSentinel] = useState('');
  
  // CSV Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTable, setUploadTable] = useState('');
  const [uploadColumns, setUploadColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadSentinel, setUploadSentinel] = useState('');

  useEffect(() => {
    loadTables();
    loadSavedQueries();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadColumns(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    const result = await getTables();
    if (result.success && result.tables) {
      setTables(result.tables);
    }
  };

  const loadColumns = async (tableName: string) => {
    const result = await getTableColumns(tableName);
    if (result.success && result.columns) {
      setColumns(result.columns);
      setSelectedColumns([]);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setQueryError('Please enter a query');
      return;
    }

    setExecuting(true);
    setQueryError('');
    setQueryResult(null);

    try {
      // Check if query is non-SELECT and requires authorization
      const trimmedQuery = query.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') || 
                           trimmedQuery.startsWith('with') || 
                           trimmedQuery.startsWith('show') ||
                           trimmedQuery.startsWith('explain');
      
      if (!isSelectQuery) {
        // Check authorization code
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setExecuting(false);
          return;
        }
      }
      
      const result = await executeQuery(query);
      
      if (result.success && result.data) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      console.error('Query execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleGenerateQuery = () => {
    if (!selectedTable) {
      return;
    }

    let query = '';

    switch (queryType) {
      case 'SELECT':
        const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
        query = `SELECT ${cols}\nFROM ${selectedTable}`;
        
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        }
        
        if (limitValue) {
          query += `\nLIMIT ${limitValue}`;
        }
        break;

      case 'INSERT':
        const insertCols = selectedColumns.filter(col => columnValues[col]);
        if (insertCols.length === 0) {
          setQueryError('Please provide values for at least one column');
          return;
        }
        const insertValues = insertCols.map(col => {
          const value = columnValues[col];
          // Simple check for numeric values
          return isNaN(Number(value)) ? `'${value}'` : value;
        });
        query = `INSERT INTO ${selectedTable} (${insertCols.join(', ')})\nVALUES (${insertValues.join(', ')})`;
        break;

      case 'UPDATE':
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

      case 'DELETE':
        query = `DELETE FROM ${selectedTable}`;
        
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        } else {
          setQueryError('WHERE clause is required for DELETE operations');
          return;
        }
        break;

      case 'EXPORT':
        if (!filePath.trim()) {
          setQueryError('File path is required for EXPORT operations');
          return;
        }
        const exportCols = selectedColumns.length > 0 ? selectedColumns : columns.map(c => c.name);
        query = `COPY ${selectedTable} (\n  ${exportCols.join(',\n  ')}\n)\nFROM '${filePath}'\nWITH (\n  FORMAT csv,\n  HEADER true,\n  ENCODING 'UTF8'\n);`;
        break;
    }

    setGeneratedQuery(query);
    setQueryError('');
  };

  const handleExecuteGeneratedQuery = async () => {
    setQuery(generatedQuery);
    setActiveTab(0);
    
    // Execute the query after a short delay
    setTimeout(async () => {
      setExecuting(true);
      setQueryError('');
      setQueryResult(null);

      try {
        const result = await executeQuery(generatedQuery);
        
        if (result.success && result.data) {
          setQueryResult(result.data);
        } else {
          setQueryError(result.error || 'Query execution failed');
        }
      } catch (err) {
        setQueryError('An error occurred while executing the query');
        console.error('Query execution error:', err);
      } finally {
        setExecuting(false);
      }
    }, 100);
  };

  const toggleColumn = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName)
        ? prev.filter((col) => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadSavedQueries = async () => {
    const result = await getSavedQueries();
    if (result.success && result.queries) {
      setSavedQueries(result.queries);
    }
    
    const groupsResult = await getQueryGroups();
    if (groupsResult.success && groupsResult.groups) {
      setAvailableGroups(groupsResult.groups);
    }
  };

  const handleSaveQuery = async () => {
    if (!queryName.trim() || !generatedQuery) return;
    
    const result = await saveQuery(queryName.trim(), generatedQuery, queryGroup || undefined);
    
    if (result.success) {
      await loadSavedQueries();
      setQueryName('');
      setQueryGroup('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadQuery = (savedQuery: {id: number, name: string, query: string, groupName: string | null, createdAt: Date}) => {
    // Validate authorization code
    if (savedQueriesSentinel !== '#mano') {
      alert('You do not have permission to load saved queries.');
      return;
    }
    
    setQuery(savedQuery.query);
    setGeneratedQuery(savedQuery.query);
    setActiveTab(0);
  };

  const handleDeleteQuery = async (id: number) => {
    const result = await deleteSavedQuery(id);
    if (result.success) {
      await loadSavedQueries();
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTable) {
      setUploadResult('Please select both a file and a table');
      return;
    }

    // Check sentinel
    if (uploadSentinel !== '#mano') {
      setUploadResult('You do not have permission for this operation.');
      return;
    }

    setUploading(true);
    setUploadResult('');

    try {
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setUploadResult('Error: File must have at least a header row and one data row');
        setUploading(false);
        return;
      }

      // Parse CSV header
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["|']|["|']$/g, ''));
      
      // Parse data rows
      const dataRows: string[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["|']|["|']$/g, ''));
        if (values.length === headers.length) {
          dataRows.push(values);
        }
      }

      if (dataRows.length === 0) {
        setUploadResult('Error: No valid data rows found');
        setUploading(false);
        return;
      }

      // Import data
      const result = await importCsvData(uploadTable, headers, dataRows);
      
      if (result.success) {
        setUploadResult(`Success! Inserted ${result.insertedCount} rows into ${uploadTable}.\n\nTotal rows in CSV: ${dataRows.length}\nSuccessfully inserted: ${result.insertedCount}`);
      } else {
        setUploadResult(`Error: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`Error: ${error instanceof Error ? error.message : 'Failed to process file'}`);
    } finally {
      setUploading(false);
    }
  };

  const loadUploadTableColumns = async (tableName: string) => {
    const result = await getTableColumns(tableName);
    if (result.success && result.columns) {
      setUploadColumns([]);
    }
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Execute Query" />
        <Tab label="Query Builder" />
        <Tab label="Saved Queries" />
        <Tab label="CSV Upload" />
      </Tabs>

      {/* Execute Query Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ p: 3 }}>
          <TextField
            multiline
            rows={8}
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Authorization Code (Required for non-SELECT queries)"
            type="password"
            fullWidth
            value={executeSentinel}
            onChange={(e) => setExecuteSentinel(e.target.value)}
            placeholder="Enter authorization code"
            helperText="Only required for INSERT, UPDATE, DELETE operations"
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleExecuteQuery}
              disabled={executing}
            >
              {executing ? <CircularProgress size={24} /> : 'Execute Query'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => {
                setGeneratedQuery(query);
                setSaveDialogOpen(true);
              }}
              disabled={!query.trim()}
            >
              Save Query
            </Button>
          </Stack>

          {queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {queryError}
            </Alert>
          )}

          {queryResult && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Results ({queryResult.rowCount} rows)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {queryResult.columns.map((col: string) => (
                        <TableCell key={col}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.rows.map((row: any, index: number) => (
                      <TableRow key={index}>
                        {queryResult.columns.map((col: string) => (
                          <TableCell key={col}>
                            {row[col] !== null && row[col] !== undefined 
                              ? String(row[col]) 
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Query Builder Tab */}
      <TabPanel value={activeTab} index={1}>
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
                  setGeneratedQuery('');
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
                      onClick={handleExecuteGeneratedQuery}
                    >
                      Execute Generated Query
                    </Button>
                  )}
                </Box>

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
                            onClick={() => setSaveDialogOpen(true)}
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
      </TabPanel>

      {/* Saved Queries Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Authorization Code"
              type="password"
              fullWidth
              value={savedQueriesSentinel}
              onChange={(e) => setSavedQueriesSentinel(e.target.value)}
              placeholder="Enter authorization code"
              helperText="Required to load and view saved queries"
            />
            
            <FormControl fullWidth>
              <InputLabel>Filter by Group</InputLabel>
              <Select
                value={selectedGroupFilter || ''}
                label="Filter by Group"
                onChange={(e) => setSelectedGroupFilter(e.target.value || null)}
              >
                <MenuItem value="">Ungrouped</MenuItem>
                {availableGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Search queries"
              placeholder="Search by name or query text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Stack>
          
          {savedQueries
            .filter(q => q.groupName === selectedGroupFilter)
            .filter(q => {
              if (!searchQuery.trim()) return true;
              const search = searchQuery.toLowerCase();
              return q.name.toLowerCase().includes(search) || 
                     q.query.toLowerCase().includes(search);
            }).length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery.trim() 
                  ? 'No queries match your search' 
                  : selectedGroupFilter === null 
                    ? 'No ungrouped queries' 
                    : `No queries in "${selectedGroupFilter}" group`}
              </Typography>
            </Box>
          ) : (
            <List>
              {savedQueries
                .filter(q => q.groupName === selectedGroupFilter)
                .filter(q => {
                  if (!searchQuery.trim()) return true;
                  const search = searchQuery.toLowerCase();
                  return q.name.toLowerCase().includes(search) || 
                         q.query.toLowerCase().includes(search);
                })
                .map((savedQuery) => (
                  <ListItem
                    key={savedQuery.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Copy query">
                          <IconButton
                            edge="end"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(savedQuery.query);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }}
                            size="small"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteQuery(savedQuery.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemButton onClick={() => handleLoadQuery(savedQuery)}>
                      <ListItemText
                        primary={savedQuery.name}
                        secondary={
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {savedQuery.query}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          )}
        </Box>
      </TabPanel>

      {/* CSV Upload Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload CSV to Table
          </Typography>
          
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Select Target Table</InputLabel>
              <Select
                value={uploadTable}
                label="Select Target Table"
                onChange={(e) => {
                  setUploadTable(e.target.value);
                  loadUploadTableColumns(e.target.value);
                }}
              >
                {tables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploadFile ? uploadFile.name : 'Choose CSV File'}
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadResult('');
                    }
                  }}
                />
              </Button>
              {uploadFile && (
                <Typography variant="caption" color="text.secondary">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>

            <Alert severity="info">
              The CSV file should have headers matching the table columns. Data will be inserted directly into the database.
            </Alert>

            <TextField
              label="Authorization Code"
              type="password"
              fullWidth
              value={uploadSentinel}
              onChange={(e) => setUploadSentinel(e.target.value)}
              placeholder="Enter authorization code"
              helperText="Required for data upload operations"
            />

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={uploading || !uploadFile || !uploadTable || !uploadSentinel}
              fullWidth
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload and Insert Data'}
            </Button>

            {uploadResult && (
              <Alert 
                severity={uploadResult.startsWith('Success') ? 'success' : 'error'}
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {uploadResult}
              </Alert>
            )}
          </Stack>
        </Box>
      </TabPanel>

      {/* Save Query Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Query</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Query Name"
              fullWidth
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="e.g., Get all voters by district"
            />
            <Autocomplete
              freeSolo
              options={availableGroups}
              value={queryGroup}
              onChange={(event, newValue) => setQueryGroup(newValue || '')}
              onInputChange={(event, newValue) => setQueryGroup(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Group (Optional)"
                  placeholder="e.g., Reports, Analytics"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuery} variant="contained" disabled={!queryName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
