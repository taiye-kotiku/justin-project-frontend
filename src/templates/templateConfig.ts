// src/templates/templateConfig.ts

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'select';
  placeholder?: string;
  default?: string;
  required?: boolean;
  maxLength?: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  fields: TemplateField[];
  hasAutoCaption: boolean;
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  customizable: {
    id: 'customizable',
    name: '✨ Customizable',
    icon: '🎨',
    description: 'Custom text, colors, and layout - full control',
    hasAutoCaption: false,
    fields: [
      {
        id: 'headerLine1',
        label: 'Header Line 1',
        type: 'text',
        placeholder: 'e.g., "Get Your"',
        default: 'Get Your',
        maxLength: 30,
        required: true
      },
      {
        id: 'headerLine2',
        label: 'Header Line 2',
        type: 'text',
        placeholder: 'e.g., "Coloring Page"',
        default: 'Coloring Page',
        maxLength: 30,
        required: true
      },
      {
        id: 'arrowText',
        label: 'Arrow Text',
        type: 'text',
        placeholder: 'e.g., "Just Color & Share!"',
        default: 'Just Color & Share!',
        maxLength: 25,
        required: false
      },
      {
        id: 'websiteText',
        label: 'Website/Handle',
        type: 'text',
        placeholder: '@yourhandle or yoursite.com',
        default: '@justgurian',
        maxLength: 30,
        required: true
      },
      {
        id: 'circleColor',
        label: 'Accent Color',
        type: 'color',
        default: '#8B5CF6',
        required: false
      },
      {
        id: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        default: '#FFFFFF',
        required: false
      }
    ]
  },

  polaroid: {
    id: 'polaroid',
    name: '📷 Polaroid',
    icon: '📸',
    description: 'Professional before/after layout - auto-generated',
    hasAutoCaption: true,
    fields: [] // No custom fields for Polaroid
  }
};

export function getTemplate(id: string): TemplateConfig {
  const template = TEMPLATES[id];
  if (!template) throw new Error(`Template ${id} not found`);
  return template;
}

export function validateTemplate(
  templateId: string,
  data: Record<string, string | number | boolean | undefined>
): { valid: boolean; errors: string[] } {
  const template = getTemplate(templateId);
  const errors: string[] = [];

  for (const field of template.fields) {
    const fieldValue = data[field.id];
    
    if (field.required && (!fieldValue || String(fieldValue).trim() === '')) {
      errors.push(`${field.label} is required`);
    }

    if (fieldValue && field.maxLength && String(fieldValue).length > field.maxLength) {
      errors.push(`${field.label} exceeds ${field.maxLength} characters`);
    }

    if (field.type === 'color' && fieldValue) {
      if (!/^#[0-9A-F]{6}$/i.test(String(fieldValue))) {
        errors.push(`${field.label} is not a valid color`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}