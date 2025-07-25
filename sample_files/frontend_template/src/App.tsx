import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Workflows from './pages/Workflows';
import Tools from './pages/Tools';
import Settings from './pages/Settings';

// Hooks and stores
import { useAppStore } from './store/appStore';

// Styles
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const { theme } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 4000,
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;