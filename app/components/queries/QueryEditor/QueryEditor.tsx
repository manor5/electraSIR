
import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';

export default function QueryEditor() {
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');
  const [executeSentinel, setExecuteSentinel] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Utility functions for risk color (could be moved to utils)
  const getQueryRiskLevel = (query: string): 'safe' | 'moderate' | 'dangerous' => {
    const trimmed = query.trim().toLowerCase();
    const noComments = trimmed
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const dangerousKeywords = ['delete', 'drop', 'truncate', 'alter'];
    const hasDangerous = dangerousKeywords.some(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasDangerous) return 'dangerous';
    const moderateKeywords = ['insert', 'update', 'create', 'grant', 'revoke', 'merge'];
    const hasModerate = moderateKeywords.some(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasModerate) return 'moderate';
    return 'safe';
  };
  const getRiskColor = (riskLevel: 'safe' | 'moderate' | 'dangerous') => {
    switch (riskLevel) {
      case 'safe': return '#e8f5e9';
      case 'moderate': return '#fff8e1';
      case 'dangerous': return '#ffebee';
    }
  };
  const getRiskBorderColor = (riskLevel: 'safe' | 'moderate' | 'dangerous') => {
    switch (riskLevel) {
      case 'safe': return '#4caf50';
      case 'moderate': return '#ff9800';
      case 'dangerous': return '#f44336';
    }
  };

  // Handlers
  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setQueryError('Please enter a query');
      return;
    }
    setExecuting(true);
    setQueryError('');
    setQueryResult(null);
    try {
      const trimmedQuery = query.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') ||
        trimmedQuery.startsWith('with') ||
        trimmedQuery.startsWith('show') ||
        trimmedQuery.startsWith('explain');
      if (!isSelectQuery) {
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setExecuting(false);
          return;
        }
      }
      // @ts-ignore: executeQuery is globally available or imported elsewhere
      const result = await executeQuery(query);
      if (result.success && result.data) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      // eslint-disable-next-line no-console
      console.error('Query execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) return;
    const columns = queryResult.columns;
    const rows = queryResult.rows;
    const csvHeader = columns.join(',');
    const csvRows = rows.map((row: any) => {
      return columns.map((col: string) => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectDownloadCSV = async () => {
    if (!query.trim()) {
      setQueryError('Please enter a query');
      return;
    }
    setDownloading(true);
    setQueryError('');
    try {
      const trimmedQuery = query.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') ||
        trimmedQuery.startsWith('with') ||
        trimmedQuery.startsWith('show') ||
        trimmedQuery.startsWith('explain');
      if (!isSelectQuery) {
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setDownloading(false);
          return;
        }
      }
      // @ts-ignore: executeQuery is globally available or imported elsewhere
      const result = await executeQuery(query);
      if (result.success && result.data) {
        const columns = result.data.columns;
        const rows = result.data.rows;
        if (rows.length === 0) {
          setQueryError('Query returned no results');
          setDownloading(false);
          return;
        }
        const csvHeader = columns.join(',');
        const csvRows = rows.map((row: any) => {
          return columns.map((col: string) => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',');
        });
        const csvContent = [csvHeader, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      // eslint-disable-next-line no-console
      console.error('Query execution error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <TextField
        multiline
        rows={8}
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter your SQL query here..."
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: query.trim() ? getRiskColor(getQueryRiskLevel(query)) : 'transparent',
            borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
            '& fieldset': {
              borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
            },
            '&.Mui-focused fieldset': {
              borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
            },
          },
        }}
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
          disabled={executing || downloading}
        >
          {executing ? <CircularProgress size={24} /> : 'Execute Query'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleDirectDownloadCSV}
          disabled={executing || downloading}
        >
          {downloading ? <CircularProgress size={24} /> : 'Download CSV'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => {
            // setGeneratedQuery and setSaveDialogOpen removed; implement local logic or context if needed
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              Results ({queryResult.rowCount} rows)
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadCSV}
              disabled={!queryResult.rows || queryResult.rows.length === 0}
            >
              Download CSV
            </Button>
          </Box>
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
  );
}
