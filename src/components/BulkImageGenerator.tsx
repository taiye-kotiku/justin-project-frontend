import { useState } from 'react';
import { TemplateFieldsForm } from './TemplateFieldsForm';

const N8N_BASE_URL = 'https://justgurian.app.n8n.cloud/webhook';

interface BulkItem {
  id: string;
  dogName: string;
  originalImageUrl?: string;
  generatedImageUrl?: string;
  compositeImageUrl?: string;
  compositeImage?: string;
  caption: string;
  status: 'pending' | 'ready' | 'generating' | 'approved' | 'scheduled' | 'failed'; // ✅ NEW - Added 'failed'
  compositeStatus?: 'pending' | 'generating' | 'ready' | 'failed'; // ✅ NEW - Added 'failed'
  error?: string; // ✅ NEW - Now properly used
}

interface CompositeResponse {
  success: boolean;
  compositeImageUrl?: string;
  driveUrl?: string;
  previewUrl?: string;
  compositeImageBase64?: string;
  imageBase64?: string;
  compositeMimeType?: string;
  mimeType?: string;
}

type TemplateType = 'customizable' | 'polaroid';

const TEMPLATE_FIELDS = [
  {
    id: 'headerLine1',
    label: 'Header Line 1',
    type: 'text' as const,
    placeholder: 'e.g., "Get Your"',
    default: 'Get Your',
    maxLength: 30,
    required: true
  },
  {
    id: 'headerLine2',
    label: 'Header Line 2',
    type: 'text' as const,
    placeholder: 'e.g., "Coloring Page"',
    default: 'Coloring Page',
    maxLength: 30,
    required: true
  },
  {
    id: 'arrowText',
    label: 'Arrow Text',
    type: 'text' as const,
    placeholder: 'e.g., "Just Color & Share!"',
    default: 'Just Color & Share!',
    maxLength: 25,
    required: false
  },
  {
    id: 'websiteText',
    label: 'Website/Handle',
    type: 'text' as const,
    placeholder: '@yourhandle or yoursite.com',
    default: '@justgurian',
    maxLength: 30,
    required: true
  },
  {
    id: 'circleColor',
    label: 'Accent Color',
    type: 'color' as const,
    default: '#8B5CF6',
    required: false
  },
  {
    id: 'backgroundColor',
    label: 'Background Color',
    type: 'color' as const,
    default: '#FFFFFF',
    required: false
  }
];

