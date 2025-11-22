"use client";
import React from 'react';
import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
} from '@mui/material';
import TamilTransliteratorInput from '@/app/components/TamilTransliterator';

export default function SearchFilters(props: any) {
  const {
    filteredConstituencies,
    selectedConstituency,
    handleConstituencyChange,
    electorName,
    setElectorName,
    electorNameEnglish,
    setElectorNameEnglish,
    relationName,
    setRelationName,
    relationNameEnglish,
    setRelationNameEnglish,
    electorBoothNumber,
    handleBoothNumberChange,
    electorGender,
    setElectorGender,
    yearOfBirth,
    handleYearOfBirthChange,
    boothNumberError,
    handleSubmit,
    handleClearSearch,
    isSearching,
    selectedDistrict,
    originalDistrict,
    originalConstituency,
    genders,
    originalDistrictValue,
    originalConstituencyValue,
    originalAge,
  } = props;

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="constituency-label">தொகுதி / Constituency</InputLabel>
        <Select
          labelId="constituency-label"
          value={selectedConstituency}
          label="தொகுதி / Constituency"
          onChange={(e) => handleConstituencyChange(e.target.value)}
        >
          {filteredConstituencies.map((constituency: any) => (
            <MenuItem key={constituency.id} value={constituency.id.toString()}>
              {constituency.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          Elector Details
        </Typography>
      </Box>

      <Box sx={{ p: 3, bgcolor: 'rgba(63, 81, 181, 0.04)', borderRadius: 2 }}>
        <Stack direction="column" spacing={{ xs: 2, sm: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }}>
            <Box sx={{ minHeight: { xs: 'auto', sm: 80 }, flex: 1 }}>
              <TamilTransliteratorInput
                label="Name of the Elector"
                value={electorName}
                onChange={setElectorName}
                englishValue={electorNameEnglish}
                onEnglishChange={setElectorNameEnglish}
                fullWidth
              />
            </Box>

            <Box sx={{ minHeight: 80, flex: 1, display: { xs: 'none', sm: 'block' } }}>
              <TamilTransliteratorInput
                label="Name of the Relation"
                value={relationName}
                onChange={setRelationName}
                englishValue={relationNameEnglish}
                onEnglishChange={setRelationNameEnglish}
                fullWidth
              />
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: { xs: -1, sm: 0 } }}>
            <TamilTransliteratorInput
              label="Name of the Relation"
              value={relationName}
              onChange={setRelationName}
              englishValue={relationNameEnglish}
              onEnglishChange={setRelationNameEnglish}
              fullWidth
            />
          </Box>

          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" spacing={1}>
              <Box sx={{ width: '50%' }}>
                <TextField
                  label="Booth Number"
                  type="text"
                  value={electorBoothNumber}
                  onChange={(e) => handleBoothNumberChange(e.target.value)}
                  placeholder="1, 2, 3"
                  sx={{ width: '100%' }}
                  size="small"
                  error={!!boothNumberError}
                />
                {boothNumberError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {boothNumberError}
                  </Typography>
                )}
              </Box>
              <FormControl sx={{ width: '50%' }} size="small">
                <InputLabel>Gender</InputLabel>
                <Select value={electorGender} label="Gender" onChange={(e) => setElectorGender(e.target.value)}>
                  {genders && genders.map((gender: any) => (
                    <MenuItem key={gender.id} value={gender.id}>{gender.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Birth Year"
              type="number"
              value={yearOfBirth}
              onChange={(e) => handleYearOfBirthChange(e.target.value)}
              placeholder="YYYY"
              sx={{ width: '100%' }}
              size="small"
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ width: '100%', display: { xs: 'none', sm: 'flex' } }}>
            <Box sx={{ width: '200px', flex: 1 }}>
              <TextField
                label="Booth Numbers"
                type="text"
                value={electorBoothNumber}
                onChange={(e) => handleBoothNumberChange(e.target.value)}
                placeholder="1, 2, 3"
                sx={{ width: '100%' }}
                size="small"
                error={!!boothNumberError}
              />
              {boothNumberError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {boothNumberError}
                </Typography>
              )}
            </Box>
            <FormControl sx={{ width: '200px', flex: 1 }} size="small">
              <InputLabel>Gender</InputLabel>
              <Select value={electorGender} label="Gender" onChange={(e) => setElectorGender(e.target.value)}>
                {genders && genders.map((gender: any) => (
                  <MenuItem key={gender.id} value={gender.id}>{gender.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Birth Year"
              type="number"
              value={yearOfBirth}
              onChange={(e) => handleYearOfBirthChange(e.target.value)}
              placeholder="YYYY"
              sx={{ width: '200px', flex: 1 }}
              size="small"
            />
          </Stack>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2, order: { xs: 1, sm: 0 } }}>
        <Button variant="contained" onClick={handleSubmit} disabled={!selectedDistrict || !selectedConstituency || isSearching} sx={{ flex: 1 }}>
          {isSearching ? 'Searching...' : 'Submit'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleClearSearch}
          disabled={
            selectedDistrict === originalDistrict && selectedConstituency === originalConstituency && !electorName && !electorBoothNumber && !electorGender && !yearOfBirth && !originalAge && !relationName
          }
          sx={{ flex: 1 }}
        >
          Clear Search
        </Button>
      </Stack>
    </>
  );
}
