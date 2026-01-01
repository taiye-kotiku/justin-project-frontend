import { useState, useRef } from 'react';
import { TemplateFieldsForm } from './TemplateFieldsForm';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

interface GenerationResult {
  originalImageUrl: string;
  generatedImageUrl: string;
  compositeImageUrl?: string;
  compositeImageBase64?: string;
  compositeMimeType?: string;
  mimeType?: string;
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

export function SingleImageGenerator() {
  const [dogName, setDogName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('@justgurian');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('customizable');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template fields state
  const [templateFields, setTemplateFields] = useState<Record<string, string | number | boolean | undefined>>({
    headerLine1: 'Get Your',
    headerLine2: 'Coloring Page',
    arrowText: 'Just Color & Share!',
    websiteText: '@justgurian',
    circleColor: '#8B5CF6',
    backgroundColor: '#FFFFFF'
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageBase64 = (e.target?.result as string);
      console.log('📸 Image uploaded, generating coloring page...');
      handleGenerateColoring(imageBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateColoring = async (imageBase64: string) => {
    if (!dogName.trim()) {
      alert('Please enter a dog name');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🎨 Generating coloring page for:', dogName);

      const response = await fetch(`${N8N_BASE_URL}/generate-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogName: dogName.trim(),
          imageBase64: imageBase64,
          mimeType: 'image/jpeg',
          theme: 'Adventure',
          petHandle: instagramHandle.trim()
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json() as ColoringPageResponse | N8nResponse<ColoringPageResponse>;
      const data = unwrapN8nResponse(responseData);

      if (data.success && data.originalImageUrl && data.generatedImageUrl) {
        setResult({
          originalImageUrl: data.originalImageUrl,
          generatedImageUrl: data.generatedImageUrl
        });
        alert('✅ Coloring page generated!');
      } else {
        throw new Error(data.error || 'Failed to generate coloring page');
      }
    } catch (error) {
      console.error('❌ Generation error:', error);
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateComposite = async (): Promise<void> => {
    if (!result?.originalImageUrl || !result?.generatedImageUrl) {
      alert('Please generate the coloring page first');
      return;
    }

    setIsGeneratingComposite(true);

    try {
      console.log('🎨 Generating marketing composite...');
      console.log('Template:', selectedTemplate);

      const payload: Record<string, string | number | boolean | undefined> = {
        dogName: dogName.trim(),
        originalImageUrl: result.originalImageUrl,
        generatedImageUrl: result.generatedImageUrl,
        template: selectedTemplate
      };

      // Add custom fields for customizable template
      if (selectedTemplate === 'customizable') {
        payload.headerLine1 = String(templateFields.headerLine1 || 'Get Your');
        payload.headerLine2 = String(templateFields.headerLine2 || 'Coloring Page');
        payload.arrowText = String(templateFields.arrowText || 'Just Color & Share!');
        payload.websiteText = String(templateFields.websiteText || '@justgurian');
        payload.circleColor = String(templateFields.circleColor || '#8B5CF6');
        payload.backgroundColor = String(templateFields.backgroundColor || '#FFFFFF');
      }

      console.log('📤 Sending payload:', payload);

      const response = await fetch(`${N8N_BASE_URL}/create-marketing-composite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json() as CompositeResponse | N8nResponse<CompositeResponse>;
      const data = unwrapN8nResponse(responseData);

      console.log('Composite response:', data);

      if (data.success) {
        setResult(prev => prev ? {
          ...prev,
          compositeImageUrl: data.compositeImageUrl || data.driveUrl || data.previewUrl,
          compositeImageBase64: data.compositeImageBase64 || data.imageBase64,
          compositeMimeType: data.compositeMimeType || data.mimeType || 'image/png'
        } : null);
        console.log('✅ Marketing composite generated!');
      } else {
        throw new Error('Failed to generate composite');
      }
    } catch (error) {
      console.error('❌ Composite generation error:', error);
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingComposite(false);
    }
  };

  const handlePostToInstagram = async (): Promise<void> => {
    if (!result?.compositeImageUrl) {
      alert('Please generate the composite first');
      return;
    }

    if (selectedTemplate === 'customizable' && !templateFields.arrowText) {
      alert('Please fill in the caption before posting');
      return;
    }

    const caption = selectedTemplate === 'customizable' 
      ? String(templateFields.arrowText)
      : `Meet ${dogName}! 🐾 Get your own dog coloring book at dogcoloringbooks.com`;

    try {
      console.log('📱 Posting to Instagram...');
      const response = await fetch(`${N8N_BASE_URL}/post-to-instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: result.compositeImageUrl,
          caption: caption
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseData = await response.json() as BaseResponse | N8nResponse<BaseResponse>;
      const data = unwrapN8nResponse(responseData);

      console.log('✅ Posted to Instagram!', data);
      alert('✅ Posted to Instagram successfully!');
    } catch (error) {
      console.error('❌ Instagram post error:', error);
      alert(`Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReset = (): void => {
    setDogName('');
    setResult(null);
    setSelectedTemplate('customizable');
    setTemplateFields({
      headerLine1: 'Get Your',
      headerLine2: 'Coloring Page',
      arrowText: 'Just Color & Share!',
      websiteText: '@justgurian',
      circleColor: '#8B5CF6',
      backgroundColor: '#FFFFFF'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎨 Single Image Generator</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">Create a coloring page and marketing composite from one dog photo</p>
      </div>

      {/* Step 1: Upload Image */}
      {!result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Step 1: Upload Dog Photo
          </label>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dog Name *
              </label>
              <input
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                placeholder="e.g., Buddy, Max, Luna"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instagram Handle (Optional)
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@yourhandle"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isGenerating}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer disabled:opacity-50"
              />
            </div>

            <button
              disabled={isGenerating || !dogName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {isGenerating ? '⏳ Generating...' : '✨ Generate Coloring Page'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Generated Coloring Page */}
      {result?.generatedImageUrl && !result?.compositeImageUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Generated Coloring Page
          </label>

          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
            {result.generatedImageUrl && (
              <img
                src={result.generatedImageUrl}
                alt="Generated coloring page"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.log('Attempted URL:', result.generatedImageUrl);
                }}
              />
            )}
          </div>

          <a
            href={result.generatedImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4"
          >
            📥 Download Coloring Page
          </a>
        </div>
      )}

      {/* Step 3: Template Selection & Composite */}
      {result?.generatedImageUrl && !result?.compositeImageUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Step 2: Marketing Template
              </label>
              <div className="grid grid-cols-2 gap-2">
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
            </div>

            {/* Template Fields Form */}
            {selectedTemplate === 'customizable' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4">
                  ✏️ Customize Your Marketing Composite
                </h4>
                <TemplateFieldsForm
                  fields={TEMPLATE_FIELDS}
                  values={templateFields}
                  onChange={(fieldId, value) =>
                    setTemplateFields(prev => ({ ...prev, [fieldId]: value }))
                  }
                />
              </div>
            )}

            {selectedTemplate === 'polaroid' && (
              <div className="bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-700 rounded-lg p-3">
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  📷 <span className="font-semibold">Polaroid Template:</span> Professional scrapbook-style layout with decorative elements
                </p>
              </div>
            )}

            <button
              onClick={handleGenerateComposite}
              disabled={isGeneratingComposite || !selectedTemplate}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {isGeneratingComposite ? '⏳ Generating...' : '🎨 Generate Marketing Composite'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Composite & Actions */}
      {result?.compositeImageUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Marketing Composite
            </label>

            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
              {result.compositeImageBase64 ? (
                <img
                  src={`data:${result.compositeMimeType || 'image/png'};base64,${result.compositeImageBase64}`}
                  alt="Marketing composite"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    console.error('Composite image load error:', e);
                    console.log('Attempted MIME type:', result.compositeMimeType);
                  }}
                />
              ) : result.compositeImageUrl ? (
                <img
                  src={result.compositeImageUrl}
                  alt="Marketing composite"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    console.log('Attempted URL:', result.compositeImageUrl);
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">No image available</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <a
                href={result.compositeImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                💾 Download Composite
              </a>
              <button
                onClick={handlePostToInstagram}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                📱 Post to Instagram
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                🔄 Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}