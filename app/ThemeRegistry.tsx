'use client';
import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from './theme';
import { GlobalStyles } from '@mui/material';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            '*': {
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
            },
            'html, body': {
              margin: '0 !important',
              padding: '0 !important',
              width: '100%',
              height: '100%',
              overflowX: 'hidden',
            },
            '#__next': {
              margin: 0,
              padding: 0,
            },
          }}
        />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
