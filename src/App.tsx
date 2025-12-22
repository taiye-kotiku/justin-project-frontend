import { useState } from 'react';
import { SingleImageGenerator } from './components/SingleImageGenerator.tsx';
import { BulkImageGenerator } from './components/BulkImageGenerator.tsx';

function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Dog Coloring Books
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Coloring Page Generator</p>
              </div>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.12-2.12a4 4 0 00 5.656 5.656l2.12 2.12a1 1 0 001.414-1.414l-2.12-2.12a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Tab Navigation */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-1.5 inline-flex shadow-sm border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('single')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all text-sm flex-1 sm:flex-none ${
                  activeTab === 'single'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Single Image
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all text-sm flex-1 sm:flex-none ${
                  activeTab === 'bulk'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Bulk Generation
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-96">
            {activeTab === 'single' ? <SingleImageGenerator /> : <BulkImageGenerator />}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <span>Powered by AI</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built with{' '}
              <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;