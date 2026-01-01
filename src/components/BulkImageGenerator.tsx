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
  status: 'pending' | 'ready' | 'generating' | 'approved' | 'scheduled';
  compositeStatus?: 'pending' | 'generating' | 'ready';
  error?: string;
}

interface BaseResponse {
  success: boolean;
  error?: string;
}

interface ColoringPageResponse extends BaseResponse {
  originalImageUrl?: string;
  generatedImageUrl?: string;
}

interface CompositeResponse extends BaseResponse {
  compositeImageUrl?: string;
  driveUrl?: string;
  previewUrl?: string;
  compositeImageBase64?: string;
  imageBase64?: string;
  compositeMimeType?: string;
  mimeType?: string;
}

// N8N wrapper type - handles both direct and wrapped responses
interface N8nResponse<T> {
  json?: T;
  pairedItem?: { item: number };
}

// Helper to unwrap n8n responses
function unwrapN8nResponse<T>(data: T | N8nResponse<T>): T {
  if (data && typeof data === 'object' && 'json' in data) {
    const wrapped = data as N8nResponse<T>;
    return wrapped.json as T;
  }
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as unknown;
    if (first && typeof first === 'object' && 'json' in first) {
      return (first as N8nResponse<T>).json as T;
    }
  }
  return data as T;
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
      alert('No pending items to generate');
      return;
    }

    setIsGeneratingColoring(true);

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

        const responseData = await response.json() as ColoringPageResponse | N8nResponse<ColoringPageResponse>;
        const data = unwrapN8nResponse(responseData);

        if (data.success) {
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              status: 'ready',
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
            status: 'pending',
            error: error instanceof Error ? error.message : 'Failed'
          } : i
        ));
      }
    }

    setIsGeneratingColoring(false);
  };

  const handleGenerateComposites = async (): Promise<void> => {
    setIsGeneratingComposites(true);

    const readyItems = items.filter(i => i.status === 'ready' && !i.compositeImageUrl);
    console.log(`🎨 Generating ${readyItems.length} composites...`);

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

        const responseData = await response.json() as CompositeResponse | N8nResponse<CompositeResponse>;
        const data = unwrapN8nResponse(responseData);

        if (data.success) {
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              compositeStatus: 'ready',
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
            compositeStatus: 'pending',
            error: error instanceof Error ? error.message : 'Failed'
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
      alert('No approved items to schedule');
      return;
    }

    setIsScheduling(true);

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
          i.id === item.id ? { ...i, status: 'scheduled' } : i
        ));
      } catch (error) {
        console.error(`Error scheduling ${item.dogName}:`, error);
        alert(`Failed to schedule ${item.dogName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsScheduling(false);
  };

  const handleRemoveItem = (id: string): void => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const approvedCount = items.filter(i => i.status === 'approved').length;
  const scheduledCount = items.filter(i => i.status === 'scheduled').length;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📦 Bulk Image Generator</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">Create multiple coloring pages and marketing composites at once</p>
      </div>

      {/* Add Dogs Section */}
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

      {/* Template Selection Section */}
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

      {/* Items List */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Dogs ({items.length})
          </label>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.dogName}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: <span className="capitalize font-semibold">{item.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    ✕ Remove
                  </button>
                </div>

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

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {items.every(i => i.status !== 'generating') && (
            <button
              onClick={handleGenerateColoringPages}
              disabled={isGeneratingColoring || items.every(i => i.generatedImageUrl)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isGeneratingColoring ? '⏳ Generating...' : '✨ Generate All Coloring Pages'}
            </button>
          )}

          {items.every(i => !i.compositeStatus || i.compositeStatus !== 'generating') && (
            <button
              onClick={handleGenerateComposites}
              disabled={isGeneratingComposites || items.filter(i => i.generatedImageUrl && !i.compositeImageUrl).length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isGeneratingComposites ? '⏳ Generating...' : '🎨 Generate All Composites'}
            </button>
          )}

          {items.some(i => i.compositeImageUrl) && !items.every(i => i.status === 'approved') && (
            <button
              onClick={handleApproveAll}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
            >
              ✅ Approve All ({items.filter(i => i.compositeImageUrl).length})
            </button>
          )}

          {approvedCount > 0 && (
            <button
              onClick={handleScheduleAll}
              disabled={isScheduling || approvedCount === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isScheduling ? '⏳ Scheduling...' : `📅 Schedule ${approvedCount} Posts`}
            </button>
          )}

          {scheduledCount > 0 && (
            <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <p className="text-green-700 dark:text-green-300 font-semibold">
                ✅ {scheduledCount} posts scheduled!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}