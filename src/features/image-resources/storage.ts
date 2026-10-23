import { ImageResource } from './types';

const STORAGE_KEY = 'notion_image_resources_v1';

export const loadResources = (): ImageResource[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load resources from storage:', err);
    return [];
  }
};

export const saveResources = (resources: ImageResource[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  } catch (err) {
    console.error('Failed to save resources to storage:', err);
  }
};
