"use client";
import {
  Container,
  Paper,
  Box,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { genders } from '@/app/utils/preConfiguredData';
import useSearchForm from '../useSearchForm/useSearchForm';
import { displayDoor, displayEpic, getRelationText, getGenderText } from './SearchForm.utils';
import SearchFilters from '../SearchFilters/SearchFilters';
import SearchResults from '../SearchResults/SearchResults';
import FamilyModal from '../FamilyModal/FamilyModal';

export default function SearchForm() {
  const hook = useSearchForm();

  const {
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
  } = hook as any;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: { xs: 12, sm: 4 } }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ display: { xs: 'flex', sm: 'block' }, flexDirection: { xs: 'column', sm: 'column' } }}>
          <SearchFilters
            filteredConstituencies={filteredConstituencies}
            selectedConstituency={selectedConstituency}
            handleConstituencyChange={handleConstituencyChange}
            electorName={electorName}
            setElectorName={setElectorName}
            electorNameEnglish={electorNameEnglish}
            setElectorNameEnglish={setElectorNameEnglish}
            relationName={relationName}
            setRelationName={setRelationName}
            relationNameEnglish={relationNameEnglish}
            setRelationNameEnglish={setRelationNameEnglish}
            electorBoothNumber={electorBoothNumber}
            handleBoothNumberChange={handleBoothNumberChange}
            electorGender={electorGender}
            setElectorGender={setElectorGender}
            yearOfBirth={yearOfBirth}
            handleYearOfBirthChange={handleYearOfBirthChange}
            boothNumberError={boothNumberError}
            handleSubmit={handleSubmit}
            handleClearSearch={handleClearSearch}
            isSearching={isSearching}
            selectedDistrict={selectedDistrict}
            originalDistrict={originalDistrict}
            originalConstituency={originalConstituency}
            genders={genders}
            originalAge={age}
          />

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

            <SearchResults
              searchResults={searchResults}
              isMultiColumnView={isMultiColumnView}
              setIsMultiColumnView={setIsMultiColumnView}
              handleFamilyClick={handleFamilyClick}
              getRelationText={getRelationText}
              getGenderText={getGenderText}
              displayDoor={displayDoor}
              displayEpic={displayEpic}
              searchPerformed={searchPerformed}
            />
          </Box>
        </Stack>
      </Paper>

      <FamilyModal
        familyModalOpen={familyModalOpen}
        handleCloseFamilyModal={handleCloseFamilyModal}
        selectedMember={selectedMember}
        familyMembers={familyMembers}
        isFamilyLoading={isFamilyLoading}
        getRelationText={getRelationText}
        getGenderText={getGenderText}
        displayDoor={displayDoor}
        displayEpic={displayEpic}
      />
    </Container>
  );
}
