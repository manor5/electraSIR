'use client';

import { Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      title: '🔎 Smart Search',
      description: 'Advanced electoral data search with multi-parameter filtering and fuzzy matching',
    },
    {
      title: '📝 Record Management',
      description: 'Review and map unmapped records with Tamil transliteration support',
    },
    {
      title: '⚙️ Query Tools',
      description: 'Execute SQL queries or build them visually with an intuitive interface',
    },
    {
      title: '📈 Analytics',
      description: 'Track search statistics and gain insights from your electoral data',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: '#f5f7fa',
        position: 'relative',
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 4, position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
            mt: 6,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              fontSize: { xs: '3rem', md: '4.5rem' },
              mb: 3,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Electoral Data Management
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: '#64748b',
              fontWeight: 400,
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.2rem', md: '1.5rem' },
            }}
          >
            A comprehensive platform for managing, searching, and analyzing electoral records with advanced mapping capabilities
          </Typography>
          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '50px',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              border: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Go to Dashboard
          </Button>
        </Box>

        {/* Features Grid */}
        <Box sx={{ mb: 8, maxWidth: '1200px', mx: 'auto', px: 3 }}>
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              mb: 5,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Key Features
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 48px rgba(102, 126, 234, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      fontSize: '1.3rem',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Stats Section */}
        <Box
          sx={{
            textAlign: 'center',
            background: 'white',
            borderRadius: '20px',
            p: 5,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            maxWidth: '1200px',
            mx: 'auto',
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              mb: 4,
            }}
          >
            Powering Electoral Data Management
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            sx={{ justifyContent: 'center' }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Tamil
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b' }}
              >
                Language Support
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Real-time
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b' }}
              >
                Data Updates
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Secure
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b' }}
              >
                Database Access
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 8,
            pt: 6,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            maxWidth: '1200px',
            mx: 'auto',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              mb: 1,
            }}
          >
            Electoral Data Management System
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}
          >
            © {new Date().getFullYear()} All rights reserved | Built with Next.js & Material-UI
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
