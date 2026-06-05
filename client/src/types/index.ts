// ========================
// FRAMES Type Definitions
// ========================

export interface Socials {
  email: string;
  instagram?: string;
  discord?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface Project {
  _id?: string;
  id: string; // Client-side ID for new projects
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoSource: 'cloudinary' | 'youtube' | 'vimeo' | 'gdrive' | 'direct';
  aspectRatio: '16:9' | '9:16' | '4:3' | '1:1';
  contentType: string;
  subjectMatter: string;
  softwareUsed: string[];
  aiToolsUsed: string[];
  order: number;
}

export interface PortfolioData {
  _id?: string;
  userId?: string;
  username: string;
  isPublished: boolean;
  publishedAt?: string;

  // Profile
  name: string;
  role: string;
  bio: string;
  location: string;
  languages: string;
  contactEmail: string;
  profileImageUrl: string;

  // Showreel
  showreelUrl: string;
  showreelThumbnailUrl: string;

  // Socials
  socials: Socials;

  // Availability
  availability: {
    status: boolean;
    link?: string;
  };

  // Skills
  primaryTool: string;
  tools: string[];
  aiTools: string[];

  // Projects (embedded for drafts, or fetched separately)
  projects: Project[];

  // Optional live content
  liveContent?: any;
}

export interface User {
  _id: string;
  email: string;
  displayName: string;
  onboarded: boolean;
  googleId?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PortfolioStats {
  views: number;
  clicks: number;
  period?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========================
// Initial/Default Data
// ========================

export const INITIAL_PROJECT: Omit<Project, 'id' | 'order'> = {
  title: '',
  description: '',
  thumbnailUrl: '',
  videoUrl: '',
  videoSource: 'youtube',
  aspectRatio: '16:9',
  contentType: 'Brand Trailer',
  subjectMatter: '',
  softwareUsed: [],
  aiToolsUsed: [],
};

export const INITIAL_PORTFOLIO: PortfolioData = {
  username: '',
  isPublished: false,
  name: '',
  role: '',
  bio: 'I create visual stories that matter.',
  location: 'Remote',
  languages: 'English',
  contactEmail: '',
  profileImageUrl: '',
  showreelUrl: '',
  showreelThumbnailUrl: '',
  socials: {
    email: '',
  },
  availability: {
    status: true,
    link: '',
  },
  primaryTool: '',
  tools: [],
  aiTools: [],
  projects: [],
};
