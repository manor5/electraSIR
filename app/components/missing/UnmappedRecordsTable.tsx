'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { fetchUnmappedRecords, markAsMapped, unmarkAsMapped, mapToResult, searchTrichyIIMatches, searchMatch2, MissingRecord, MatchResult } from '@/app/actions/missingActions';
import TamilTransliteratorInput from '@/app/components/TamilTransliterator';

export default function UnmappedRecordsTable() {
  const [records, setRecords] = useState<MissingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MissingRecord | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedNameTamil, setEditedNameTamil] = useState('');
  const [editedRelname, setEditedRelname] = useState('');
  const [editedRelnameTamil, setEditedRelnameTamil] = useState('');
  const [editedGender, setEditedGender] = useState('');
  const [editedAge, setEditedAge] = useState('');
  const [isMarkedAsMapped, setIsMarkedAsMapped] = useState(false);

  // Search results state
  const [activeTab, setActiveTab] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [trichyIIResults, setTrichyIIResults] = useState<MatchResult[]>([]);
  const [match2Results, setMatch2Results] = useState<MatchResult[]>([]);
  const [ageAdjustedMessage, setAgeAdjustedMessage] = useState('');
  const [mappedResultId, setMappedResultId] = useState<number | null>(null);

  const loadRecords = async (currentPage: number, limit: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchUnmappedRecords({
        page: currentPage + 1,
        limit,
      });

      if (result.success && result.data) {
        setRecords(result.data);
        setTotal(result.total || 0);
      } else {
        setError(result.error || 'Failed to load records');
      }
    } catch (err) {
      setError('An error occurred while loading records');
      console.error('Load records error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (record: MissingRecord) => {
    setSelectedRecord(record);
    setEditedName(record.name || '');
    setEditedNameTamil(record.name_tam || '');
    setEditedRelname(record.relname || '');
    setEditedRelnameTamil(record.relname_tam || '');
    setEditedGender(record.gender || '');
    setEditedAge(record.age?.toString() || '');
    setActiveTab(0);
    setSearchPerformed(false);
    setTrichyIIResults([]);
    setMatch2Results([]);
    setAgeAdjustedMessage('');
    setIsMarkedAsMapped(false);
    setMappedResultId(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
    setSearchPerformed(false);
    setTrichyIIResults([]);
    setMatch2Results([]);
    setAgeAdjustedMessage('');
    setIsMarkedAsMapped(false);
    setMappedResultId(null);
  };

  const handleClearSearch = () => {
    if (selectedRecord) {
      setEditedName(selectedRecord.name || '');
      setEditedNameTamil(selectedRecord.name_tam || '');
      setEditedRelname(selectedRecord.relname || '');
      setEditedRelnameTamil(selectedRecord.relname_tam || '');
      setEditedGender(selectedRecord.gender || '');
      setEditedAge(selectedRecord.age?.toString() || '');
    }
    setActiveTab(0);
    setSearchPerformed(false);
    setTrichyIIResults([]);
    setMatch2Results([]);
    setAgeAdjustedMessage('');
    setMappedResultId(null);
  };

  const handleSearchMapping = async () => {
    if (!editedNameTamil) {
      alert('Please fill in Name (Tamil)');
      return;
    }

    setSearchLoading(true);
    setAgeAdjustedMessage('');

    try {
      // Search Trichy-II only
      const trichyResult = await searchTrichyIIMatches({
        nameTamil: editedNameTamil,
        relnameTamil: editedRelnameTamil || undefined,
        age: editedAge ? parseInt(editedAge) : undefined,
      });

      if (trichyResult.success && trichyResult.data) {
        setTrichyIIResults(trichyResult.data);
        if (trichyResult.ageAdjusted && trichyResult.message) {
          setAgeAdjustedMessage(trichyResult.message);
        }
      }

      // Switch to Trichy-II tab after search
      setActiveTab(0);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Search mapping error:', err);
      alert('An error occurred while searching');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Fetch Match-2 results only when Match-2 tab is selected
    if (newValue === 1 && match2Results.length === 0 && editedNameTamil) {
      setSearchLoading(true);
      try {
        const match2Result = await searchMatch2({
          nameTamil: editedNameTamil,
          relnameTamil: editedRelnameTamil || undefined,
        });

        if (match2Result.success && match2Result.data) {
          setMatch2Results(match2Result.data);
        }
      } catch (err) {
        console.error('Search Match-2 error:', err);
        alert('An error occurred while searching Match-2');
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const handleMarkAsMapped = async () => {
    if (!selectedRecord) return;
    
    try {
      const result = await markAsMapped(selectedRecord.id);
      if (result.success) {
        setIsMarkedAsMapped(true);
        // Reload the records to reflect the change
        loadRecords(page, rowsPerPage);
      } else {
        alert('Failed to mark as mapped: ' + result.error);
      }
    } catch (err) {
      console.error('Mark as mapped error:', err);
      alert('An error occurred while marking as mapped');
    }
  };

  const handleUnmarkAsMapped = async () => {
    if (!selectedRecord) return;
    
    try {
      const result = await unmarkAsMapped(selectedRecord.id);
      if (result.success) {
        setIsMarkedAsMapped(false);
        // Reload the records to reflect the change
        loadRecords(page, rowsPerPage);
      } else {
        alert('Failed to unmark as mapped: ' + result.error);
      }
    } catch (err) {
      console.error('Unmark as mapped error:', err);
      alert('An error occurred while unmarking as mapped');
    }
  };

  const handleMapToResult = async (matchedResult: MatchResult) => {
    if (!selectedRecord) return;
    
    try {
      const result = await mapToResult({
        recordId: selectedRecord.id,
        constituency: matchedResult.constituency || '166',
        boothNo: matchedResult.booth_no || 0,
        serialNo: matchedResult.serial_no || 0,
        bestMatch: activeTab === 0 ? '1' : '2', // Trichy-II = 1, Match-2 = 2
      });
      
      if (result.success) {
        setIsMarkedAsMapped(true);
        setMappedResultId(matchedResult.id);
        // Reload the records to reflect the change
        loadRecords(page, rowsPerPage);
      } else {
        alert('Failed to map: ' + result.error);
      }
    } catch (err) {
      console.error('Map to result error:', err);
      alert('An error occurred while mapping');
    }
  };

  const handleUnmapResult = async () => {
    if (!selectedRecord) return;
    
    try {
      const result = await unmarkAsMapped(selectedRecord.id);
      if (result.success) {
        setIsMarkedAsMapped(false);
        setMappedResultId(null);
        // Reload the records to reflect the change
        loadRecords(page, rowsPerPage);
      } else {
        alert('Failed to unmap: ' + result.error);
      }
    } catch (err) {
      console.error('Unmap result error:', err);
      alert('An error occurred while unmapping');
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-label="unmapped records table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Name (Tamil)</TableCell>
                <TableCell>Relative Name</TableCell>
                <TableCell>Relative Name (Tamil)</TableCell>
                <TableCell>Relation</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell align="right">Age</TableCell>
                <TableCell>EPIC</TableCell>
                <TableCell>Booth No</TableCell>
                <TableCell>Serial No</TableCell>
                <TableCell>AC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No unmapped records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    hover
                    onClick={() => handleRowClick(record)}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {record.id}
                    </TableCell>
                    <TableCell>{record.name || '-'}</TableCell>
                    <TableCell>{record.name_tam || '-'}</TableCell>
                    <TableCell>{record.relname || '-'}</TableCell>
                    <TableCell>{record.relname_tam || '-'}</TableCell>
                    <TableCell>{record.rln_type || '-'}</TableCell>
                    <TableCell>{record.gender || '-'}</TableCell>
                    <TableCell align="right">{record.age || '-'}</TableCell>
                    <TableCell>{record.epic || '-'}</TableCell>
                    <TableCell>{record.booth_no || '-'}</TableCell>
                    <TableCell>{record.serial_no || '-'}</TableCell>
                    <TableCell>{record.ac || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Search Mapping</span>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isMarkedAsMapped ? (
                <Button 
                  variant="contained" 
                  color="success" 
                  size="small"
                  onClick={handleMarkAsMapped}
                >
                  Mark as Mapped
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  color="warning" 
                  size="small"
                  onClick={handleUnmarkAsMapped}
                >
                  Unmark
                </Button>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TamilTransliteratorInput
              label="Name"
              value={editedNameTamil}
              onChange={setEditedNameTamil}
              englishValue={editedName}
              onEnglishChange={setEditedName}
              fullWidth
            />

            <TamilTransliteratorInput
              label="Relative Name"
              value={editedRelnameTamil}
              onChange={setEditedRelnameTamil}
              englishValue={editedRelname}
              onEnglishChange={setEditedRelname}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select
                value={editedGender}
                label="Gender"
                onChange={(e) => setEditedGender(e.target.value)}
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Age"
              type="number"
              value={editedAge}
              onChange={(e) => setEditedAge(e.target.value)}
              fullWidth
              size="small"
              helperText={editedAge ? `Hint: Current age + 20 = ${parseInt(editedAge) + 20}` : 'Add 20 years to current age if needed'}
            />

            {/* Search Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={handleSearchMapping} variant="contained" disabled={searchLoading} fullWidth>
                {searchLoading ? 'Searching...' : 'Search Mapping'}
              </Button>
              <Button onClick={handleClearSearch} fullWidth>Clear Search</Button>
            </Box>

            {/* Search Results Tabs */}
            {searchPerformed && (
              <Box sx={{ mt: 1 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab label={`Trichy-II (${trichyIIResults.length})`} />
                  <Tab label={`Match-2 (${match2Results.length})`} />
                </Tabs>

                {/* Trichy-II Results */}
                {activeTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    {ageAdjustedMessage && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {ageAdjustedMessage}
                      </Alert>
                    )}
                    {trichyIIResults.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No matches found in Trichy-II
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Seq</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Relative</TableCell>
                              <TableCell>Gender</TableCell>
                              <TableCell>Age</TableCell>
                              <TableCell>Booth</TableCell>
                              <TableCell>Door</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {trichyIIResults.map((result) => (
                              <TableRow key={result.id}>
                                <TableCell>{result.serial_no}</TableCell>
                                <TableCell>{result.name}</TableCell>
                                <TableCell>{result.relative_name}</TableCell>
                                <TableCell>{result.gender}</TableCell>
                                <TableCell>{result.age}</TableCell>
                                <TableCell>{result.booth_no}</TableCell>
                                <TableCell>{result.door_no}</TableCell>
                                <TableCell>
                                  {mappedResultId === result.id ? (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="warning"
                                      onClick={handleUnmapResult}
                                    >
                                      Unmap
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="primary"
                                      onClick={() => handleMapToResult(result)}
                                      disabled={mappedResultId !== null}
                                    >
                                      Map
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Match-2 Results */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    {match2Results.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No matches found in other constituencies
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Const</TableCell>
                              <TableCell>Seq</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Relative</TableCell>
                              <TableCell>Gender</TableCell>
                              <TableCell>Age</TableCell>
                              <TableCell>Booth</TableCell>
                              <TableCell>Door</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {match2Results.map((result) => (
                              <TableRow key={result.id}>
                                <TableCell>{result.constituency}</TableCell>
                                <TableCell>{result.serial_no}</TableCell>
                                <TableCell>{result.name}</TableCell>
                                <TableCell>{result.relative_name}</TableCell>
                                <TableCell>{result.gender}</TableCell>
                                <TableCell>{result.age}</TableCell>
                                <TableCell>{result.booth_no}</TableCell>
                                <TableCell>{result.door_no}</TableCell>
                                <TableCell>
                                  {mappedResultId === result.id ? (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="warning"
                                      onClick={handleUnmapResult}
                                    >
                                      Unmap
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="primary"
                                      onClick={() => handleMapToResult(result)}
                                      disabled={mappedResultId !== null}
                                    >
                                      Map
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={handleCloseModal} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
