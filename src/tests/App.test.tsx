import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './testUtils';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the app title', () => {
      render(<App />);
      expect(screen.getByText('Dog Coloring Books')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered Coloring Page Generator')).toBeInTheDocument();
    });

    it('renders tab navigation', () => {
      render(<App />);
      expect(screen.getByText('Single Image')).toBeInTheDocument();
      expect(screen.getByText('Bulk Generation')).toBeInTheDocument();
    });

    it('renders footer', () => {
      render(<App />);
      expect(screen.getByText('Powered by AI')).toBeInTheDocument();
    });

    it('renders SingleImageGenerator by default', () => {
      render(<App />);
      expect(screen.getByText('🎨 Single Image Generator')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to bulk generation tab', () => {
      render(<App />);
      
      const bulkTab = screen.getByText('Bulk Generation');
      fireEvent.click(bulkTab);
      
      expect(screen.getByText('📦 Bulk Image Generator')).toBeInTheDocument();
    });

    it('switches back to single image tab', () => {
      render(<App />);
      
      const bulkTab = screen.getByText('Bulk Generation');
      fireEvent.click(bulkTab);
      
      const singleTab = screen.getByText('Single Image');
      fireEvent.click(singleTab);
      
      expect(screen.getByText('🎨 Single Image Generator')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
      render(<App />);
      
      const singleTab = screen.getByText('Single Image');
      expect(singleTab).toHaveClass('from-blue-600');
      
      const bulkTab = screen.getByText('Bulk Generation');
      fireEvent.click(bulkTab);
      
      expect(bulkTab).toHaveClass('from-purple-600');
    });
  });

  describe('Dark Mode', () => {
    it('toggles dark mode', () => {
      render(<App />);
      
      const darkModeButton = screen.getByLabelText('Toggle dark mode');
      fireEvent.click(darkModeButton);
      
      expect(document.documentElement).toHaveClass('dark');
    });

    it('persists dark mode to localStorage', () => {
      render(<App />);
      
      const darkModeButton = screen.getByLabelText('Toggle dark mode');
      fireEvent.click(darkModeButton);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    });

    it('loads dark mode from localStorage', () => {
      localStorage.setItem('darkMode', 'true');
      
      render(<App />);
      
      expect(document.documentElement).toHaveClass('dark');
    });

    it('respects system preference when no localStorage value', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      render(<App />);
      
      expect(document.documentElement).toHaveClass('dark');
    });
  });
});