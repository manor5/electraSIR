
'use client';

import { useState,  } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  
} from '@mui/material';

import QueryEditor from './QueryEditor/QueryEditor';
import QueryBuilderForm from './QueryBuilderForm/QueryBuilderForm';
import CSVUploadForm from './CSVUploadForm/CSVUploadForm';
import SavedQueriesList from './SavedQueriesList/SavedQueriesList';

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
  return (
    <Paper sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Query Editor" />
        <Tab label="Query Builder" />
        <Tab label="Saved Queries" />
        <Tab label="CSV Upload" />
      </Tabs>

      {/* Execute Query Tab */}
      <TabPanel value={activeTab} index={0}>
        <QueryEditor />
      </TabPanel>

      {/* Query Builder Tab */}
      <TabPanel value={activeTab} index={1}>
        <QueryBuilderForm />
      </TabPanel>

      {/* Saved Queries Tab */}
      <TabPanel value={activeTab} index={2}>
        <SavedQueriesList />
      </TabPanel>

      {/* CSV Upload Tab */}
      <TabPanel value={activeTab} index={3}>
        <CSVUploadForm />
      </TabPanel>
    </Paper>
  );
}
