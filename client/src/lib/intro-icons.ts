export const getRoleIcons = (role: string): string[] => {
  if (!role) return ['×', '×', '×', '×'];
  
  const r = role.toLowerCase();

  if (r.includes('video editor') || r.includes('editor')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
      '—◆—',
      '▶',
      '◎',
      '∿'
    ];
  }

  if (r.includes('filmmaker') || r.includes('director')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.4-2.2 1.5-2.5l13.5-4c1.1-.3 2.2.4 2.5 1.5l.6 2.4z"/><path d="m5 11 2-5.5"/><path d="m9 10 2-5.5"/><path d="m13 8.7 2-5.5"/><path d="m17 7.5 2-5.5"/><path d="M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11Z"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="2"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8V4h4"/><path d="M4 16v4h4"/><path d="M20 8V4h-4"/><path d="M20 16v4h-4"/></svg>',
      '⊙'
    ];
  }

  if (r.includes('motion designer') || r.includes('motion')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c4-8 14-8 18 0"/></svg>',
      '△',
      '○',
      '□',
      'AE',
      '◆'
    ];
  }

  if (r.includes('colorist') || r.includes('color')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h20"/><path d="M2 12h20"/><path d="M2 18h20"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14v7"/><path d="M11 9v12"/><path d="M15 15v6"/><path d="M19 11v10"/></svg>'
    ];
  }

  if (r.includes('photographer')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
      '⊙',
      '◎',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14v7"/><path d="M11 9v12"/><path d="M15 15v6"/><path d="M19 11v10"/></svg>'
    ];
  }

  if (r.includes('vfx') || r.includes('visual effects')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="4" cy="4" r="1"/><circle cx="20" cy="4" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="4" cy="20" r="1"/><circle cx="20" cy="20" r="1"/><circle cx="16" cy="8" r="1"/></svg>',
      '⚡',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 10 18H2L12 2z"/><path d="m12 2-5 18"/><path d="m12 2 5 18"/><path d="M2 20 12 12"/><path d="M22 20 12 12"/></svg>',
      '✦',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>'
    ];
  }

  if (r.includes('graphic designer') || r.includes('designer')) {
    return [
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="4" cy="20" r="2"/><circle cx="20" cy="4" r="2"/><path d="M5.5 18.5 18.5 5.5"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="6" height="6" x="2" y="2"/><rect width="6" height="6" x="16" y="2"/><rect width="6" height="6" x="9" y="16"/></svg>',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
      '|'
    ];
  }

  // Default: FRAMES viewfinder marks
  return [
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8V4h4"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8V4h-4"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16v4h4"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16v4h-4"/></svg>'
  ];
};
