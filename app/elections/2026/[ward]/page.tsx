'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import { jsPDF } from 'jspdf';
import {
  getPaguthis,
  getWardsByPaguthi,
  getBoothsByWard,
  getGenderWiseAggregatedData,
  getStreetWiseElectors,
} from '@/app/actions/elections2026Actions';

interface AgeBandAggregatedData {
  age_band: string;
  male_count: number;
  female_count: number;
  total_count: number;
}

interface StreetWiseElectorData {
  id: number;
  booth: string;
  ward: string;
  pagudhi: string;
  section_name: string;
  total_electors: number;
  polling_station: string;
}

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

export default function WardElectionsPage() {
  const params = useParams();
  const wardFromRoute = params?.ward ? decodeURIComponent(params.ward as string) : '';

  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [selectedPaguthi, setSelectedPaguthi] = useState<Paguthi | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [genderData, setGenderData] = useState<GenderAggregatedData[]>([]);
  const [ageBandData, setAgeBandData] = useState<AgeBandAggregatedData[]>([]);
  const [streetWiseData, setStreetWiseData] = useState<StreetWiseElectorData[]>([]);
  const [streetSearch, setStreetSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [ageBandLoading, setAgeBandLoading] = useState(false);
  const [streetWiseLoading, setStreetWiseLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState<keyof GenderAggregatedData | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  type AgeBandSortKey = 'age_band' | 'male_count' | 'female_count' | 'total_count' | 'percentage';
  const [ageBandSortBy, setAgeBandSortBy] = useState<AgeBandSortKey>('age_band');
  const [ageBandSortOrder, setAgeBandSortOrder] = useState<'asc' | 'desc'>('asc');

  type StreetWiseSortKey = 'section_name' | 'total_electors' | 'booth' | 'ward' | 'pagudhi' | 'polling_station';
  const [streetWiseSortBy, setStreetWiseSortBy] = useState<StreetWiseSortKey>('section_name');
  const [streetWiseSortOrder, setStreetWiseSortOrder] = useState<'asc' | 'desc'>('asc');

  // Initialize based on ward from route
  useEffect(() => {
    const initializeWardPage = async () => {
      try {
        // Get all paguthis to find the one containing this ward
        const paguthisResult = await getPaguthis();
        if (paguthisResult.success) {
          const allPaguthis = paguthisResult.data as Paguthi[];
          
          // Try to find paguthi for this ward by checking each one
          let foundPaguthi: Paguthi | null = null;
          for (const paguthi of allPaguthis) {
            const wardsResult = await getWardsByPaguthi(paguthi.pagudhi);
            if (wardsResult.success) {
              const wards = wardsResult.data as Ward[];
              const wardExists = wards.find(w => w.ward === wardFromRoute);
              if (wardExists) {
                foundPaguthi = paguthi;
                break;
              }
            }
          }

          if (foundPaguthi) {
            setSelectedPaguthi(foundPaguthi);
            setSelectedWard({ ward: wardFromRoute });

            // Load booths for this ward and paguthi
            const boothsResult = await getBoothsByWard(wardFromRoute, foundPaguthi.pagudhi);
            if (boothsResult.success) {
              setBooths(boothsResult.data as Booth[]);
              const allBooth = (boothsResult.data as Booth[]).find(b => b.booth === 'All');
              if (allBooth) {
                setSelectedBooth(allBooth);
              }
            }
          } else {
            setError('Ward not found');
          }
        } else {
          setError('Failed to load paguthis');
        }
      } catch (err) {
        setError('Failed to initialize ward page');
        console.error(err);
      }
    };

    if (wardFromRoute) {
      initializeWardPage();
    }
  }, [wardFromRoute]);

  // Load data when booth changes
  useEffect(() => {
    if (selectedBooth && selectedWard && selectedPaguthi) {
      loadGenderData();
      loadAgeBandData();
      loadStreetWiseData();
    }
  }, [selectedBooth]);

  const loadGenderData = async () => {
    setLoading(true);
    setError('');
    const result = await getGenderWiseAggregatedData(
      selectedBooth?.booth as any,
      selectedWard?.ward as any,
      selectedPaguthi?.pagudhi as any
    );
    if (result.success) {
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

  const loadAgeBandData = async () => {
    setAgeBandLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBooth?.booth) params.append('booth', selectedBooth.booth);
      if (selectedWard?.ward) params.append('ward', selectedWard.ward);
      if (selectedPaguthi?.pagudhi) params.append('pagudhi', selectedPaguthi.pagudhi);
      const res = await fetch(`/api/age-band?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setAgeBandData(result.data);
      } else {
        setAgeBandData([]);
      }
    } catch (e) {
      setAgeBandData([]);
    }
    setAgeBandLoading(false);
  };

  const loadStreetWiseData = async () => {
    setStreetWiseLoading(true);
    try {
      const result = await getStreetWiseElectors(
        selectedBooth?.booth as any,
        selectedWard?.ward as any,
        selectedPaguthi?.pagudhi as any
      );
      if (result.success) {
        setStreetWiseData(result.data as StreetWiseElectorData[]);
      } else {
        setStreetWiseData([]);
      }
    } catch (e) {
      setStreetWiseData([]);
    }
    setStreetWiseLoading(false);
  };

  const getSortedData = () => {
    if (!sortBy) return genderData;
    
    const sorted = [...genderData].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
    
    return sorted;
  };

  const handleSort = (column: keyof GenderAggregatedData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortedAgeBandData = () => {
    const withPercent = ageBandData.map(row => ({
      ...row,
      percentage: (() => {
        const grandTotal = ageBandData.reduce((sum, r) => sum + Number(r.total_count), 0);
        return grandTotal > 0 ? (Number(row.total_count) / grandTotal) * 100 : 0;
      })(),
    }));
    
    if (!ageBandSortBy) return withPercent;
    
    return [...withPercent].sort((a, b) => {
      let aVal: string | number = a[ageBandSortBy];
      let bVal: string | number = b[ageBandSortBy];
      
      if (ageBandSortBy === 'percentage') {
        aVal = a.percentage;
        bVal = b.percentage;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return ageBandSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ageBandSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  };

  const handleAgeBandSort = (column: AgeBandSortKey) => {
    if (ageBandSortBy === column) {
      setAgeBandSortOrder(ageBandSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setAgeBandSortBy(column);
      setAgeBandSortOrder('asc');
    }
  };

  const getSortedStreetWiseData = () => {
    let filtered = streetWiseData;
    
    if (streetSearch.trim() !== '') {
      filtered = streetWiseData.filter((row) =>
        row.section_name.toLowerCase().includes(streetSearch.toLowerCase())
      );
    }
    
    if (!streetWiseSortBy) return filtered;
    
    return [...filtered].sort((a, b) => {
      let aVal: string | number = a[streetWiseSortBy];
      let bVal: string | number = b[streetWiseSortBy];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return streetWiseSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return streetWiseSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  };

  const handleStreetWiseSort = (column: StreetWiseSortKey) => {
    if (streetWiseSortBy === column) {
      setStreetWiseSortOrder(streetWiseSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStreetWiseSortBy(column);
      setStreetWiseSortOrder('asc');
    }
  };

  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  const downloadPDFFromBackend = async (pdfType: 'gender' | 'ageBand' | 'streetWise', data: any) => {
    try {
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: pdfType,
          data: data,
          timestamp: getFormattedDateTime(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to download PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error downloading PDF';
      console.error('Error downloading PDF from backend:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPDFFromBackend('gender', genderData);
    } catch (err) {
      setError('Error downloading data');
    }
    setDownloading(false);
  };

  const handleStreetWiseDownload = async () => {
    setDownloading(true);
    try {
      await downloadPDFFromBackend('streetWise', streetWiseData);
    } catch (err) {
      setError('Error downloading data');
    }
    setDownloading(false);
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
            Trichy West Constituency - Pagudhi {selectedPaguthi?.pagudhi} - Ward {wardFromRoute}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
            Select booth to view all three tables
          </Typography>
        </Box>

        {/* Booth Filter Card */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Select Booth
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  sx={{ flex: 1 }}
                  select
                  label="Booth"
                  value={selectedBooth?.booth || ''}
                  onChange={(e) => {
                    const selected = booths.find(b => b.booth === e.target.value);
                    setSelectedBooth(selected || null);
                  }}
                >
                  <MenuItem value="">Select booth...</MenuItem>
                  {booths.map((option) => (
                    <MenuItem key={option.booth} value={option.booth}>
                      {option.booth}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    const allBooth = booths.find(b => b.booth === 'All');
                    if (allBooth) setSelectedBooth(allBooth);
                  }}
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
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto', '@media (max-width: 768px)': { maxHeight: '500px' } }}>
                  <Table size="small" stickyHeader sx={{ minWidth: '900px', '@media (max-width: 768px)': { minWidth: '600px' } }}>
                    <TableHead>
                      <TableRow sx={{ background: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', width: '50px', py: 1, px: 0.5, pl: 2, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3 } }}>
                          S. No
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '80px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.7rem' } }} onClick={() => handleSort('pagudhi')}>
                          {sortBy === 'pagudhi' ? `Paguthi ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Paguthi'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '35px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '30px', fontSize: '0.65rem' } }} onClick={() => handleSort('ward')}>
                          {sortBy === 'ward' ? `Ward ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Ward'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '35px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '30px', fontSize: '0.65rem' } }} onClick={() => handleSort('booth')}>
                          {sortBy === 'booth' ? `Booth ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Booth'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '60px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '45px', fontSize: '0.65rem' } }} onClick={() => handleSort('male_count')}>
                          {sortBy === 'male_count' ? `Male ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Male'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '40px', fontSize: '0.65rem' } }}>
                          Male %
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '60px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '45px', fontSize: '0.65rem' } }} onClick={() => handleSort('female_count')}>
                          {sortBy === 'female_count' ? `Female ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Female'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.2, width: '40px', fontSize: '0.65rem' } }}>
                          Female %
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { py: 0.5, px: 0.2, width: '40px', fontSize: '0.65rem' } }} onClick={() => handleSort('total_count')}>
                          {sortBy === 'total_count' ? `Total ${sortOrder === 'asc' ? '↑' : '↓'}` : 'Total'}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSortedData().map((row, index) => {
                        const malePercent = row.total_count > 0 ? ((row.male_count / row.total_count) * 100).toFixed(2) : '0.00';
                        const femalePercent = row.total_count > 0 ? ((row.female_count / row.total_count) * 100).toFixed(2) : '0.00';
                        
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              '&:hover': { background: '#f8fafc' },
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 600, width: '50px', py: 0.5, px: 0.5, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '35px', fontSize: '0.65rem' } }}>{index + 1}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 0.5, width: '80px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '50px', fontSize: '0.65rem' } }}>{row.pagudhi || 'N/A'}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 0.5, width: '35px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '30px', fontSize: '0.65rem' } }}>{row.ward || 'N/A'}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '35px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '30px', fontSize: '0.65rem' } }}>{row.booth || 'N/A'}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '60px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '45px', fontSize: '0.65rem' } }}>{row.male_count}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '40px', fontSize: '0.65rem' } }}>{malePercent}%</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '60px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '45px', fontSize: '0.65rem' } }}>{row.female_count}</TableCell>
                            <TableCell align="right" sx={{ py: 0.5, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.3, px: 0.2, width: '40px', fontSize: '0.65rem' } }}>{femalePercent}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, py: 0.5, px: 0.5, pr: 2, width: '50px', '@media (max-width: 768px)': { py: 0.3, px: 0.2, width: '40px', fontSize: '0.65rem' } }}>{row.total_count}</TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {genderData.length > 0 && (() => {
                        const totalMale = genderData.reduce((sum, row) => sum + row.male_count, 0);
                        const totalFemale = genderData.reduce((sum, row) => sum + row.female_count, 0);
                        const totalThird = genderData.reduce((sum, row) => sum + row.third_count, 0);
                        const grandTotal = genderData.reduce((sum, row) => sum + row.total_count, 0);
                        
                        const malePercentOverall = grandTotal > 0 ? ((totalMale / grandTotal) * 100).toFixed(2) : '0.00';
                        const femalePercentOverall = grandTotal > 0 ? ((totalFemale / grandTotal) * 100).toFixed(2) : '0.00';
                        
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
                            <TableCell align="center" sx={{ fontWeight: 700, py: 0.5, px: 0.5, pl: 2, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>-</TableCell>
                            <TableCell colSpan={3} sx={{ fontWeight: 700, py: 0.5, px: 0.5, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{totalMale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{malePercentOverall}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '60px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{totalFemale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{femalePercentOverall}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, py: 0.5, px: 0.5, pr: 2, width: '50px', '@media (max-width: 768px)': { px: 0.3, fontSize: '0.75rem' } }}>{grandTotal}</TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>

                {genderData.length === 0 && !loading && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">
                      No data available for the selected booth
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Age Band Table */}
        <Card sx={{ mt: 6, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Age Band Distribution for {selectedBooth?.booth || 'All'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', textTransform: 'none' }}
                onClick={() => {
                  setDownloading(true);
                  downloadPDFFromBackend('ageBand', ageBandData).finally(() => setDownloading(false));
                }}
              >
                Download PDF
              </Button>
            </Box>
            <div id="age-band-table-container">
              {ageBandLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', '@media (max-width: 768px)': { maxHeight: '350px' } }}>
                  <Table size="small" stickyHeader sx={{ minWidth: '600px', '@media (max-width: 768px)': { minWidth: '450px' } }}>
                    <TableHead>
                      <TableRow sx={{ background: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pl: 2, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, py: 0.5, width: '38px', fontSize: '0.65rem' } }} onClick={() => handleAgeBandSort('age_band')}>{ageBandSortBy === 'age_band' ? `Age Band ${ageBandSortOrder === 'asc' ? '↑' : '↓'}` : 'Age Band'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.1, width: '4px', fontSize: '0.6rem' } }} onClick={() => handleAgeBandSort('male_count')}>{ageBandSortBy === 'male_count' ? `Male ${ageBandSortOrder === 'asc' ? '↑' : '↓'}` : 'Male'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.1, width: '4px', fontSize: '0.6rem' } }} onClick={() => handleAgeBandSort('female_count')}>{ageBandSortBy === 'female_count' ? `Female ${ageBandSortOrder === 'asc' ? '↑' : '↓'}` : 'Female'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, width: '50px', cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', py: 0.5, px: 0.1, width: '4px', fontSize: '0.6rem' } }} onClick={() => handleAgeBandSort('total_count')}>{ageBandSortBy === 'total_count' ? `Total ${ageBandSortOrder === 'asc' ? '↑' : '↓'}` : 'Total'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pr: 2, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { py: 0.5, px: 0.2, width: '28px  ', fontSize: '0.65rem' } }} onClick={() => handleAgeBandSort('percentage')}>{ageBandSortBy === 'percentage' ? `Percentage ${ageBandSortOrder === 'asc' ? '↑' : '↓'}` : 'Percentage'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const sortedData = getSortedAgeBandData();
                        return sortedData.map((row, idx) => (
                          <TableRow key={row.age_band}>
                            <TableCell sx={{ pl: 2, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', pl: 0.3, pr: 0.2, py: 0.3, width: '28px', fontSize: '0.65rem' } }}>{row.age_band}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.male_count}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.female_count}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.total_count}</TableCell>
                            <TableCell align="right" sx={{ pr: 2, '@media (max-width: 768px)': { pr: 0.2, py: 0.3, width: '28px ', fontSize: '0.6rem' }, width: '50px' }}>{row.percentage.toFixed(2)}%</TableCell>
                          </TableRow>
                        ));
                      })()}
                      {ageBandData.length > 0 && (() => {
                        const totalMale = ageBandData.reduce((sum, row) => sum + Number(row.male_count), 0);
                        const totalFemale = ageBandData.reduce((sum, row) => sum + Number(row.female_count), 0);
                        const grandTotal = ageBandData.reduce((sum, row) => sum + Number(row.total_count), 0);
                        return (
                          <TableRow sx={{ background: '#e8f0f7', fontWeight: 700, position: 'sticky', bottom: 0, zIndex: 10 }}>
                            <TableCell sx={{ fontWeight: 700, pl: 2, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', pl: 0.3, pr: 0.2, py: 0.3, width: '38px', fontSize: '0.65rem' } }}>TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{totalMale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{totalFemale}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{grandTotal}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, pr: 2, '@media (max-width: 768px)': { pr: 0.2, py: 0.3, width: '50px', fontSize: '0.6rem' }, width: '50px' }}>100%</TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Street Wise Voter Count Table */}
        <Card sx={{ mt: 6, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Street Wise Voter Count
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleStreetWiseDownload}
                disabled={downloading || streetWiseData.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  textTransform: 'none',
                }}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Box>
            
            <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0', backgroundColor: '#fafbfc' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  placeholder="Search by street/section name..."
                  value={streetSearch}
                  onChange={(e) => setStreetSearch(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#64748b' }}>
                          🔍
                        </Box>
                      ),
                    },
                  }}
                />
                {streetSearch && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={() => setStreetSearch('')}
                  >
                    Clear Search
                  </Button>
                )}
              </Stack>
            </Box>
            
            {streetWiseLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', '@media (max-width: 768px)': { maxHeight: '350px' } }}>
                  <Table size="small" stickyHeader sx={{ minWidth: '700px', '@media (max-width: 768px)': { minWidth: '500px' } }}>
                    <TableHead>
                    <TableRow sx={{ background: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pl: 2, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.7rem' } }}>S. No</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('pagudhi')}>{streetWiseSortBy === 'pagudhi' ? `Paguthi ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Paguthi'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('ward')}>{streetWiseSortBy === 'ward' ? `Ward ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Ward'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pr: 4, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, pr: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('booth')}>{streetWiseSortBy === 'booth' ? `Booth ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Booth'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pl: 4, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, pl: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('polling_station')}>{streetWiseSortBy === 'polling_station' ? `Polling Station ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Polling Station'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('section_name')}>{streetWiseSortBy === 'section_name' ? `Street / Section ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Street / Section'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, background: '#f8fafc', py: 1, px: 0.5, pr: 2, cursor: 'pointer', '&:hover': { background: '#e0e8f0' }, '@media (max-width: 768px)': { px: 0.3, fontSize: '0.7rem' } }} onClick={() => handleStreetWiseSort('total_electors')}>{streetWiseSortBy === 'total_electors' ? `Total Electors ${streetWiseSortOrder === 'asc' ? '↑' : '↓'}` : 'Total Electors'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSortedStreetWiseData().map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell align="center" sx={{ py: 0.5, px: 0.5, pl: 2, fontWeight: 600, width: '50px', '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{idx + 1}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, px: 0.5, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{row.pagudhi}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, px: 0.5, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{row.ward}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, px: 0.5, pr: 4, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, pr: 0.3, fontSize: '0.75rem' } }}>{row.booth}</TableCell>
                        <TableCell sx={{ py: 0.5, px: 0.5, pl: 4, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, pl: 0.3, fontSize: '0.75rem' } }}>{row.polling_station}</TableCell>
                        <TableCell sx={{ py: 0.5, px: 0.5, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.3, fontSize: '0.75rem' } }}>{row.section_name}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, px: 0.5, pr: 2, fontWeight: 600, '@media (max-width: 768px)': { px: 0.3, fontSize: '0.75rem' } }}>{row.total_electors}</TableCell>
                      </TableRow>
                    ))}
                    {getSortedStreetWiseData().length > 0 && (() => {
                      const grandTotal = getSortedStreetWiseData().reduce((sum, row) => sum + Number(row.total_electors), 0);
                      return (
                        <TableRow sx={{ background: '#e8f0f7', fontWeight: 700, position: 'sticky', bottom: 0, zIndex: 10 }}>
                          <TableCell sx={{ fontWeight: 700, pl: 2, '@media (max-width: 768px)': { pl: 1, fontSize: '0.75rem' } }} colSpan={6}>TOTAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, pr: 2, '@media (max-width: 768px)': { pr: 0.3, fontSize: '0.75rem' } }}>{grandTotal}</TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
              {getSortedStreetWiseData().length === 0 && streetWiseData.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    No streets found matching "{streetSearch}"
                  </Typography>
                </Box>
              )}
              {streetWiseData.length === 0 && !streetWiseLoading && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    No data available for the selected booth
                  </Typography>
                </Box>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
