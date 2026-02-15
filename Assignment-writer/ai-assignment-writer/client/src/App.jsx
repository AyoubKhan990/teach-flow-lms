import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Form from './pages/Form';
import Result from './pages/Result';
import JobProgress from './pages/JobProgress';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <Router>
      <ToastProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-[var(--radius-control)] focus:bg-[color:var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-[var(--shadow-2)]"
        >
          Skip to content
        </a>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<Form />} />
            <Route path="/jobs/:jobId" element={<JobProgress />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