export function BulkImageGenerator() {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [dogNames, setDogNames] = useState('');
  const [isGeneratingColoring, setIsGeneratingColoring] = useState(false);
  const [isGeneratingComposites, setIsGeneratingComposites] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('customizable');

  // ===== ERROR STATE (NEW - CRITICAL FIX) =====
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Template fields state
  const [defaultTemplateFields, setDefaultTemplateFields] = useState<Record<string, string | number | boolean | undefined>>({
    headerLine1: 'Get Your',
    headerLine2: 'Coloring Page',
    arrowText: 'Just Color & Share!',
    websiteText: '@justgurian',
    circleColor: '#8B5CF6',
    backgroundColor: '#FFFFFF'
  });

  const handleAddDogs = (): void => {
    if (!dogNames.trim()) return;

    const newDogs = dogNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map(name => ({
        id: `${name}-${Date.now()}`,
        dogName: name,
        caption: `Meet ${name}! 🐾`,
        status: 'pending' as const
      }));

    setItems(prev => [...prev, ...newDogs]);
    setDogNames('');
  };

  const handleUpdateCaption = (id: string, caption: string): void => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, caption } : item
    ));
  };

  const handleGenerateColoringPages = async (): Promise<void> => {
    const pendingItems = items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      setBulkError('No pending items to generate');
      return;
    }

    setIsGeneratingColoring(true);
    setBulkError(null);

    for (const item of pendingItems) {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'generating' } : i
      ));

      try {
        console.log(`🎨 Generating coloring page for: ${item.dogName}`);

        const response = await fetch(`${N8N_BASE_URL}/generate-single`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dogName: item.dogName,
            imageUrl: 'https://via.placeholder.com/400',
            theme: 'Adventure',
            petHandle: '@justgurian'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as {
          success: boolean;
          originalImageUrl?: string;
          generatedImageUrl?: string;
        };

        if (data.success) {
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              status: 'ready',
              error: undefined, // ✅ Clear error on success
              originalImageUrl: data.originalImageUrl,
              generatedImageUrl: data.generatedImageUrl
            } : i
          ));
        }
      } catch (error) {
        console.error(`Error for ${item.dogName}:`, error);
        setItems(prev => prev.map(i =>
          i.id === item.id ? {
            ...i,
            status: 'failed', // ✅ CHANGED - Use 'failed' status instead of 'pending'
            error: error instanceof Error ? error.message : 'Failed to generate'
          } : i
        ));
      }
    }

    setIsGeneratingColoring(false);
  };

  const handleGenerateComposites = async (): Promise<void> => {
    setIsGeneratingComposites(true);
    setBulkError(null);

    const readyItems = items.filter(i => i.status === 'ready' && !i.compositeImageUrl);
    console.log(`🎨 Generating ${readyItems.length} composites...`);

    if (readyItems.length === 0) {
      setBulkError('No items ready for composite generation');
      setIsGeneratingComposites(false);
      return;
    }

    for (const item of readyItems) {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, compositeStatus: 'generating' } : i
      ));

      try {
        if (!item.originalImageUrl || !item.generatedImageUrl) {
          throw new Error('Missing image URLs');
        }

        const payload: Record<string, string | number | boolean | undefined> = {
          dogName: item.dogName,
          originalImageUrl: item.originalImageUrl,
          generatedImageUrl: item.generatedImageUrl,
          template: selectedTemplate,
          caption: item.caption
        };

        // Add custom fields for customizable template
        if (selectedTemplate === 'customizable') {
          payload.headerLine1 = String(defaultTemplateFields.headerLine1 || 'Get Your');
          payload.headerLine2 = String(defaultTemplateFields.headerLine2 || 'Coloring Page');
          payload.arrowText = String(defaultTemplateFields.arrowText || 'Just Color & Share!');
          payload.websiteText = String(defaultTemplateFields.websiteText || '@justgurian');
          payload.circleColor = String(defaultTemplateFields.circleColor || '#8B5CF6');
          payload.backgroundColor = String(defaultTemplateFields.backgroundColor || '#FFFFFF');
        }

        const response = await fetch(`${N8N_BASE_URL}/create-marketing-composite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as CompositeResponse;

        if (data.success) {
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              compositeStatus: 'ready',
              error: undefined, // ✅ Clear error on success
              compositeImage: `data:${data.compositeMimeType || data.mimeType || 'image/png'};base64,${data.compositeImageBase64 || data.imageBase64}`,
              compositeImageUrl: data.compositeImageUrl || data.driveUrl || data.previewUrl
            } : i
          ));
        }
      } catch (error) {
        console.error(`❌ Composite error for ${item.dogName}:`, error);
        setItems(prev => prev.map(i =>
          i.id === item.id ? {
            ...i,
            compositeStatus: 'failed', // ✅ NEW - Use 'failed' status
            error: error instanceof Error ? error.message : 'Failed to generate composite'
          } : i
        ));
      }
    }

    setIsGeneratingComposites(false);
  };

  const handleApproveAll = (): void => {
    setItems(prev => prev.map(item =>
      item.compositeImageUrl ? { ...item, status: 'approved' } : item
    ));
  };

  const handleScheduleAll = async (): Promise<void> => {
    const approvedItems = items.filter(i => i.status === 'approved' && i.compositeImageUrl);

    if (approvedItems.length === 0) {
      setBulkError('No approved items to schedule');
      return;
    }

    setIsScheduling(true);
    setBulkError(null);

    for (const item of approvedItems) {
      try {
        console.log(`📅 Scheduling post for ${item.dogName}...`);

        const response = await fetch(`${N8N_BASE_URL}/post-to-instagram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: item.compositeImageUrl,
            caption: item.caption
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'scheduled', error: undefined } : i
        ));
      } catch (error) {
        console.error(`Error scheduling ${item.dogName}:`, error);
        setItems(prev => prev.map(i =>
          i.id === item.id ? {
            ...i,
            status: 'failed', // ✅ NEW - Use 'failed' status
            error: error instanceof Error ? error.message : 'Failed to schedule'
          } : i
        ));
      }
    }

    setIsScheduling(false);
  };

  // ===== RETRY FUNCTIONS (NEW) =====
  const handleRetryItem = (id: string, step: 'coloring' | 'composite' | 'schedule'): void => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    switch (step) {
      case 'coloring':
        setItems(prev => prev.map(i =>
          i.id === id ? { ...i, status: 'pending', error: undefined } : i
        ));
        break;
      case 'composite':
        setItems(prev => prev.map(i =>
          i.id === id ? { ...i, compositeStatus: 'pending', error: undefined } : i
        ));
        break;
      case 'schedule':
        setItems(prev => prev.map(i =>
          i.id === id ? { ...i, status: 'approved', error: undefined } : i
        ));
        break;
    }
  };

  const handleRemoveItem = (id: string): void => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // ===== COMPUTE COUNTS =====
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const scheduledCount = items.filter(i => i.status === 'scheduled').length;
  const failedCount = items.filter(i => i.status === 'failed' || i.compositeStatus === 'failed').length;

  // ===== BUTTON STATE LOGIC (IMPROVED - CLEARER) =====
  const hasGeneratingColoring = items.some(i => i.status === 'generating');
  const hasGeneratingComposites = items.some(i => i.compositeStatus === 'generating');
  const hasReadyForComposite = items.some(i => i.generatedImageUrl && !i.compositeImageUrl && i.status === 'ready');

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📦 Bulk Image Generator</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">Create multiple coloring pages and marketing composites at once</p>
      </div>

      {/* ===== BULK ERROR STATE (NEW) ===== */}
      {bulkError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 animate-in slide-in-from-top">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">⚠️ Alert</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{bulkError}</p>
            </div>
            <button
              onClick={() => setBulkError(null)}
              className="ml-4 p-1 rounded hover:bg-red-300/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===== STATUS SUMMARY (NEW) ===== */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400">Ready</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{items.filter(i => i.status === 'ready').length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
            <p className="text-xs text-green-600 dark:text-green-400">Approved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{approvedCount}</p>
          </div>
          {failedCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
              <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{failedCount}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== ADD DOGS SECTION ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Add Dog Names
        </label>

        <div className="space-y-4">
          <div>
            <textarea
              value={dogNames}
              onChange={(e) => setDogNames(e.target.value)}
              placeholder="Enter dog names, separated by commas (e.g., Buddy, Max, Luna)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <button
            onClick={handleAddDogs}
            disabled={!dogNames.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
          >
            ➕ Add Dogs
          </button>
        </div>
      </div>

      {/* ===== TEMPLATE SELECTION ===== */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Marketing Template
          </label>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSelectedTemplate('customizable')}
              className={`py-3 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                selectedTemplate === 'customizable'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'
              }`}
            >
              <div>✨ Customizable</div>
              <div className="text-xs opacity-75">Custom text</div>
            </button>
            <button
              onClick={() => setSelectedTemplate('polaroid')}
              className={`py-3 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                selectedTemplate === 'polaroid'
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-pink-400'
              }`}
            >
              <div>📷 Polaroid</div>
              <div className="text-xs opacity-75">Auto layout</div>
            </button>
          </div>

          {/* Template Fields Form */}
          {selectedTemplate === 'customizable' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4">
                ✏️ Customize All Composites
              </h4>
              <TemplateFieldsForm
                fields={TEMPLATE_FIELDS}
                values={defaultTemplateFields}
                onChange={(fieldId, value) =>
                  setDefaultTemplateFields(prev => ({ ...prev, [fieldId]: value }))
                }
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">
                These settings will be applied to all generated composites
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== ITEMS LIST ===== */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Dogs ({items.length})
          </label>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {items.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${
                  item.status === 'failed' || item.compositeStatus === 'failed'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    : item.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : item.status === 'scheduled'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.dogName}</h4>
                    <p className={`text-xs mt-1 font-semibold capitalize ${
                      item.status === 'failed' || item.compositeStatus === 'failed'
                        ? 'text-red-700 dark:text-red-300'
                        : item.status === 'approved'
                        ? 'text-green-700 dark:text-green-300'
                        : item.status === 'scheduled'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {item.status === 'generating' && '⏳ ' }
                      {item.compositeStatus === 'generating' && '⏳ '}
                      Status: {item.status} {item.compositeStatus && `(Composite: ${item.compositeStatus})`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold ml-4"
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* ===== ERROR DISPLAY (NEW - CRITICAL FIX) ===== */}
                {item.error && (
                  <div className="mb-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-red-500">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      <span className="font-semibold">Error:</span> {item.error}
                    </p>
                    {/* ===== RETRY BUTTON (NEW) ===== */}
                    {item.status === 'failed' && (
                      <button
                        onClick={() => handleRetryItem(item.id, 'coloring')}
                        className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      >
                        🔄 Retry Coloring
                      </button>
                    )}
                    {item.compositeStatus === 'failed' && (
                      <button
                        onClick={() => handleRetryItem(item.id, 'composite')}
                        className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      >
                        🔄 Retry Composite
                      </button>
                    )}
                  </div>
                )}

                {/* Composite Preview */}
                {item.compositeImage && (
                  <div className="mb-3 max-h-32 overflow-hidden rounded">
                    <img
                      src={item.compositeImage}
                      alt={item.dogName}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Caption Edit */}
                <textarea
                  value={item.caption}
                  onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                  placeholder="Instagram caption..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.caption.length}/300
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ACTION BUTTONS ===== */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {/* Generate Coloring Button - IMPROVED (clearer logic) */}
          {!hasGeneratingColoring && items.some(i => i.status === 'pending') && (
            <button
              onClick={handleGenerateColoringPages}
              disabled={isGeneratingColoring}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isGeneratingColoring ? '⏳ Generating Coloring Pages...' : '✨ Generate All Coloring Pages'}
            </button>
          )}

          {/* Generate Composites Button - IMPROVED (clearer logic) */}
          {!hasGeneratingComposites && hasReadyForComposite && (
            <button
              onClick={handleGenerateComposites}
              disabled={isGeneratingComposites}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isGeneratingComposites ? '⏳ Generating Composites...' : '🎨 Generate All Composites'}
            </button>
          )}

          {/* Approve All Button */}
          {items.some(i => i.compositeImageUrl && i.status !== 'approved' && i.status !== 'scheduled') && (
            <button
              onClick={handleApproveAll}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
            >
              ✅ Approve All ({items.filter(i => i.compositeImageUrl && i.status !== 'approved').length})
            </button>
          )}

          {/* Schedule Button */}
          {approvedCount > 0 && (
            <button
              onClick={handleScheduleAll}
              disabled={isScheduling}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isScheduling ? '⏳ Scheduling...' : `📅 Schedule ${approvedCount} Posts`}
            </button>
          )}

          {/* Success Summary */}
          {scheduledCount > 0 && (
            <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <p className="text-green-700 dark:text-green-300 font-semibold">
                ✅ {scheduledCount} post{scheduledCount !== 1 ? 's' : ''} scheduled!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}