import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { TemplateFieldsForm } from '../../components/TemplateFieldsForm';
import type { TemplateField } from '../../templates/templateConfig';

describe('TemplateFieldsForm Component', () => {
  const mockOnChange = vi.fn();

  const textField: TemplateField = {
    id: 'headerLine1',
    label: 'Header Line 1',
    type: 'text',
    placeholder: 'Enter header',
    default: 'Get Your',
    maxLength: 30,
    required: true
  };

  const colorField: TemplateField = {
    id: 'circleColor',
    label: 'Accent Color',
    type: 'color',
    default: '#8B5CF6',
    required: false
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render nothing when no fields provided', () => {
    const { container } = render(
      <TemplateFieldsForm
        fields={[]}
        values={{}}
        onChange={mockOnChange}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render text input field', () => {
    render(
      <TemplateFieldsForm
        fields={[textField]}
        values={{ headerLine1: 'Test' }}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Header Line 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter header')).toBeInTheDocument();
  });

  it('should show required indicator for required fields', () => {
    render(
      <TemplateFieldsForm
        fields={[textField]}
        values={{}}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should call onChange when text input changes', () => {
    render(
      <TemplateFieldsForm
        fields={[textField]}
        values={{ headerLine1: 'Test' }}
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter header');
    fireEvent.change(input, { target: { value: 'New Value' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('headerLine1', 'New Value');
  });

  it('should show character count for text fields with maxLength', () => {
    render(
      <TemplateFieldsForm
        fields={[textField]}
        values={{ headerLine1: 'Test' }}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('4/30')).toBeInTheDocument();
  });

  it('should render color input field', () => {
    render(
      <TemplateFieldsForm
        fields={[colorField]}
        values={{ circleColor: '#8B5CF6' }}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Accent Color')).toBeInTheDocument();
    const colorInput = screen.getByDisplayValue('#8B5CF6');
    expect(colorInput).toHaveAttribute('type', 'color');
  });

  it('should call onChange when color changes', () => {
    render(
      <TemplateFieldsForm
        fields={[colorField]}
        values={{ circleColor: '#8B5CF6' }}
        onChange={mockOnChange}
      />
    );
    
    const colorInput = screen.getByDisplayValue('#8B5CF6');
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('circleColor', '#FF0000');
  });

  it('should display error messages', () => {
    const errors = { headerLine1: 'This field is required' };
    
    render(
      <TemplateFieldsForm
        fields={[textField]}
        values={{}}
        onChange={mockOnChange}
        errors={errors}
      />
    );
    
    expect(screen.getByText('❌ This field is required')).toBeInTheDocument();
  });
});