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
        className={`w-full bg-zinc-900/50 border rounded-lg py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 ${
          icon ? 'pl-10 pr-4' : 'px-4'
        } ${error ? 'border-red-500/50' : 'border-zinc-800'} ${className}`}
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
      className={`w-full bg-zinc-900/50 border rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-600 ${
        error ? 'border-red-500/50' : 'border-zinc-800'
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-xs text-red-400">{error}</p>
    )}
  </div>
);
