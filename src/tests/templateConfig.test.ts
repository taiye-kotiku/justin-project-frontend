import { describe, it, expect } from 'vitest';
import { 
  TEMPLATES, 
  getTemplate, 
  validateTemplate 
} from '../templates/templateConfig';

describe('templateConfig', () => {
  describe('TEMPLATES', () => {
    it('exports customizable template', () => {
      expect(TEMPLATES.customizable).toBeDefined();
      expect(TEMPLATES.customizable.id).toBe('customizable');
      expect(TEMPLATES.customizable.name).toBe('✨ Customizable');
    });

    it('exports polaroid template', () => {
      expect(TEMPLATES.polaroid).toBeDefined();
      expect(TEMPLATES.polaroid.id).toBe('polaroid');
      expect(TEMPLATES.polaroid.name).toBe('📷 Polaroid');
    });

    it('customizable template has fields', () => {
      expect(TEMPLATES.customizable.fields.length).toBeGreaterThan(0);
    });

    it('polaroid template has no fields', () => {
      expect(TEMPLATES.polaroid.fields.length).toBe(0);
      expect(TEMPLATES.polaroid.hasAutoCaption).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('returns customizable template', () => {
      const template = getTemplate('customizable');
      expect(template.id).toBe('customizable');
      expect(template.fields.length).toBeGreaterThan(0);
    });

    it('returns polaroid template', () => {
      const template = getTemplate('polaroid');
      expect(template.id).toBe('polaroid');
      expect(template.hasAutoCaption).toBe(true);
    });

    it('throws error for non-existent template', () => {
      expect(() => getTemplate('nonexistent')).toThrow('Template nonexistent not found');
    });
  });

  describe('validateTemplate', () => {
    describe('Customizable Template', () => {
      it('validates required fields', () => {
        const data = {
          headerLine1: 'Get Your',
          headerLine2: 'Coloring Page',
          websiteText: '@justgurian',
          circleColor: '#8B5CF6',
          backgroundColor: '#FFFFFF'
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('fails when required field is missing', () => {
        const data = {
          headerLine1: '',
          headerLine2: 'Coloring Page',
          websiteText: '@justgurian'
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Header Line 1 is required');
      });

      it('fails when field exceeds maxLength', () => {
        const data = {
          headerLine1: 'A'.repeat(31),
          headerLine2: 'Coloring Page',
          websiteText: '@justgurian'
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
      });

      it('validates color format', () => {
        const data = {
          headerLine1: 'Get Your',
          headerLine2: 'Coloring Page',
          websiteText: '@justgurian',
          circleColor: 'invalid'
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('not a valid color'))).toBe(true);
      });

      it('accepts valid hex colors', () => {
        const validColors = ['#000000', '#FFFFFF', '#8B5CF6', '#ff0000', '#ABC123'];
        
        validColors.forEach(color => {
          const data = {
            headerLine1: 'Get Your',
            headerLine2: 'Coloring Page',
            websiteText: '@justgurian',
            circleColor: color
          };
          
          const result = validateTemplate('customizable', data);
          expect(result.valid).toBe(true);
        });
      });

      it('rejects invalid hex colors', () => {
        const invalidColors = ['#FFF', '#GGGGGG', 'red', 'rgb(255,0,0)', '#12345'];
        
        invalidColors.forEach(color => {
          const data = {
            headerLine1: 'Get Your',
            headerLine2: 'Coloring Page',
            websiteText: '@justgurian',
            circleColor: color
          };
          
          const result = validateTemplate('customizable', data);
          expect(result.valid).toBe(false);
        });
      });

      it('allows optional fields to be empty', () => {
        const data = {
          headerLine1: 'Get Your',
          headerLine2: 'Coloring Page',
          websiteText: '@justgurian',
          arrowText: ''
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(true);
      });

      it('validates multiple errors', () => {
        const data = {
          headerLine1: '',
          headerLine2: 'A'.repeat(31),
          websiteText: '',
          circleColor: 'invalid'
        };
        
        const result = validateTemplate('customizable', data);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });

    describe('Polaroid Template', () => {
      it('validates polaroid template (no fields)', () => {
        const result = validateTemplate('polaroid', {});
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Template Field Types', () => {
    it('has correct field types in customizable template', () => {
      const template = getTemplate('customizable');
      
      const textFields = template.fields.filter(f => f.type === 'text');
      const colorFields = template.fields.filter(f => f.type === 'color');
      
      expect(textFields.length).toBeGreaterThan(0);
      expect(colorFields.length).toBeGreaterThan(0);
    });

    it('includes all required field properties', () => {
      const template = getTemplate('customizable');
      
      template.fields.forEach(field => {
        expect(field.id).toBeDefined();
        expect(field.label).toBeDefined();
        expect(field.type).toBeDefined();
        expect(['text', 'textarea', 'color', 'select']).toContain(field.type);
      });
    });

    it('has appropriate defaults for all fields', () => {
      const template = getTemplate('customizable');
      
      template.fields.forEach(field => {
        if (field.required) {
          expect(field.default).toBeDefined();
        }
      });
    });
  });
});