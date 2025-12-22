# Dog Coloring Books - Frontend

Modern React application for managing dog coloring book content generation, batch processing, and Instagram scheduling.

**Live Demo:** [https://dogcoloringbooks.vercel.app](https://dogcoloringbooks.vercel.app)  
**Backend API:** [https://api.dogcoloringbooks.com](https://api.dogcoloringbooks.com)

---

## 🎯 What This Does

The frontend provides a user-friendly interface for:

- **Single Image Generation** - Upload a dog photo, generate coloring page, write caption, post to Instagram
- **Batch Processing** - Upload 30+ dog images at once for bulk generation
- **AI Dog Generation** - Create fictional dogs with auto-generated names and characteristics
- **Approval Workflow** - Review, edit, and approve images before posting
- **Schedule Management** - View scheduled posts and optimal posting times
- **Real-time Status** - Track processing progress and posting status

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ (or use nvm)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/taiye-kotiku/dog-coloring-books-frontend.git
cd dog-coloring-books-frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local with your backend URL
# REACT_APP_API_URL=http://localhost:5000 (for local dev)
```

### Local Development

```bash
# Start development server
npm run dev

# App opens at http://localhost:3000
```

### Build for Production

```bash
npm run build

# Build output in ./build directory
# Ready to deploy to Vercel or any static hosting
```

---

## 📁 Project Structure

```
src/
├── components/               # Reusable React components
│   ├── ImageUpload/         # Photo upload interface
│   ├── ImagePreview/        # AI-generated image display
│   ├── CaptionEditor/       # Caption editing UI
│   ├── ApprovalWorkflow/    # Approve/reject interface
│   ├── BatchGallery/        # Bulk image gallery view
│   ├── ScheduleViewer/      # Posting schedule display
│   ├── StatusTracker/       # Real-time status updates
│   └── common/              # Shared UI components
│
├── pages/                    # Page-level components
│   ├── Dashboard.tsx        # Main dashboard
│   ├── SingleImage.tsx      # Single image processing
│   ├── BulkUpload.tsx       # Batch upload page
│   ├── BatchReview.tsx      # Bulk review interface
│   ├── Settings.tsx         # Configuration page
│   └── NotFound.tsx         # 404 page
│
├── services/                # API communication
│   ├── api.ts              # Axios configuration & base API
│   ├── imageService.ts     # Image generation API
│   ├── sheetsService.ts    # Google Sheets data
│   └── instagramService.ts # Instagram posting API
│
├── types/                   # TypeScript interfaces
│   ├── image.ts
│   ├── caption.ts
│   ├── user.ts
│   └── api.ts
│
├── hooks/                   # Custom React hooks
│   ├── useImageGeneration.ts
│   ├── useBatchProcessing.ts
│   └── useInstagramPosting.ts
│
├── styles/                  # Global CSS
│   ├── globals.css
│   ├── tailwind.css
│   └── variables.css
│
├── utils/                   # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   └── errorHandling.ts
│
├── App.tsx                  # Main app component
├── index.tsx                # Entry point
└── config.ts                # App configuration
```

---

## 🔧 Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Vite** - Build tool (if using)
- **React Router** - Navigation (if added)

---

## 🌐 Environment Variables

Create `.env.local` file:

```env
# Backend API URL (local development)
REACT_APP_API_URL=http://localhost:5000

# Backend API URL (production)
REACT_APP_API_URL_PROD=https://api.dogcoloringbooks.com

# Environment
REACT_APP_ENV=development
```

**In Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add production variables:
   ```
   REACT_APP_API_URL=https://api.dogcoloringbooks.com
   REACT_APP_ENV=production
   ```

---

## 📡 API Integration

### Image Generation

```typescript
import { imageService } from '@/services/imageService';

const response = await imageService.generateImage({
  dogName: 'Max',
  photo: base64EncodedImage,
});

// Returns: { imageUrl, status, generatedAt }
```

### Batch Processing

```typescript
const response = await imageService.processBatch({
  images: [
    { dogName: 'Max', photo: base64 },
    { dogName: 'Bella', photo: base64 },
  ],
});

// Returns: { batchId, status, processedCount }
```

### Caption Generation

```typescript
const response = await imageService.generateCaption({
  dogName: 'Max',
  breed: 'Golden Retriever',
});

// Returns: { caption, hashtags }
```

### Instagram Posting

```typescript
const response = await instagramService.postToInstagram({
  imageUrl: 'https://drive.google.com/...',
  caption: 'Meet Max, the adorable Golden Retriever!',
  scheduledTime: '2025-12-10T15:00:00Z',
});

// Returns: { postId, status, postedAt }
```

---

## 🎨 Component Examples

### ImageUpload Component

```typescript
import { useState } from 'react';
import { imageService } from '@/services/imageService';

export function ImageUpload() {
  const [dogName, setDogName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!photo || !dogName) return;

    setLoading(true);
    try {
      const base64 = await convertToBase64(photo);
      const result = await imageService.generateImage({
        dogName,
        photo: base64,
      });
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <input 
        type="text" 
        placeholder="Dog name"
        value={dogName}
        onChange={(e) => setDogName(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      />
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <button 
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        {loading ? 'Processing...' : 'Generate Coloring Page'}
      </button>
    </div>
  );
}
```

---

## 🚀 Deployment

### Deploy to Vercel

**Option 1: Via Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select GitHub repository
3. Click Deploy
4. Vercel auto-deploys on every push to `main`

**Option 2: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
```

### Environment Variables in Vercel

1. Go to Settings → Environment Variables
2. Add:
   ```
   REACT_APP_API_URL=https://api.dogcoloringbooks.com
   REACT_APP_ENV=production
   ```

### Custom Domain

1. Go to Settings → Domains
2. Add your domain
3. Follow DNS setup instructions

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ImageUpload.test.tsx
```

---

## 📊 Performance Optimization

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';

const BulkUpload = lazy(() => import('./pages/BulkUpload'));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <BulkUpload />
    </Suspense>
  );
}
```

### Image Optimization
- Use WebP format when possible
- Compress images before upload
- Implement lazy loading for gallery views

### Bundle Size
- Monitor with: `npm run build -- --analyze`
- Tree-shake unused dependencies
- Use dynamic imports for large features

---

## 🐛 Debugging

### Development Mode
```bash
# Start with debugging enabled
npm run dev

# Open DevTools (F12)
# Check Console, Network, React DevTools
```

### Common Issues

**Issue:** CORS errors when calling backend
```
Solution: Check backend CORS configuration
         Verify REACT_APP_API_URL environment variable
         Ensure backend is running
```

**Issue:** Images not loading
```
Solution: Check Google Drive image URLs are accessible
         Verify authentication with Google
         Check image sharing settings
```

**Issue:** Slow performance
```
Solution: Reduce bundle size
         Implement code splitting
         Optimize images
         Use React.memo for expensive components
```

---

## 📚 Documentation

- **[API Documentation](../dog-coloring-books-backend/README.md)** - Backend API reference
- **[Deployment Guide](./DEPLOYMENT.md)** - Detailed deployment instructions
- **[Architecture](./ARCHITECTURE.md)** - System design and decisions
- **[Contributing](./CONTRIBUTING.md)** - How to contribute

---

## 🔐 Security

- Never commit `.env.local` file
- Don't expose API keys in client code
- Use environment variables for sensitive data
- Validate all user inputs before sending to backend
- Implement proper error handling
- HTTPS only in production

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 Git Workflow

```bash
# Create feature branch from develop
git checkout -b feature/your-feature develop

# Make changes and commit
git commit -m "Add feature description"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
# After review and approval, merge to develop
# Then merge develop to main for production release
```

---

## 🎯 Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Make changes
   - Test locally
   - Push to GitHub

2. **Pull Request**
   - Create PR against `develop`
   - Request code review
   - Fix any issues
   - Merge to `develop`

3. **Release to Production**
   - Create PR from `develop` to `main`
   - Final testing and approval
   - Merge to `main`
   - Auto-deploy via Vercel
   - Create GitHub release

---

## 📊 Monitoring

### Vercel Analytics
- Dashboard shows page load times, Core Web Vitals
- Monitor error rates and performance
- Set up alerts for critical issues

### Error Tracking
- Implement error boundary components
- Send errors to monitoring service
- Log API failures

---

## 🆘 Support

- **Issues:** Create GitHub issue for bugs
- **Discussions:** Use GitHub discussions for questions
- **Documentation:** Check docs folder
- **Backend Issues:** See backend repository

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Author

**Taiye Promise Kotiku**
- Email: kotikutaiye@gmail.com
- Portfolio: https://taiye.framer.website
- GitHub: https://github.com/taiye-kotiku

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for hosting and deployment
- Google for APIs (Gemini, Drive, Sheets)
- Tailwind CSS for styling utilities

---

**Last Updated:** December 2025  
**Status:** Production  
**Current Version:** 1.0.0