import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render the app header', () => {
    render(<App />);
    expect(screen.getByText('Dog Coloring Books')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Coloring Page Generator')).toBeInTheDocument();
  });

  it('should render tab navigation', () => {
    render(<App />);
    expect(screen.getByText('Single Image')).toBeInTheDocument();
    expect(screen.getByText('Bulk Generation')).toBeInTheDocument();
  });

  it('should switch between single and bulk tabs', () => {
    render(<App />);
    
    const bulkTab = screen.getByText('Bulk Generation');
    fireEvent.click(bulkTab);
    
    expect(screen.getByText('📦 Bulk Image Generator')).toBeInTheDocument();
  });

  it('should toggle dark mode', async () => {
    render(<App />);
    
    const darkModeButton = screen.getByLabelText('Toggle dark mode');
    fireEvent.click(darkModeButton);
    
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    });
  });

  it('should render footer', () => {
    render(<App />);
    expect(screen.getByText('Powered by AI')).toBeInTheDocument();
  });

  it('should default to single image tab', () => {
    render(<App />);
    expect(screen.getByText('🎨 Single Image Generator')).toBeInTheDocument();
  });
});