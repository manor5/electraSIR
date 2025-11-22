"use client";
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Button,
} from '@mui/material';
import { SearchResult } from '@/app/actions/searchActions';

export default function FamilyModal(props: any) {
  const { familyModalOpen, handleCloseFamilyModal, selectedMember, familyMembers, isFamilyLoading, getRelationText, getGenderText, displayDoor, displayEpic } = props;

  return (
    <Dialog open={familyModalOpen} onClose={handleCloseFamilyModal} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Family Members</Typography>
          <IconButton onClick={handleCloseFamilyModal} size="small">
            <Typography variant="body1">✕</Typography>
          </IconButton>
        </Box>
        {selectedMember && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            For: {selectedMember.name} (Door No: {displayDoor(selectedMember.door_no)})
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isFamilyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              குறிப்பு: வாக்காளரின் குடும்ப உறுப்பினர்கள் இருக்கிறார்களா என்று தேடி சரி பார்த்து கொள்ளவும்.
            </Alert>
            {familyMembers.length > 0 ? (
              <Box sx={{ display: 'grid', justifyContent: 'center', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,48%))' }, gap: 2 }}>
                {familyMembers.map((member: SearchResult, index: number) => {
                  const matchesBooth = member.booth_no === selectedMember?.booth_no;
                  return (
                    <Paper key={member.id} elevation={1} sx={{ p: 2, boxSizing: 'border-box', width: '100%' }}>
                      <Stack spacing={0}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.25 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {index + 1}. {member.name}
                          </Typography>
                          {/* gender & age moved to the dedicated row below */}
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                          {member.relative_name && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {member.relative_name}
                            </Typography>
                          )}
                          {member.relative_name && member.relation && <Typography variant="body2" color="text.secondary">-</Typography>}
                          {member.relation && (
                            <Typography variant="body2" color="text.secondary">{getRelationText(member.relation)}</Typography>
                          )}
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                          <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Gender</Typography>
                            <Typography variant="body2" color="text.secondary">{member.gender ? getGenderText(member.gender) : '-'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', width: { xs: '100%', sm: '50%' }, justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Age</Typography>
                            <Typography variant="body2" color="text.secondary">{member.age ?? '-'}</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', width: '50%', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Sequence/வரிசை</Typography>
                            <Typography variant="body2" color="text.secondary">{member.serial_no ?? '-'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', width: '50%', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Booth</Typography>
                            <Typography variant="body2" color="text.secondary">{member.booth_no ?? '-'}</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', width: '50%', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Door No</Typography>
                            <Typography variant="body2" color="text.secondary">{displayDoor(member.door_no)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', width: '50%', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">EPIC</Typography>
                            <Typography variant="body2" color="text.secondary">{displayEpic(member.epic)}</Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No family members found
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseFamilyModal}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
