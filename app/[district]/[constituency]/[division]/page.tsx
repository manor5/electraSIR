'use client';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { districts, constituencies, genders } from '@/app/utils/preConfiguredData';
import { useState, useEffect } from 'react';
import TamilTransliteratorInput from '@/app/components/TamilTransliterator';
import { searchElectors, SearchResult } from '@/app/actions/searchActions';

type SubmitData = {
  district: {
    id: number;
    name: string;
  };
  constituency: {
    id: number;
    name: string;
    districtId: number;
  };
  division: string;
  elector: {
    name: string;
    nameEnglish: string;
    boothNumber: string;
    gender: string;
    age: string;
  };
  relation: {
    name: string;
    nameEnglish: string;
    boothNumber: string;
    gender: string;
    age: string;
  };
  relationOfRelation: {
    name: string;
    nameEnglish: string;
    boothNumber: string;
    gender: string;
    age: string;
  };
};

export default function DivisionPage() {
  const params = useParams();
  const router = useRouter();
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [filteredConstituencies, setFilteredConstituencies] = useState(constituencies);

  // Helper function to convert relation codes to Tamil text
  const getRelationText = (relationCode: string): string => {
    const relationMap: { [key: string]: string } = {
      'த': 'தந்தை',
      'தா': 'தந்தை',
      'tha': 'தந்தை',
      'க': 'கணவர்',
      'கா': 'கணவர்',
      'ka': 'கணவர்',
      'தய்': 'தாய்',
      'thay': 'தாய்',
      'ம': 'மனைவி',
      'ma': 'மனைவி',
      'அ': 'அண்ணன்',
      'an': 'அண்ணன்',
      'தம்': 'தம்பி',
      'tham': 'தம்பி',
      'அக்': 'அக்கா',
      'akka': 'அக்கா',
      'தங்': 'தங்கை',
      'thangai': 'தங்கை',
    };
    return relationMap[relationCode.toLowerCase()] || relationCode;
  };

  // Helper function to convert gender codes to Tamil text
  const getGenderText = (genderCode: string): string => {
    const genderMap: { [key: string]: string } = {
      'ஆ': 'ஆண்',
      'aa': 'ஆண்',
      'aan': 'ஆண்',
      'பெ': 'பெண்',
      'pe': 'பெண்',
      'pen': 'பெண்',
      'm': 'ஆண்',
      'male': 'ஆண்',
      'f': 'பெண்',
      'female': 'பெண்',
    };
    return genderMap[genderCode.toLowerCase()] || genderCode;
  };
  
  // Store original values from URL
  const [originalDistrict, setOriginalDistrict] = useState('');
  const [originalConstituency, setOriginalConstituency] = useState('');
  
  // Elector details
  const [electorName, setElectorName] = useState('');
  const [electorNameEnglish, setElectorNameEnglish] = useState('');
  const [electorBoothNumber, setElectorBoothNumber] = useState('');
  const [electorGender, setElectorGender] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [age, setAge] = useState('');

  // Relation details
  const [relationName, setRelationName] = useState('');
  const [relationNameEnglish, setRelationNameEnglish] = useState('');
  const [relationBoothNumber, setRelationBoothNumber] = useState('');
  const [relationGender, setRelationGender] = useState('');
  const [relationYearOfBirth, setRelationYearOfBirth] = useState('');
  const [relationAge, setRelationAge] = useState('');

  // Relation of Relation details
  const [relationOfRelationName, setRelationOfRelationName] = useState('');
  const [relationOfRelationNameEnglish, setRelationOfRelationNameEnglish] = useState('');
  const [relationOfRelationBoothNumber, setRelationOfRelationBoothNumber] = useState('');
  const [relationOfRelationGender, setRelationOfRelationGender] = useState('');
  const [relationOfRelationYearOfBirth, setRelationOfRelationYearOfBirth] = useState('');
  const [relationOfRelationAge, setRelationOfRelationAge] = useState('');

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string>('');

  // Calculate age from year of birth
  const calculateAgeFromYear = (year: string) => {
    if (!year) return '';
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(year);
    if (isNaN(birthYear) || birthYear > currentYear) return '';
    return (currentYear - birthYear).toString();
  };

  // Handle year of birth change
  const handleYearOfBirthChange = (value: string) => {
    setYearOfBirth(value);
    const calculatedAge = calculateAgeFromYear(value);
    setAge(calculatedAge);
  };

  // Handle relation year of birth change
  const handleRelationYearOfBirthChange = (value: string) => {
    setRelationYearOfBirth(value);
    const calculatedAge = calculateAgeFromYear(value);
    setRelationAge(calculatedAge);
  };

  // Handle relation of relation year of birth change
  const handleRelationOfRelationYearOfBirthChange = (value: string) => {
    setRelationOfRelationYearOfBirth(value);
    const calculatedAge = calculateAgeFromYear(value);
    setRelationOfRelationAge(calculatedAge);
  };

  // Initialize from URL params
  useEffect(() => {
    if (params.district) {
      const districtParam = decodeURIComponent(params.district as string);
      
      // Try to match by ID first, then by name
      const district = districts.find(d => 
        d.id.toString() === districtParam || 
        d.name.toLowerCase() === districtParam.toLowerCase()
      );
      
      if (district) {
        setSelectedDistrict(district.id.toString());
        setOriginalDistrict(district.id.toString());
        
        // Filter constituencies for this district
        const filtered = constituencies.filter(c => c.districtId === district.id);
        setFilteredConstituencies(filtered);
        
        // Set constituency if exists in URL
        if (params.constituency) {
          const constituencyParam = decodeURIComponent(params.constituency as string);
          
          // Try to match by ID first, then by name
          const constituency = filtered.find(c => 
            c.id.toString() === constituencyParam || 
            c.name.toLowerCase() === constituencyParam.toLowerCase()
          );
          
          if (constituency) {
            setSelectedConstituency(constituency.id.toString());
            setOriginalConstituency(constituency.id.toString());
          }
        }
      }
    }
  }, [params.district, params.constituency]);

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedConstituency('');
    
    // Filter constituencies
    const filtered = constituencies.filter(c => c.districtId === parseInt(districtId));
    setFilteredConstituencies(filtered);
  };

  const handleConstituencyChange = (constituencyId: string) => {
    setSelectedConstituency(constituencyId);
  };

  const handleClearSearch = () => {
    setSelectedDistrict(originalDistrict);
    setSelectedConstituency(originalConstituency);
    
    // Clear all form fields
    setElectorName('');
    setElectorNameEnglish('');
    setElectorBoothNumber('');
    setElectorGender('');
    setYearOfBirth('');
    setAge('');
    
    setRelationName('');
    setRelationNameEnglish('');
    setRelationBoothNumber('');
    setRelationGender('');
    setRelationYearOfBirth('');
    setRelationAge('');
    
    setRelationOfRelationName('');
    setRelationOfRelationNameEnglish('');
    setRelationOfRelationBoothNumber('');
    setRelationOfRelationGender('');
    setRelationOfRelationYearOfBirth('');
    setRelationOfRelationAge('');
    
    // Re-filter constituencies for original district
    if (originalDistrict) {
      const filtered = constituencies.filter(c => c.districtId === parseInt(originalDistrict));
      setFilteredConstituencies(filtered);
    } else {
      setFilteredConstituencies(constituencies);
    }
  };

  const handleSubmit = async () => {
    const districtData = districts.find(d => d.id.toString() === selectedDistrict);
    const constituencyData = constituencies.find(c => c.id.toString() === selectedConstituency);
    
    if (!districtData || !constituencyData) {
      console.error('District or Constituency not found');
      return;
    }

    // Clear previous results and errors
    setSearchError('');
    setSearchResults([]);
    setIsSearching(true);

    try {
      // Perform database search
      const result = await searchElectors({
        name: electorName || undefined,
        relativeName: relationName || undefined,
        boothNumber: electorBoothNumber || undefined,
        gender: electorGender || undefined,
        age: age ? parseInt(age) : undefined,
      });

      if (result.success && result.data) {
        setSearchResults(result.data);
        console.log('Search results:', result.data);
      } else {
        setSearchError(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }

    const submitData: SubmitData = {
      district: {
        id: districtData.id,
        name: districtData.name,
      },
      constituency: {
        id: constituencyData.id,
        name: constituencyData.name,
        districtId: constituencyData.districtId,
      },
      division: params.division ? decodeURIComponent(params.division as string) : '',
      elector: {
        name: electorName,
        nameEnglish: electorNameEnglish,
        boothNumber: electorBoothNumber,
        gender: electorGender,
        age: age,
      },
      relation: {
        name: relationName,
        nameEnglish: relationNameEnglish,
        boothNumber: relationBoothNumber,
        gender: relationGender,
        age: relationAge,
      },
      relationOfRelation: {
        name: relationOfRelationName,
        nameEnglish: relationOfRelationNameEnglish,
        boothNumber: relationOfRelationBoothNumber,
        gender: relationOfRelationGender,
        age: relationOfRelationAge,
      },
    };

    console.log('Submitted:', submitData);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: { xs: 12, sm: 4 } }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="district-label">மாவட்டம் / District</InputLabel>
            <Select
              labelId="district-label"
              value={selectedDistrict}
              label="மாவட்டம் / District"
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedDistrict}>
            <InputLabel id="constituency-label">தொகுதி / Constituency</InputLabel>
            <Select
              labelId="constituency-label"
              value={selectedConstituency}
              label="தொகுதி / Constituency"
              onChange={(e) => handleConstituencyChange(e.target.value)}
            >
              {filteredConstituencies.map((constituency) => (
                <MenuItem key={constituency.id} value={constituency.id.toString()}>
                  {constituency.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              1
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              Elector Details
            </Typography>
            <Box sx={{ flex: 1, height: '2px', bgcolor: 'divider' }} />
          </Box>

          <Box sx={{ p: 3, bgcolor: 'rgba(63, 81, 181, 0.04)', borderRadius: 2 }}>
            <Stack 
              direction="column"
              spacing={2}
            >
            <Box sx={{ minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Elector"
                value={electorName}
                onChange={setElectorName}
                englishValue={electorNameEnglish}
                onEnglishChange={setElectorNameEnglish}
                fullWidth
              />
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Booth Number"
                  type="number"
                  value={electorBoothNumber}
                  onChange={(e) => setElectorBoothNumber(e.target.value)}
                  placeholder="Booth"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Box sx={{ height: '21px' }} />
                <FormControl sx={{ width: { xs: '100%', sm: 120 } }} size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={electorGender}
                    label="Gender"
                    onChange={(e) => setElectorGender(e.target.value)}
                  >
                    {genders.map((gender) => (
                      <MenuItem key={gender.id} value={gender.id}>
                        {gender.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Year of Birth"
                  type="number"
                  value={yearOfBirth}
                  onChange={(e) => handleYearOfBirthChange(e.target.value)}
                  placeholder="YYYY"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Typography sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', fontSize: '0.875rem' }}>OR</Typography>
                <TextField
                  label="Current Age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
              </Stack>
            </Stack>
          </Stack>
          </Box>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              bgcolor: 'secondary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              2
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              Relation Details
            </Typography>
            <Box sx={{ flex: 1, height: '2px', bgcolor: 'divider' }} />
          </Box>

          <Box sx={{ p: 3, bgcolor: 'rgba(63, 81, 181, 0.04)', borderRadius: 2 }}>
            <Stack 
              direction="column"
              spacing={2}
            >
            <Box sx={{ minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Relation"
                value={relationName}
                onChange={setRelationName}
                englishValue={relationNameEnglish}
                onEnglishChange={setRelationNameEnglish}
                fullWidth
              />
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Booth Number"
                  type="number"
                  value={relationBoothNumber}
                  onChange={(e) => setRelationBoothNumber(e.target.value)}
                  placeholder="Booth"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Box sx={{ height: '21px' }} />
                <FormControl sx={{ width: { xs: '100%', sm: 120 } }} size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={relationGender}
                    label="Gender"
                    onChange={(e) => setRelationGender(e.target.value)}
                  >
                    {genders.map((gender) => (
                      <MenuItem key={gender.id} value={gender.id}>
                        {gender.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Year of Birth"
                  type="number"
                  value={relationYearOfBirth}
                  onChange={(e) => handleRelationYearOfBirthChange(e.target.value)}
                  placeholder="YYYY"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Typography sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', fontSize: '0.875rem' }}>OR</Typography>
                <TextField
                  label="Current Age"
                  type="number"
                  value={relationAge}
                  onChange={(e) => setRelationAge(e.target.value)}
                  placeholder="Age"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
              </Stack>
            </Stack>
          </Stack>
          </Box>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              bgcolor: 'success.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              3
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              Relation of Relation Details
            </Typography>
            <Box sx={{ flex: 1, height: '2px', bgcolor: 'divider' }} />
          </Box>

          <Box sx={{ p: 3, bgcolor: 'rgba(63, 81, 181, 0.04)', borderRadius: 2 }}>
            <Stack 
              direction="column"
              spacing={2}
            >
            <Box sx={{ minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Relation of Relation"
                value={relationOfRelationName}
                onChange={setRelationOfRelationName}
                englishValue={relationOfRelationNameEnglish}
                onEnglishChange={setRelationOfRelationNameEnglish}
                fullWidth
              />
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Booth Number"
                  type="number"
                  value={relationOfRelationBoothNumber}
                  onChange={(e) => setRelationOfRelationBoothNumber(e.target.value)}
                  placeholder="Booth"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Box sx={{ height: '21px' }} />
                <FormControl sx={{ width: { xs: '100%', sm: 120 } }} size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={relationOfRelationGender}
                    label="Gender"
                    onChange={(e) => setRelationOfRelationGender(e.target.value)}
                  >
                    {genders.map((gender) => (
                      <MenuItem key={gender.id} value={gender.id}>
                        {gender.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack spacing={1} sx={{ flex: { xs: 1, sm: 'none' } }}>
                <TextField
                  label="Year of Birth"
                  type="number"
                  value={relationOfRelationYearOfBirth}
                  onChange={(e) => handleRelationOfRelationYearOfBirthChange(e.target.value)}
                  placeholder="YYYY"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
                <Typography sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', fontSize: '0.875rem' }}>OR</Typography>
                <TextField
                  label="Current Age"
                  type="number"
                  value={relationOfRelationAge}
                  onChange={(e) => setRelationOfRelationAge(e.target.value)}
                  placeholder="Age"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                  size="small"
                />
              </Stack>
            </Stack>
          </Stack>
          </Box>

          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ 
              mt: 2,
              position: { xs: 'fixed', sm: 'relative' },
              bottom: { xs: 16, sm: 'auto' },
              left: { xs: 16, sm: 'auto' },
              right: { xs: 16, sm: 'auto' },
              zIndex: { xs: 1000, sm: 'auto' },
              bgcolor: { xs: 'background.paper', sm: 'transparent' },
              p: { xs: 2, sm: 0 },
              borderRadius: { xs: 2, sm: 0 },
              boxShadow: { xs: 3, sm: 0 },
            }}
          >
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!selectedDistrict || !selectedConstituency || isSearching}
              sx={{ flex: 1 }}
            >
              {isSearching ? 'Searching...' : 'Submit'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleClearSearch}
              disabled={
                selectedDistrict === originalDistrict && 
                selectedConstituency === originalConstituency &&
                !electorName && !electorBoothNumber && !electorGender && !yearOfBirth && !age &&
                !relationName && !relationBoothNumber && !relationGender && !relationYearOfBirth && !relationAge &&
                !relationOfRelationName && !relationOfRelationBoothNumber && !relationOfRelationGender && !relationOfRelationYearOfBirth && !relationOfRelationAge
              }
              sx={{ flex: 1 }}
            >
              Clear Search
            </Button>
          </Stack>

          {/* Search Results Section */}
          {isSearching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {searchError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {searchError}
            </Alert>
          )}

          {searchResults.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Search Results ({searchResults.length})
              </Typography>
              <Stack spacing={2}>
                {searchResults.map((result) => (
                  <Paper key={result.id} elevation={1} sx={{ p: 2 }}>
                    <Stack spacing={0}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }}>
                        {result.name}
                      </Typography>
                      
                      <Stack direction="row" spacing={2}>
                        {result.relative_name && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {result.relative_name}
                          </Typography>
                        )}
                        {result.relative_name && result.relation && (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                        {result.relation && (
                          <Typography variant="body2" color="text.secondary">
                            {getRelationText(result.relation)}
                          </Typography>
                        )}
                      </Stack>
                      
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        {result.gender && (
                          <Typography variant="body2" color="text.secondary">
                            Gender: {getGenderText(result.gender)}
                          </Typography>
                        )}
                        {result.age && (
                          <Typography variant="body2" color="text.secondary">
                            Age: {result.age}
                          </Typography>
                        )}
                      </Stack>
                      
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        {result.sequence && (
                          <Typography variant="body2" color="text.secondary">
                            Sequence: {result.sequence}
                          </Typography>
                        )}
                        {result.booth_no && (
                          <Typography variant="body2" color="text.secondary">
                            Booth: {result.booth_no}
                          </Typography>
                        )}
                      </Stack>
                      
                      {result.epic && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          EPIC: {result.epic}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {params.division && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Division: {decodeURIComponent(params.division as string)}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
