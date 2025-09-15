import { ReactElement } from 'react';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  lastUpdated?: string; 
  image?: string;
  preview?: string;
  author?: string;
  tagline?: string;
}

export interface Post {
  meta: PostMeta;
  Content: () => ReactElement;
}


// Import each post from its folder's index.tsx
import speedingUpStartup from './speeding-up-startup/index';

export const posts: Post[] = [
  speedingUpStartup,
];
