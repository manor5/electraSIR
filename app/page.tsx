'use client';

import { Container, Box } from '@mui/material';
import { useState } from 'react';
import TamilTransliterator from './components/TamilTransliterator';

export default function Home() {
  const [text, setText] = useState('');
  const [englishText, setEnglishText] = useState('');

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <TamilTransliterator 
          value={text} 
          onChange={setText}
          englishValue={englishText}
          onEnglishChange={setEnglishText}
          label="Type in English"
          fullWidth
          multiline
          rows={4}
        />
      </Box>
    </Container>
  );
}
