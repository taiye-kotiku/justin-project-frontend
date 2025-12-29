import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { BulkImageGenerator } from '../../components/BulkImageGenerator';

global.fetch = vi.fn();

describe('BulkImageGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    render(<BulkImageGenerator />);
    
    expect(screen.getByText('📦 Bulk Image Generator')).toBeInTheDocument();
    expect(screen.getByText('Add Dog Names')).toBeInTheDocument();
  });

  it('should allow entering dog names', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy, Max, Luna' } });
    
    expect(textarea).toHaveValue('Buddy, Max, Luna');
  });

  it('should add dogs when clicking Add Dogs button', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy, Max' } });
    
    const addButton = screen.getByText('➕ Add Dogs');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('should clear textarea after adding dogs', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy' } });
    
    const addButton = screen.getByText('➕ Add Dogs');
    fireEvent.click(addButton);
    
    expect(textarea).toHaveValue('');
  });

  it('should disable add button when textarea is empty', () => {
    render(<BulkImageGenerator />);
    
    const addButton = screen.getByText('➕ Add Dogs');
    expect(addButton).toBeDisabled();
  });

  it('should show template selection after adding dogs', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy' } });
    
    const addButton = screen.getByText('➕ Add Dogs');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Marketing Template')).toBeInTheDocument();
  });

  it('should allow editing captions for each dog', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy' } });
    fireEvent.click(screen.getByText('➕ Add Dogs'));
    
    const captionTextarea = screen.getByPlaceholderText('Instagram caption...');
    fireEvent.change(captionTextarea, { target: { value: 'Custom caption' } });
    
    expect(captionTextarea).toHaveValue('Custom caption');
  });

  it('should allow removing dogs', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: 'Buddy' } });
    fireEvent.click(screen.getByText('➕ Add Dogs'));
    
    const removeButton = screen.getByText('✕ Remove');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('Buddy')).not.toBeInTheDocument();
  });

  it('should handle multiple dog names with trimming', () => {
    render(<BulkImageGenerator />);
    
    const textarea = screen.getByPlaceholderText(/Enter dog names, separated by commas/i);
    fireEvent.change(textarea, { target: { value: ' Buddy , Max , Luna ' } });
    fireEvent.click(screen.getByText('➕ Add Dogs'));
    
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });
});