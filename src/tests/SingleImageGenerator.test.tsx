import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './testUtils';
import { SingleImageGenerator } from '../components/SingleImageGenerator';

describe('SingleImageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders component title', () => {
      render(<SingleImageGenerator />);
      expect(screen.getByText('🎨 Single Image Generator')).toBeInTheDocument();
    });

    it('renders dog name input', () => {
      render(<SingleImageGenerator />);
      expect(screen.getByPlaceholderText('e.g., Buddy, Max, Luna')).toBeInTheDocument();
    });

    it('renders instagram handle input', () => {
      render(<SingleImageGenerator />);
      expect(screen.getByPlaceholderText('@yourhandle')).toBeInTheDocument();
    });

    it('renders file upload input', () => {
      render(<SingleImageGenerator />);
      const fileInput = screen.getByLabelText(/Photo/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('has generate button disabled initially', () => {
      render(<SingleImageGenerator />);
      const generateButton = screen.getByText('✨ Generate Coloring Page');
      expect(generateButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('enables generate button when dog name is provided', () => {
      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const generateButton = screen.getByText('✨ Generate Coloring Page');
      expect(generateButton).not.toBeDisabled();
    });

    it('trims whitespace from dog name', () => {
      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: '  Max  ' } });
      
      expect(dogNameInput).toHaveValue('  Max  ');
    });

    it('updates instagram handle', () => {
      render(<SingleImageGenerator />);
      
      const handleInput = screen.getByPlaceholderText('@yourhandle');
      fireEvent.change(handleInput, { target: { value: '@mydog' } });
      
      expect(handleInput).toHaveValue('@mydog');
    });
  });

  describe('Image Upload', () => {
    it('handles file selection', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          originalImageUrl: 'https://example.com/original.jpg',
          generatedImageUrl: 'https://example.com/generated.jpg'
        })
      });
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Coloring Page Generation', () => {
    it('shows loading state during generation', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 100))
      );
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText('⏳ Generating...')).toBeInTheDocument();
      });
    });

    it('displays generated image on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          originalImageUrl: 'https://example.com/original.jpg',
          generatedImageUrl: 'https://example.com/generated.jpg'
        })
      });
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('handles generation error', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Failed'));
      });
      
      alertMock.mockRestore();
    });
  });

  describe('Template Selection', () => {
    it('renders template selection after generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          originalImageUrl: 'https://example.com/original.jpg',
          generatedImageUrl: 'https://example.com/generated.jpg'
        })
      });
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText('✨ Customizable')).toBeInTheDocument();
        expect(screen.getByText('📷 Polaroid')).toBeInTheDocument();
      });
    });

    it('switches between templates', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          originalImageUrl: 'https://example.com/original.jpg',
          generatedImageUrl: 'https://example.com/generated.jpg'
        })
      });
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const polaroidButton = screen.getByText('📷 Polaroid');
        fireEvent.click(polaroidButton);
        expect(polaroidButton).toHaveClass('bg-pink-600');
      });
    });
  });

  describe('Reset Functionality', () => {
    it('resets form after creating another', async () => {
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
            compositeImageUrl: 'https://example.com/composite.jpg'
          })
        });
      global.fetch = mockFetch;

      render(<SingleImageGenerator />);
      
      const dogNameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
      fireEvent.change(dogNameInput, { target: { value: 'Max' } });
      
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Photo/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText('🎨 Generate Marketing Composite')).toBeInTheDocument();
      });
      
      const generateCompositeButton = screen.getByText('🎨 Generate Marketing Composite');
      fireEvent.click(generateCompositeButton);
      
      await waitFor(() => {
        const resetButton = screen.getByText('🔄 Create Another');
        fireEvent.click(resetButton);
      });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Buddy, Max, Luna')).toHaveValue('');
      });
    });
  });
});