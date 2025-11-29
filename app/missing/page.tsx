import { Box, Container, Typography } from '@mui/material';
import UnmappedRecordsTable from '@/app/components/missing/UnmappedRecordsTable';

export default function MissingPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Missing Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unmapped records from batch missing data
        </Typography>
      </Box>
      <UnmappedRecordsTable />
    </Container>
  );
}
