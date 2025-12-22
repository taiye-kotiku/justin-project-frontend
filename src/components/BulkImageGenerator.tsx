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
  // ✅ TEMPLATE SELECTION - MOVED INSIDE COMPONENT
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
      const response = await fetch(`${N8N_BASE_URL}/schedule-posts`, {
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

  return (
    <div className="space-y-8">
      
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">📸 Upload Images</h3>
          <p className="text-gray-600 text-sm mb-4">Select multiple dog photos</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleBatchUpload}
            className="w-full text-sm"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">🤖 Auto-Generate</h3>
          <p className="text-gray-600 text-sm mb-4">Create AI mock dogs</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={autoCount}
              onChange={(e) => setAutoCount(Number(e.target.value))}
              min="1"
              max="20"
              className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg"
            />
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="flex-1 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
          <label className="block text-sm font-semibold mb-4">📋 Select Marketing Template for All Posts:</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTemplate('customizable')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedTemplate === 'customizable'
                  ? 'bg-purple-600 text-white border-2 border-purple-600'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="text-lg">✨ Customizable</div>
              <div className="text-xs mt-1">Custom text & colors</div>
            </button>
            <button
              onClick={() => setSelectedTemplate('polaroid')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedTemplate === 'polaroid'
                  ? 'bg-indigo-600 text-white border-2 border-indigo-600'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400'
              }`}
            >
              <div className="text-lg">📷 Polaroid</div>
              <div className="text-xs mt-1">Professional before/after</div>
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{items.length}</strong> items | 
              <span className="text-blue-600 ml-2"><strong>{readyCount}</strong> ready</span> | 
              <span className="text-green-600 ml-2"><strong>{approvedCount}</strong> approved</span> |
              <span className="text-purple-600 ml-2"><strong>{scheduledCount}</strong> scheduled</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : '✨ Generate All'}
              </button>
              
              <button
                onClick={handleApproveAll}
                disabled={readyCount === 0}
                className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Approve All
              </button>
              
              <button
                onClick={handleScheduleAll}
                disabled={approvedCount === 0 || isScheduling}
                className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isScheduling ? 'Scheduling...' : `📅 Schedule ${approvedCount} Posts`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border-4 ${
              item.status === 'scheduled' ? 'border-purple-500' :
              item.status === 'approved' ? 'border-green-500' :
              item.status === 'ready' ? 'border-blue-500' :
              'border-gray-200'
            }`}
          >
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              {item.generatedImage ? (
                <img src={item.generatedImage} alt={item.dogName} className="h-full w-full object-cover" />
              ) : item.status === 'generating' ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              ) : (
                <p className="text-gray-400">Preview</p>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{item.dogName}</h3>
              
              {item.caption && (
                <textarea
                  value={item.caption}
                  onChange={(e) => setItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, caption: e.target.value } : i
                  ))}
                  rows={3}
                  className="w-full text-sm px-2 py-1 border rounded mb-2 resize-none"
                />
              )}

              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  item.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                  item.status === 'approved' ? 'bg-green-100 text-green-800' :
                  item.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.toUpperCase()}
                </span>

                {item.status === 'ready' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveItem(item.id)}
                      className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setItems(prev => prev.map(i =>
                        i.id === item.id ? { ...i, status: 'rejected' } : i
                      ))}
                      className="bg-red-600 text-white text-xs font-bold py-1 px-3 rounded"
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Items Yet</h3>
          <p className="text-gray-600">Upload images or auto-generate to get started!</p>
        </div>
      )}
    </div>
  );
}