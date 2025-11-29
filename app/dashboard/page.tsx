import { Container, Box } from '@mui/material';
import Dashboard from '@/app/components/Dashboard';

export default function DashboardPage() {
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          py: 4,
        }}
      >
        <Dashboard />
      </Box>
    </Container>
  );
}
