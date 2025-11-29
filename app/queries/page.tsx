import { Container, Typography } from '@mui/material';
import QueryInterface from '@/app/components/queries/QueryInterface';

export default function QueriesPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Queries
      </Typography>
      <QueryInterface />
    </Container>
  );
}
