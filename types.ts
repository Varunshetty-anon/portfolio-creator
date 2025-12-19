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
  stats?: {
    views: number;
    clicks: number;
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
  },
  stats: {
    views: 0,
    clicks: 0
  }
};

export const DEMO_DATA: PortfolioData = {
  ...INITIAL_DATA,
  username: "demo",
  name: "Alex Rivera",
  role: "Senior Video Editor",
  location: "Los Angeles, CA",
  languages: "English, Spanish",
  bio: "Specializing in high-energy commercial edits and documentary storytelling. I transform raw footage into compelling narratives.",
  profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
  showreelThumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop",
  showreelLink: "https://www.youtube.com/watch?v=LXb3EKWsInQ", 
  socials: {
    email: "alex@example.com",
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
  },
  primaryTool: "DaVinci Resolve",
  tools: ["Premiere Pro", "After Effects", "Cinema 4D"],
  projects: [
    {
      id: "1",
      title: "Nike - Run Future",
      description: "A fast-paced commercial spot focusing on sound design and kinetic typography.",
      thumbnail: "https://images.unsplash.com/photo-1556906781-9a412961d289?q=80&w=1000&auto=format&fit=crop",
      link: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      category: "Commercial",
      type: "video",
      aspectRatio: "16:9"
    },
    {
      id: "2",
      title: "Urban Echoes",
      description: "Short documentary exploring the underground music scene in Berlin.",
      thumbnail: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop",
      link: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      category: "Documentary",
      type: "video",
      aspectRatio: "16:9"
    },
    {
      id: "3",
      title: "Social Shorts Vol. 1",
      description: "Collection of high-engagement vertical content for fashion brands.",
      thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
      link: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      category: "Social Media",
      type: "video",
      aspectRatio: "9:16"
    }
  ]
};