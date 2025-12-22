import { useState } from 'react';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

interface BulkItem {
  id: string;
  dogName: string;
  imageFile?: File;
  originalImageUrl?: string;
  generatedImage?: string;
  generatedImageUrl?: string;
  caption?: string;
  status: 'pending' | 'generating' | 'ready' | 'approved' | 'rejected' | 'scheduled';
  error?: string;
}

export function BulkImageGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<'customizable' | 'polaroid'>('customizable');
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [autoCount, setAutoCount] = useState(5);

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: BulkItem[] = Array.from(files).map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      dogName: file.name.replace(/\.[^/.]+$/, ''),
      imageFile: file,
      status: 'pending'
    }));

    setItems(prev => [...prev, ...newItems]);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);

    try {
      const newItems: BulkItem[] = [];

      for (let i = 0; i < autoCount; i++) {
        const response = await fetch(`${N8N_BASE_URL}/generate-ai-dog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          newItems.push({
            id: `ai-${Date.now()}-${i}`,
            dogName: data.name,
            imageFile: undefined,
            generatedImage: `data:${data.mimeType};base64,${data.imageBase64}`,
            status: 'pending'
          });
        }
      }

      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);

    const pending = items.filter(i => i.status === 'pending');

    for (const item of pending) {
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'generating' } : i
      ));

      try {
        let imageInput: string;

        if (item.imageFile) {
          const reader = new FileReader();
          reader.readAsDataURL(item.imageFile);
          await new Promise(resolve => { reader.onloadend = resolve; });
          imageInput = reader.result as string;
        } else if (item.generatedImage) {
          imageInput = item.generatedImage;
        } else {
          continue;
        }

        const response = await fetch(`${N8N_BASE_URL}/generate-single`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dogName: item.dogName,
            imageUrl: imageInput,
            themes: ['A fun coloring book adventure'],
            petHandle: ''
          })
        });

        const data = await response.json();

        if (data.success && data.results[0]) {
          const result = data.results[0];
          
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              status: 'ready',
              originalImageUrl: data.originalImageUrl,
              generatedImage: `data:${result.mimeType};base64,${result.imageBase64}`,
              generatedImageUrl: data.generatedImageUrl,
              caption: result.caption
            } : i
          ));
        }
      } catch (error) {
        setItems(prev => prev.map(i =>
          i.id === item.id ? { 
            ...i, 
            status: 'rejected',
            error: error instanceof Error ? error.message : 'Generation failed'
          } : i
        ));
      }
    }

    setIsGenerating(false);
  };

  const handleApproveItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.originalImageUrl || !item.generatedImageUrl) return;

    try {
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, status: 'approved' } : i
      ));

      await fetch(`${N8N_BASE_URL}/approve-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogName: item.dogName,
          originalImageUrl: item.originalImageUrl,
          generatedImageUrl: item.generatedImageUrl,
          caption: item.caption,
          status: 'approved',
          template: selectedTemplate
        })
      });

    } catch (error) {
      console.error('Error approving item:', error);
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, status: 'ready' } : i
      ));
    }
  };

  const handleApproveAll = async () => {
    const readyItems = items.filter(i => i.status === 'ready');
    
    for (const item of readyItems) {
      await handleApproveItem(item.id);
    }
  };

  const handleScheduleAll = async () => {
    setIsScheduling(true);
    
    const approvedItems = items.filter(i => i.status === 'approved');
    
    try {
      const response = await fetch(`${N8N_BASE_URL}/schedule-carousel-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: approvedItems.map((item, index) => ({
            dogName: item.dogName,
            originalImageUrl: item.originalImageUrl,
            generatedImageUrl: item.generatedImageUrl,
            caption: item.caption,
            template: selectedTemplate,
            scheduledTime: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString()
          }))
        })
      });

      if (response.ok) {
        setItems(prev => prev.map(i =>
          i.status === 'approved' ? { ...i, status: 'scheduled' } : i
        ));
      }
    } catch (error) {
      console.error('Error scheduling posts:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const readyCount = items.filter(i => i.status === 'ready').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const scheduledCount = items.filter(i => i.status === 'scheduled').length;

  const getStatusColor = (status: BulkItem['status']) => {
    switch(status) {
      case 'scheduled': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'ready': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'generating': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h2 className="text-lg font-bold dark:text-white">Upload Images</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select multiple dog photos to generate pages.</p>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-medium shadow-sm">
              Choose Files
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchUpload}
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-400 italic">{items.length > 0 ? `${items.length} file(s)` : 'No file chosen'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
            </svg>
            <h2 className="text-lg font-bold dark:text-white">Auto-Generate</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create AI mock dogs without uploading.</p>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              max="20"
              value={autoCount}
              onChange={(e) => setAutoCount(Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-medium shadow-sm"
            />
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold transition shadow-md disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H3a1 1 0 000 2h1a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V5zm12 0a2 2 0 012-2 1 1 0 110-2h-1a2 2 0 00-2 2v10a2 2 0 002 2h1a1 1 0 110 2h-1a2 2 0 01-2-2V5z" clipRule="evenodd" />
            </svg>
            <h3 className="font-bold dark:text-white">Select Marketing Template for All Posts:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedTemplate('customizable')}
              className={`relative group rounded-xl p-4 border-2 transition-all flex flex-col items-center justify-center ${
                selectedTemplate === 'customizable'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300'
              }`}
            >
              {selectedTemplate === 'customizable' && (
                <div className="absolute top-3 right-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <span className="font-bold text-lg">Customizable</span>
              </div>
              <span className="text-xs opacity-90 font-medium">Custom text & colors</span>
            </button>

            <button
              onClick={() => setSelectedTemplate('polaroid')}
              className={`group rounded-xl p-4 border-2 transition-all flex flex-col items-center justify-center ${
                selectedTemplate === 'polaroid'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
              }`}
            >
              {selectedTemplate === 'polaroid' && (
                <div className="absolute top-3 right-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2v4h8V8H6z" />
                </svg>
                <span className="font-bold text-lg">Polaroid</span>
              </div>
              <span className="text-xs opacity-90 font-medium">Professional before/after</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Stats */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm flex-wrap justify-center md:justify-start">
            <span className="font-bold text-gray-900 dark:text-white">{items.length} items</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{readyCount} ready</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-green-600 dark:text-green-400 font-medium">{approvedCount} approved</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{scheduledCount} scheduled</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-col sm:flex-row">
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z" />
              </svg>
              {isGenerating ? 'Generating...' : 'Generate All'}
            </button>
            <button
              onClick={handleApproveAll}
              disabled={readyCount === 0}
              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Approve All
            </button>
            <button
              onClick={handleScheduleAll}
              disabled={approvedCount === 0 || isScheduling}
              className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v2a1 1 0 11-2 0V7H8v2a1 1 0 11-2 0V7z" />
              </svg>
              {isScheduling ? 'Scheduling...' : `Schedule ${approvedCount}`}
            </button>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border-2 transition-all hover:shadow-xl ${
              item.status === 'scheduled' ? 'border-purple-500 dark:border-purple-400' :
              item.status === 'approved' ? 'border-green-500 dark:border-green-400' :
              item.status === 'ready' ? 'border-blue-500 dark:border-blue-400' :
              item.status === 'generating' ? 'border-yellow-500 dark:border-yellow-400' :
              'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              {item.generatedImage ? (
                <img src={item.generatedImage} alt={item.dogName} className="h-full w-full object-cover" />
              ) : item.status === 'generating' ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mb-3"></div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Generating...</p>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-600">Preview</p>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 dark:text-white">{item.dogName}</h3>

              {item.caption && (
                <textarea
                  value={item.caption}
                  onChange={(e) => setItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, caption: e.target.value } : i
                  ))}
                  rows={3}
                  className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 dark:text-white mb-2 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              )}

              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusColor(item.status)}`}>
                  {item.status.toUpperCase()}
                </span>

                {item.status === 'ready' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveItem(item.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                      title="Approve"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setItems(prev => prev.map(i =>
                        i.id === item.id ? { ...i, status: 'rejected' } : i
                      ))}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                      title="Reject"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Items Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Upload images or auto-generate to get started!</p>
        </div>
      )}
    </div>
  );
}