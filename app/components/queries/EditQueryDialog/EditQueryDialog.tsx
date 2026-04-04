
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Autocomplete, Box } from '@mui/material';
import React from 'react';

interface EditQueryDialogProps {
  open: boolean;
  onClose: () => void;
  editQueryName: string;
  setEditQueryName: (name: string) => void;
  editQueryText: string;
  setEditQueryText: (text: string) => void;
  editQueryGroup: string;
  setEditQueryGroup: (group: string) => void;
  editQueryOrder: number;
  setEditQueryOrder: (order: number) => void;
  availableGroups: string[];
  handleUpdateQuery: () => void;
  handleDeleteQuery: (id: number) => void;
  editingQuery: any;
  setEditDialogOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setActiveTab: (tab: number) => void;
  setExecuting: (exec: boolean) => void;
  setQueryError: (err: string) => void;
  setQueryResult: (result: any) => void;
  executeSentinel: string;
  executeQuery: (query: string) => Promise<any>;
  setDownloading: (downloading: boolean) => void;
  PlayArrowIcon: any;
  DownloadIcon: any;
  ContentCopyIcon: any;
  DeleteIcon: any;
  getRiskColor: (query: string) => string;
  getRiskBorderColor: (query: string) => string;
  getQueryRiskLevel: (query: string) => string;
}

const EditQueryDialog: React.FC<EditQueryDialogProps> = ({
  open,
  onClose,
  editQueryName,
  setEditQueryName,
  editQueryText,
  setEditQueryText,
  editQueryGroup,
  setEditQueryGroup,
  editQueryOrder,
  setEditQueryOrder,
  availableGroups,
  handleUpdateQuery,
  handleDeleteQuery,
  editingQuery,
  setEditDialogOpen,
  setQuery,
  setActiveTab,
  setExecuting,
  setQueryError,
  setQueryResult,
  executeSentinel,
  executeQuery,
  setDownloading,
  PlayArrowIcon,
  DownloadIcon,
  ContentCopyIcon,
  DeleteIcon,
  getRiskColor,
  getRiskBorderColor,
  getQueryRiskLevel,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Edit Query</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          autoFocus
          label="Query Name"
          fullWidth
          value={editQueryName}
          onChange={(e) => setEditQueryName(e.target.value)}
          placeholder="e.g., Get all voters by district"
        />
        <TextField
          label="Query"
          fullWidth
          multiline
          rows={10}
          value={editQueryText}
          onChange={(e) => setEditQueryText(e.target.value)}
          placeholder="Enter your SQL query here..."
          sx={{ 
            fontFamily: 'monospace',
            '& .MuiOutlinedInput-root': {
              backgroundColor: editQueryText.trim() ? getRiskColor(editQueryText) : 'transparent',
              borderColor: editQueryText.trim() ? getRiskBorderColor(editQueryText) : undefined,
              '& fieldset': {
                borderColor: editQueryText.trim() ? getRiskBorderColor(editQueryText) : undefined,
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: editQueryText.trim() ? getRiskBorderColor(editQueryText) : undefined,
              },
              '&.Mui-focused fieldset': {
                borderColor: editQueryText.trim() ? getRiskBorderColor(editQueryText) : undefined,
              },
            },
          }}
        />
        <Autocomplete
          freeSolo
          options={availableGroups}
          value={editQueryGroup}
          onChange={(_, newValue) => setEditQueryGroup(newValue || '')}
          onInputChange={(_, newValue) => setEditQueryGroup(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Group (Optional)"
              placeholder="e.g., Reports, Analytics"
            />
          )}
        />
        <TextField
          label="Display Order"
          type="number"
          fullWidth
          value={editQueryOrder}
          onChange={(e) => setEditQueryOrder(parseInt(e.target.value) || 0)}
          helperText="Lower numbers appear first within the group"
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={async () => {
              if (!editingQuery) return;
              setEditDialogOpen(false);
              setQuery(editQueryText);
              setActiveTab(0);
              setTimeout(async () => {
                setExecuting(true);
                setQueryError('');
                setQueryResult(null);
                try {
                  const trimmedQuery = editQueryText.trim().toLowerCase();
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
                  const result = await executeQuery(editQueryText);
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
            }}
            size="small"
            disabled={!editQueryText.trim()}
          >
            Execute
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={async () => {
              if (!editingQuery) return;
              setEditDialogOpen(false);
              setDownloading(true);
              setQueryError('');
              try {
                const trimmedQuery = editQueryText.trim().toLowerCase();
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
                const result = await executeQuery(editQueryText);
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
                  link.setAttribute('download', `${editQueryName.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  setQueryError(result.error || 'Query execution failed');
                }
              } catch (err) {
                setQueryError('An error occurred while executing the query');
                console.error('Query execution error:', err);
              } finally {
                setDownloading(false);
              }
            }}
            size="small"
            disabled={!editQueryText.trim()}
          >
            Download CSV
          </Button>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(editQueryText);
              } catch (err) {
                console.error('Failed to copy:', err);
              }
            }}
            size="small"
            disabled={!editQueryText.trim()}
          >
            Copy
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            onClick={async () => {
              if (!editingQuery) return;
              if (window.confirm(`Are you sure you want to delete "${editQueryName}"?`)) {
                await handleDeleteQuery(editingQuery.id);
                setEditDialogOpen(false);
              }
            }}
            size="small"
            color="error"
          >
            Delete
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdateQuery} variant="contained" disabled={!editQueryName.trim() || !editQueryText.trim()}>
            Update
          </Button>
        </Box>
      </Box>
    </DialogActions>
  </Dialog>
);

export default EditQueryDialog;
