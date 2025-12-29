import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './testUtils';
import { BulkImageGenerator } from '../components/BulkImageGenerator';

describe('BulkImageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders component title', () => {
      render(<BulkImageGenerator />);
      expect(screen.getByText('📦 Bulk Image Generator')).toBeInTheDocument();
    });

    it('renders dog names textarea', () => {
      render(<BulkImageGenerator />);
      expect(screen.getByPlaceholderText(/Enter dog names, separated by commas/i)).toBeInTheDocument();
    });

    it('has add dogs button disabled initially', () => {
      render(<BulkImageGenerator />);
      const addButton = screen.getByText('➕ Add Dogs');
      expect(addButton).toBeDisabled();
    });
  });

  describe('Adding Dogs', () => {
    it('adds dogs from comma-separated list', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max, Buddy, Luna' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      expect(addButton).not.toBeDisabled();
      
      fireEvent.click(addButton);
      
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('Buddy')).toBeInTheDocument();
      expect(screen.getByText('Luna')).toBeInTheDocument();
    });

    it('trims whitespace from dog names', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: '  Max  ,  Buddy  ' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('filters empty names', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max,,Buddy,' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText(/Dogs \(2\)/)).toBeInTheDocument();
    });

    it('clears textarea after adding dogs', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max, Buddy' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(textarea).toHaveValue('');
    });
  });

  describe('Managing Dogs List', () => {
    it('displays dog count', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max, Buddy, Luna' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText(/Dogs \(3\)/)).toBeInTheDocument();
    });

    it('removes individual dogs', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max, Buddy' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const removeButtons = screen.getAllByText('✕ Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByText('Max')).not.toBeInTheDocument();
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('updates captions', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const captionInput = screen.getByPlaceholderText('Instagram caption...');
      fireEvent.change(captionInput, { target: { value: 'New caption for Max!' } });
      
      expect(captionInput).toHaveValue('New caption for Max!');
    });

    it('shows caption character count', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const captionInput = screen.getByPlaceholderText('Instagram caption...');
      fireEvent.change(captionInput, { target: { value: 'Test caption' } });
      
      expect(screen.getByText('12/300')).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('shows template selection when dogs are added', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText('✨ Customizable')).toBeInTheDocument();
      expect(screen.getByText('📷 Polaroid')).toBeInTheDocument();
    });

    it('switches between templates', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const polaroidButton = screen.getByText('📷 Polaroid');
      fireEvent.click(polaroidButton);
      
      expect(polaroidButton).toHaveClass('bg-pink-600');
    });

    it('shows customization form for customizable template', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText('✏️ Customize All Composites')).toBeInTheDocument();
    });
  });

  describe('Bulk Generation', () => {
    it('shows generate coloring pages button', () => {
      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      expect(screen.getByText('✨ Generate All Coloring Pages')).toBeInTheDocument();
    });

    it('generates coloring pages for all dogs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          originalImageUrl: 'https://example.com/original.jpg',
          generatedImageUrl: 'https://example.com/generated.jpg'
        })
      });
      global.fetch = mockFetch;

      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max, Buddy' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const generateButton = screen.getByText('✨ Generate All Coloring Pages');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Approval and Scheduling', () => {
    it('shows approve all button after composites are generated', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            originalImageUrl: 'https://example.com/original.jpg',
            generatedImageUrl: 'https://example.com/generated.jpg'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            compositeImageUrl: 'https://example.com/composite.jpg',
            compositeImageBase64: 'base64data'
          })
        });
      global.fetch = mockFetch;

      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const generateButton = screen.getByText('✨ Generate All Coloring Pages');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('🎨 Generate All Composites')).toBeInTheDocument();
      });
      
      const compositeButton = screen.getByText('🎨 Generate All Composites');
      fireEvent.click(compositeButton);
      
      await waitFor(() => {
        expect(screen.getByText('✅ Approve All')).toBeInTheDocument();
      });
    });

    it('approves all items', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            originalImageUrl: 'https://example.com/original.jpg',
            generatedImageUrl: 'https://example.com/generated.jpg'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            compositeImageUrl: 'https://example.com/composite.jpg',
            compositeImageBase64: 'base64data'
          })
        });
      global.fetch = mockFetch;

      render(<BulkImageGenerator />);
      
      const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
      fireEvent.change(textarea, { target: { value: 'Max' } });
      
      const addButton = screen.getByText('➕ Add Dogs');
      fireEvent.click(addButton);
      
      const generateButton = screen.getByText('✨ Generate All Coloring Pages');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        const compositeButton = screen.getByText('🎨 Generate All Composites');
        fireEvent.click(compositeButton);
      });
      
      await waitFor(() => {
        const approveButton = screen.getByText('✅ Approve All');
        fireEvent.click(approveButton);
        expect(screen.getByText(/Approved: 1/)).toBeInTheDocument();
      });
    });
  });
});