import { useState } from 'react';
import { SingleImageGenerator } from './components/SingleImageGenerator.tsx';
import { BulkImageGenerator } from './components/BulkImageGenerator.tsx';

function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🐶 Dog Coloring Books
          </h1>
          <p className="text-gray-600 mt-1">AI-Powered Coloring Page Generator</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'single'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📸 Single Image
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'bulk'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🚀 Bulk Generation
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'single' ? <SingleImageGenerator /> : <BulkImageGenerator />}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-600">
        <p>Powered by AI • Built with ❤️</p>
      </footer>
    </div>
  );
}

export default App;