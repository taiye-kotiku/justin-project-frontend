import { useState, useRef, useEffect } from 'react';
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
type StepType = 'upload' | 'coloring' | 'template' | 'composite';

interface ErrorState {
  type: 'coloring' | 'composite' | 'instagram' | null;
  message: string;
  timestamp: number;
}

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
  // ===== CORE STATE =====
  const [dogName, setDogName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('@justgurian');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== LOADING STATES =====
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState(false);
  const [isPostingToInstagram, setIsPostingToInstagram] = useState(false);

  // ===== ERROR STATE (NEW - CRITICAL FIX) =====
  const [error, setError] = useState<ErrorState | null>(null);

  // ===== STEP MANAGEMENT (NEW - REPLACES IMPLICIT CONDITIONS) =====
  const [step, setStep] = useState<StepType>('upload');

  // ===== TEMPLATE STATE =====
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('customizable');
  const [templateFields, setTemplateFields] = useState<Record<string, string | number | boolean | undefined>>({
    headerLine1: 'Get Your',
    headerLine2: 'Coloring Page',
    arrowText: 'Just Color & Share!',
    websiteText: '@justgurian',
    circleColor: '#8B5CF6',
    backgroundColor: '#FFFFFF'
  });

  // ===== STEP SYNC EFFECT (NEW) =====
  useEffect(() => {
    if (!result) {
      setStep('upload');
    } else if (!result.generatedImageUrl) {
      setStep('coloring');
    } else if (!result.compositeImageUrl) {
      setStep('template');
    } else {
      setStep('composite');
    }
  }, [result]);

  // ===== ERROR CLEAR EFFECT (NEW) =====
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 10000); // Auto-clear after 10s
    return () => clearTimeout(timer);
  }, [error?.timestamp]);

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
    // ===== VALIDATION =====
    if (!dogName.trim()) {
      setError({
        type: 'coloring',
        message: 'Please enter a dog name',
        timestamp: Date.now()
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

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

      const data = await response.json() as {
        success: boolean;
        originalImageUrl?: string;
        generatedImageUrl?: string;
        error?: string;
      };

      console.log('Response data:', data);

      if (data.success && data.originalImageUrl && data.generatedImageUrl) {
        setResult({
          originalImageUrl: data.originalImageUrl,
          generatedImageUrl: data.generatedImageUrl
        });
      } else {
        throw new Error(data.error || 'Failed to generate coloring page');
      }
    } catch (error) {
      console.error('❌ Generation error:', error);
      setError({
        type: 'coloring',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateComposite = async (): Promise<void> => {
    if (!result?.originalImageUrl || !result?.generatedImageUrl) {
      setError({
        type: 'composite',
        message: 'Please generate the coloring page first',
        timestamp: Date.now()
      });
      return;
    }

    setIsGeneratingComposite(true);
    setError(null);

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

      const data = await response.json() as CompositeResponse;
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
      setError({
        type: 'composite',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      });
    } finally {
      setIsGeneratingComposite(false);
    }
  };

  const handlePostToInstagram = async (): Promise<void> => {
    if (!result?.compositeImageUrl) {
      setError({
        type: 'instagram',
        message: 'Please generate the composite first',
        timestamp: Date.now()
      });
      return;
    }

    if (selectedTemplate === 'customizable' && !templateFields.arrowText) {
      setError({
        type: 'instagram',
        message: 'Please fill in the caption before posting',
        timestamp: Date.now()
      });
      return;
    }

    const caption = selectedTemplate === 'customizable' 
      ? String(templateFields.arrowText)
      : `Meet ${dogName}! 🐾 Get your own dog coloring book at dogcoloringbooks.com`;

    setIsPostingToInstagram(true);
    setError(null);

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

      const data = await response.json();
      console.log('✅ Posted to Instagram!', data);
      
      // Show success message
      setError({
        type: null,
        message: '✅ Posted to Instagram successfully!',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Instagram post error:', error);
      setError({
        type: 'instagram',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      });
    } finally {
      setIsPostingToInstagram(false);
    }
  };

  const handleReset = (): void => {
    setDogName('');
    setResult(null);
    setSelectedTemplate('customizable');
    setError(null);
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

  const retryLastAction = (): void => {
    if (!error) return;
    
    switch (error.type) {
      case 'coloring':
        fileInputRef.current?.click();
        break;
      case 'composite':
        handleGenerateComposite();
        break;
      case 'instagram':
        handlePostToInstagram();
        break;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎨 Single Image Generator</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">Create a coloring page and marketing composite from one dog photo</p>
      </div>

      {/* ===== ERROR STATE UI (NEW - CRITICAL FIX) ===== */}
      {error && (
        <div className={`rounded-lg p-4 border-2 animate-in slide-in-from-top ${
          error.type ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`font-semibold ${error.type ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
                {error.type ? '⚠️ Error' : '✅ Success'}
              </p>
              <p className={`text-sm mt-1 ${error.type ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                {error.message}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className={`ml-4 p-1 rounded hover:bg-opacity-20 ${error.type ? 'hover:bg-red-300' : 'hover:bg-green-300'}`}
            >
              ✕
            </button>
          </div>
          {error.type && (
            <button
              onClick={retryLastAction}
              disabled={isGenerating || isGeneratingComposite || isPostingToInstagram}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded text-sm"
            >
              🔄 Retry
            </button>
          )}
        </div>
      )}

      {/* ===== STEP 1: UPLOAD ===== */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Step 1: Upload Dog Photo
          </label>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dog Name <span className="text-red-600">*</span>
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
                Photo <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supported formats: JPG, PNG, WebP
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || !dogName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {isGenerating ? '⏳ Generating...' : '✨ Generate Coloring Page'}
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: GENERATED COLORING PAGE ===== */}
      {step === 'coloring' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Generated Coloring Page
          </label>

          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
            {result?.generatedImageUrl && (
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
            href={result?.generatedImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4"
          >
            📥 Download Coloring Page
          </a>

          <button
            onClick={() => setStep('template')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            ➜ Continue to Template Selection
          </button>
        </div>
      )}

      {/* ===== STEP 3: TEMPLATE SELECTION & CUSTOMIZATION ===== */}
      {step === 'template' && (
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
              disabled={isGeneratingComposite}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {isGeneratingComposite ? '⏳ Generating composite...' : '🎨 Generate Marketing Composite'}
            </button>
          </div>
        </div>
      )}

      {/* ===== LOADING STATE FOR COMPOSITE (NEW - CRITICAL FIX) ===== */}
      {isGeneratingComposite && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Marketing Composite...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment</p>
          </div>
        </div>
      )}

      {/* ===== STEP 4: COMPOSITE & ACTIONS ===== */}
      {step === 'composite' && result?.compositeImageUrl && (
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
                disabled={isPostingToInstagram}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-2 px-4 rounded-lg"
              >
                {isPostingToInstagram ? '⏳ Posting...' : '📱 Post to Instagram'}
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