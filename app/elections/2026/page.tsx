'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Pagination,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import {
  getPaguthis,
  getWardsByPaguthi,
  getAllWards,
  getBoothsByWard,
  getAllBooths,
  getGenderWiseAggregatedData,
} from '@/app/actions/elections2026Actions';

interface Booth {
  booth: string;
}

interface Ward {
  ward: string;
}

interface Paguthi {
  pagudhi: string;
}

interface GenderAggregatedData {
  pagudhi: string | null;
  ward: string;
  booth: string;
  male_count: number;
  female_count: number;
  third_count: number;
  total_count: number;
}

export default function Elections2026Page() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [paguthis, setPaguthis] = useState<Paguthi[]>([]);
  const [genderData, setGenderData] = useState<GenderAggregatedData[]>([]);

  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [selectedPaguthi, setSelectedPaguthi] = useState<Paguthi | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [boothsLoading, setBoothsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // Initialize filters on mount
  useEffect(() => {
    const initializeFilters = async () => {
      setBoothsLoading(true);
      const result = await getPaguthis();
      console.log('getPaguthis result:', result);
      if (result.success) {
        setPaguthis(result.data as Paguthi[]);
        // Auto-select 'All' paguthi by default
        const allPaguthi = result.data?.find(p => p.pagudhi === 'All');
        if (allPaguthi) {
          setSelectedPaguthi(allPaguthi);
          
          // Load wards immediately
          const wardsResult = await getWardsByPaguthi(allPaguthi.pagudhi);
          if (wardsResult.success) {
            setWards(wardsResult.data as Ward[]);
            const allWard = wardsResult.data?.find(w => w.ward === 'All');
            if (allWard) {
              setSelectedWard(allWard);
              
              // Load booths immediately
              const boothsResult = await getBoothsByWard(allWard.ward, allPaguthi.pagudhi);
              if (boothsResult.success) {
                  setBooths(boothsResult.data as Booth[]);
                  const allBooth = boothsResult.data?.find(b => b.booth === 'All');
                if (allBooth) {
                  setSelectedBooth(allBooth);
                  
                  // Load aggregated gender data once all filters are ready
                  setLoading(true);
                  const electorResult = await getGenderWiseAggregatedData(
                    allBooth.booth,
                    allWard.ward,
                    allPaguthi.pagudhi
                  );
                  if (electorResult.success) {
                    setGenderData(electorResult.data as GenderAggregatedData[]);
                  } else {
                    setError(electorResult.error || 'Failed to load data');
                  }
                  setLoading(false);
                }
              }
            }
          }
        }
      } else {
        setError(result.error || 'Failed to load paguthis');
      }
      setBoothsLoading(false);
    };
    
    initializeFilters();
  }, []);

  // Load wards when paguthi changes (after initialization)
  useEffect(() => {
    if (selectedPaguthi) {
      loadWards(selectedPaguthi.pagudhi);
    }
  }, [selectedPaguthi]);

  const loadWards = async (pagudhi: string) => {
    const result = await getWardsByPaguthi(pagudhi);
    if (result.success) {
      setWards(result.data as Ward[]);
      // Auto-select 'All' ward by default
      const allWard = result.data?.find(w => w.ward === 'All');
      if (allWard) {
        setSelectedWard(allWard);
      }
    }
  };

  // Load booths when ward changes
  useEffect(() => {
    if (selectedWard && selectedPaguthi) {
      loadBooths(selectedWard.ward, selectedPaguthi.pagudhi);
    }
  }, [selectedWard]);

  const loadBooths = async (ward: string, pagudhi: string) => {
    const result = await getBoothsByWard(ward, pagudhi);
    if (result.success) {
      setBooths(result.data as Booth[]);
      // Auto-select 'All' booth by default
      const allBooth = result.data?.find(b => b.booth === 'All');
      if (allBooth) {
        setSelectedBooth(allBooth);
      }
    }
  };

  // Load aggregated gender data when filters change (after initialization)
  useEffect(() => {
    if (selectedBooth && selectedWard && selectedPaguthi) {
      loadGenderData();
    }
  }, [selectedBooth, selectedWard, selectedPaguthi]);

  const loadGenderData = async () => {
    setLoading(true);
    setError('');
    const result = await getGenderWiseAggregatedData(
      selectedBooth?.booth as any,
      selectedWard?.ward as any,
      selectedPaguthi?.pagudhi as any
    );
    if (result.success) {
      console.log('Gender data loaded:', result.data);
      console.log('Data sample:', result.data?.[0]);
      // Convert string counts to numbers
      const convertedData = (result.data as GenderAggregatedData[])?.map((row: any) => ({
        ...row,
        male_count: Number(row.male_count),
        female_count: Number(row.female_count),
        third_count: Number(row.third_count),
        total_count: Number(row.total_count),
      }));
      setGenderData(convertedData);
    } else {
      setError(result.error || 'Failed to load data');
    }
    setLoading(false);
  };

  const handleClearFilters = () => {
    // Reset to default 'All' selections
    const allPaguthi = paguthis.find(p => p.pagudhi === 'All');
    const allWard = wards.find(w => w.ward === 'All');
    const allBooth = booths.find(b => b.booth === 'All');
    
    if (allPaguthi) setSelectedPaguthi(allPaguthi);
    if (allWard) setSelectedWard(allWard);
    if (allBooth) setSelectedBooth(allBooth);
    setPage(1);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate CSV from current genderData
      const csv = generateCSV(genderData);
      downloadCSV(csv, 'gender_wise_data.csv');
    } catch (err) {
      setError('Error downloading data');
    }
    setDownloading(false);
  };

  const generateCSV = (data: GenderAggregatedData[]) => {
    const headers = [
      'Paguthi',
      'Ward',
      'Booth',
      'Male Count',
      'Male %',
      'Female Count',
      'Female %',
      'Third Count',
      'Third %',
      'Total',
    ];

    const rows = data.map((row) => {
      const malePercent = row.total_count > 0 ? ((row.male_count / row.total_count) * 100).toFixed(2) : '0.00';
      const femalePercent = row.total_count > 0 ? ((row.female_count / row.total_count) * 100).toFixed(2) : '0.00';
      const thirdPercent = row.total_count > 0 ? ((row.third_count / row.total_count) * 100).toFixed(2) : '0.00';

      return [
        row.pagudhi || 'N/A',
        row.ward || 'N/A',
        row.booth || 'N/A',
        row.male_count,
        malePercent,
        row.female_count,
        femalePercent,
        row.third_count,
        thirdPercent,
        row.total_count,
      ];
    });

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: '#f5f7fa',
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Elector Records - 2026 Elections
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
            View and filter elector records by paguthi, ward, and booth
          </Typography>
        </Box>

        {/* Filters Card */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Filters
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={paguthis}
                  loading={boothsLoading}
                  getOptionLabel={(option) => option.pagudhi || ''}
                  value={selectedPaguthi}
                  onChange={(_, value) => setSelectedPaguthi(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Paguthi"
                      placeholder="Select paguthi..."
                    />
                  )}
                  noOptionsText="No paguthis found"
                />

                <Autocomplete
                  sx={{ flex: 1 }}
                  options={wards}
                  getOptionLabel={(option) => option.ward || ''}
                  value={selectedWard}
                  onChange={(_, value) => setSelectedWard(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ward"
                      placeholder="Select ward..."
                    />
                  )}
                  noOptionsText="No wards found"
                />

                <Autocomplete
                  sx={{ flex: 1 }}
                  options={booths}
                  getOptionLabel={(option) => option.booth || ''}
                  value={selectedBooth}
                  onChange={(_, value) => setSelectedBooth(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Booth"
                      placeholder="Select booth..."
                    />
                  )}
                  noOptionsText="No booths found"
                />

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Gender Wise Table */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gender Wise Data
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={downloading || genderData.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  textTransform: 'none',
                }}
              >
                {downloading ? 'Downloading...' : 'Download CSV'}
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
                  <Table size="small" stickyHeader sx={{ minWidth: '900px' }}>
                    <TableHead>
                      <TableRow sx={{ background: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', width: '50px', py: 1, px: 0.5 }}>
                          S. No
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '100px' }}>
                          Paguthi
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '45px' }}>
                          Ward
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '45px' }}>
                          Booth
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '80px' }}>
                          Male (Count)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '70px' }}>
                          Male (%)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '80px' }}>
                          Female (Count)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '70px' }}>
                          Female (%)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '80px' }}>
                          Third (Count)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '70px' }}>
                          Third (%)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '70px' }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {genderData.map((row, index) => {
                        const malePercent = row.total_count > 0 ? ((row.male_count / row.total_count) * 100).toFixed(2) : '0.00';
                        const femalePercent = row.total_count > 0 ? ((row.female_count / row.total_count) * 100).toFixed(2) : '0.00';
                        const thirdPercent = row.total_count > 0 ? ((row.third_count / row.total_count) * 100).toFixed(2) : '0.00';
                        
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              '&:hover': { background: '#f8fafc' },
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 600, width: '50px', py: 0.5, px: 0.5 }}>{index + 1}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 0.5, width: '100px' }}>{row.pagudhi || 'N/A'}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 0.5, width: '45px' }}>{row.ward || 'N/A'}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 0.5, width: '45px' }}>{row.booth || 'N/A'}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '80px' }}>{row.male_count}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '70px' }}>{malePercent}%</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '80px' }}>{row.female_count}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '70px' }}>{femalePercent}%</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '80px' }}>{row.third_count}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '70px' }}>{thirdPercent}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, py: 0.5, px: 0.5, width: '70px' }}>{row.total_count}</TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Summary Row */}
                      {genderData.length > 0 && (() => {
                        const totalMale = genderData.reduce((sum, row) => sum + row.male_count, 0);
                        const totalFemale = genderData.reduce((sum, row) => sum + row.female_count, 0);
                        const totalThird = genderData.reduce((sum, row) => sum + row.third_count, 0);
                        const grandTotal = genderData.reduce((sum, row) => sum + row.total_count, 0);
                        
                        const malePercentOverall = grandTotal > 0 ? ((totalMale / grandTotal) * 100).toFixed(2) : '0.00';
                        const femalePercentOverall = grandTotal > 0 ? ((totalFemale / grandTotal) * 100).toFixed(2) : '0.00';
                        const thirdPercentOverall = grandTotal > 0 ? ((totalThird / grandTotal) * 100).toFixed(2) : '0.00';
                        
                        return (
                          <TableRow
                            sx={{
                              background: '#e8f0f7',
                              fontWeight: 700,
                              position: 'sticky',
                              bottom: 0,
                              zIndex: 10,
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '50px' }}>-</TableCell>
                            <TableCell colSpan={3} sx={{ fontWeight: 700, py: 0.5, px: 0.5 }}>TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '80px' }}>{totalMale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '70px' }}>{malePercentOverall}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '80px' }}>{totalFemale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '70px' }}>{femalePercentOverall}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '80px' }}>{totalThird}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '70px' }}>{thirdPercentOverall}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '70px' }}>{grandTotal}</TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>

                {genderData.length === 0 && !loading && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">
                      No data available for the selected filters
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Note for future tables */}
        <Alert severity="info">
          More tables will be added below. This page is currently showing Elector Records from the electors_2026 table.
        </Alert>
      </Box>
    </Box>
  );
}
