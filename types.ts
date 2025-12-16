export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailBlob?: Blob;
  link: string;
  customVideoBlob?: Blob;
  category: string;
  aspectRatio?: '16:9' | '9:16';
  type: 'video' | 'image'; // New field to distinguish media type
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
  uid?: string; // Firebase Auth UID
  username: string; // Unique handle for public URL
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
    username: string; // Legacy/Fallback
    password: string; // Legacy/Fallback
  };
}

export const INITIAL_DATA: PortfolioData = {
  username: "guest",
  name: "Your Name",
  role: "Creative Director",
  location: "Earth",
  languages: "English",
  bio: "I create visual stories that matter. Welcome to my portfolio.",
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