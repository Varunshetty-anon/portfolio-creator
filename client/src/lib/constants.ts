// ========================
// FRAMES Constants
// ========================

export interface ToolInfo {
  id: string;
  name: string;
  slug: string;
  domain: string;
  color: string;
}

export const EDITING_TOOLS_LIST: ToolInfo[] = [
  { id: 'premiere', name: 'Premiere Pro', slug: 'adobepremierepro', domain: 'adobe.com', color: '#9999FF' },
  { id: 'ae', name: 'After Effects', slug: 'adobeaftereffects', domain: 'adobe.com', color: '#9999FF' },
  { id: 'resolve', name: 'DaVinci Resolve', slug: 'davinciresolve', domain: 'blackmagicdesign.com', color: '#ff4747' },
  { id: 'fcp', name: 'Final Cut Pro', slug: 'finalcutpro', domain: 'apple.com', color: '#ffffff' },
  { id: 'capcut', name: 'CapCut', slug: 'capcut', domain: 'capcut.com', color: '#000000' },
  { id: 'avid', name: 'Avid Media Composer', slug: 'avid', domain: 'avid.com', color: '#6600cc' },
  { id: 'blender', name: 'Blender', slug: 'blender', domain: 'blender.org', color: '#EA7600' },
  { id: 'c4d', name: 'Cinema 4D', slug: 'cinema4d', domain: 'maxon.net', color: '#002E70' },
  { id: 'ue', name: 'Unreal Engine', slug: 'unrealengine', domain: 'unrealengine.com', color: '#0E1128' },
  { id: 'photoshop', name: 'Photoshop', slug: 'adobephotoshop', domain: 'adobe.com', color: '#31A8FF' },
  { id: 'illustrator', name: 'Illustrator', slug: 'adobeillustrator', domain: 'adobe.com', color: '#FF9A00' },
  { id: 'vegas', name: 'Sony Vegas', slug: 'vegas', domain: 'vegascreativesoftware.com', color: '#ffffff' },
  { id: 'nuke', name: 'Nuke', slug: 'nuke', domain: 'foundry.com', color: '#F7C429' },
  { id: 'maya', name: 'Maya', slug: 'autodeskmaya', domain: 'autodesk.com', color: '#37A5CC' },
  { id: 'houdini', name: 'Houdini', slug: 'houdini', domain: 'sidefx.com', color: '#FF4611' },
];

export const AI_TOOLS_LIST: ToolInfo[] = [
  { id: 'mj', name: 'Midjourney', slug: 'midjourney', domain: 'midjourney.com', color: '#ffffff' },
  { id: 'runway', name: 'RunwayML', slug: 'runway', domain: 'runwayml.com', color: '#FA5B8E' },
  { id: 'chatgpt', name: 'ChatGPT', slug: 'openai', domain: 'openai.com', color: '#10A37F' },
  { id: 'dalle', name: 'DALL-E', slug: 'openai', domain: 'openai.com', color: '#10A37F' },
  { id: 'sd', name: 'Stable Diffusion', slug: 'stabilityai', domain: 'stability.ai', color: '#ffffff' },
  { id: 'topaz', name: 'Topaz Video AI', slug: 'topaz', domain: 'topazlabs.com', color: '#ffffff' },
  { id: 'luma', name: 'Luma Dream Machine', slug: 'luma', domain: 'lumalabs.ai', color: '#ffffff' },
  { id: 'pika', name: 'Pika Labs', slug: 'pika', domain: 'pika.art', color: '#ffffff' },
  { id: 'kling', name: 'Kling AI', slug: 'kling', domain: 'kling.ai', color: '#ffffff' },
  { id: 'eleven', name: 'ElevenLabs', slug: 'elevenlabs', domain: 'elevenlabs.io', color: '#ffffff' },
  { id: 'sora', name: 'Sora', slug: 'openai', domain: 'openai.com', color: '#ffffff' },
  { id: 'veo', name: 'Google Veo', slug: 'google', domain: 'deepmind.google', color: '#4285F4' },
  { id: 'descript', name: 'Descript', slug: 'descript', domain: 'descript.com', color: '#17E088' },
  { id: 'submagic', name: 'Submagic', slug: 'submagic', domain: 'submagic.co', color: '#F6ADF6' },
];

export const PROJECT_CONTENT_TYPES = [
  { id: 'Trailer', label: 'Brand Trailer' },
  { id: 'Ad', label: 'Ad / Promotional Spot' },
  { id: 'Music Video', label: 'Music Video' },
  { id: 'Short Film', label: 'Short Film' },
  { id: 'Documentary', label: 'Documentary' },
  { id: 'Social', label: 'Social Media Content' },
  { id: 'Corporate', label: 'Corporate' },
  { id: 'Wedding', label: 'Wedding' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Vlog', label: 'Vlog' },
  { id: 'Showreel', label: 'Showreel' },
  { id: 'Other', label: 'Other' },
];

export const PROJECT_SUBJECT_MATTERS = [
  { id: 'Beauty', label: 'Beauty & Fashion' },
  { id: 'Tech', label: 'Tech' },
  { id: 'Lifestyle', label: 'Lifestyle' },
  { id: 'Auto', label: 'Automotive' },
  { id: 'Travel', label: 'Travel' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Narrative', label: 'Narrative' },
  { id: 'Education', label: 'Education' },
  { id: 'Real Estate', label: 'Real Estate' },
  { id: 'Food', label: 'Food & Beverage' },
  { id: 'Other', label: 'Other' },
];

export const CREATIVE_ROLES = [
  'Video Editor',
  'Motion Designer',
  'Graphic Designer',
  'Filmmaker',
  'Content Creator',
  '3D Artist',
  'Colorist',
  'VFX Artist',
  'Photographer',
  'Creative Director',
];

/**
 * Get brand color for a tool name.
 */
export const getBrandColor = (name: string): string => {
  const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
  return tool?.color || '#ffffff';
};

/**
 * Get tool info by name.
 */
export const getToolInfo = (name: string): ToolInfo | undefined => {
  return [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
};
