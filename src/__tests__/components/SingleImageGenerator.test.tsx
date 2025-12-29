import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { SingleImageGenerator } from '../../components/SingleImageGenerator';

global.fetch = vi.fn();

describe('SingleImageGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with initial state', () => {
    render(<SingleImageGenerator />);
    
    expect(screen.getByText('🎨 Single Image Generator')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Upload Dog Photo')).toBeInTheDocument();
  });

  it('should allow entering dog name', () => {
    render(<SingleImageGenerator />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
    fireEvent.change(nameInput, { target: { value: 'Max' } });
    
    expect(nameInput).toHaveValue('Max');
  });

  it('should allow entering instagram handle', () => {
    render(<SingleImageGenerator />);
    
    const handleInput = screen.getByPlaceholderText('@yourhandle');
    fireEvent.change(handleInput, { target: { value: '@testhandle' } });
    
    expect(handleInput).toHaveValue('@testhandle');
  });

  it('should disable generate button when dog name is empty', () => {
    render(<SingleImageGenerator />);
    
    const generateButton = screen.getByText('✨ Generate Coloring Page');
    expect(generateButton).toBeDisabled();
  });

  it('should enable generate button when dog name is entered', () => {
    render(<SingleImageGenerator />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
    fireEvent.change(nameInput, { target: { value: 'Max' } });
    
    const generateButton = screen.getByText('✨ Generate Coloring Page');
    expect(generateButton).not.toBeDisabled();
  });

  it('should handle file upload', () => {
    render(<SingleImageGenerator />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Buddy, Max, Luna');
    fireEvent.change(nameInput, { target: { value: 'Max' } });
    
    const fileInput = screen.getByLabelText('Photo *');
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(fileInput.files?.[0]).toBe(file);
  });
});