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
} from '@mui/material';
import { districts, constituencies } from '@/app/utils/preConfiguredData';
import { useState, useEffect } from 'react';
import TamilTransliteratorInput from '@/app/components/TamilTransliterator';

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
    age: string;
  };
  relation: {
    name: string;
    nameEnglish: string;
    age: string;
  };
  relationOfRelation: {
    name: string;
    nameEnglish: string;
    age: string;
  };
};

export default function DivisionPage() {
  const params = useParams();
  const router = useRouter();
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [filteredConstituencies, setFilteredConstituencies] = useState(constituencies);
  
  // Store original values from URL
  const [originalDistrict, setOriginalDistrict] = useState('');
  const [originalConstituency, setOriginalConstituency] = useState('');
  
  // Elector details
  const [electorName, setElectorName] = useState('');
  const [electorNameEnglish, setElectorNameEnglish] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [age, setAge] = useState('');

  // Relation details
  const [relationName, setRelationName] = useState('');
  const [relationNameEnglish, setRelationNameEnglish] = useState('');
  const [relationYearOfBirth, setRelationYearOfBirth] = useState('');
  const [relationAge, setRelationAge] = useState('');

  // Relation of Relation details
  const [relationOfRelationName, setRelationOfRelationName] = useState('');
  const [relationOfRelationNameEnglish, setRelationOfRelationNameEnglish] = useState('');
  const [relationOfRelationYearOfBirth, setRelationOfRelationYearOfBirth] = useState('');
  const [relationOfRelationAge, setRelationOfRelationAge] = useState('');

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
    setYearOfBirth('');
    setAge('');
    
    setRelationName('');
    setRelationNameEnglish('');
    setRelationYearOfBirth('');
    setRelationAge('');
    
    setRelationOfRelationName('');
    setRelationOfRelationNameEnglish('');
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

  const handleSubmit = () => {
    const districtData = districts.find(d => d.id.toString() === selectedDistrict);
    const constituencyData = constituencies.find(c => c.id.toString() === selectedConstituency);
    
    if (!districtData || !constituencyData) {
      console.error('District or Constituency not found');
      return;
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
        age: age,
      },
      relation: {
        name: relationName,
        nameEnglish: relationNameEnglish,
        age: relationAge,
      },
      relationOfRelation: {
        name: relationOfRelationName,
        nameEnglish: relationOfRelationNameEnglish,
        age: relationOfRelationAge,
      },
    };

    console.log('Submitted:', submitData);
    // Add your submission logic here
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Elector Details
          </Typography>

          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Elector"
                value={electorName}
                onChange={setElectorName}
                englishValue={electorNameEnglish}
                onEnglishChange={setElectorNameEnglish}
                fullWidth
              />
            </Box>
            
            <TextField
              label="Year of Birth"
              type="number"
              value={yearOfBirth}
              onChange={(e) => handleYearOfBirthChange(e.target.value)}
              placeholder="YYYY"
              sx={{ width: 140, alignSelf: 'flex-start' }}
            />
            
            <Typography sx={{ pt: 1, fontWeight: 500, color: 'text.secondary' }}>
              OR
            </Typography>
            
            <TextField
              label="Current Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              sx={{ width: 120, alignSelf: 'flex-start' }}
            />
          </Stack>

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Relation Details
          </Typography>

          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Relation"
                value={relationName}
                onChange={setRelationName}
                englishValue={relationNameEnglish}
                onEnglishChange={setRelationNameEnglish}
                fullWidth
              />
            </Box>
            
            <TextField
              label="Year of Birth"
              type="number"
              value={relationYearOfBirth}
              onChange={(e) => handleRelationYearOfBirthChange(e.target.value)}
              placeholder="YYYY"
              sx={{ width: 140, alignSelf: 'flex-start' }}
            />
            
            <Typography sx={{ pt: 1, fontWeight: 500, color: 'text.secondary' }}>
              OR
            </Typography>
            
            <TextField
              label="Current Age"
              type="number"
              value={relationAge}
              onChange={(e) => setRelationAge(e.target.value)}
              placeholder="Enter age"
              sx={{ width: 120, alignSelf: 'flex-start' }}
            />
          </Stack>

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Relation of Relation Details
          </Typography>

          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, minHeight: 80 }}>
              <TamilTransliteratorInput
                label="Name of the Relation of Relation"
                value={relationOfRelationName}
                onChange={setRelationOfRelationName}
                englishValue={relationOfRelationNameEnglish}
                onEnglishChange={setRelationOfRelationNameEnglish}
                fullWidth
              />
            </Box>
            
            <TextField
              label="Year of Birth"
              type="number"
              value={relationOfRelationYearOfBirth}
              onChange={(e) => handleRelationOfRelationYearOfBirthChange(e.target.value)}
              placeholder="YYYY"
              sx={{ width: 140, alignSelf: 'flex-start' }}
            />
            
            <Typography sx={{ pt: 1, fontWeight: 500, color: 'text.secondary' }}>
              OR
            </Typography>
            
            <TextField
              label="Current Age"
              type="number"
              value={relationOfRelationAge}
              onChange={(e) => setRelationOfRelationAge(e.target.value)}
              placeholder="Enter age"
              sx={{ width: 120, alignSelf: 'flex-start' }}
            />
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!selectedDistrict || !selectedConstituency}
            >
              Submit
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleClearSearch}
              disabled={
                selectedDistrict === originalDistrict && 
                selectedConstituency === originalConstituency &&
                !electorName && !yearOfBirth && !age &&
                !relationName && !relationYearOfBirth && !relationAge &&
                !relationOfRelationName && !relationOfRelationYearOfBirth && !relationOfRelationAge
              }
            >
              Clear Search
            </Button>
          </Stack>

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
