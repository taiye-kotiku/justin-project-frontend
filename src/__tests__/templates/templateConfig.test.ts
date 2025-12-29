import { describe, it, expect } from 'vitest';
import { 
  TEMPLATES, 
  getTemplate, 
  validateTemplate 
} from '../../templates/templateConfig';

describe('templateConfig', () => {
  describe('TEMPLATES', () => {
    it('should have customizable template', () => {
      expect(TEMPLATES.customizable).toBeDefined();
      expect(TEMPLATES.customizable.name).toBe('✨ Customizable');
      expect(TEMPLATES.customizable.fields.length).toBeGreaterThan(0);
    });

    it('should have polaroid template', () => {
      expect(TEMPLATES.polaroid).toBeDefined();
      expect(TEMPLATES.polaroid.name).toBe('📷 Polaroid');
      expect(TEMPLATES.polaroid.fields.length).toBe(0);
    });

    it('should have correct field structure for customizable template', () => {
      const fields = TEMPLATES.customizable.fields;
      
      const headerLine1 = fields.find(f => f.id === 'headerLine1');
      expect(headerLine1).toBeDefined();
      expect(headerLine1?.type).toBe('text');
      expect(headerLine1?.required).toBe(true);
      expect(headerLine1?.maxLength).toBe(30);
    });
  });

  describe('getTemplate', () => {
    it('should return template by id', () => {
      const template = getTemplate('customizable');
      expect(template).toEqual(TEMPLATES.customizable);
    });

    it('should throw error for invalid template id', () => {
      expect(() => getTemplate('invalid')).toThrow('Template invalid not found');
    });

    it('should return polaroid template', () => {
      const template = getTemplate('polaroid');
      expect(template).toEqual(TEMPLATES.polaroid);
    });
  });

  describe('validateTemplate', () => {
    it('should validate required fields', () => {
      const data = {
        headerLine1: 'Get Your',
        headerLine2: 'Coloring Page',
        websiteText: '@justgurian'
      };
      
      const result = validateTemplate('customizable', data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const data = {
        headerLine1: '',
        headerLine2: 'Coloring Page',
        websiteText: '@justgurian'
      };
      
      const result = validateTemplate('customizable', data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Header Line 1 is required');
    });

    it('should validate maxLength constraint', () => {
      const data = {
        headerLine1: 'This is a very long header that exceeds maximum',
        headerLine2: 'Coloring Page',
        websiteText: '@justgurian'
      };
      
      const result = validateTemplate('customizable', data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
    });

    it('should validate color format', () => {
      const data = {
        headerLine1: 'Get Your',
        headerLine2: 'Coloring Page',
        websiteText: '@justgurian',
        circleColor: 'invalid-color'
      };
      
      const result = validateTemplate('customizable', data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not a valid color'))).toBe(true);
    });

    it('should accept valid color format', () => {
      const data = {
        headerLine1: 'Get Your',
        headerLine2: 'Coloring Page',
        websiteText: '@justgurian',
        circleColor: '#8B5CF6'
      };
      
      const result = validateTemplate('customizable', data);
      expect(result.valid).toBe(true);
    });

    it('should validate polaroid template with no required fields', () => {
      const data = {};
      
      const result = validateTemplate('polaroid', data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});