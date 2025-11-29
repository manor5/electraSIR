"use client";
import React from 'react';
import { Box, Paper, Stack, Typography, Button } from '@mui/material';
import { SearchResult } from '@/app/actions/searchActions';

export default function SearchResults(props: any) {
  const { searchResults, isMultiColumnView, setIsMultiColumnView, handleFamilyClick, getRelationText, getGenderText, displayDoor, displayEpic, searchPerformed } = props;

  // Show "no records found" message if search was performed but no results
  if (searchPerformed && (!searchResults || searchResults.length === 0)) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={1} sx={{ p: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No matching records were found for your search criteria. Please try different search parameters.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!searchResults || searchResults.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Search Results ({searchResults.length})
        </Typography>
        <Button variant="outlined" size="small" onClick={() => setIsMultiColumnView(!isMultiColumnView)} sx={{ display: { xs: 'none', sm: 'block' } }}>
          {isMultiColumnView ? 'Single Column' : 'Multi Column'}
        </Button>
      </Box>

      {isMultiColumnView ? (
        <Box sx={{ display: 'grid', justifyContent: 'center', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,48%))' }, gap: 2 }}>
          {searchResults.map((result: SearchResult, index: number) => (
            <Paper key={result.id} elevation={1} sx={{ p: 2, boxSizing: 'border-box', width: '100%' }}>
              <Stack spacing={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {index + 1}. {result.name}
                    </Typography>
                    {/* gender/age moved to the dedicated row below */}
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => handleFamilyClick(result)} disabled={!displayDoor(result.door_no) || displayDoor(result.door_no) === '-'} sx={{ ml: 1, minWidth: 'auto', px: 1.5 }}>
                    Family
                  </Button>
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 0, mb: 1 }}>
                  {result.relative_name && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {result.relative_name}
                    </Typography>
                  )}
                  {result.relative_name && result.relation && <Typography variant="body2" color="text.secondary">-</Typography>}
                  {result.relation && <Typography variant="body2" color="text.secondary">{getRelationText(result.relation)}</Typography>}
                </Stack>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body2" color="text.secondary">{result.gender ? getGenderText(result.gender) : '-'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Age</Typography>
                    <Typography variant="body2" color="text.secondary">{result.age ?? '-'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Seq/வரிசை</Typography>
                    <Typography variant="body2" color="text.secondary">{result.serial_no ?? '-'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Booth</Typography>
                    <Typography variant="body2" color="text.secondary">{result.booth_no ?? '-'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Door No</Typography>
                    <Typography variant="body2" color="text.secondary">{displayDoor(result.door_no)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">EPIC</Typography>
                    <Typography variant="body2" color="text.secondary">{displayEpic(result.epic)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          {searchResults.map((result: SearchResult, index: number) => (
            <Paper key={result.id} elevation={1} sx={{ p: 2, boxSizing: 'border-box', width: { xs: '100%', sm: '48%' } }}>
              <Stack spacing={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {index + 1}. {result.name}
                    </Typography>
                    {/* gender/age moved to the dedicated row below */}
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => handleFamilyClick(result)} disabled={!displayDoor(result.door_no) || displayDoor(result.door_no) === '-'} sx={{ ml: 1, minWidth: 'auto', px: 1.5 }}>
                    Family
                  </Button>
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 0, mb: 1 }}>
                  {result.relative_name && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {result.relative_name}
                    </Typography>
                  )}
                  {result.relative_name && result.relation && <Typography variant="body2" color="text.secondary">-</Typography>}
                  {result.relation && <Typography variant="body2" color="text.secondary">{getRelationText(result.relation)}</Typography>}
                </Stack>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body2" color="text.secondary">{result.gender ? getGenderText(result.gender) : '-'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Age</Typography>
                    <Typography variant="body2" color="text.secondary">{result.age ?? '-'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Seq/வரிசை</Typography>
                    <Typography variant="body2" color="text.secondary">{result.serial_no ?? '-'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Booth</Typography>
                    <Typography variant="body2" color="text.secondary">{result.booth_no ?? '-'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0, sm: 2 }, mt: { xs: 0, sm: 0.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Door No</Typography>
                    <Typography variant="body2" color="text.secondary">{displayDoor(result.door_no)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">EPIC</Typography>
                    <Typography variant="body2" color="text.secondary">{displayEpic(result.epic)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
