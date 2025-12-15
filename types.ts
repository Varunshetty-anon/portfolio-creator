export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  link: string; // YouTube/Vimeo link
  category: string;
}

export interface Socials {
  email: string;
  instagram: string;
  discord: string;
  linkedin?: string;
}

export interface PortfolioData {
  name: string;
  role: string;
  location: string;
  languages: string;
  bio: string;
  profileImage: string;
  showreelThumbnail: string;
  showreelLink: string;
  socials: Socials;
  skills: string[];
  tools: string[];
  aiTools: string[];
  projects: Project[];
}

export const INITIAL_DATA: PortfolioData = {
  name: "Varun Shetty",
  role: "Video Editor",
  location: "India",
  languages: "English, Hindi, Kannada",
  bio: "Video editor who works on everything from reels to long-form. I've spent more time on timelines than on sleep. Mostly patient—until the client asks for a new track after final render. Just here trying to make good stuff and not lose my mind.",
  profileImage: "https://picsum.photos/id/64/400/400",
  showreelThumbnail: "https://picsum.photos/id/190/800/450",
  showreelLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
  socials: {
    email: "varun@example.com",
    instagram: "varunshetty_edits",
    discord: "varun#1234",
  },
  skills: ["Color Grading", "Sound Design", "Motion Graphics", "Storytelling"],
  tools: ["Adobe Premiere Pro", "Adobe After Effects", "DaVinci Resolve"],
  aiTools: ["RunwayML", "Google Veo", "Midjourney"],
  projects: [
    {
      id: "1",
      title: "Urban Hype Reel",
      thumbnail: "https://picsum.photos/id/238/600/800",
      link: "#",
      category: "Reels",
    },
    {
      id: "2",
      title: "Cinematic Travel Vlog",
      thumbnail: "https://picsum.photos/id/249/600/800",
      link: "#",
      category: "Long Form",
    },
    {
      id: "3",
      title: "Music Video Edit",
      thumbnail: "https://picsum.photos/id/453/600/800",
      link: "#",
      category: "Music Video",
    },
  ],
};