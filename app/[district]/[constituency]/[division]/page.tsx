'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { districts, constituencies, genders } from '@/app/utils/preConfiguredData';
import { useState, useEffect } from 'react';
import TamilTransliteratorInput from '@/app/components/TamilTransliterator';
import { searchElectors, SearchResult, searchFamilyMembers, incrementOperationCounter } from '@/app/actions/searchActions';

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
  elector: {
    name: string;
    nameEnglish: string;
    boothNumber: string;
    gender: string;
    age: string;
  };
  relation: {
    name: string;
    
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
      'F': 'தந்தை',
      'tha': 'தந்தை',
      'க': 'கணவர்',
      'H': 'கணவர்',
      'கா': 'கணவர்',
      'ka': 'கணவர்',
      'தய்': 'தாய்',
      'thay': 'தாய்',
      'M': 'தாய்',
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
  const [isMultiColumnView, setIsMultiColumnView] = useState(false);
  const [boothNumberError, setBoothNumberError] = useState<string>('');

  // Family modal state
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const [familyMembers, setFamilyMembers] = useState<SearchResult[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  // Dynamic age label based on constituency
  const getAgeLabel = () => {
    return selectedConstituency === '167' ? 'Age at 2005' : 'Age at 2002';
  };

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

  const handleBoothNumberChange = (value: string) => {
    setElectorBoothNumber(value);
    setBoothNumberError('');
  };

  const handleFamilyClick = async (member: SearchResult) => {
    setSelectedMember(member);
    setFamilyModalOpen(true);
    setIsFamilyLoading(true);
    setFamilyMembers([]);

    try {
      const result = await searchFamilyMembers({
        doorNo: member.door_no,
        relativeName: member.relative_name,
        memberName: member.name,
        constituencyId: selectedConstituency,
      });

      if (result.success && result.data) {
        // Filter out the selected member from the family results
        let filteredFamily = result.data.filter(familyMember => familyMember.id !== member.id);
        
        // If selected member's relation is கணவர் (husband) or மனைவி (wife), filter out family members with same relation type
        const selectedRelation = member.relation;
        if (selectedRelation) {
          // Check if selected member is கணவர் (H, க, கா, ka) or மனைவி (W, ம, ma)
          const isHusband = ['H', 'க', 'கா', 'ka'].includes(selectedRelation) || 
                           getRelationText(selectedRelation) === 'கணவர்';
          const isWife = ['W', 'ம', 'ma'].includes(selectedRelation) || 
                        getRelationText(selectedRelation) === 'மனைவி';
          
          if (isHusband || isWife) {
            filteredFamily = filteredFamily.filter(familyMember => {
              const familyRelation = familyMember.relation;
              if (!familyRelation) return true;
              
              const isFamilyHusband = ['H', 'க', 'கா', 'ka'].includes(familyRelation) || 
                                     getRelationText(familyRelation) === 'கணவர்';
              const isFamilyWife = ['W', 'ம', 'ma'].includes(familyRelation) || 
                                  getRelationText(familyRelation) === 'மனைவி';
              
              // If selected is husband, exclude other husbands; if selected is wife, exclude other wives
              if (isHusband) {
                return !isFamilyHusband;
              } else {
                return !isFamilyWife;
              }
            });
          }
        }
        
        // Sort family members: same booth first, then by sequence
        filteredFamily.sort((a, b) => {
          const aMatchesBooth = a.booth_no === member.booth_no;
          const bMatchesBooth = b.booth_no === member.booth_no;
          
          if (aMatchesBooth && !bMatchesBooth) return -1;
          if (!aMatchesBooth && bMatchesBooth) return 1;
          
          // If both match or both don't match, sort by sequence
          return (a.sequence || 0) - (b.sequence || 0);
        });
        
        setFamilyMembers(filteredFamily);
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setIsFamilyLoading(false);
    }
  };

  const handleCloseFamilyModal = () => {
    setFamilyModalOpen(false);
    setSelectedMember(null);
    setFamilyMembers([]);
  };

  const handleSubmit = async () => {
    const districtData = districts.find(d => d.id.toString() === selectedDistrict);
    const constituencyData = constituencies.find(c => c.id.toString() === selectedConstituency);
    
    if (!districtData || !constituencyData) {
      console.error('District or Constituency not found');
      return;
    }

    // Validate and clean booth number
    let cleanedBoothNumber = electorBoothNumber;
    if (electorBoothNumber) {
      const boothNumbers = electorBoothNumber.split(',').map(b => b.trim());
      // Filter for non-empty values that are not valid numbers
      const invalidBooths = boothNumbers.filter(b => {
        if (b === '') return false; // Skip empty strings
        const num = parseInt(b);
        return isNaN(num) || num.toString() !== b; // Check if it's not a valid integer
      });
      
      if (invalidBooths.length > 0) {
        // Show error if there are any invalid values
        setBoothNumberError('Invalid format. Use numbers separated by commas (e.g., 1, 2, 3)');
        return;
      }
      
      // Clean the booth numbers - remove empty values
      const validBooths = boothNumbers.filter(b => b !== '' && !isNaN(parseInt(b)));
      cleanedBoothNumber = validBooths.join(', ');
    }
    
    setBoothNumberError('');

    // Increment operation counter asynchronously (fire and forget)
    incrementOperationCounter().catch(err => console.error('Counter increment failed:', err));

    // Clear previous results and errors
    setSearchError('');
    setSearchResults([]);
    setIsSearching(true);

    try {
      // Perform database search
      const result = await searchElectors({
        name: electorName || undefined,
        relativeName: relationName || undefined,
        boothNumber: cleanedBoothNumber || undefined,
        gender: electorGender || undefined,
        age: age ? parseInt(age) : undefined,
        constituencyId: selectedConstituency || undefined,
        birthYear: yearOfBirth || undefined,
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
      elector: {
        name: electorName,
        nameEnglish: electorNameEnglish,
        boothNumber: electorBoothNumber,
        gender: electorGender,
        age: age,
      },
      relation: {
        name: relationName
        
      },
     
    };

    console.log('Submitted:', submitData);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: { xs: 12, sm: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Link href="/stats" passHref style={{ textDecoration: 'none' }}>
          <Button variant="outlined" size="small">
            View Statistics
          </Button>
        </Link>
      </Box>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ display: { xs: 'flex', sm: 'block' }, flexDirection: { xs: 'column', sm: 'column' } }}>
          {/* <FormControl fullWidth disabled>
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
          </FormControl> */}

          <FormControl fullWidth>
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
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              Elector Details
            </Typography>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'rgba(63, 81, 181, 0.04)', borderRadius: 2 }}>
            <Stack 
              direction="column"
              spacing={{ xs: 2, sm: 1.5 }}
            >
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

          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ 
              mt: 2,
              order: { xs: 1, sm: 0 },
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
          <Box sx={{ order: { xs: 2, sm: 0 } }}>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Search Results ({searchResults.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setIsMultiColumnView(!isMultiColumnView)}
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  {isMultiColumnView ? 'Single Column' : 'Multi Column'}
                </Button>
              </Box>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: isMultiColumnView ? 'repeat(2, 1fr)' : '1fr' },
                gap: 2
              }}>
                {searchResults.map((result) => (
                  <Paper key={result.id} elevation={1} sx={{ p: 2 }}>
                    <Stack spacing={0}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {result.name}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleFamilyClick(result)}
                          disabled={!result.door_no || result.door_no === '' || result.door_no.toLowerCase() === 'null'}
                          sx={{ ml: 1, minWidth: 'auto', px: 1.5 }}
                        >
                          Family
                        </Button>
                      </Box>
                      
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
                        {result.serial_no && (
                          <Typography variant="body2" color="text.secondary">
                            Sequence: {result.serial_no}
                          </Typography>
                        )}
                        {result.booth_no && (
                          <Typography variant="body2" color="text.secondary">
                            Booth: {result.booth_no}
                          </Typography>
                        )}
                      </Stack>
                      
                      {result.door_no && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Door No: {result.door_no}
                        </Typography>
                      )}
                      
                      {result.epic && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          EPIC: {result.epic}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
          </Box>

          
        </Stack>
      </Paper>

      {/* Family Modal */}
      <Dialog 
        open={familyModalOpen} 
        onClose={handleCloseFamilyModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Family Members</Typography>
            <IconButton onClick={handleCloseFamilyModal} size="small">
              <Typography variant="body1">✕</Typography>
            </IconButton>
          </Box>
          {selectedMember && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              For: {selectedMember.name} {selectedMember.door_no && `(Door No: ${selectedMember.door_no})`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {isFamilyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : familyMembers.length > 0 ? (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {familyMembers.map((member) => {
                const matchesBooth = member.booth_no === selectedMember?.booth_no;
                return (
                <Paper 
                  key={member.id} 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(63, 81, 181, 0.04)',
                    borderLeft: matchesBooth ? '4px solid #4CAF50' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Stack spacing={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                      {matchesBooth && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ 
                            color: 'success.main', 
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        >
                          ● Same Booth
                        </Typography>
                      )}
                    </Box>
                    
                    <Stack direction="row" spacing={2}>
                      {member.relative_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {member.relative_name}
                        </Typography>
                      )}
                      {member.relative_name && member.relation && (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                      {member.relation && (
                        <Typography variant="body2" color="text.secondary">
                          {getRelationText(member.relation)}
                        </Typography>
                      )}
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                      {member.gender && (
                        <Typography variant="body2" color="text.secondary">
                          Gender: {getGenderText(member.gender)}
                        </Typography>
                      )}
                      {member.age && (
                        <Typography variant="body2" color="text.secondary">
                          Age: {member.age}
                        </Typography>
                      )}
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      {member.serial_no && (
                        <Typography variant="body2" color="text.secondary">
                          Sequence: {member.serial_no}
                        </Typography>
                      )}
                      {member.booth_no && (
                        <Typography variant="body2" color="text.secondary">
                          Booth: {member.booth_no}
                        </Typography>
                      )}
                    </Stack>
                    
                    {member.door_no && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Door No: {member.door_no}
                      </Typography>
                    )}
                    
                    {member.epic && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        EPIC: {member.epic}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No family members found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFamilyModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
