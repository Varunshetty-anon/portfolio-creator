export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailBlob?: Blob; // For local DB storage
  link: string; // YouTube/Vimeo link or Blob URL
  customVideoBlob?: Blob; // For local DB storage
  category: string;
  aspectRatio?: '16:9' | '9:16'; // Support for vertical video
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
  name: string;
  role: string;
  location: string;
  languages: string;
  bio: string;
  contactEmail: string;
  profileImage: string;
  profileImageBlob?: Blob; // For local DB storage
  showreelThumbnail: string;
  showreelThumbnailBlob?: Blob; // For local DB storage
  showreelLink: string;
  showreelBlob?: Blob; // For local DB storage - NEW
  socials: Socials;
  testimonials: Testimonial[];
  skills: string[];
  primaryTool: string; // New field for the hero card
  tools: string[];
  aiTools: string[];
  projects: Project[];
  availability: {
    status: boolean; // true = Available, false = Busy
    link?: string;   // Optional link to current project if busy
  };
  settings: {
    username: string;
    password: string;
  };
}

export const INITIAL_DATA: PortfolioData = {
  name: "Varun Shetty",
  role: "Video Editor",
  location: "India",
  languages: "English, Hindi, Kannada",
  bio: "Video editor who works on everything from reels to long-form. I've spent more time on timelines than on sleep. Mostly patient—until the client asks for a new track after final render. Just here trying to make good stuff and not lose my mind.",
  contactEmail: "varun@example.com",
  profileImage: "https://picsum.photos/id/64/400/400",
  showreelThumbnail: "https://picsum.photos/id/190/800/450",
  showreelLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
  socials: {
    email: "varun@example.com",
    instagram: "varunshetty_edits",
    discord: "varun#1234",
    linkedin: "varunshetty",
    youtube: "varunshettyvlogs"
  },
  availability: {
    status: true,
    link: ""
  },
  testimonials: [
    {
      id: "1",
      name: "Sarah Jenkins",
      role: "Creative Director, HypeAgency",
      quote: "Varun has an incredible eye for pacing. He turned our raw footage into a masterpiece in record time."
    },
    {
      id: "2",
      name: "Mike Ross",
      role: "YouTuber (1M+ Subs)",
      quote: "The retention on my videos went up by 40% after Varun started editing them. Legend."
    }
  ],
  skills: ["Color Grading", "Sound Design", "Motion Graphics", "Storytelling"],
  primaryTool: "DaVinci Resolve",
  tools: ["Adobe Premiere Pro", "Adobe After Effects", "Final Cut Pro"],
  aiTools: ["RunwayML", "Google Veo", "Midjourney"],
  projects: [
    {
      id: "1",
      title: "Urban Hype Reel",
      description: "A fast-paced energetic reel showcasing the vibrant street life of Mumbai. Edited with dynamic transitions and beat-syncing.",
      thumbnail: "https://picsum.photos/id/238/600/800",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Reels",
      aspectRatio: "9:16"
    },
    {
      id: "2",
      title: "Cinematic Travel Vlog",
      description: "Documenting a journey through the Himalayas. Focus on sound design and color grading to evoke emotion.",
      thumbnail: "https://picsum.photos/id/249/600/800",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder valid external link for shareability
      category: "Long Form",
      aspectRatio: "16:9"
    },
  ],
  settings: {
    username: "admin",
    password: "cinefolio"
  }
};