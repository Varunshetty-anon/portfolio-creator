import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-frames-bg disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants: Record<string, string> = {
    primary:
      'bg-white text-black hover:bg-zinc-200 focus-visible:ring-zinc-500 border border-transparent shadow-cinematic',
    secondary:
      'bg-frames-surface-raised text-white hover:bg-frames-border focus-visible:ring-zinc-700 border border-frames-border',
    ghost:
      'bg-transparent text-frames-text-muted hover:text-white hover:bg-white/5',
    outline:
      'bg-transparent border border-frames-border text-frames-text-muted hover:border-white hover:text-white hover:shadow-cinematic-hover',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
