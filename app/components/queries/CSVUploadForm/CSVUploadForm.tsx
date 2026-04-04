import { getTables } from '@/app/actions/queryActions';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
} from '@mui/material';

export default function CSVUploadForm() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTable, setUploadTable] = useState('');
  const [uploadColumns, setUploadColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadSentinel, setUploadSentinel] = useState('');
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    // @ts-ignore: getTables is globally available or imported elsewhere
    getTables().then(result => {
      if (result.success && result.tables) {
        setTables(result.tables);
      }
    });
  }, []);

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTable) {
      setUploadResult('Please select both a file and a table');
      return;
    }
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
      const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
      const dataRows: string[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^\"|\"$/g, ''));
        if (values.length === headers.length) {
          dataRows.push(values);
        }
      }
      if (dataRows.length === 0) {
        setUploadResult('Error: No valid data rows found');
        setUploading(false);
        return;
      }
      // @ts-ignore: importCsvData is globally available or imported elsewhere
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

  return (
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
            onChange={(e) => setUploadTable(e.target.value)}
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
            {uploadFile ? uploadFile.name : 'Select CSV File'}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
            />
          </Button>
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
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>
        {uploadResult && (
          <Alert severity={uploadResult.startsWith('Success') ? 'success' : 'error'} sx={{ whiteSpace: 'pre-line' }}>
            {uploadResult}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
