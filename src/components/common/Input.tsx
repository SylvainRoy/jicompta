/**
 * Input Component
 */

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const isDate = props.type === 'date';
    const inputClasses = `
      w-full max-w-full min-w-0 box-border px-3 py-2
      ${isDate ? '' : 'border rounded-lg'}
      focus:outline-none focus:ring-2 focus:ring-blue-500
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${!isDate && (error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300')}
      ${className}
    `.trim();

    const inputEl = <input ref={ref} className={inputClasses} {...props} />;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {isDate ? (
          <div className={`overflow-hidden rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'}`}>
            {inputEl}
          </div>
        ) : inputEl}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
