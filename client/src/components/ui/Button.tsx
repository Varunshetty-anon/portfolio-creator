import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast ease-out rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };

    const variantStyles = {
      primary: 'bg-bg-floating border border-border-strong text-text-primary hover:bg-bg-raised',
      secondary: 'bg-bg-floating border border-border-strong border-l-[3px] border-l-accent text-text-primary hover:bg-bg-raised',
      ghost: 'bg-transparent border border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
      danger: 'bg-transparent border border-danger/40 text-danger hover:bg-danger/10',
      accent: 'bg-accent text-[#0A0A0B] hover:bg-accent-hover border border-transparent',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
