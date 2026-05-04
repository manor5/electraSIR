'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select, MenuItem,
  Button, Chip, CircularProgress, Switch, FormControlLabel,
  Snackbar, Alert, InputAdornment, TableSortLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getElectionResults, getParties, updateConstituencyResult,
  ElectionResult, Party,
} from '@/app/actions/electionResultsActions';

interface EditState {
  lead_party_2026: string;
  lead_party_votes_2026: string;
  runner_party_2026: string;
  runner_party_votes_2026: string;
  votes_counted_2026: string;
  counting_completed: boolean;
}

const EMPTY_EDIT: EditState = {
  lead_party_2026: '',
  lead_party_votes_2026: '',
  runner_party_2026: '',
  runner_party_votes_2026: '',
  votes_counted_2026: '',
  counting_completed: false,
};

function toEditState(r: ElectionResult): EditState {
  return {
    lead_party_2026:         r.lead_party_2026 ?? '',
    lead_party_votes_2026:   r.lead_party_votes_2026?.toString() ?? '',
    runner_party_2026:       r.runner_party_2026 ?? '',
    runner_party_votes_2026: r.runner_party_votes_2026?.toString() ?? '',
    votes_counted_2026:      r.votes_counted_2026?.toString() ?? '',
    counting_completed:      r.counting_completed,
  };
}

const ALLIANCE_COLORS: Record<string, { bg: string; fg: string }> = {
  'DMK+':  { bg: '#e3f2fd', fg: '#1565c0' },
  'ADMK+': { bg: '#fce4ec', fg: '#b71c1c' },
  'NTK':   { bg: '#f3e5f5', fg: '#6a1b9a' },
  'TVK':   { bg: '#e8f5e9', fg: '#1b5e20' },
};

export default function UpdateResultsPage() {
  const [rows, setRows]           = useState<ElectionResult[]>([]);
  const [parties, setParties]     = useState<Party[]>([]);
  const [edits, setEdits]         = useState<Record<number, EditState>>({});
  const [saving, setSaving]       = useState<Record<number, boolean>>({});
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const load = useCallback(async () => {
    const [resRows, resParties] = await Promise.all([
      getElectionResults('all'),
      getParties(),
    ]);
    if (resRows.success && resRows.data) {
      setRows(resRows.data);
      const initial: Record<number, EditState> = {};
      resRows.data.forEach((r) => { initial[r.id] = toEditState(r); });
      setEdits(initial);
    }
    if (resParties.success && resParties.data) setParties(resParties.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (id: number, field: keyof EditState, value: string | boolean) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const allianceFor = (party: string) =>
    parties.find((p) => p.party_short_name === party)?.alliance ?? null;

  const handleSave = async (row: ElectionResult) => {
    const e = edits[row.id];
    if (!e) return;
    setSaving((p) => ({ ...p, [row.id]: true }));

    const result = await updateConstituencyResult(row.id, {
      lead_party_2026:         e.lead_party_2026 || null,
      lead_party_votes_2026:   e.lead_party_votes_2026 ? Number(e.lead_party_votes_2026) : null,
      runner_party_2026:       e.runner_party_2026 || null,
      runner_party_votes_2026: e.runner_party_votes_2026 ? Number(e.runner_party_votes_2026) : null,
      votes_counted_2026:      e.votes_counted_2026 ? Number(e.votes_counted_2026) : null,
      counting_completed:      e.counting_completed,
    });

    setSaving((p) => ({ ...p, [row.id]: false }));
    setToast({
      open: true,
      msg: result.success ? `${row.constituency_name} updated` : result.error ?? 'Update failed',
      severity: result.success ? 'success' : 'error',
    });
  };

  const filtered = rows.filter((r) =>
    r.constituency_name.toLowerCase().includes(search.toLowerCase())
  );

  const partySelect = (id: number, field: 'lead_party_2026' | 'runner_party_2026') => (
    <Select
      size="small"
      value={edits[id]?.[field] ?? ''}
      onChange={(e) => setField(id, field, e.target.value)}
      displayEmpty
      sx={{ minWidth: 90, fontSize: '0.82rem' }}
    >
      <MenuItem value=""><em style={{ color: '#aaa' }}>—</em></MenuItem>
      {parties.map((p) => (
        <MenuItem key={p.party_short_name} value={p.party_short_name}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {p.party_short_name}
            <Typography variant="caption" sx={{ color: '#aaa' }}>{p.alliance}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#3c4043', flex: 1 }}>
          Update Election Results 2026
        </Typography>
        <TextField
          size="small"
          placeholder="Search constituency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            },
          }}
          sx={{ width: 240, bgcolor: 'white', borderRadius: 2 }}
        />
        {loading && <CircularProgress size={20} />}
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflowX: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#3c4043', color: 'white', whiteSpace: 'nowrap' } }}>
              <TableCell>#</TableCell>
              <TableCell>Constituency</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Lead Party</TableCell>
              <TableCell>Lead Votes</TableCell>
              <TableCell>Runner Party</TableCell>
              <TableCell>Runner Votes</TableCell>
              <TableCell>Total Counted</TableCell>
              <TableCell align="center">Counting Done</TableCell>
              <TableCell>Alliance</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="center">Save</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row, idx) => {
              const e   = edits[row.id] ?? EMPTY_EDIT;
              const alliancePreview = allianceFor(e.lead_party_2026);
              const allianceMeta   = ALLIANCE_COLORS[alliancePreview ?? ''] ?? null;
              const isSaving       = saving[row.id] ?? false;

              return (
                <TableRow
                  key={row.id}
                  sx={{
                    bgcolor: e.counting_completed && allianceMeta ? allianceMeta.bg : 'white',
                    '&:hover': { filter: 'brightness(0.97)' },
                    verticalAlign: 'middle',
                  }}
                >
                  <TableCell sx={{ color: '#aaa', fontSize: '0.75rem' }}>{idx + 1}</TableCell>

                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: 160 }}>
                    {row.constituency_name}
                  </TableCell>

                  <TableCell>
                    {row.region
                      ? <Chip label={row.region} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      : '—'}
                  </TableCell>

                  <TableCell>{partySelect(row.id, 'lead_party_2026')}</TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={e.lead_party_votes_2026}
                      onChange={(ev) => setField(row.id, 'lead_party_votes_2026', ev.target.value)}
                      sx={{ width: 110 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>

                  <TableCell>{partySelect(row.id, 'runner_party_2026')}</TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={e.runner_party_votes_2026}
                      onChange={(ev) => setField(row.id, 'runner_party_votes_2026', ev.target.value)}
                      sx={{ width: 110 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={e.votes_counted_2026}
                      onChange={(ev) => setField(row.id, 'votes_counted_2026', ev.target.value)}
                      sx={{ width: 110 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={e.counting_completed}
                      onChange={(ev) => setField(row.id, 'counting_completed', ev.target.checked)}
                      color="success"
                    />
                  </TableCell>

                  <TableCell>
                    {alliancePreview && allianceMeta ? (
                      <Chip
                        label={alliancePreview}
                        size="small"
                        sx={{ bgcolor: allianceMeta.bg, color: allianceMeta.fg, fontWeight: 700 }}
                      />
                    ) : '—'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {row.last_updated ?? '—'}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleSave(row)}
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SaveIcon fontSize="small" />}
                      sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
