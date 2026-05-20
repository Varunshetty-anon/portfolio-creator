// ========================
// FRAMES ToolIcon Component
// ========================
// Renders a tool's icon with a three-tier fallback:
// 1. Simple Icons CDN
// 2. Clearbit Logo API
// 3. First letter text

import React, { useState } from 'react';

interface ToolIconProps {
  name: string;
  slug?: string;
  domain?: string;
  size?: number;
  className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({
  name,
  slug,
  domain,
  size = 20,
  className = '',
}) => {
  const [tier, setTier] = useState<1 | 2 | 3>(1);

  const toolSlug = slug || name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

  if (tier === 1) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${toolSlug}/white`}
        alt={name}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        onError={() => setTier(domain ? 2 : 3)}
        loading="lazy"
      />
    );
  }

  if (tier === 2 && domain) {
    return (
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        width={size}
        height={size}
        className={`inline-block rounded ${className}`}
        onError={() => setTier(3)}
        loading="lazy"
      />
    );
  }

  // Tier 3: Text fallback
  return (
    <span
      className={`inline-flex items-center justify-center rounded bg-zinc-800 text-zinc-400 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
};
