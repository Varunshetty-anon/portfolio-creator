import { describe, it, expect } from 'vitest';
import { isNativeVideo, getBrandColor, getAspectRatioFromDims } from './utils';

describe('Utils', () => {
  describe('isNativeVideo', () => {
    it('should return true for Cloudinary URLs', () => {
      expect(isNativeVideo('https://res.cloudinary.com/demo/video/upload/sample.mp4')).toBe(true);
    });

    it('should return true for Firebase Storage URLs', () => {
      expect(isNativeVideo('https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/file.mp4')).toBe(true);
    });

    it('should return true for Dropbox URLs', () => {
      expect(isNativeVideo('https://dl.dropboxusercontent.com/s/xyz/video.mp4')).toBe(true);
    });

    it('should return true for native extensions', () => {
      expect(isNativeVideo('https://example.com/video.mp4')).toBe(true);
      expect(isNativeVideo('https://example.com/video.webm')).toBe(true);
      expect(isNativeVideo('https://example.com/video.mov')).toBe(true);
    });

    it('should return false for YouTube URLs', () => {
      expect(isNativeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    });

    it('should return false for empty or null URLs', () => {
      expect(isNativeVideo('')).toBe(false);
      // @ts-ignore
      expect(isNativeVideo(null)).toBe(false);
    });
  });

  describe('getBrandColor', () => {
    it('should return correct color for known tools', () => {
      expect(getBrandColor('Premiere Pro')).toBe('#9999FF');
      expect(getBrandColor('DaVinci Resolve')).toBe('#ff4747');
      expect(getBrandColor('ChatGPT')).toBe('#10A37F');
    });

    it('should return default white for unknown tools', () => {
      expect(getBrandColor('Unknown Tool')).toBe('#ffffff');
    });
  });

  describe('getAspectRatioFromDims', () => {
    it('should identify 16:9', () => {
      expect(getAspectRatioFromDims(1920, 1080)).toBe('16:9'); // 1.77
    });

    it('should identify 9:16', () => {
      expect(getAspectRatioFromDims(1080, 1920)).toBe('9:16'); // 0.56
    });

    it('should identify 1:1', () => {
      expect(getAspectRatioFromDims(1080, 1080)).toBe('1:1'); // 1.0
    });

    it('should identify 4:3', () => {
      expect(getAspectRatioFromDims(800, 600)).toBe('4:3'); // 1.33
    });

    it('should default to 16:9 for zero dims', () => {
      expect(getAspectRatioFromDims(0, 0)).toBe('16:9');
    });
  });
});
