import { useState } from 'react';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

export function SingleImageGenerator() {
  // ✅ TEMPLATE SELECTION - MOVED INSIDE COMPONENT
  const [selectedTemplate, setSelectedTemplate] = useState<'customizable' | 'polaroid'>('customizable');
  
  const [dogName, setDogName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingComposite, setIsCreatingComposite] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Generated coloring book data
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  
  // Marketing composite customization (shown after generation)
  const [showCustomization, setShowCustomization] = useState(false);
  const [headerLine1, setHeaderLine1] = useState('TURN ONE PICTURE OF YOUR DOG INTO');
  const [headerLine2, setHeaderLine2] = useState('ONE HUNDRED PICTURES OF YOUR DOG!');
  const [arrowText, setArrowText] = useState('←---STARTING IMAGE');
  const [websiteText, setWebsiteText] = useState('dogcoloringbooks.com');
  const [circleColor, setCircleColor] = useState('#7C3AED');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  
  // Final marketing image
  const [marketingImageUrl, setMarketingImageUrl] = useState('');
  const [marketingImagePreview, setMarketingImagePreview] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || !dogName) {
      setError('Please provide both dog name and photo!');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64 = (reader.result as string).split(',')[1];

      // Call n8n webhook
      const response = await fetch(`${N8N_BASE_URL}/generate-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogName,
          imageUrl: `data:image/jpeg;base64,${base64}`,
          themes: ['A fun coloring book adventure'],
          petHandle: instagramHandle
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      const result = data.results[0];
      
      setOriginalImageUrl(data.originalImageUrl);
      setGeneratedImage(`data:${result.mimeType};base64,${result.imageBase64}`);
      setGeneratedImageUrl(data.generatedImageUrl);
      setCaption(result.caption);
      setSuccess('✅ Coloring book generated! Now customize your marketing text...');
      
      // Show customization panel
      setShowCustomization(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

// ============================================
// REPLACE THIS FUNCTION IN SingleImageGenerator.tsx
// ============================================

  const handleCreateMarketingImage = async () => {
    if (!generatedImage) {
      setError('Missing generated image');
      return;
    }

    setIsCreatingComposite(true);
    setError('');

    try {
      // Extract base64 from the data URLs
      // generatedImage is: "data:image/jpeg;base64,xxxxx"
      // previewUrl is: "blob:..." (we need the original base64 instead)
      
      // Get the original image base64 from the file
      let originalBase64 = '';
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            originalBase64 = (reader.result as string).split(',')[1];
            resolve(null);
          };
        });
      }

      // Get generated image base64
      const generatedBase64 = generatedImage.split(',')[1];

      if (!originalBase64 || !generatedBase64) {
        setError('Failed to extract image data');
        return;
      }

      // Determine endpoint based on selected template
      let endpoint = '/api/create-marketing-image';
      let payload: Record<string, string> = {
        originalImageBase64: originalBase64,
        coloringImageBase64: generatedBase64,
        dogName: dogName,
      };

      if (selectedTemplate === 'customizable') {
        endpoint = '/api/create-marketing-image';
        payload = {
          ...payload,
          headerLine1,
          headerLine2,
          arrowText,
          websiteText,
          circleColor,
          backgroundColor
        };
      } else if (selectedTemplate === 'polaroid') {
        endpoint = '/api/generate-rebel-composite';
        // Polaroid template doesn't need extra customization fields
      }

      console.log(`Creating ${selectedTemplate} marketing image...`);
      console.log(`Original base64 length: ${originalBase64.length}`);
      console.log(`Generated base64 length: ${generatedBase64.length}`);

      // Call backend to create marketing composite
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create marketing image');
      }

      console.log(`✅ ${selectedTemplate} image created!`);
      console.log(`Response mimeType: ${data.mimeType}`);

      setMarketingImagePreview(`data:${data.mimeType};base64,${data.imageBase64}`);
      setMarketingImageUrl('composite-ready'); // Mark as ready
      setSuccess(`✅ ${selectedTemplate === 'customizable' ? 'Customizable' : 'Polaroid'} marketing image created! Ready to post.`);

    } catch (err) {
      console.error('Error creating marketing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to create marketing image');
    } finally {
      setIsCreatingComposite(false);
    }
  };

  const handlePost = async () => {
    if (!marketingImageUrl) {
      setError('No marketing image to post');
      return;
    }

    setIsPosting(true);
    setError('');

    try {
      const response = await fetch(`${N8N_BASE_URL}/post-marketing-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: marketingImageUrl,
          caption,
          dogName,
          originalImageUrl,
          generatedImageUrl,
          template: selectedTemplate
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Posting failed');
      }

      setSuccess('🎉 Posted to Instagram successfully!');
      
      setTimeout(() => {
        handleReset();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Posting failed');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReset = () => {
    setDogName('');
    setInstagramHandle('');
    setImageFile(null);
    setPreviewUrl('');
    setOriginalImageUrl('');
    setGeneratedImage('');
    setGeneratedImageUrl('');
    setCaption('');
    setShowCustomization(false);
    setMarketingImageUrl('');
    setMarketingImagePreview('');
    setError('');
    setSuccess('');
    // Reset to defaults
    setHeaderLine1('TURN ONE PICTURE OF YOUR DOG INTO');
    setHeaderLine2('ONE HUNDRED PICTURES OF YOUR DOG!');
    setArrowText('←---STARTING IMAGE');
    setWebsiteText('dogcoloringbooks.com');
    setCircleColor('#7C3AED');
    setBackgroundColor('#FFFFFF');
  };

  return (
    <div className="space-y-8">
      
      {/* Step 1: Upload & Generate Coloring Book */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📝 Step 1: Dog Details
            </h2>
            {generatedImage && (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                ✓ Generated
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dog Name *
              </label>
              <input
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                placeholder="e.g., Buddy"
                disabled={isGenerating || !!generatedImage}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instagram Handle <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@buddys_adventures"
                disabled={isGenerating || !!generatedImage}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Photo *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isGenerating || !!generatedImage}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer disabled:opacity-50"
              />
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="mt-4 w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
              )}
            </div>

            {!generatedImage ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !imageFile || !dogName}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '⏳ Generating...' : '✨ Generate Coloring Page'}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="w-full bg-gray-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-700 transition-all"
              >
                🔄 Start Over
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🎨 Coloring Book Preview
          </h2>

          {!generatedImage && !isGenerating && (
            <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-400">Your coloring page will appear here...</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-semibold">Creating your coloring page...</p>
            </div>
          )}

          {generatedImage && (
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full rounded-lg border-2 border-gray-200"
            />
          )}
        </div>
      </div>

      {/* Step 2: Select Template & Customize Marketing Text */}
      {showCustomization && !marketingImageUrl && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-8">
          
          {/* Template Selection Toggle */}
          <div className="mb-8 p-4 bg-white rounded-lg border-2 border-gray-200">
            <label className="block text-sm font-semibold mb-4">📋 Select Marketing Template:</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTemplate('customizable')}
                className={`flex-1 py-4 px-4 rounded-lg font-semibold transition-all ${
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
                className={`flex-1 py-4 px-4 rounded-lg font-semibold transition-all ${
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

          {/* Customization Panel - Only show for customizable template */}
          {selectedTemplate === 'customizable' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                ✏️ Step 2: Customize Marketing Text
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Header Line 1
                  </label>
                  <input
                    type="text"
                    value={headerLine1}
                    onChange={(e) => setHeaderLine1(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Header Line 2
                  </label>
                  <input
                    type="text"
                    value={headerLine2}
                    onChange={(e) => setHeaderLine2(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Arrow Text
                  </label>
                  <input
                    type="text"
                    value={arrowText}
                    onChange={(e) => setArrowText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website Text
                  </label>
                  <input
                    type="text"
                    value={websiteText}
                    onChange={(e) => setWebsiteText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Circle Border Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={circleColor}
                      onChange={(e) => setCircleColor(e.target.value)}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={circleColor}
                      onChange={(e) => setCircleColor(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info for Polaroid template */}
          {selectedTemplate === 'polaroid' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-semibold">📷 Polaroid Template</p>
              <p className="text-blue-700 text-sm mt-1">Professional before/after layout with original photo in Polaroid frame. No customization needed!</p>
            </div>
          )}

          <button
            onClick={handleCreateMarketingImage}
            disabled={isCreatingComposite}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isCreatingComposite ? '⏳ Creating Marketing Image...' : '🎨 Create Marketing Image'}
          </button>
        </div>
      )}

      {/* Step 3: Final Marketing Image & Post */}
      {marketingImageUrl && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📸 Step 3: Final Marketing Image
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {marketingImagePreview && (
                <img
                  src={marketingImagePreview}
                  alt="Marketing"
                  className="w-full rounded-lg border-2 border-gray-200"
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Caption (Editable)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <button
                onClick={handlePost}
                disabled={isPosting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isPosting ? '⏳ Posting...' : '📸 Post to Instagram Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
}