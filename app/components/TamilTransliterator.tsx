'use client';

import { useState, ChangeEvent, useCallback, KeyboardEvent, useEffect, useRef } from 'react';
import { TextField, TextFieldProps, Box, Stack, Typography } from '@mui/material';

// Simple transliteration function using Google Input Tools API
async function transliterateText(text: string): Promise<string> {
  if (!text.trim()) return '';
  
  try {
    const response = await fetch(
      `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ta-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`
    );
    
    const data = await response.json();
    
    if (data && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
      return data[1][0][1][0];
    }
    
    return text;
  } catch (error) {
    console.error('Transliteration error:', error);
    return text;
  }
}

interface TamilTransliteratorInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  englishValue?: string;
  onEnglishChange?: (value: string) => void;
}

export default function TamilTransliteratorInput({ 
  value, 
  onChange,
  englishValue = '',
  onEnglishChange,
  ...textFieldProps 
}: TamilTransliteratorInputProps) {

  
  console.log("Rendering TamilTransliteratorInput with value:", value, "and englishValue:", englishValue);

  const handleTextChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    console.log("handleTextChange inputText:", inputText);
    if (onEnglishChange) {
      onEnglishChange(inputText);
    }
     if(inputText.trim() === '') {
      console.log("cleared onChange")
      // bump request id to ignore any inflight transliteration responses
      requestId.current += 1;
      onChange('');
      return;
    }
    // Transliterate as user types
    if (inputText.trim()) {
      const currentId = ++requestId.current;
      const result = await transliterateText(inputText);
      // ignore if another request started after this one
      if (currentId !== requestId.current) return;
      onChange(result);
    } else {
      onChange('');
    }
    
  }, [onEnglishChange, onChange]);

  // use a ref to track the latest transliteration request so we can ignore
  // stale async responses (prevents old fetches from overwriting cleared state)
  const requestId = useRef(0);

  
  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        {...textFieldProps}
        value={englishValue}
        onChange={handleTextChange}
        disabled={  textFieldProps.disabled}
        placeholder={textFieldProps.placeholder || "Type in English..."}
        size="small"
        sx={{ width: '100%', ...textFieldProps.sx }}
      />
      {value && (
        <Typography
          sx={{
            mt: 1.5,
            px: 2.5,
            py: 1.5,
            fontSize: '0.95rem',
            fontFamily: '"Noto Sans Tamil", "Lohit Tamil", sans-serif',
            color: 'primary.dark',
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            borderRadius: 1,
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main',
            minHeight: '1.5rem',
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}
