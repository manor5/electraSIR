'use client';

import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Stack,
  Paper,
  alpha,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RouteCard {
  title: string;
  description: string;
  path: string;
  icon: string;
  color: string;
  gradient: string;
}

export default function Dashboard() {
  const router = useRouter();

  const routes: RouteCard[] = [
    {
      title: 'Electoral Search',
      description: 'Search for voters by name, relative name, booth number, and other criteria',
      path: '/19/166/1',
      icon: 'SearchIcon',
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Missing Records',
      description: 'Review and map unmapped records from batch missing data',
      path: '/missing',
      icon: 'DescriptionIcon',
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Database Queries',
      description: 'Execute SQL queries and build queries with interactive tools',
      path: '/queries',
      icon: 'StorageIcon',
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Statistics',
      description: 'View analytics and statistics for electoral data',
      path: '/stats',
      icon: 'BarChartIcon',
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  const handleCardClick = (path: string) => {
    router.push(path);
  };

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
        {/* Home Navigation Button */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<span style={{ fontSize: '1.1rem' }}>←</span>}
            sx={{
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#667eea',
              borderColor: '#e2e8f0',
              borderRadius: '50px',
              textTransform: 'none',
              background: 'white',
              '&:hover': {
                borderColor: '#667eea',
                background: '#f8f9ff',
                transform: 'translateX(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Back to Home
          </Button>
        </Box>

        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Electoral Data Management
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#64748b',
              fontWeight: 400,
              fontSize: { xs: '1.1rem', md: '1.5rem' },
            }}
          >
            Select a module to get started
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 4,
            mb: 8,
          }}
        >
          {routes.map((route) => (
            <Card
              key={route.path}
              sx={{
                height: '100%',
                background: 'white',
                backdropFilter: 'none',
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 48px rgba(102, 126, 234, 0.2)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleCardClick(route.path)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    background: route.gradient,
                    color: 'white',
                    py: 6,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '16px 16px 0 0',
                  }}
                >
                  {route.icon === 'SearchIcon' && <SearchIcon sx={{ fontSize: 80 }} />}
                  {route.icon === 'DescriptionIcon' && <DescriptionIcon sx={{ fontSize: 80 }} />}
                  {route.icon === 'StorageIcon' && <StorageIcon sx={{ fontSize: 80 }} />}
                  {route.icon === 'BarChartIcon' && <BarChartIcon sx={{ fontSize: 80 }} />}
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                    }}
                  >
                    {route.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {route.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 8,
            pt: 6,
            pb: 4,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              mb: 1,
              fontSize: '0.9rem',
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
