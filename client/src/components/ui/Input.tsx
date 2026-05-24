import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        className={`w-full bg-transparent border-b py-2.5 text-frames-text text-sm font-sans focus:outline-none focus:border-white transition-colors placeholder:text-frames-text-muted ${
          icon ? 'pl-8 pr-4' : 'px-0'
        } ${error ? 'border-red-500/50' : 'border-frames-border'} ${className}`}
        {...props}
      />
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-400">{error}</p>
    )}
  </div>
);

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
    )}
    <textarea
      className={`w-full bg-transparent border-b px-0 py-2.5 text-frames-text text-sm font-sans focus:outline-none focus:border-white transition-colors resize-none placeholder:text-frames-text-muted ${
        error ? 'border-red-500/50' : 'border-frames-border'
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-xs text-red-400">{error}</p>
    )}
  </div>
);
