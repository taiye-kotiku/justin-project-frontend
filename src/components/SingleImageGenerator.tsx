import { useState } from 'react';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

interface GenerationResult {
  originalImageUrl?: string;
  generatedImageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  caption?: string;
  compositeImageUrl?: string;
  compositeImageBase64?: string;
  compositeMimeType?: string;
}

export function SingleImageGenerator() {
  const [dogName, setDogName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'customizable' | 'polaroid'>('customizable');
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!dogName || !imageFile) {
      alert('Please fill in dog name and upload an image');
      return;
    }

    setIsGenerating(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        try {
          const imageBase64 = (reader.result as string).split(',')[1];

          console.log('🚀 Generating single image...');
          console.log('N8N_BASE_URL:', N8N_BASE_URL);
          console.log('Webhook URL:', `${N8N_BASE_URL}/generate-single`);

          const response = await fetch(`${N8N_BASE_URL}/generate-single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dogName,
              imageUrl: `data:${imageFile.type};base64,${imageBase64}`,
              themes: ['A fun coloring book adventure'],
              petHandle: instagramHandle
            })
          });

          console.log('Response status:', response.status);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Response data:', data);

          if (data.success && data.results?.[0]) {
            const res = data.results[0];
            setResult({
              originalImageUrl: data.originalImageUrl,
              generatedImageUrl: data.generatedImageUrl,
              imageBase64: res.imageBase64,
              mimeType: res.mimeType,
              caption: res.caption
            });
            alert('✅ Generated successfully!');
          } else {
            throw new Error('Invalid response format: ' + JSON.stringify(data));
          }
        } catch (innerError) {
          console.error('❌ Generation error:', innerError);
          alert(`Generation failed: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
        } finally {
          setIsGenerating(false);
        }
      };
    } catch (error) {
      console.error('❌ File read error:', error);
      alert('Failed to read file');
      setIsGenerating(false);
    }
  };

  const handleGenerateComposite = async () => {
    if (!result?.originalImageUrl || !result?.generatedImageUrl) {
      alert('Please generate the coloring page first');
      return;
    }

    setIsGeneratingComposite(true);

    try {
      console.log('🎨 Generating marketing composite...');
      console.log('Template:', selectedTemplate);
      console.log('Original:', result.originalImageUrl);
      console.log('Generated:', result.generatedImageUrl);

      const endpoint = selectedTemplate === 'customizable' 
        ? `${N8N_BASE_URL}/create-marketing-composite`
        : `${N8N_BASE_URL}/create-marketing-composite`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogName,
          originalImageUrl: result.originalImageUrl,
          generatedImageUrl: result.generatedImageUrl,
          caption: result.caption,
          template: selectedTemplate
        })
      });

      console.log('Composite response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Composite response:', data);

      if (data.success || data.compositeImage) {
        setResult(prev => prev ? {
          ...prev,
          compositeImageUrl: data.compositeImageUrl || data.url,
          compositeImageBase64: data.compositeImageBase64 || data.imageBase64,
          compositeMimeType: data.compositeMimeType || data.mimeType || 'image/png'
        } : null);
        alert('✅ Marketing composite generated!');
      } else {
        throw new Error('Invalid response: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('❌ Composite generation error:', error);
      alert(`Composite generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingComposite(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 1: Dog Details</h2>
        </div>

        <form className="space-y-6 flex-grow">
          <div>
            <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dog Name <span className="text-red-500">*</span>
            </label>
            <input
              id="dogName"
              type="text"
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="e.g., Buddy"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white outline-none shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instagram Handle <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
              <input
                id="instagram"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="buddys_adventures"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white outline-none shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Photo <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group cursor-pointer bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-1 text-center" onClick={() => document.getElementById('file-upload')?.click()}>
                <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-purple-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-18-12l-4 4m4-4l4 4m-4-4v12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-purple-500 hover:text-purple-600">
                    <span>Upload a file</span>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  console.log('File input changed:', e.target.files);
                  handleImageChange(e);
                }}
                className="hidden"
              />
            </div>
            {imageFile && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ File selected: <strong>{imageFile.name}</strong> ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                For best results, use a photo with good lighting where the dog's face is clearly visible.
              </p>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !dogName || !imageFile}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.757 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.757 4.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
            </svg>
            {isGenerating ? 'Generating...' : 'Generate Coloring Page'}
          </button>
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v6h6V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v6h6V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2h6v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2h6v-2a2 2 0 00-2-2h-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preview & Marketing</h2>
        </div>

        {!result ? (
          <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-12 text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generating your coloring page...</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">This usually takes 15-25 seconds</p>
              </div>
            ) : (
              <div className="z-10 relative">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No preview available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Fill in the details on the left and click "Generate" to see your custom coloring page appear here.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow flex flex-col gap-6">
            {/* Coloring Page */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Step 1: Coloring Page</h3>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-square flex items-center justify-center">
                <img
                  src={`data:${result?.mimeType};base64,${result?.imageBase64}`}
                  alt={dogName}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Template Selection & Composite */}
            {!result?.compositeImageUrl ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Step 2: Marketing Template</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedTemplate('customizable')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
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
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                        selectedTemplate === 'polaroid'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      <div>📷 Polaroid</div>
                      <div className="text-xs opacity-75">Before/after</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateComposite}
                  disabled={isGeneratingComposite}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  {isGeneratingComposite ? 'Generating Marketing...' : 'Generate Marketing Composite'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Step 2: Marketing Composite ({selectedTemplate})</h3>
                <div className="border-2 border-green-400 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-square flex items-center justify-center">
                  <img
                    src={`data:${result?.compositeMimeType};base64,${result?.compositeImageBase64}`}
                    alt={`${dogName} composite`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Avg. time: ~30-40s
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            High Res Output
          </span>
        </div>
      </div>
    </div>
  );
}