'use client';

import { getSavedQueries, getQueryGroups } from '@/app/actions/queryActions';

import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Menu,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export default function SavedQueriesList() {
  const [savedQueries, setSavedQueries] = useState<Array<{id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}>>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueriesSentinel, setSavedQueriesSentinel] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedQueryForMenu, setSelectedQueryForMenu] = useState<any>(null);
  const [draggedQuery, setDraggedQuery] = useState<any>(null);
  const [dragOverQuery, setDragOverQuery] = useState<any>(null);

  useEffect(() => {
    // @ts-ignore: getSavedQueries/getQueryGroups are globally available or imported elsewhere
    getSavedQueries().then(result => {
      if (result.success && result.queries) {
        setSavedQueries(result.queries);
      }
    });
    getQueryGroups().then(groupsResult => {
      if (groupsResult.success && groupsResult.groups) {
        setAvailableGroups(groupsResult.groups);
      }
    });
  }, []);

  // Utility functions for risk color (could be moved to utils)
  const getQueryRiskLevel = (query: string): 'safe' | 'moderate' | 'dangerous' => {
    const trimmed = query.trim().toLowerCase();
    const noComments = trimmed
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const dangerousKeywords = ['delete', 'drop', 'truncate', 'alter'];
    const hasDangerous = dangerousKeywords.some(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasDangerous) return 'dangerous';
    const moderateKeywords = ['insert', 'update', 'create', 'grant', 'revoke', 'merge'];
    const hasModerate = moderateKeywords.some(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasModerate) return 'moderate';
    return 'safe';
  };
  const getRiskBorderColor = (riskLevel: 'safe' | 'moderate' | 'dangerous') => {
    switch (riskLevel) {
      case 'safe': return '#4caf50';
      case 'moderate': return '#ff9800';
      case 'dangerous': return '#f44336';
    }
  };

  // Drag and drop handlers (simplified, no DB update)
  const handleDragStart = (e: React.DragEvent, query: any) => {
    e.stopPropagation();
    setDraggedQuery(query);
  };

  const handleDragEnd = () => {
    setDraggedQuery(null);
    setDragOverQuery(null);
  };

  const handleDragOver = (e: React.DragEvent, query: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverQuery(query);
  };

  const handleDragLeave = () => {
    setDragOverQuery(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuery: any) => {
    e.preventDefault();
    e.stopPropagation();
    // Reorder logic would go here
    setDraggedQuery(null);
    setDragOverQuery(null);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, query: any) => {
    setMenuAnchor(e.currentTarget);
    setSelectedQueryForMenu(query);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedQueryForMenu(null);
  };

  return (
      <Paper elevation={2} sx={{ p: 3, background: '#fafbfc' }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Authorization Code"
            type="password"
            fullWidth
            value={savedQueriesSentinel}
            onChange={(e) => setSavedQueriesSentinel(e.target.value)}
            placeholder="Enter authorization code"
            helperText="Required to load and view saved queries"
          />
          <FormControl fullWidth>
            <InputLabel>Filter by Group</InputLabel>
            <Select
              value={selectedGroupFilter || ''}
              label="Filter by Group"
              onChange={(e) => setSelectedGroupFilter(e.target.value || null)}
            >
              <MenuItem value="">Ungrouped</MenuItem>
              {availableGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Search queries"
            placeholder="Search by name or query text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Stack>
        {savedQueries
          .filter(q => q.groupName === selectedGroupFilter)
          .filter(q => {
            if (!searchQuery.trim()) return true;
            const search = searchQuery.toLowerCase();
            return q.name.toLowerCase().includes(search) || 
                   q.query.toLowerCase().includes(search);
          }).length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery.trim() 
                ? 'No queries match your search' 
                : selectedGroupFilter === null 
                  ? 'No ungrouped queries' 
                  : `No queries in "${selectedGroupFilter}" group`}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {savedQueries
              .filter(q => q.groupName === selectedGroupFilter)
              .filter(q => {
                if (!searchQuery.trim()) return true;
                const search = searchQuery.toLowerCase();
                return q.name.toLowerCase().includes(search) || 
                       q.query.toLowerCase().includes(search);
              })
              .map((savedQuery, index, array) => {
                const groupQueries = savedQueries.filter(q => q.groupName === selectedGroupFilter);
                const groupIndex = groupQueries.findIndex(q => q.id === savedQuery.id);
                const isFirst = groupIndex === 0;
                const isLast = groupIndex === groupQueries.length - 1;
                const isDragging = draggedQuery?.id === savedQuery.id;
                const isDropTarget = dragOverQuery?.id === savedQuery.id;
                const showDropIndicator = isDropTarget;
                const isDropAbove = false; // Drop position indicator (can be enhanced with mouse position logic)
                // ...existing code...
                return (
                  <ListItem
                    key={savedQuery.id}
                    // ...existing code...
                    sx={{
                      position: 'relative',
                      opacity: isDragging ? 0.4 : 1,
                      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                      backgroundColor: isDropTarget ? 'primary.light' : 'transparent',
                      borderTop: showDropIndicator && isDropAbove ? '1px solid #bdbdbd' : 'none',
                      borderBottom: showDropIndicator && !isDropAbove ? '1px solid #bdbdbd' : 'none',
                      borderColor: '#bdbdbd',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: isDragging ? 'transparent' : 'rgba(25, 118, 210, 0.12)',
                        boxShadow: isDragging ? 'none' : '0 0 0 2px rgba(33, 150, 243, 0.18)',
                        borderColor: isDragging ? '#bdbdbd' : '#2196f3',
                        zIndex: 2,
                      },
                      p: 0,
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      background: isDropTarget ? 'rgba(25, 118, 210, 0.08)' : '#fff',
                    }}
                    // ...existing code...
                  >
                    {/* ...existing code... */}
                  </ListItem>
                );
              })}
          </List>
        )}
        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          {/* ...existing code... */}
        </Menu>
      </Paper>
    );
}
