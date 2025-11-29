'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Autocomplete,
  ListSubheader,
  Menu,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { executeQuery, getTables, getTableColumns, saveQuery, getSavedQueries, deleteSavedQuery, getQueryGroups, importCsvData, updateSavedQuery, updateQueryOrder } from '@/app/actions/queryActions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`query-tabpanel-${index}`}
      aria-labelledby={`query-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function QueryInterface() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Execute Query tab state
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');
  const [executeSentinel, setExecuteSentinel] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Query Builder tab state
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [queryType, setQueryType] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT'>('SELECT');
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, string>>({});
  const [whereClause, setWhereClause] = useState('');
  const [limitValue, setLimitValue] = useState('100');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [filePath, setFilePath] = useState('');
  
  // Saved queries state
  const [savedQueries, setSavedQueries] = useState<Array<{id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}>>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryGroup, setQueryGroup] = useState<string>('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueriesSentinel, setSavedQueriesSentinel] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<{id: number, name: string, query: string, groupName: string | null} | null>(null);
  const [editQueryName, setEditQueryName] = useState('');
  const [editQueryText, setEditQueryText] = useState('');
  const [editQueryGroup, setEditQueryGroup] = useState<string>('');
  const [editQueryOrder, setEditQueryOrder] = useState<number>(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedQueryForMenu, setSelectedQueryForMenu] = useState<{id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number} | null>(null);
  
  // Drag and drop state
  const [draggedQuery, setDraggedQuery] = useState<{id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number} | null>(null);
  const [dragOverQuery, setDragOverQuery] = useState<{id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number} | null>(null);
  
  // CSV Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTable, setUploadTable] = useState('');
  const [uploadColumns, setUploadColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadSentinel, setUploadSentinel] = useState('');

  useEffect(() => {
    loadTables();
    loadSavedQueries();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadColumns(selectedTable);
    }
  }, [selectedTable]);

  // Utility function to determine query risk level
  const getQueryRiskLevel = (query: string): 'safe' | 'moderate' | 'dangerous' => {
    const trimmed = query.trim().toLowerCase();
    
    // Remove comments for better parsing
    const noComments = trimmed
      .replace(/--[^\n]*/g, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Dangerous operations (red)
    const dangerousKeywords = ['delete', 'drop', 'truncate', 'alter'];
    const hasDangerous = dangerousKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasDangerous) {
      return 'dangerous';
    }
    
    // Moderate operations (yellow) - INSERT, UPDATE, CREATE, etc.
    const moderateKeywords = ['insert', 'update', 'create', 'grant', 'revoke', 'merge'];
    const hasModerate = moderateKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(noComments)
    );
    if (hasModerate) {
      return 'moderate';
    }
    
    // Safe operations (green) - SELECT, WITH, SHOW, EXPLAIN, etc.
    return 'safe';
  };

  const getRiskColor = (riskLevel: 'safe' | 'moderate' | 'dangerous') => {
    switch (riskLevel) {
      case 'safe':
        return '#e8f5e9'; // light green
      case 'moderate':
        return '#fff8e1'; // light yellow
      case 'dangerous':
        return '#ffebee'; // light red
    }
  };

  const getRiskBorderColor = (riskLevel: 'safe' | 'moderate' | 'dangerous') => {
    switch (riskLevel) {
      case 'safe':
        return '#4caf50'; // green
      case 'moderate':
        return '#ff9800'; // orange
      case 'dangerous':
        return '#f44336'; // red
    }
  };

  const loadTables = async () => {
    const result = await getTables();
    if (result.success && result.tables) {
      setTables(result.tables);
    }
  };

  const loadColumns = async (tableName: string) => {
    const result = await getTableColumns(tableName);
    if (result.success && result.columns) {
      setColumns(result.columns);
      setSelectedColumns([]);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setQueryError('Please enter a query');
      return;
    }

    setExecuting(true);
    setQueryError('');
    setQueryResult(null);

    try {
      // Check if query is non-SELECT and requires authorization
      const trimmedQuery = query.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') || 
                           trimmedQuery.startsWith('with') || 
                           trimmedQuery.startsWith('show') ||
                           trimmedQuery.startsWith('explain');
      
      if (!isSelectQuery) {
        // Check authorization code
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setExecuting(false);
          return;
        }
      }
      
      const result = await executeQuery(query);
      
      if (result.success && result.data) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      console.error('Query execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleGenerateQuery = () => {
    if (!selectedTable) {
      return;
    }

    let query = '';

    switch (queryType) {
      case 'SELECT':
        const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
        query = `SELECT ${cols}\nFROM ${selectedTable}`;
        
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        }
        
        if (limitValue) {
          query += `\nLIMIT ${limitValue}`;
        }
        break;

      case 'INSERT':
        const insertCols = selectedColumns.filter(col => columnValues[col]);
        if (insertCols.length === 0) {
          setQueryError('Please provide values for at least one column');
          return;
        }
        const insertValues = insertCols.map(col => {
          const value = columnValues[col];
          // Simple check for numeric values
          return isNaN(Number(value)) ? `'${value}'` : value;
        });
        query = `INSERT INTO ${selectedTable} (${insertCols.join(', ')})\nVALUES (${insertValues.join(', ')})`;
        break;

      case 'UPDATE':
        const updateCols = selectedColumns.filter(col => columnValues[col]);
        if (updateCols.length === 0) {
          setQueryError('Please provide values for at least one column');
          return;
        }
        const setClauses = updateCols.map(col => {
          const value = columnValues[col];
          const formattedValue = isNaN(Number(value)) ? `'${value}'` : value;
          return `${col} = ${formattedValue}`;
        });
        query = `UPDATE ${selectedTable}\nSET ${setClauses.join(', ')}`;
        
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        } else {
          setQueryError('WHERE clause is required for UPDATE operations');
          return;
        }
        break;

      case 'DELETE':
        query = `DELETE FROM ${selectedTable}`;
        
        if (whereClause.trim()) {
          query += `\nWHERE ${whereClause.trim()}`;
        } else {
          setQueryError('WHERE clause is required for DELETE operations');
          return;
        }
        break;

      case 'EXPORT':
        if (!filePath.trim()) {
          setQueryError('File path is required for EXPORT operations');
          return;
        }
        const exportCols = selectedColumns.length > 0 ? selectedColumns : columns.map(c => c.name);
        query = `COPY ${selectedTable} (\n  ${exportCols.join(',\n  ')}\n)\nFROM '${filePath}'\nWITH (\n  FORMAT csv,\n  HEADER true,\n  ENCODING 'UTF8'\n);`;
        break;
    }

    setGeneratedQuery(query);
    setQueryError('');
  };

  const handleExecuteGeneratedQuery = async () => {
    setQuery(generatedQuery);
    setActiveTab(0);
    
    // Execute the query after a short delay
    setTimeout(async () => {
      setExecuting(true);
      setQueryError('');
      setQueryResult(null);

      try {
        const result = await executeQuery(generatedQuery);
        
        if (result.success && result.data) {
          setQueryResult(result.data);
        } else {
          setQueryError(result.error || 'Query execution failed');
        }
      } catch (err) {
        setQueryError('An error occurred while executing the query');
        console.error('Query execution error:', err);
      } finally {
        setExecuting(false);
      }
    }, 100);
  };

  const toggleColumn = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName)
        ? prev.filter((col) => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCSV = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) return;

    // Create CSV content
    const columns = queryResult.columns;
    const rows = queryResult.rows;

    // Header row
    const csvHeader = columns.join(',');

    // Data rows
    const csvRows = rows.map((row: any) => {
      return columns.map((col: string) => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        
        // Escape values that contain commas, quotes, or newlines
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectDownloadCSV = async () => {
    if (!query.trim()) {
      setQueryError('Please enter a query');
      return;
    }

    setDownloading(true);
    setQueryError('');

    try {
      // Check if query is non-SELECT and requires authorization
      const trimmedQuery = query.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') || 
                           trimmedQuery.startsWith('with') || 
                           trimmedQuery.startsWith('show') ||
                           trimmedQuery.startsWith('explain');
      
      if (!isSelectQuery) {
        // Check authorization code
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setDownloading(false);
          return;
        }
      }
      
      const result = await executeQuery(query);
      
      if (result.success && result.data) {
        // Create CSV and download without displaying
        const columns = result.data.columns;
        const rows = result.data.rows;

        if (rows.length === 0) {
          setQueryError('Query returned no results');
          setDownloading(false);
          return;
        }

        // Header row
        const csvHeader = columns.join(',');

        // Data rows
        const csvRows = rows.map((row: any) => {
          return columns.map((col: string) => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            
            // Escape values that contain commas, quotes, or newlines
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',');
        });

        const csvContent = [csvHeader, ...csvRows].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      console.error('Query execution error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const loadSavedQueries = async () => {
    const result = await getSavedQueries();
    if (result.success && result.queries) {
      setSavedQueries(result.queries);
    }
    
    const groupsResult = await getQueryGroups();
    if (groupsResult.success && groupsResult.groups) {
      setAvailableGroups(groupsResult.groups);
    }
  };

  const handleSaveQuery = async () => {
    if (!queryName.trim() || !generatedQuery) return;
    
    const result = await saveQuery(queryName.trim(), generatedQuery, queryGroup || undefined);
    
    if (result.success) {
      await loadSavedQueries();
      setQueryName('');
      setQueryGroup('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadQuery = (savedQuery: {id: number, name: string, query: string, groupName: string | null, createdAt: Date}) => {
    // Validate authorization code
    if (savedQueriesSentinel !== '#mano') {
      alert('You do not have permission to load saved queries.');
      return;
    }
    
    setQuery(savedQuery.query);
    setGeneratedQuery(savedQuery.query);
    setActiveTab(0);
  };

  const handleDeleteQuery = async (id: number) => {
    const result = await deleteSavedQuery(id);
    if (result.success) {
      await loadSavedQueries();
    }
  };

  const handleEditQuery = (savedQuery: {id: number, name: string, query: string, groupName: string | null, displayOrder?: number}) => {
    setEditingQuery(savedQuery);
    setEditQueryName(savedQuery.name);
    setEditQueryText(savedQuery.query);
    setEditQueryGroup(savedQuery.groupName || '');
    setEditQueryOrder(savedQuery.displayOrder || 0);
    setEditDialogOpen(true);
  };

  const handleUpdateQuery = async () => {
    if (!editingQuery || !editQueryName.trim() || !editQueryText.trim()) return;
    
    const result = await updateSavedQuery(
      editingQuery.id,
      editQueryName.trim(),
      editQueryText.trim(),
      editQueryGroup || undefined
    );
    
    if (result.success) {
      // Update display order if changed
      await updateQueryOrder(editingQuery.id, editQueryOrder);
      await loadSavedQueries();
      setEditDialogOpen(false);
      setEditingQuery(null);
      setEditQueryName('');
      setEditQueryText('');
      setEditQueryGroup('');
      setEditQueryOrder(0);
    } else {
      alert('Failed to update query: ' + result.error);
    }
  };


  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, query: {id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}) => {
    e.stopPropagation();
    setDraggedQuery(query);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(query));
    // Prevent text selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  const handleDragOver = (e: React.DragEvent, query: {id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedQuery && draggedQuery.id !== query.id && draggedQuery.groupName === query.groupName) {
      setDragOverQuery(query);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverQuery(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetQuery: {id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverQuery(null);
    
    if (!draggedQuery || draggedQuery.id === targetQuery.id) {
      setDraggedQuery(null);
      return;
    }

    // Only allow reordering within the same group
    if (draggedQuery.groupName !== targetQuery.groupName) {
      alert('Cannot move queries between different groups');
      setDraggedQuery(null);
      return;
    }

    // Get all queries in the same group, sorted by display order
    const groupQueries = savedQueries
      .filter(q => q.groupName === draggedQuery.groupName)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    const draggedIndex = groupQueries.findIndex(q => q.id === draggedQuery.id);
    const targetIndex = groupQueries.findIndex(q => q.id === targetQuery.id);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedQuery(null);
      return;
    }

    // Optimistically update UI
    const reorderedQueries = [...groupQueries];
    const [draggedItem] = reorderedQueries.splice(draggedIndex, 1);
    reorderedQueries.splice(targetIndex, 0, draggedItem);

    // Update display_order for optimistic UI
    const updatedQueries = reorderedQueries.map((q, i) => ({ ...q, displayOrder: i }));
    const otherQueries = savedQueries.filter(q => q.groupName !== draggedQuery.groupName);
    setSavedQueries([...otherQueries, ...updatedQueries].sort((a, b) => {
      if (a.groupName === null && b.groupName !== null) return 1;
      if (a.groupName !== null && b.groupName === null) return -1;
      if (a.groupName !== b.groupName) return (a.groupName || '').localeCompare(b.groupName || '');
      return a.displayOrder - b.displayOrder;
    }));
    setDraggedQuery(null);

    // Update database in background
    try {
      for (let i = 0; i < reorderedQueries.length; i++) {
        const result = await updateQueryOrder(reorderedQueries[i].id, i);
        if (!result.success) {
          throw new Error('Failed to update query order');
        }
      }
    } catch (error) {
      // Revert on error
      console.error('Failed to update order:', error);
      await loadSavedQueries();
      alert('Failed to update order. Changes have been reverted.');
    }

    await loadSavedQueries();
    setDraggedQuery(null);
  };

  const handleDragEnd = () => {
    setDraggedQuery(null);
    setDragOverQuery(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, savedQuery: {id: number, name: string, query: string, groupName: string | null, createdAt: Date, displayOrder: number}) => {
    setMenuAnchor(event.currentTarget);
    setSelectedQueryForMenu(savedQuery);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedQueryForMenu(null);
  };

  const handleExecuteSavedQuery = async () => {
    if (!selectedQueryForMenu) return;
    handleMenuClose();
    
    // Load query to Execute Query tab
    setQuery(selectedQueryForMenu.query);
    setActiveTab(0);
    
    // Execute it automatically
    setTimeout(async () => {
      setExecuting(true);
      setQueryError('');
      setQueryResult(null);

      try {
        const trimmedQuery = selectedQueryForMenu.query.trim().toLowerCase();
        const isSelectQuery = trimmedQuery.startsWith('select') || 
                             trimmedQuery.startsWith('with') || 
                             trimmedQuery.startsWith('show') ||
                             trimmedQuery.startsWith('explain');
        
        if (!isSelectQuery) {
          if (executeSentinel !== '#mano') {
            setQueryError('You do not have permission for this operation.');
            setExecuting(false);
            return;
          }
        }
        
        const result = await executeQuery(selectedQueryForMenu.query);
        
        if (result.success && result.data) {
          setQueryResult(result.data);
        } else {
          setQueryError(result.error || 'Query execution failed');
        }
      } catch (err) {
        setQueryError('An error occurred while executing the query');
        console.error('Query execution error:', err);
      } finally {
        setExecuting(false);
      }
    }, 100);
  };

  const handleDownloadSavedQueryAsCSV = async () => {
    if (!selectedQueryForMenu) return;
    const queryToExecute = selectedQueryForMenu.query;
    handleMenuClose();
    
    setDownloading(true);
    setQueryError('');

    try {
      const trimmedQuery = queryToExecute.trim().toLowerCase();
      const isSelectQuery = trimmedQuery.startsWith('select') || 
                           trimmedQuery.startsWith('with') || 
                           trimmedQuery.startsWith('show') ||
                           trimmedQuery.startsWith('explain');
      
      if (!isSelectQuery) {
        if (executeSentinel !== '#mano') {
          setQueryError('You do not have permission for this operation.');
          setDownloading(false);
          return;
        }
      }
      
      const result = await executeQuery(queryToExecute);
      
      if (result.success && result.data) {
        const columns = result.data.columns;
        const rows = result.data.rows;

        if (rows.length === 0) {
          setQueryError('Query returned no results');
          setDownloading(false);
          return;
        }

        const csvHeader = columns.join(',');
        const csvRows = rows.map((row: any) => {
          return columns.map((col: string) => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',');
        });

        const csvContent = [csvHeader, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedQueryForMenu.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setQueryError('An error occurred while executing the query');
      console.error('Query execution error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTable) {
      setUploadResult('Please select both a file and a table');
      return;
    }

    // Check sentinel
    if (uploadSentinel !== '#mano') {
      setUploadResult('You do not have permission for this operation.');
      return;
    }

    setUploading(true);
    setUploadResult('');

    try {
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setUploadResult('Error: File must have at least a header row and one data row');
        setUploading(false);
        return;
      }

      // Parse CSV header
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["|']|["|']$/g, ''));
      
      // Parse data rows
      const dataRows: string[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["|']|["|']$/g, ''));
        if (values.length === headers.length) {
          dataRows.push(values);
        }
      }

      if (dataRows.length === 0) {
        setUploadResult('Error: No valid data rows found');
        setUploading(false);
        return;
      }

      // Import data
      const result = await importCsvData(uploadTable, headers, dataRows);
      
      if (result.success) {
        setUploadResult(`Success! Inserted ${result.insertedCount} rows into ${uploadTable}.\n\nTotal rows in CSV: ${dataRows.length}\nSuccessfully inserted: ${result.insertedCount}`);
      } else {
        setUploadResult(`Error: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`Error: ${error instanceof Error ? error.message : 'Failed to process file'}`);
    } finally {
      setUploading(false);
    }
  };

  const loadUploadTableColumns = async (tableName: string) => {
    const result = await getTableColumns(tableName);
    if (result.success && result.columns) {
      setUploadColumns([]);
    }
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Execute Query" />
        <Tab label="Query Builder" />
        <Tab label="Saved Queries" />
        <Tab label="CSV Upload" />
      </Tabs>

      {/* Execute Query Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ p: 3 }}>
          <TextField
            multiline
            rows={8}
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: query.trim() ? getRiskColor(getQueryRiskLevel(query)) : 'transparent',
                borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
                '& fieldset': {
                  borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
                  borderWidth: '2px',
                },
                '&:hover fieldset': {
                  borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
                },
                '&.Mui-focused fieldset': {
                  borderColor: query.trim() ? getRiskBorderColor(getQueryRiskLevel(query)) : undefined,
                },
              },
            }}
          />
          
          <TextField
            label="Authorization Code (Required for non-SELECT queries)"
            type="password"
            fullWidth
            value={executeSentinel}
            onChange={(e) => setExecuteSentinel(e.target.value)}
            placeholder="Enter authorization code"
            helperText="Only required for INSERT, UPDATE, DELETE operations"
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleExecuteQuery}
              disabled={executing || downloading}
            >
              {executing ? <CircularProgress size={24} /> : 'Execute Query'}
            </Button>
            
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDirectDownloadCSV}
              disabled={executing || downloading}
            >
              {downloading ? <CircularProgress size={24} /> : 'Download CSV'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => {
                setGeneratedQuery(query);
                setSaveDialogOpen(true);
              }}
              disabled={!query.trim()}
            >
              Save Query
            </Button>
          </Stack>

          {queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {queryError}
            </Alert>
          )}

          {queryResult && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                  Results ({queryResult.rowCount} rows)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCSV}
                  disabled={!queryResult.rows || queryResult.rows.length === 0}
                >
                  Download CSV
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {queryResult.columns.map((col: string) => (
                        <TableCell key={col}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.rows.map((row: any, index: number) => (
                      <TableRow key={index}>
                        {queryResult.columns.map((col: string) => (
                          <TableCell key={col}>
                            {row[col] !== null && row[col] !== undefined 
                              ? String(row[col]) 
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Query Builder Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Query Type</InputLabel>
              <Select
                value={queryType}
                label="Query Type"
                onChange={(e) => {
                  setQueryType(e.target.value as any);
                  setSelectedColumns([]);
                  setColumnValues({});
                  setGeneratedQuery('');
                  setFilePath('');
                }}
              >
                <MenuItem value="SELECT">SELECT</MenuItem>
                <MenuItem value="INSERT">INSERT</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="EXPORT">EXPORT (COPY FROM)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Table</InputLabel>
              <Select
                value={selectedTable}
                label="Select Table"
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {tables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTable && (
              <>
                {queryType === 'SELECT' && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Columns (click to toggle):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {columns.map((col) => (
                        <Chip
                          key={col.name}
                          label={`${col.name} (${col.type})`}
                          onClick={() => toggleColumn(col.name)}
                          color={selectedColumns.includes(col.name) ? 'primary' : 'default'}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                    {selectedColumns.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No columns selected - will use SELECT *
                      </Typography>
                    )}
                  </Box>
                )}

                {queryType === 'EXPORT' && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Columns to Export (click to toggle):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {columns.map((col) => (
                        <Chip
                          key={col.name}
                          label={`${col.name} (${col.type})`}
                          onClick={() => toggleColumn(col.name)}
                          color={selectedColumns.includes(col.name) ? 'primary' : 'default'}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                    {selectedColumns.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No columns selected - will use all columns
                      </Typography>
                    )}
                  </Box>
                )}

                {(queryType === 'INSERT' || queryType === 'UPDATE') && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Column Values:
                    </Typography>
                    <Stack spacing={2}>
                      {columns.map((col) => (
                        <TextField
                          key={col.name}
                          label={`${col.name} (${col.type})`}
                          fullWidth
                          value={columnValues[col.name] || ''}
                          onChange={(e) => {
                            setColumnValues(prev => ({ ...prev, [col.name]: e.target.value }));
                            if (!selectedColumns.includes(col.name) && e.target.value) {
                              setSelectedColumns(prev => [...prev, col.name]);
                            }
                          }}
                          placeholder={`Enter value for ${col.name}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {queryType === 'EXPORT' && (
                  <TextField
                    label="File Path"
                    fullWidth
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="e.g., /Users/username/Documents/data.csv"
                    helperText="Full path to the CSV file to import"
                    required
                  />
                )}

                {(queryType === 'UPDATE' || queryType === 'DELETE' || queryType === 'SELECT') && (
                  <TextField
                    label={`WHERE Clause ${(queryType === 'UPDATE' || queryType === 'DELETE') ? '(required)' : '(optional)'}`}
                    fullWidth
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    placeholder="e.g., id = 1 OR name ILIKE '%john%'"
                    required={queryType === 'UPDATE' || queryType === 'DELETE'}
                  />
                )}

                {queryType === 'SELECT' && (
                  <TextField
                    label="LIMIT"
                    fullWidth
                    type="number"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    sx={{ maxWidth: 300 }}
                  />
                )}

                <Box>
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuery}
                    sx={{ mr: 2 }}
                  >
                    Generate Query
                  </Button>
                  {generatedQuery && (
                    <Button
                      variant="outlined"
                      onClick={handleExecuteGeneratedQuery}
                    >
                      Execute Generated Query
                    </Button>
                  )}
                </Box>

                {generatedQuery && (
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">
                        Generated Query:
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={copySuccess ? "Copied!" : "Copy query"}>
                          <IconButton
                            onClick={handleCopyQuery}
                            size="small"
                            color={copySuccess ? "success" : "default"}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Save query">
                          <IconButton
                            onClick={() => setSaveDialogOpen(true)}
                            size="small"
                            color="primary"
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography
                        component="pre"
                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem', m: 0 }}
                      >
                        {generatedQuery}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Box>
      </TabPanel>

      {/* Saved Queries Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ p: 3 }}>
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
            <List>
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
                  
                  // Calculate if we should show drop indicator above or below
                  const showDropIndicator = isDropTarget && draggedQuery;
                  const draggedPos = draggedQuery ? groupQueries.findIndex(q => q.id === draggedQuery.id) : -1;
                  const targetPos = groupIndex;
                  const isDropAbove = draggedPos > targetPos;
                  
                  return (
                  <ListItem
                      key={savedQuery.id}
                      onDragOver={(e) => handleDragOver(e, savedQuery)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, savedQuery)}
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
                        mb: 2, // more vertical space between rows
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={(e) => handleMenuOpen(e, savedQuery)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                        <Box
                          draggable
                          onDragStart={(e) => handleDragStart(e, savedQuery)}
                          onDragEnd={handleDragEnd}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            backgroundColor: getRiskBorderColor(getQueryRiskLevel(savedQuery.query)),
                            color: '#fff',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            borderTopLeftRadius: 4,
                            borderBottomLeftRadius: 4,
                            mr: 1,
                          }}
                          title="Drag to reorder"
                        >
                          <DragIndicatorIcon fontSize="small" />
                        </Box>
                        <ListItemButton
                          onClick={() => handleEditQuery(savedQuery)}
                          sx={{
                            background: `linear-gradient(120deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 100%), ${getRiskColor(getQueryRiskLevel(savedQuery.query))}`,
                            borderLeft: `1px solid ${getRiskBorderColor(getQueryRiskLevel(savedQuery.query))}`,
                            marginLeft: '2px',
                            boxShadow: '0 0 0 2px rgba(33,150,243,0.10)',
                            backdropFilter: 'blur(32px) saturate(300%)',
                            WebkitBackdropFilter: 'blur(32px) saturate(300%)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.25)',
                            pl: 1,
                            transition: 'box-shadow 0.2s, background 0.2s',
                            boxSizing: 'border-box',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:before': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '2px',
                              border: '1px solid rgba(255,255,255,0.18)',
                              pointerEvents: 'none',
                              boxShadow: 'inset 0 2.5px 8px 0 rgba(255,255,255,0.10)',
                            },
                            '&:after': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              top: 0,
                              height: '45%',
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 100%)',
                              pointerEvents: 'none',
                            },
                            '&:hover': {
                              background: `linear-gradient(120deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.10) 100%), ${getRiskColor(getQueryRiskLevel(savedQuery.query))}`,
                              boxShadow: '0 0 0 4px rgba(33,150,243,0.18)',
                              borderColor: '#2196f3',
                              opacity: 1,
                            },
                          }}
                        >
                          <ListItemText
                            primary={savedQuery.name}
                            secondary={
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {savedQuery.query}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </Box>
                    </ListItem>
                      );
                })}
            </List>
          )}
          
          {/* Actions Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              if (selectedQueryForMenu) {
                handleLoadQuery(selectedQueryForMenu);
              }
              handleMenuClose();
            }}>
              <ListItemText>Load Query</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExecuteSavedQuery}>
              <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText>Execute Query</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDownloadSavedQueryAsCSV}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText>Download CSV</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              if (selectedQueryForMenu) {
                handleEditQuery(selectedQueryForMenu);
              }
              handleMenuClose();
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText>Edit Query</ListItemText>
            </MenuItem>
            <MenuItem onClick={async () => {
              if (selectedQueryForMenu) {
                try {
                  await navigator.clipboard.writeText(selectedQueryForMenu.query);
                } catch (err) {
                  console.error('Failed to copy:', err);
                }
              }
              handleMenuClose();
            }}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText>Copy Query</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              if (selectedQueryForMenu) {
                handleDeleteQuery(selectedQueryForMenu.id);
              }
              handleMenuClose();
            }} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText>Delete Query</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </TabPanel>

      {/* CSV Upload Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload CSV to Table
          </Typography>
          
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Select Target Table</InputLabel>
              <Select
                value={uploadTable}
                label="Select Target Table"
                onChange={(e) => {
                  setUploadTable(e.target.value);
                  loadUploadTableColumns(e.target.value);
                }}
              >
                {tables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploadFile ? uploadFile.name : 'Choose CSV File'}
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadResult('');
                    }
                  }}
                />
              </Button>
              {uploadFile && (
                <Typography variant="caption" color="text.secondary">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>

            <Alert severity="info">
              The CSV file should have headers matching the table columns. Data will be inserted directly into the database.
            </Alert>

            <TextField
              label="Authorization Code"
              type="password"
              fullWidth
              value={uploadSentinel}
              onChange={(e) => setUploadSentinel(e.target.value)}
              placeholder="Enter authorization code"
              helperText="Required for data upload operations"
            />

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={uploading || !uploadFile || !uploadTable || !uploadSentinel}
              fullWidth
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload and Insert Data'}
            </Button>

            {uploadResult && (
              <Alert 
                severity={uploadResult.startsWith('Success') ? 'success' : 'error'}
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {uploadResult}
              </Alert>
            )}
          </Stack>
        </Box>
      </TabPanel>

      {/* Save Query Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Query</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Query Name"
              fullWidth
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="e.g., Get all voters by district"
            />
            <Autocomplete
              freeSolo
              options={availableGroups}
              value={queryGroup}
              onChange={(event, newValue) => setQueryGroup(newValue || '')}
              onInputChange={(event, newValue) => setQueryGroup(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Group (Optional)"
                  placeholder="e.g., Reports, Analytics"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuery} variant="contained" disabled={!queryName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Query Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Query</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Query Name"
              fullWidth
              value={editQueryName}
              onChange={(e) => setEditQueryName(e.target.value)}
              placeholder="e.g., Get all voters by district"
            />
            <TextField
              label="Query"
              fullWidth
              multiline
              rows={10}
              value={editQueryText}
              onChange={(e) => setEditQueryText(e.target.value)}
              placeholder="Enter your SQL query here..."
              sx={{ 
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: editQueryText.trim() ? getRiskColor(getQueryRiskLevel(editQueryText)) : 'transparent',
                  borderColor: editQueryText.trim() ? getRiskBorderColor(getQueryRiskLevel(editQueryText)) : undefined,
                  '& fieldset': {
                    borderColor: editQueryText.trim() ? getRiskBorderColor(getQueryRiskLevel(editQueryText)) : undefined,
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: editQueryText.trim() ? getRiskBorderColor(getQueryRiskLevel(editQueryText)) : undefined,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: editQueryText.trim() ? getRiskBorderColor(getQueryRiskLevel(editQueryText)) : undefined,
                  },
                },
              }}
            />
            <Autocomplete
              freeSolo
              options={availableGroups}
              value={editQueryGroup}
              onChange={(event, newValue) => setEditQueryGroup(newValue || '')}
              onInputChange={(event, newValue) => setEditQueryGroup(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Group (Optional)"
                  placeholder="e.g., Reports, Analytics"
                />
              )}
            />
            <TextField
              label="Display Order"
              type="number"
              fullWidth
              value={editQueryOrder}
              onChange={(e) => setEditQueryOrder(parseInt(e.target.value) || 0)}
              helperText="Lower numbers appear first within the group"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<PlayArrowIcon />}
                onClick={async () => {
                  if (!editingQuery) return;
                  setEditDialogOpen(false);
                  
                  // Load query to Execute Query tab
                  setQuery(editQueryText);
                  setActiveTab(0);
                  
                  // Execute it automatically
                  setTimeout(async () => {
                    setExecuting(true);
                    setQueryError('');
                    setQueryResult(null);

                    try {
                      const trimmedQuery = editQueryText.trim().toLowerCase();
                      const isSelectQuery = trimmedQuery.startsWith('select') || 
                                           trimmedQuery.startsWith('with') || 
                                           trimmedQuery.startsWith('show') ||
                                           trimmedQuery.startsWith('explain');
                      
                      if (!isSelectQuery) {
                        if (executeSentinel !== '#mano') {
                          setQueryError('You do not have permission for this operation.');
                          setExecuting(false);
                          return;
                        }
                      }
                      
                      const result = await executeQuery(editQueryText);
                      
                      if (result.success && result.data) {
                        setQueryResult(result.data);
                      } else {
                        setQueryError(result.error || 'Query execution failed');
                      }
                    } catch (err) {
                      setQueryError('An error occurred while executing the query');
                      console.error('Query execution error:', err);
                    } finally {
                      setExecuting(false);
                    }
                  }, 100);
                }}
                size="small"
                disabled={!editQueryText.trim()}
              >
                Execute
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  if (!editingQuery) return;
                  setEditDialogOpen(false);
                  
                  setDownloading(true);
                  setQueryError('');

                  try {
                    const trimmedQuery = editQueryText.trim().toLowerCase();
                    const isSelectQuery = trimmedQuery.startsWith('select') || 
                                         trimmedQuery.startsWith('with') || 
                                         trimmedQuery.startsWith('show') ||
                                         trimmedQuery.startsWith('explain');
                    
                    if (!isSelectQuery) {
                      if (executeSentinel !== '#mano') {
                        setQueryError('You do not have permission for this operation.');
                        setDownloading(false);
                        return;
                      }
                    }
                    
                    const result = await executeQuery(editQueryText);
                    
                    if (result.success && result.data) {
                      const columns = result.data.columns;
                      const rows = result.data.rows;

                      if (rows.length === 0) {
                        setQueryError('Query returned no results');
                        setDownloading(false);
                        return;
                      }

                      const csvHeader = columns.join(',');
                      const csvRows = rows.map((row: any) => {
                        return columns.map((col: string) => {
                          const value = row[col];
                          if (value === null || value === undefined) return '';
                          
                          const stringValue = String(value);
                          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\\n')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                          }
                          return stringValue;
                        }).join(',');
                      });

                      const csvContent = [csvHeader, ...csvRows].join('\\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `${editQueryName.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      setQueryError(result.error || 'Query execution failed');
                    }
                  } catch (err) {
                    setQueryError('An error occurred while executing the query');
                    console.error('Query execution error:', err);
                  } finally {
                    setDownloading(false);
                  }
                }}
                size="small"
                disabled={!editQueryText.trim()}
              >
                Download CSV
              </Button>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(editQueryText);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                size="small"
                disabled={!editQueryText.trim()}
              >
                Copy
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={async () => {
                  if (!editingQuery) return;
                  if (window.confirm(`Are you sure you want to delete "${editQueryName}"?`)) {
                    await handleDeleteQuery(editingQuery.id);
                    setEditDialogOpen(false);
                  }
                }}
                size="small"
                color="error"
              >
                Delete
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateQuery} variant="contained" disabled={!editQueryName.trim() || !editQueryText.trim()}>
                Update
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
