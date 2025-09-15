import { posts } from '../posts';

export function getAllPosts(fields: string[] = []) {
  return posts
    .map((post) => {
      const items: Record<string, any> = {};
      fields.forEach((field) => {
        if (field === 'slug') items[field] = post.meta.slug;
        else if (field === 'content') items[field] = post.Content;
        else if (field in post.meta) items[field] = post.meta[field as keyof typeof post.meta];
      });
      return items;
    })
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}
