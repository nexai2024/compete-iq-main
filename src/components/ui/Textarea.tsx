import React, { useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, showCharCount = false, maxLength, className = '', id, value, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null
    ].filter(Boolean).join(' ');

    const currentLength = value ? String(value).length : 0;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${className}`}
          {...props}
        />
        <div className="mt-1 flex justify-between items-center">
          <div>
            {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
            {helperText && !error && <p id={helperId} className="text-sm text-gray-500">{helperText}</p>}
          </div>
          {showCharCount && maxLength && (
            <p className={`text-sm ${currentLength > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
              {currentLength} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
