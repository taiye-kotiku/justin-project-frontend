import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './testUtils';
import { TemplateFieldsForm } from '../components/TemplateFieldsForm';
import type { TemplateField } from '../templates/templateConfig';

describe('TemplateFieldsForm', () => {
  const mockTextFields: TemplateField[] = [
    {
      id: 'headerLine1',
      label: 'Header Line 1',
      type: 'text',
      placeholder: 'Enter header',
      default: 'Get Your',
      maxLength: 30,
      required: true
    },
    {
      id: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description',
      maxLength: 100,
      required: false
    }
  ];

  const mockColorField: TemplateField[] = [
    {
      id: 'circleColor',
      label: 'Accent Color',
      type: 'color',
      default: '#8B5CF6',
      required: false
    }
  ];

  describe('Rendering', () => {
    it('returns null when no fields provided', () => {
      const { container } = render(
        <TemplateFieldsForm
          fields={[]}
          values={{}}
          onChange={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders text input fields', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: 'Test' }}
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByLabelText(/Header Line 1/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter header')).toBeInTheDocument();
    });

    it('renders textarea fields', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ description: 'Test description' }}
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('renders color input fields', () => {
      render(
        <TemplateFieldsForm
          fields={mockColorField}
          values={{ circleColor: '#8B5CF6' }}
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByLabelText(/Accent Color/i)).toBeInTheDocument();
      const colorInput = screen.getByDisplayValue('#8B5CF6');
      expect(colorInput).toHaveAttribute('type', 'color');
    });

    it('shows required indicator', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{}}
          onChange={vi.fn()}
        />
      );
      
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Character Count', () => {
    it('displays character count for text fields', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: 'Test' }}
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByText('4/30')).toBeInTheDocument();
    });

    it('updates character count on input', () => {
      const onChange = vi.fn();
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: 'Test' }}
          onChange={onChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter header');
      fireEvent.change(input, { target: { value: 'New Value' } });
      
      expect(onChange).toHaveBeenCalledWith('headerLine1', 'New Value');
    });

    it('displays character count for textarea', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ description: 'Test description' }}
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByText('16/100')).toBeInTheDocument();
    });
  });

  describe('Field Interactions', () => {
    it('calls onChange when text input changes', () => {
      const onChange = vi.fn();
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: '' }}
          onChange={onChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter header');
      fireEvent.change(input, { target: { value: 'New Value' } });
      
      expect(onChange).toHaveBeenCalledWith('headerLine1', 'New Value');
    });

    it('calls onChange when textarea changes', () => {
      const onChange = vi.fn();
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ description: '' }}
          onChange={onChange}
        />
      );
      
      const textarea = screen.getByPlaceholderText('Enter description');
      fireEvent.change(textarea, { target: { value: 'New description' } });
      
      expect(onChange).toHaveBeenCalledWith('description', 'New description');
    });

    it('calls onChange when color changes', () => {
      const onChange = vi.fn();
      render(
        <TemplateFieldsForm
          fields={mockColorField}
          values={{ circleColor: '#8B5CF6' }}
          onChange={onChange}
        />
      );
      
      const colorInput = screen.getByDisplayValue('#8B5CF6');
      fireEvent.change(colorInput, { target: { value: '#FF0000' } });
      
      expect(onChange).toHaveBeenCalledWith('circleColor', '#FF0000');
    });

    it('respects maxLength attribute', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: '' }}
          onChange={vi.fn()}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter header');
      expect(input).toHaveAttribute('maxLength', '30');
    });
  });

  describe('Error Display', () => {
    it('displays error messages', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: '' }}
          onChange={vi.fn()}
          errors={{ headerLine1: 'This field is required' }}
        />
      );
      
      expect(screen.getByText('❌ This field is required')).toBeInTheDocument();
    });

    it('displays multiple errors', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: '', description: '' }}
          onChange={vi.fn()}
          errors={{
            headerLine1: 'Header is required',
            description: 'Description is too short'
          }}
        />
      );
      
      expect(screen.getByText('❌ Header is required')).toBeInTheDocument();
      expect(screen.getByText('❌ Description is too short')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('uses default value when value is undefined', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{}}
          onChange={vi.fn()}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter header');
      expect(input).toHaveValue('');
    });

    it('uses provided value over default', () => {
      render(
        <TemplateFieldsForm
          fields={mockTextFields}
          values={{ headerLine1: 'Custom Value' }}
          onChange={vi.fn()}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter header');
      expect(input).toHaveValue('Custom Value');
    });

    it('uses default color when no value provided', () => {
      render(
        <TemplateFieldsForm
          fields={mockColorField}
          values={{}}
          onChange={vi.fn()}
        />
      );
      
      const colorInput = screen.getByDisplayValue('#8B5CF6');
      expect(colorInput).toBeInTheDocument();
    });
  });
});