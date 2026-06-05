import React from 'react';
import PortfolioLayout from './PortfolioLayout';
import { INITIAL_PORTFOLIO } from '@/types';

export default function AuditPortfolio() {
  const mockData = {
    portfolio: {
      ...INITIAL_PORTFOLIO,
      name: 'Christopher Nolan',
      role: 'Director & Editor',
      bio: 'Crafting cinematic experiences that challenge the perception of time and space.',
      location: 'Los Angeles, CA',
      languages: 'English',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
      showreelUrl: 'https://www.youtube.com/watch?v=Jm-upHSP9KU',
    },
    projects: [
      {
        id: '1',
        title: 'Dunkirk: The Sound of Survival',
        description: 'An analysis of the ticking clock mechanism in the score.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=Jm-upHSP9KU',
        aspectRatio: '16:9',
        contentType: 'Case Study',
        subjectMatter: 'Sound Design',
        softwareUsed: ['Premiere', 'Pro Tools'],
        aiToolsUsed: [],
        order: 0,
      },
      {
        id: '2',
        title: 'Interstellar',
        description: 'Visual effects breakdown of the black hole.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=Jm-upHSP9KU',
        aspectRatio: '16:9',
        contentType: 'VFX Breakdown',
        subjectMatter: 'Visual Effects',
        softwareUsed: ['Nuke', 'Maya'],
        aiToolsUsed: [],
        order: 1,
      },
      {
        id: '3',
        title: 'Inception',
        description: 'Dream within a dream sequence editing.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=Jm-upHSP9KU',
        aspectRatio: '4:3',
        contentType: 'Editing',
        subjectMatter: 'Narrative',
        softwareUsed: ['Avid'],
        aiToolsUsed: [],
        order: 2,
      }
    ]
  };

  return <PortfolioLayout isPreviewMode draftData={mockData} />;
}
