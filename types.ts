export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailBlob?: Blob;
  link: string; // Can be direct URL or Google Drive link
  driveLink?: string; // Explicit field for drive link if needed, or re-use link
  customVideoBlob?: Blob;
  category: string;
  aspectRatio?: '16:9' | '9:16';
  type: 'video' | 'image'; 
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

export interface PortfolioData {
  uid?: string; 
  username: string; 
  name: string;
  role: string;
  location: string;
  languages: string;
  bio: string;
  contactEmail: string;
  profileImage: string;
  profileImageBlob?: Blob;
  showreelThumbnail: string;
  showreelThumbnailBlob?: Blob;
  showreelLink: string;
  showreelBlob?: Blob;
  socials: Socials;
  testimonials: Testimonial[];
  skills: string[];
  primaryTool: string;
  tools: string[];
  aiTools: string[];
  projects: Project[];
  availability: {
    status: boolean;
    link?: string;
  };
  settings: {
    username: string; 
    password: string; 
  };
}

export const INITIAL_DATA: PortfolioData = {
  username: "guest",
  name: "", // Empty to trigger onboarding
  role: "",
  location: "Earth",
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
  settings: {
    username: "admin",
    password: "password"
  }
};