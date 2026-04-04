
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Autocomplete } from '@mui/material';
import React from 'react';

interface SaveQueryDialogProps {
  open: boolean;
  onClose: () => void;
  queryName: string;
  setQueryName: (name: string) => void;
  queryGroup: string;
  setQueryGroup: (group: string) => void;
  availableGroups: string[];
  handleSaveQuery: () => void;
}

const SaveQueryDialog: React.FC<SaveQueryDialogProps> = ({
  open,
  onClose,
  queryName,
  setQueryName,
  queryGroup,
  setQueryGroup,
  availableGroups,
  handleSaveQuery,
}) => (
  <Dialog open={open} onClose={onClose}>
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
          onChange={(_, newValue) => setQueryGroup(newValue || '')}
          onInputChange={(_, newValue) => setQueryGroup(newValue)}
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
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={handleSaveQuery} variant="contained" disabled={!queryName.trim()}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

export default SaveQueryDialog;
