"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { districts, constituencies } from '@/app/utils/preConfiguredData';
import { searchElectors, SearchResult, searchFamilyMembers, incrementOperationCounter } from '@/app/actions/searchActions';
import { getRelationText, getGenderText } from '../SearchForm/SearchForm.utils';
import { useInitializeFromParams, useSyncEnglishClears } from './useSearchForm.hooks';

export default function useSearchForm() {
  const params = useParams();

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [filteredConstituencies, setFilteredConstituencies] = useState(constituencies);

  const [originalDistrict, setOriginalDistrict] = useState('');
  const [originalConstituency, setOriginalConstituency] = useState('');

  const [electorName, setElectorName] = useState('');
  const [electorNameEnglish, setElectorNameEnglish] = useState('');
  const [electorBoothNumber, setElectorBoothNumber] = useState('');
  const [electorGender, setElectorGender] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [age, setAge] = useState('');

  const [relationName, setRelationName] = useState('');
  const [relationNameEnglish, setRelationNameEnglish] = useState('');
  

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string>('');
  const [isMultiColumnView, setIsMultiColumnView] = useState(false);
  const [boothNumberError, setBoothNumberError] = useState<string>('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const [familyMembers, setFamilyMembers] = useState<SearchResult[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  // Initialize state from URL params (kept in a focused hook)
  useInitializeFromParams(
    params,
    setSelectedDistrict,
    setOriginalDistrict,
    setFilteredConstituencies,
    setSelectedConstituency,
    setOriginalConstituency,
  );

  // Clear Tamil fields when their English counterparts are emptied
  useSyncEnglishClears(electorNameEnglish, setElectorName, relationNameEnglish, setRelationName);

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedConstituency('');
    const filtered = constituencies.filter(c => c.districtId === parseInt(districtId));
    setFilteredConstituencies(filtered);
  };

  const handleConstituencyChange = (constituencyId: string) => {
    setSelectedConstituency(constituencyId);
    // If constituency is not Tiruchirapalli II (id 166), clear birth-year and derived age
    if (constituencyId !== '166') {
      setYearOfBirth('');
      setAge('');
    }
  };

  // Note: age reference year is 2005 for Tiruchirapalli II (id 166)
  const getAgeLabel = () => selectedConstituency === '166' ? 'Age at 2005' : 'Age at 2002';

  const calculateAgeFromYear = (year: string) => {
    if (!year) return '';
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(year);
    if (isNaN(birthYear) || birthYear > currentYear) return '';
    return (currentYear - birthYear).toString();
  };

  const handleYearOfBirthChange = (value: string) => {
    setYearOfBirth(value);
    setAge(calculateAgeFromYear(value));
  };



  const handleClearSearch = () => {
    setSelectedDistrict(originalDistrict);
    setSelectedConstituency(originalConstituency);
    setElectorName('');
    setElectorNameEnglish('');
    setElectorBoothNumber('');
    setElectorGender('');
    setYearOfBirth('');
    setAge('');
    setRelationName('');
    setRelationNameEnglish('');
    setSearchResults([]);
    setSearchError('');
    setBoothNumberError('');
    setSearchPerformed(false);
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
        boothNo: member.booth_no,
        relativeName: member.relative_name,
        memberName: member.name,
        constituencyId: selectedConstituency,
      });

      if (result.success && result.data) {
        let filteredFamily = result.data.filter(familyMember => familyMember.id !== member.id);
        const selectedRelation = member.relation;
        if (selectedRelation) {
          const isHusband = ['H', 'க', 'கா', 'ka'].includes(selectedRelation) || getRelationText(selectedRelation) === 'கணவர்';
          const isWife = ['W', 'ம', 'ma'].includes(selectedRelation) || getRelationText(selectedRelation) === 'மனைவி';
          if (isHusband || isWife) {
            filteredFamily = filteredFamily.filter(familyMember => {
              const familyRelation = familyMember.relation;
              if (!familyRelation) return true;
              const isFamilyHusband = ['H', 'க', 'கா', 'ka'].includes(familyRelation) || getRelationText(familyRelation) === 'கணவர்';
              const isFamilyWife = ['W', 'ம', 'ma'].includes(familyRelation) || getRelationText(familyRelation) === 'மனைவி';
              if (isHusband) {
                return !isFamilyHusband;
              } else {
                return !isFamilyWife;
              }
            });
          }
        }

        filteredFamily.sort((a, b) => {
          const aMatchesBooth = a.booth_no === member.booth_no;
          const bMatchesBooth = b.booth_no === member.booth_no;
          if (aMatchesBooth && !bMatchesBooth) return -1;
          if (!aMatchesBooth && bMatchesBooth) return 1;
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

    let cleanedBoothNumber = electorBoothNumber;
    if (electorBoothNumber) {
      const boothNumbers = electorBoothNumber.split(',').map(b => b.trim());
      const invalidBooths = boothNumbers.filter(b => {
        if (b === '') return false;
        const num = parseInt(b);
        return isNaN(num) || num.toString() !== b;
      });
      if (invalidBooths.length > 0) {
        setBoothNumberError('Invalid format. Use numbers separated by commas (e.g., 1, 2, 3)');
        return;
      }
      const validBooths = boothNumbers.filter(b => b !== '' && !isNaN(parseInt(b)));
      cleanedBoothNumber = validBooths.join(', ');
    }

    setBoothNumberError('');
    const searchParams = {
        name: electorName || undefined,
        relativeName: relationName || undefined,
        boothNumber: cleanedBoothNumber || undefined,
        gender: electorGender || undefined,
        age: age ? parseInt(age) : undefined,
        constituencyId: selectedConstituency || undefined,
        birthYear: yearOfBirth || undefined,
      }

    incrementOperationCounter(searchParams).catch(err => console.error('Counter increment failed:', err));

    setSearchError('');
    setSearchResults([]);
    setSearchPerformed(false);
    setIsSearching(true);

    try {
      const result = await searchElectors(searchParams);

      if (result.success && result.data) {
        const searchNameRaw = (electorName || electorNameEnglish || '').trim();
        if (searchNameRaw !== '') {
          const searchName = searchNameRaw.toLowerCase();
          const exactMatches = result.data.filter(r => (r.name || '').trim().toLowerCase() === searchName);
          const others = result.data.filter(r => (r.name || '').trim().toLowerCase() !== searchName);
          setSearchResults([...exactMatches, ...others]);
        } else {
          setSearchResults(result.data);
        }
        setSearchPerformed(true);
      } else {
        setSearchError(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    // state
    selectedDistrict,
    selectedConstituency,
    filteredConstituencies,
    originalDistrict,
    originalConstituency,
    electorName,
    electorNameEnglish,
    electorBoothNumber,
    electorGender,
    yearOfBirth,
    age,
    relationName,
    relationNameEnglish,
    isSearching,
    searchResults,
    searchError,
    isMultiColumnView,
    boothNumberError,
    searchPerformed,
    familyModalOpen,
    selectedMember,
    familyMembers,
    isFamilyLoading,
    // setters / handlers
    setElectorName,
    setElectorNameEnglish,
    setElectorGender,
    setRelationName,
    setRelationNameEnglish,
    
    handleDistrictChange,
    handleConstituencyChange,
    handleBoothNumberChange,
    handleYearOfBirthChange,
    handleSubmit,
    handleClearSearch,
    handleFamilyClick,
    handleCloseFamilyModal,
    setIsMultiColumnView,
    getRelationText,
    getGenderText,
  };
}
