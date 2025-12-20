import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input
      className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 ${className}`}
      {...props}
    />
  </div>
);

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>}
    <textarea
      className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-600 ${className}`}
      {...props}
    />
  </div>
);