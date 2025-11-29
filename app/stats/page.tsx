'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import { getOperationCounter } from '@/app/actions/searchActions';

export default function StatsPage() {
  const [counterValue, setCounterValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCounter = async () => {
      try {
        const result = await getOperationCounter();
        if (result.success && result.count !== undefined) {
          setCounterValue(result.count);
        } else {
          setError(result.error || 'Failed to load counter');
        }
      } catch (err) {
        setError('An error occurred while fetching the counter');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounter();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounter, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <Link href="/dashboard" passHref style={{ textDecoration: 'none' }}>
          <Button variant="outlined" size="small">
            ← Back to Dashboard
          </Button>
        </Link>
      </Box>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Search Statistics
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        ) : (
          <Box>
            <Typography variant="h1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              {counterValue?.toLocaleString()}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Number of Searches Done
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
