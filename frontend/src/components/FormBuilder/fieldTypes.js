// Form Field Type Definitions

export const fieldTypes = [
  {
    id: 'text',
    name: 'Short Text',
    icon: '📝',
    type: 'text',
    category: 'basic',
    defaultConfig: {
      label: 'Text Field',
      placeholder: 'Enter text',
      required: false,
      validation: {}
    }
  },
  {
    id: 'textarea',
    name: 'Long Text',
    icon: '📄',
    type: 'textarea',
    category: 'basic',
    defaultConfig: {
      label: 'Long Text',
      placeholder: 'Enter detailed text',
      required: false,
      rows: 4
    }
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    type: 'email',
    category: 'basic',
    defaultConfig: {
      label: 'Email Address',
      placeholder: 'your@email.com',
      required: true,
      validation: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
      }
    }
  },
  {
    id: 'phone',
    name: 'Phone',
    icon: '📞',
    type: 'tel',
    category: 'basic',
    defaultConfig: {
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      required: false
    }
  },
  {
    id: 'number',
    name: 'Number',
    icon: '🔢',
    type: 'number',
    category: 'basic',
    defaultConfig: {
      label: 'Number',
      placeholder: 'Enter number',
      required: false,
      validation: {}
    }
  },
  {
    id: 'date',
    name: 'Date',
    icon: '📅',
    type: 'date',
    category: 'basic',
    defaultConfig: {
      label: 'Date',
      required: false
    }
  },
  {
    id: 'select',
    name: 'Dropdown',
    icon: '📋',
    type: 'select',
    category: 'choice',
    defaultConfig: {
      label: 'Dropdown',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    id: 'radio',
    name: 'Single Choice',
    icon: '🔘',
    type: 'radio',
    category: 'choice',
    defaultConfig: {
      label: 'Single Choice',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    id: 'checkbox',
    name: 'Multiple Choice',
    icon: '☑️',
    type: 'checkbox',
    category: 'choice',
    defaultConfig: {
      label: 'Multiple Choice',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    id: 'file',
    name: 'File Upload',
    icon: '📎',
    type: 'file',
    category: 'advanced',
    defaultConfig: {
      label: 'File Upload',
      required: false,
      accept: '*',
      maxSize: 5
    }
  },
  {
    id: 'rating',
    name: 'Rating',
    icon: '⭐',
    type: 'rating',
    category: 'advanced',
    defaultConfig: {
      label: 'Rating',
      required: false,
      maxRating: 5
    }
  },
  {
    id: 'agreement',
    name: 'Agreement',
    icon: '✅',
    type: 'agreement',
    category: 'advanced',
    defaultConfig: {
      label: 'I agree to the terms and conditions',
      required: true
    }
  }
];

export const renderFieldPreview = (field, value, onChange) => {
  const commonClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <input
          type={field.field_type}
          placeholder={field.placeholder}
          required={field.required}
          className={commonClasses}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    
    case 'textarea':
      return (
        <textarea
          placeholder={field.placeholder}
          required={field.required}
          rows={field.rows || 4}
          className={commonClasses}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    
    case 'date':
      return (
        <input
          type="date"
          required={field.required}
          className={commonClasses}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    
    case 'select':
      return (
        <select
          required={field.required}
          className={commonClasses}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          <option value="">Select an option</option>
          {field.options?.map((option, idx) => (
            <option key={idx} value={option}>{option}</option>
          ))}
        </select>
      );
    
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={option}
                required={field.required}
                checked={value === option}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={option}
                checked={Array.isArray(value) && value.includes(option)}
                onChange={(e) => {
                  const currentValue = Array.isArray(value) ? value : [];
                  const newValue = e.target.checked
                    ? [...currentValue, option]
                    : currentValue.filter(v => v !== option);
                  onChange(field.id, newValue);
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    
    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept={field.accept || '*'}
            required={field.required}
            className="hidden"
            id={`file-${field.id}`}
            onChange={(e) => onChange(field.id, e.target.files[0]?.name || '')}
          />
          <label htmlFor={`file-${field.id}`} className="cursor-pointer text-blue-600 hover:text-blue-700">
            {value ? value : 'Click to upload file'}
          </label>
          {field.maxSize && (
            <p className="text-xs text-gray-500 mt-2">Max size: {field.maxSize}MB</p>
          )}
        </div>
      );
    
    case 'rating':
      const maxRating = field.maxRating || 5;
      return (
        <div className="flex gap-2">
          {[...Array(maxRating)].map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(field.id, idx + 1)}
              className="text-2xl focus:outline-none"
            >
              {idx < (value || 0) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      );
    
    case 'agreement':
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required={field.required}
            checked={value || false}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">{field.label}</span>
        </label>
      );
    
    default:
      return <div className="text-gray-500">Unknown field type</div>;
  }
};
