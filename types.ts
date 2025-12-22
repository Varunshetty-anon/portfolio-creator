

export interface Album {
  id: string;
  title: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  link: string; // Can be direct URL or Google Drive link
  driveLink?: string; 
  category: string; // Deprecated in favor of contentType/subjectMatter but kept for compatibility
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  type: 'video' | 'image'; 
  
  // Enhanced Metadata
  contentType?: string;
  subjectMatter?: string;
  softwareUsed?: string[]; // List of tool names
  
  // Organization
  albumId?: string; 
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface Socials {
  email: string;
  instagram?: string;
  discord?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

// The content payload for a portfolio
export interface PortfolioContent {
  username: string; 
  name: string;
  role: string;
  location: string;
  languages: string;
  bio: string;
  contactEmail: string;
  profileImage: string;
  showreelThumbnail: string;
  showreelLink: string;
  socials: Socials;
  testimonials: Testimonial[];
  skills: string[];
  primaryTool: string;
  tools: string[];
  aiTools: string[];
  projects: Project[];
  albums: Album[];
  availability: {
    status: boolean;
    link?: string;
  };
}

// User Metadata (users/{uid})
export interface UserProfile {
  uid: string;
  email: string;
  onboarded: boolean;
  createdAt: number;
}

// Portfolio Metadata (portfolios/{uid})
export interface PortfolioMeta {
  ownerUid: string;
  slug: string;
  publish: {
    isPublished: boolean;
    liveVersion: string | null;
    publishedAt: number | null;
  };
  stats?: {
    views: number;
    clicks: number;
  };
}

// Unified Type for App State (Legacy compatibility wrapper)
export interface PortfolioData extends PortfolioContent {
  uid?: string; // Owner UID
  settings?: {
    username: string; // This is actually the slug
    password: string; 
  };
  meta?: PortfolioMeta; // Attached metadata during load
  stats?: {
    views: number;
    clicks: number;
  };
}

export const INITIAL_CONTENT: PortfolioContent = {
  username: "", // slug
  name: "VARU", // Default name as requested
  role: "",
  location: "Remote",
  languages: "English",
  bio: "I create visual stories that matter.",
  contactEmail: "",
  profileImage: "https://picsum.photos/id/64/400/400",
  showreelThumbnail: "https://picsum.photos/id/190/800/450",
  showreelLink: "", 
  socials: {
    email: "",
  },
  availability: {
    status: true,
    link: ""
  },
  testimonials: [],
  skills: [],
  primaryTool: "",
  tools: [],
  aiTools: [],
  projects: [],
  albums: [],
};

export const INITIAL_DATA: PortfolioData = {
  ...INITIAL_CONTENT,
  uid: "guest",
  settings: {
    username: "guest",
    password: ""
  }
};