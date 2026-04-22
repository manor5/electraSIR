'use client';

import { useState, useRef, useCallback } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchByVoterId, VoterRecord } from '../actions/voterIdSearchActions';

type SearchState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

const tamil = { fontFamily: "'Noto Sans Tamil', sans-serif" };

export default function VoterSearchPage() {
  const [voterId, setVoterId] = useState('');
  const [state, setState] = useState<SearchState>('idle');
  const [record, setRecord] = useState<VoterRecord | null>(null);
  const lastSearched = useRef('');

  const doSearch = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || trimmed === lastSearched.current) return;
    lastSearched.current = trimmed;

    setState('loading');
    setRecord(null);

    const result = await searchByVoterId(trimmed);

    if (!result.success) {
      setState('error');
      return;
    }

    if (result.data) {
      setRecord(result.data);
      setState('found');
    } else {
      setState('not_found');
    }
  }, []);

  const handleBlur = () => doSearch(voterId);

  const handleSearch = () => {
    lastSearched.current = '';
    doSearch(voterId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      lastSearched.current = '';
      doSearch(voterId);
    }
  };

  const isIdle = state === 'idle';

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isIdle ? 'center' : 'flex-start',
        pt: isIdle ? 0 : { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 },
        pb: 4,
        bgcolor: '#f8f9fa',
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          ...tamil,
          mb: { xs: 3, sm: 4 },
          fontWeight: 700,
          color: '#3c4043',
          fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' },
        }}
      >
        வாக்காளர் தேடல்
      </Typography>

      {/* Search Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          maxWidth: { xs: '100%', sm: 600, md: 680 },
          mb: { xs: 3, sm: 4 },
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="வாக்காளர் அடையாள எண்"
          value={voterId}
          onChange={(e) => setVoterId(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              sx: {
                ...tamil,
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                borderRadius: '28px 0 0 28px',
                bgcolor: 'white',
                '& fieldset': { borderRight: 'none', borderRadius: '28px 0 0 28px' },
                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            },
            htmlInput: {
              sx: {
                py: { xs: '14px', sm: '18px' },
                px: { xs: 2, sm: 3 },
              },
            },
          }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={state === 'loading'}
          sx={{
            minWidth: { xs: 60, sm: 80 },
            borderRadius: '0 28px 28px 0',
            boxShadow: 'none',
            fontSize: { xs: '1rem', sm: '1.2rem' },
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {state === 'loading' ? (
            <CircularProgress size={26} sx={{ color: 'white' }} />
          ) : (
            <SearchIcon sx={{ fontSize: { xs: '1.6rem', sm: '2rem' } }} />
          )}
        </Button>
      </Box>

      {/* Results */}
      {state === 'found' && record && (
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 600, md: 680 },
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
          }}
        >
          <ResultRow label="பெயர்" value={record.name} />
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <ResultRow label="பாகம் எண்" value={record.booth} />
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <ResultRow label="வரிசை எண்" value={record.serial_no} />
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <ResultRow label="வார்டு" value={record.ward} />
        </Paper>
      )}

      {state === 'not_found' && (
        <Paper
          elevation={1}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 600, md: 680 },
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            bgcolor: '#fff8e1',
            border: '1px solid #ffe082',
          }}
        >
          <Typography
            sx={{
              ...tamil,
              color: '#5d4037',
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' },
              lineHeight: 2,
            }}
          >
            இதில் பெயர் இல்லை என்றால் supplement list இல் ஒரு முறை தேடி பார்க்கவும்
          </Typography>
        </Paper>
      )}

      {state === 'error' && (
        <Typography
          color="error"
          sx={{
            ...tamil,
            fontSize: { xs: '1.1rem', sm: '1.3rem' },
          }}
        >
          தேடலில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.
        </Typography>
      )}
    </Box>
  );
}

function ResultRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
      <Typography
        sx={{
          fontFamily: "'Noto Sans Tamil', sans-serif",
          fontWeight: 700,
          color: '#5f6368',
          width: { xs: '140px', sm: '160px' },
          flexShrink: 0,
          fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Noto Sans Tamil', sans-serif",
          color: '#202124',
          fontWeight: 500,
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' },
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
