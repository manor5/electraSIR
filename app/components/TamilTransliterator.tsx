'use client';

import { useState, ChangeEvent, useCallback, KeyboardEvent } from 'react';
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
  const [currentText, setCurrentText] = useState('');
  const [isTransliterating, setIsTransliterating] = useState(false);
  console.log({ englishValue,value, currentText });

  const performTransliteration = useCallback(async (text: string) => {
    if (!text || !text.trim()) {
      return;
    }

    setIsTransliterating(true);
    try {
      const result = await transliterateText(text);
      // Append to existing Tamil text with a space
      onChange(value + (value ? ' ' : '') + result);
      if (onEnglishChange) {
        onEnglishChange(englishValue + text + ' ');
      }
      setCurrentText('');
    } catch (error) {
      console.error('Error during transliteration:', error);
    } finally {
      setIsTransliterating(false);
    }
  }, [onChange, value, onEnglishChange, englishValue]);

  const handleTextChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    
    if (onEnglishChange) {
      onEnglishChange(inputText);
    }
    
    // Transliterate as user types
    if (inputText.trim()) {
      const result = await transliterateText(inputText);
      onChange(result);
    } else {
      onChange('');
    }
    
    setCurrentText('');
  }, [onEnglishChange, onChange]);

  const handleKeyDown = useCallback(async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      const text = currentText?.trim();
      if (text) {
        await performTransliteration(text);
      }
    }
  }, [currentText, performTransliteration]);

  const handleBlur = useCallback(async () => {
    if (currentText && currentText.trim()) {
      await performTransliteration(currentText);
    }
  }, [currentText, performTransliteration]);

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        {...textFieldProps}
        value={englishValue}
        onChange={handleTextChange}
        disabled={isTransliterating || textFieldProps.disabled}
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
