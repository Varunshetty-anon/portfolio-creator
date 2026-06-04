import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onEditClick?: () => void;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  editable = false,
  onEditClick,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  // Generate initials from name
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a consistent gradient based on name hash
  const getGradient = (name?: string) => {
    if (!name) return 'linear-gradient(135deg, var(--color-bg-floating), var(--color-bg-raised))';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c1 = `hsl(${Math.abs(hash) % 360}, 60%, 40%)`;
    const c2 = `hsl(${(Math.abs(hash) + 40) % 360}, 60%, 30%)`;
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-body font-medium text-white ${sizeStyles[size]} ${className} ${editable ? 'cursor-pointer group' : ''}`}
      style={{ background: src && !imgError ? 'transparent' : getGradient(name) }}
      onClick={editable ? onEditClick : undefined}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(name)
      )}

      {editable && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-1/2 h-1/2"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
      )}
    </div>
  );
};
