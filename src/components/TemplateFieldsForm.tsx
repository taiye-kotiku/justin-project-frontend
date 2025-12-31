// src/components/TemplateFieldsForm.tsx

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'select';
  placeholder?: string;
  default?: string;
  required?: boolean;
  maxLength?: number;
  options?: string[]; // ✅ NEW - Support for select options
}

interface TemplateFieldsFormProps {
  fields: TemplateField[];
  values: Record<string, string | number | boolean | undefined>;
  onChange: (fieldId: string, value: string | number | boolean) => void;
  errors?: Record<string, string>;
}

export function TemplateFieldsForm({
  fields,
  values,
  onChange,
  errors
}: TemplateFieldsFormProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.id}>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-600 ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <div>
              <input
                type="text"
                value={String(values[field.id] || '')}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {field.maxLength && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {String(values[field.id] || '').length}/{field.maxLength}
                </p>
              )}
            </div>
          )}

          {field.type === 'textarea' && (
            <div>
              <textarea
                value={String(values[field.id] || '')}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {field.maxLength && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {String(values[field.id] || '').length}/{field.maxLength}
                </p>
              )}
            </div>
          )}

          {field.type === 'color' && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={String(values[field.id] || field.default || '#000000')}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                {String(values[field.id] || field.default)}
              </span>
            </div>
          )}

          {field.type === 'select' && (
            <select
              value={String(values[field.id] || field.default || '')}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {/* ✅ FIXED - Now renders select options if provided */}
              {field.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {errors?.[field.id] && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              ⚠️ {errors[field.id]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}