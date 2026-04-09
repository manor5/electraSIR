'use client';

import { useEffect, useState, useRef } from 'react';
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
  Paper,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Pagination,
  Alert,
  Select,
  MenuItem,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import ClearIcon from '@mui/icons-material/Clear';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  getPaguthis,
  getWardsByPaguthi,
  getAllWards,
  getBoothsByWard,
  getAllBooths,
  getGenderWiseAggregatedData,
  getStreetWiseElectors,
} from '@/app/actions/elections2026Actions';
// Remove direct import of server action
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

export default function Elections2026Page() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [paguthis, setPaguthis] = useState<Paguthi[]>([]);
  const [genderData, setGenderData] = useState<GenderAggregatedData[]>([]);

  const [ageBandData, setAgeBandData] = useState<AgeBandAggregatedData[]>([]);
  const [ageBandLoading, setAgeBandLoading] = useState(false);

  const [streetWiseData, setStreetWiseData] = useState<StreetWiseElectorData[]>([]);
  const [streetWiseLoading, setStreetWiseLoading] = useState(false);
  const [streetSearch, setStreetSearch] = useState('');

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
  
  const [sortBy, setSortBy] = useState<keyof GenderAggregatedData | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // State for age band table sorting
  type AgeBandSortKey = 'age_band' | 'male_count' | 'female_count' | 'total_count' | 'percentage';
  const [ageBandSortBy, setAgeBandSortBy] = useState<AgeBandSortKey>('age_band');
  const [ageBandSortOrder, setAgeBandSortOrder] = useState<'asc' | 'desc'>('asc');

  // State for street-wise table sorting
  type StreetWiseSortKey = 'section_name' | 'total_electors' | 'booth' | 'ward' | 'pagudhi' | 'polling_station';
  const [streetWiseSortBy, setStreetWiseSortBy] = useState<StreetWiseSortKey>('section_name');
  const [streetWiseSortOrder, setStreetWiseSortOrder] = useState<'asc' | 'desc'>('asc');

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
                  
                  // Load all aggregated data once all filters are ready
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

                  // Load age band data
                  setAgeBandLoading(true);
                  try {
                    const params = new URLSearchParams();
                    params.append('booth', allBooth.booth);
                    params.append('ward', allWard.ward);
                    params.append('pagudhi', allPaguthi.pagudhi);
                    const res = await fetch(`/api/age-band?${params.toString()}`);
                    const result = await res.json();
                    if (result.success) {
                      setAgeBandData(result.data);
                    }
                  } catch (e) {
                    console.error('Error loading age band data:', e);
                  }
                  setAgeBandLoading(false);

                  // Load street-wise data
                  setStreetWiseLoading(true);
                  try {
                    const streetResult = await getStreetWiseElectors(
                      allBooth.booth,
                      allWard.ward,
                      allPaguthi.pagudhi
                    );
                    if (streetResult.success) {
                      setStreetWiseData(streetResult.data as StreetWiseElectorData[]);
                    } else {
                      setStreetWiseData([]);
                    }
                  } catch (e) {
                    console.error('Error loading street-wise data:', e);
                    setStreetWiseData([]);
                  }
                  setStreetWiseLoading(false);
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
      loadAgeBandData();
      loadStreetWiseData();
    }
  }, [selectedBooth, selectedWard, selectedPaguthi]);
  const loadAgeBandData = async () => {
    setAgeBandLoading(true);
    try {
      const booth = selectedBooth?.booth;
      const ward = selectedWard?.ward;
      const pagudhi = selectedPaguthi?.pagudhi;
      // Call the server action via fetch to an API route
      const params = new URLSearchParams();
      if (booth) params.append('booth', booth);
      if (ward) params.append('ward', ward);
      if (pagudhi) params.append('pagudhi', pagudhi);
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

  // Age band sorting functions
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

  // Street-wise sorting functions
  const getSortedStreetWiseData = () => {
    let filtered = streetWiseData;
    
    // Apply street search filter
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
        // Try to parse error response
        let errorMessage = 'Failed to download PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          // Response was not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header if available
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

  // Keep client-side PDF generation as fallback
  const downloadPDF = (pdf: jsPDF, filename: string) => {
    // For better mobile support, use data URI approach
    try {
      const dataUri = pdf.output('dataurlstring');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      document.body.appendChild(link);
      
      // Add small delay for mobile browser compatibility
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
      }, 100);
    } catch (e) {
      // Fallback to save method if data URI fails
      pdf.save(filename);
    }
  };

  const generateAgeBandDataPDF = (data: AgeBandAggregatedData[]) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Age Band Distribution', 15, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['Age Band', 'Male Count', 'Female Count', 'Total', 'Percentage'];
    const columnWidths = [40, 35, 35, 35, 35];
    
    // Add headers
    pdf.setFontSize(10);
    pdf.setFont('', 'bold');
    let xPosition = 15;
    headers.forEach((header, idx) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 7;
    pdf.setFont('', 'normal');

    // Calculate grand total for percentage
    const grandTotal = data.reduce((sum, row) => sum + Number(row.total_count), 0);

    // Add data rows
    data.forEach((row) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      const percentage = grandTotal > 0 ? ((Number(row.total_count) / grandTotal) * 100).toFixed(2) : '0.00';
      
      const rowData = [
        row.age_band,
        Number(row.male_count).toString(),
        Number(row.female_count).toString(),
        Number(row.total_count).toString(),
        percentage + '%',
      ];

      xPosition = 15;
      rowData.forEach((cell, idx) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += columnWidths[idx];
      });
      yPosition += 7;
    });

    // Add summary row
    if (data.length > 0) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setFont('', 'bold');
      const totalMale = data.reduce((sum, row) => sum + Number(row.male_count), 0);
      const totalFemale = data.reduce((sum, row) => sum + Number(row.female_count), 0);

      const summaryData = ['TOTAL', totalMale.toString(), totalFemale.toString(), grandTotal.toString(), '100%'];
      
      xPosition = 15;
      summaryData.forEach((cell, idx) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += columnWidths[idx];
      });
    }

    downloadPDF(pdf, `age_band_table_${getFormattedDateTime()}.pdf`);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Use backend API for reliable downloads
      await downloadPDFFromBackend('gender', genderData);
    } catch (err) {
      setError('Error downloading data');
    }
    setDownloading(false);
  };

  const generateGenderDataPDF = async (data: GenderAggregatedData[]) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 15;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Gender Wise Data', 15, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['Paguthi', 'Ward', 'Booth', 'Male Count', 'Male %', 'Female Count', 'Female %', 'Total'];
    const columnWidths = [25, 20, 20, 22, 18, 25, 18, 22];
    
    // Add headers
    pdf.setFontSize(10);
    pdf.setFont('', 'bold');
    let xPosition = 15;
    headers.forEach((header, idx) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 7;
    pdf.setFont('', 'normal');

    // Add data rows
    data.forEach((row) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      const malePercent = row.total_count > 0 ? ((row.male_count / row.total_count) * 100).toFixed(2) : '0.00';
      const femalePercent = row.total_count > 0 ? ((row.female_count / row.total_count) * 100).toFixed(2) : '0.00';
      
      const rowData = [
        row.pagudhi || 'N/A',
        row.ward || 'N/A',
        row.booth || 'N/A',
        row.male_count.toString(),
        malePercent + '%',
        row.female_count.toString(),
        femalePercent + '%',
        row.total_count.toString(),
      ];

      xPosition = 15;
      rowData.forEach((cell, idx) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += columnWidths[idx];
      });
      yPosition += 7;
    });

    // Add summary row
    if (data.length > 0) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setFont('', 'bold');
      const totalMale = data.reduce((sum, row) => sum + row.male_count, 0);
      const totalFemale = data.reduce((sum, row) => sum + row.female_count, 0);
      const totalThird = data.reduce((sum, row) => sum + row.third_count, 0);
      const grandTotal = data.reduce((sum, row) => sum + row.total_count, 0);

      const malePercentOverall = grandTotal > 0 ? ((totalMale / grandTotal) * 100).toFixed(2) : '0.00';
      const femalePercentOverall = grandTotal > 0 ? ((totalFemale / grandTotal) * 100).toFixed(2) : '0.00';

      const summaryData = ['TOTAL', '', '', totalMale.toString(), malePercentOverall + '%', totalFemale.toString(), femalePercentOverall + '%', grandTotal.toString()];
      
      xPosition = 15;
      summaryData.forEach((cell, idx) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += columnWidths[idx];
      });
    }

    downloadPDF(pdf, `gender_wise_data_${getFormattedDateTime()}.pdf`);
  };

  const generateStreetWiseDataPDF = (data: StreetWiseElectorData[]) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Street Wise Voter Count', 15, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['S. No', 'Paguthi', 'Ward', 'Booth', 'Polling Station', 'Street / Section', 'Total Electors'];
    const columnWidths = [15, 25, 20, 20, 35, 40, 25];
    
    // Add headers
    pdf.setFontSize(9);
    pdf.setFont('', 'bold');
    let xPosition = 12;
    headers.forEach((header, idx) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 7;
    pdf.setFont('', 'normal');
    pdf.setFontSize(8);

    // Add data rows
    data.forEach((row, idx) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      const rowData = [
        (idx + 1).toString(),
        row.pagudhi || 'N/A',
        row.ward || 'N/A',
        row.booth || 'N/A',
        row.polling_station,
        row.section_name || 'N/A',
        row.total_electors.toString(),
      ];

      xPosition = 12;
      rowData.forEach((cell, idx) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += columnWidths[idx];
      });
      yPosition += 6;
    });

    // Add summary row
    if (data.length > 0) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setFont('', 'bold');
      const grandTotal = data.reduce((sum, row) => sum + row.total_electors, 0);
      
      xPosition = 12;
      pdf.text('', xPosition, yPosition);
      xPosition += columnWidths[0];
      pdf.text('', xPosition, yPosition);
      xPosition += columnWidths[1];
      pdf.text('', xPosition, yPosition);
      xPosition += columnWidths[2];
      pdf.text('', xPosition, yPosition);
      xPosition += columnWidths[3];
      pdf.text('', xPosition, yPosition);
      xPosition += columnWidths[4];
      pdf.text('TOTAL', xPosition, yPosition);
      xPosition += columnWidths[5];
      pdf.text(grandTotal.toString(), xPosition, yPosition);
    }

    downloadPDF(pdf, `street_wise_voter_count_${getFormattedDateTime()}.pdf`);
  };

  const handleStreetWiseDownload = async () => {
    setDownloading(true);
    try {
      // Use backend API for reliable downloads
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
                <TextField
                  sx={{ flex: 1 }}
                  select
                  label="Paguthi"
                  value={selectedPaguthi?.pagudhi || ''}
                  onChange={(e) => {
                    const selected = paguthis.find(p => p.pagudhi === e.target.value);
                    setSelectedPaguthi(selected || null);
                  }}
                  disabled={boothsLoading}
                >
                  <MenuItem value="">Select paguthi...</MenuItem>
                  {paguthis.map((option) => (
                    <MenuItem key={option.pagudhi} value={option.pagudhi}>
                      {option.pagudhi}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  sx={{ flex: 1 }}
                  select
                  label="Ward"
                  value={selectedWard?.ward || ''}
                  onChange={(e) => {
                    const selected = wards.find(w => w.ward === e.target.value);
                    setSelectedWard(selected || null);
                  }}
                >
                  <MenuItem value="">Select ward...</MenuItem>
                  {wards.map((option) => (
                    <MenuItem key={option.ward} value={option.ward}>
                      {option.ward}
                    </MenuItem>
                  ))}
                </TextField>

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
                        const thirdPercent = row.total_count > 0 ? ((row.third_count / row.total_count) * 100).toFixed(2) : '0.00';
                        
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
                      No data available for the selected filters
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Note for future tables */}
        {/* Age Band Table */}
        <Card sx={{ mt: 6, borderRadius: 4, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {(() => {
                  if (
                    selectedBooth?.booth && selectedBooth.booth !== 'All'
                  ) {
                    return `Age Band Distribution for Booth ${selectedBooth.booth}`;
                  } else if (
                    selectedWard?.ward && selectedWard.ward !== 'All'
                  ) {
                    return `Age Band Distribution for Ward ${selectedWard.ward}`;
                  } else if (
                    selectedPaguthi?.pagudhi && selectedPaguthi.pagudhi !== 'All'
                  ) {
                    return `Age Band Distribution for Paguthi ${selectedPaguthi.pagudhi}`;
                  } else {
                    return 'Age Band Distribution for All Data';
                  }
                })()}
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
                        // Get sorted data for display
                        const sortedData = getSortedAgeBandData();
                        return sortedData.map((row, idx) => (
                          <TableRow key={row.age_band}>
                            <TableCell sx={{ pl: 2, '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', pl: 0.3, pr: 0.2, py: 0.3, width: '28px', fontSize: '0.65rem' } }}>{row.age_band}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.male_count}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.female_count}</TableCell>
                            <TableCell align="right" sx={{ '@media (max-width: 768px)': { borderRight: '1px solid #e2e8f0', px: 0.1, py: 0.3, width: '4px', fontSize: '0.6rem' }, width: '50px' }}>{row.total_count}</TableCell>
                            <TableCell align="right" sx={{ pr: 2, '@media (max-width: 768px)': { pr: 0.2, py: 0.3, width: '28px ', fontSize: '0.65rem' }, width: '50px' }}>{row.percentage.toFixed(2)}%</TableCell>
                          </TableRow>
                        ));
                      })()}
                      {/* Summary Row */}
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
                            <TableCell align="right" sx={{ fontWeight: 700, pr: 2, '@media (max-width: 768px)': { pr: 0.2, py: 0.3, width: '50px', fontSize: '0.65rem' }, width: '50px' }}>100%</TableCell>
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
                {(() => {
                  if (
                    selectedBooth?.booth && selectedBooth.booth !== 'All'
                  ) {
                    return `Street Wise Voter Count for Booth ${selectedBooth.booth}`;
                  } else if (
                    selectedWard?.ward && selectedWard.ward !== 'All'
                  ) {
                    return `Street Wise Voter Count for Ward ${selectedWard.ward}`;
                  } else if (
                    selectedPaguthi?.pagudhi && selectedPaguthi.pagudhi !== 'All'
                  ) {
                    return `Street Wise Voter Count for Paguthi ${selectedPaguthi.pagudhi}`;
                  } else {
                    return 'Street Wise Voter Count for All Data';
                  }
                })()}
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
            
            {/* Street Search Filter */}
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
                    {/* Summary Row */}
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
                    No data available for the selected filters
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
