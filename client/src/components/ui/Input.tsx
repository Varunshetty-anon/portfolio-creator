import React, { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md';
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      leftIcon,
      rightElement,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs uppercase tracking-wider text-text-muted mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-0 pl-0 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-transparent border-0 border-b border-border text-text-primary placeholder:text-text-muted focus:ring-0 focus:outline-none focus:border-b-2 focus:border-accent transition-colors duration-fast ease-out ${
              leftIcon ? 'pl-8' : 'pl-0'
            } ${rightElement ? 'pr-10' : 'pr-0'} ${
              size === 'sm' ? 'py-1 text-sm' : 'py-2 text-base'
            } ${error ? 'border-danger focus:border-danger' : ''} ${className}`}
            {...rest}
          />
          {rightElement && (
            <div className="absolute right-0 pr-0 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-danger mt-1">{error}</span>}
        {hint && !error && <span className="text-xs text-text-muted mt-1">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hint, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs uppercase tracking-wider text-text-muted mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full bg-transparent border-0 border-b border-border text-text-primary placeholder:text-text-muted focus:ring-0 focus:outline-none focus:border-b-2 focus:border-accent transition-colors duration-fast ease-out py-2 text-base min-h-[80px] resize-y ${
            error ? 'border-danger focus:border-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger mt-1">{error}</span>}
        {hint && !error && <span className="text-xs text-text-muted mt-1">{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
