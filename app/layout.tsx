import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIR Portal - Electra",
  description: "State Incident Report Portal by Electra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeRegistry>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky" elevation={2}>
              <Toolbar sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      letterSpacing: '0.5px',
                      background: 'linear-gradient(45deg, #FFF 30%, #90CAF9 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Electra
                  </Typography>
                  <Box
                    sx={{
                      width: '2px',
                      height: '30px',
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: 500,
                      color: 'white',
                    }}
                  >
                    SIR PORTAL
                  </Typography>
                </Box>
              </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
              {children}
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
