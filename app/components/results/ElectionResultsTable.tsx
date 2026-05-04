'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, LinearProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  getElectionResults, getRecentlyUpdated, getAllianceTally,
  ElectionResult, RecentResult, AllianceTally, ResultFilter,
} from '@/app/actions/electionResultsActions';

const POLL_INTERVAL_MS = 30_000;

const ALLIANCE_META: Record<string, { bg: string; fg: string; border: string }> = {
  'DMK+':  { bg: '#e3f2fd', fg: '#1565c0', border: '#90caf9' },
  'ADMK+': { bg: '#fce4ec', fg: '#b71c1c', border: '#f48fb1' },
  'NTK':   { bg: '#f3e5f5', fg: '#6a1b9a', border: '#ce93d8' },
  'TVK':   { bg: '#e8f5e9', fg: '#1b5e20', border: '#a5d6a7' },
};

const DEFAULT_META = { bg: '#f5f5f5', fg: '#333', border: '#bbb' };

interface Props {
  filter: ResultFilter;
  title: string;
}

export default function ElectionResultsTable({ filter, title }: Props) {
  const [rows, setRows]           = useState<ElectionResult[]>([]);
  const [counts, setCounts]       = useState({ completed: 0, total: 0 });
  const [recent, setRecent]       = useState<RecentResult[]>([]);
  const [tally, setTally]         = useState<AllianceTally[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastFetched, setLastFetched] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const [mainRes, recentRes, tallyRes] = await Promise.all([
      getElectionResults(filter),
      getRecentlyUpdated(),
      getAllianceTally(),
    ]);

    if (mainRes.success && mainRes.data) {
      setRows(mainRes.data);
      setCounts(mainRes.counts!);
    }
    if (recentRes.success && recentRes.data) setRecent(recentRes.data);
    if (tallyRes.success  && tallyRes.data)  setTally(tallyRes.data);

    setLastFetched(new Date().toLocaleTimeString('en-IN'));
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  const completionPct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
  const totalSeats    = tally.reduce((s, t) => s + Number(t.total), 0);

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Alliance tally cards ── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 1,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'stretch',
        }}
      >
        {tally.length === 0 ? (
          <Paper elevation={1} sx={{ px: 3, py: 1.5, borderRadius: 3, color: '#aaa', fontSize: '0.9rem' }}>
            No results declared yet
          </Paper>
        ) : (
          tally.map((t) => {
            const meta = ALLIANCE_META[t.alliance] ?? DEFAULT_META;
            const pct  = totalSeats > 0 ? Math.round((Number(t.total) / totalSeats) * 100) : 0;
            return (
              <Paper
                key={t.alliance}
                elevation={2}
                sx={{
                  px: 3, py: 1.5,
                  borderRadius: 3,
                  bgcolor: meta.bg,
                  border: `2px solid ${meta.border}`,
                  minWidth: 120,
                  flex: '1 1 120px',
                  maxWidth: 200,
                }}
              >
                {/* Alliance name */}
                <Typography sx={{ fontWeight: 800, color: meta.fg, fontSize: '1rem', mb: 1 }}>
                  {t.alliance}
                </Typography>

                {/* Won + Leading counts */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', sm: '2.2rem' }, color: meta.fg, lineHeight: 1 }}>
                      {t.won}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: meta.fg, opacity: 0.7 }}>WON</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1.4rem', color: meta.fg, opacity: 0.3, pb: '18px' }}>+</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.3rem', sm: '1.6rem' }, color: meta.fg, opacity: 0.75, lineHeight: 1 }}>
                      {t.leading}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: meta.fg, opacity: 0.55 }}>LEADING</Typography>
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 5, borderRadius: 2,
                    bgcolor: `${meta.border}55`,
                    '& .MuiLinearProgress-bar': { bgcolor: meta.fg },
                  }}
                />
                <Typography sx={{ fontSize: '0.7rem', color: meta.fg, opacity: 0.6, mt: 0.5 }}>
                  {pct}% · total {t.total}
                </Typography>
              </Paper>
            );
          })
        )}

        {/* Declared / total summary */}
        <Paper elevation={1} sx={{ px: 3, py: 1.5, borderRadius: 3, bgcolor: 'white', minWidth: 120, flex: '1 1 120px', maxWidth: 200 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' }, color: '#3c4043', lineHeight: 1 }}>
            {counts.completed}
            <Typography component="span" sx={{ fontSize: '1rem', color: '#888', fontWeight: 400 }}>
              /{counts.total}
            </Typography>
          </Typography>
          <Typography sx={{ fontWeight: 600, color: '#555', fontSize: '0.9rem', mt: 0.5 }}>Declared</Typography>
          <LinearProgress variant="determinate" value={completionPct} sx={{ mt: 1, height: 4, borderRadius: 2 }} />
          <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.5 }}>{completionPct}% complete</Typography>
        </Paper>
      </Box>

      {/* ── Scrolling ticker ── */}
      {recent.length > 0 && (
        <Box
          sx={{
            mx: { xs: 2, sm: 3 },
            my: 1.5,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#1a237e',
            display: 'flex',
            alignItems: 'center',
            height: { xs: 56, sm: 68 },
          }}
        >
          <Box
            sx={{
              px: 2.5,
              bgcolor: '#e53935',
              color: 'white',
              fontWeight: 800,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              whiteSpace: 'nowrap',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              letterSpacing: '0.5px',
            }}
          >
            LATEST
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0,
                animation: `ticker ${recent.length * 6}s linear infinite`,
                whiteSpace: 'nowrap',
                '@keyframes ticker': {
                  '0%':   { transform: 'translateX(100%)' },
                  '100%': { transform: 'translateX(-100%)' },
                },
              }}
            >
              {[...recent, ...recent].map((r, i) => {
                const meta = ALLIANCE_META[r.lead_alliance_2026 ?? ''] ?? DEFAULT_META;
                return (
                  <Box
                    key={i}
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 3,
                      color: 'white',
                      fontSize: { xs: '1rem', sm: '1.15rem' },
                      borderRight: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        bgcolor: meta.bg,
                        color: meta.fg,
                        fontWeight: 800,
                        px: 1.2,
                        py: 0.3,
                        borderRadius: 1,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      }}
                    >
                      {r.lead_party_2026}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.1rem' } }}>{r.constituency_name}</Box>
                    {r.lead_party_votes_2026 && (
                      <Box component="span" sx={{ opacity: 0.8, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {r.lead_party_votes_2026.toLocaleString('en-IN')}
                      </Box>
                    )}
                    {r.runner_party_2026 && (
                      <Box component="span" sx={{ opacity: 0.6, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                        vs {r.runner_party_2026}
                        {r.runner_party_votes_2026 ? ` ${r.runner_party_votes_2026.toLocaleString('en-IN')}` : ''}
                      </Box>
                    )}
                    <Box component="span" sx={{ opacity: 0.45, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      {r.last_updated}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Page header ── */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.3rem' }, color: '#3c4043', flex: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading && <CircularProgress size={14} />}
          {lastFetched && (
            <Typography variant="caption" color="text.disabled">
              {lastFetched} · refreshes every 30s
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Results table ── */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#3c4043', color: 'white', whiteSpace: 'nowrap' } }}>
                <TableCell>#</TableCell>
                <TableCell>Constituency</TableCell>
                <TableCell>Region</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Lead Party 2026</TableCell>
                <TableCell align="right">Lead Votes</TableCell>
                <TableCell>Runner 2026</TableCell>
                <TableCell align="right">Runner Votes</TableCell>
                <TableCell align="right">Total Counted</TableCell>
                <TableCell>Alliance 2026</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell sx={{ borderLeft: '2px solid #555' }}>Winner 2021</TableCell>
                <TableCell align="right">Votes 2021</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const meta = ALLIANCE_META[row.lead_alliance_2026 ?? ''] ?? null;
                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      bgcolor: row.counting_completed && meta ? meta.bg : 'white',
                      '&:hover': { filter: 'brightness(0.96)' },
                    }}
                  >
                    <TableCell sx={{ color: '#aaa', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.constituency_name}</TableCell>
                    <TableCell>
                      {row.region
                        ? <Chip label={row.region} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={row.counting_completed ? 'Counting complete' : 'In progress'}>
                        {row.counting_completed
                          ? <CheckCircleIcon sx={{ color: '#43a047', fontSize: 20 }} />
                          : <HourglassEmptyIcon sx={{ color: '#fb8c00', fontSize: 20 }} />}
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontWeight: row.lead_party_2026 ? 700 : 400, color: meta ? meta.fg : '#bbb' }}>
                      {row.lead_party_2026 ?? '—'}
                    </TableCell>
                    <TableCell align="right">{row.lead_party_votes_2026?.toLocaleString('en-IN') ?? '—'}</TableCell>
                    <TableCell sx={{ color: row.runner_party_2026 ? '#c62828' : '#bbb' }}>
                      {row.runner_party_2026 ?? '—'}
                    </TableCell>
                    <TableCell align="right">{row.runner_party_votes_2026?.toLocaleString('en-IN') ?? '—'}</TableCell>
                    <TableCell align="right">{row.votes_counted_2026?.toLocaleString('en-IN') ?? '—'}</TableCell>
                    <TableCell>
                      {row.lead_alliance_2026 && meta ? (
                        <Chip
                          label={row.lead_alliance_2026}
                          size="small"
                          sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, border: `1px solid ${meta.border}` }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                      {row.last_updated ?? '—'}
                    </TableCell>
                    <TableCell sx={{ borderLeft: '2px solid #eee', color: '#666' }}>
                      {row.lead_party ?? '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#666' }}>
                      {row.lead_count?.toLocaleString('en-IN') ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4, color: '#aaa' }}>
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
