"use client";

import { Post } from "./types";

const STORAGE_KEY = "socialpilot_posts_v1";

export function getPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Post[];
  } catch {
    return [];
  }
}

export function savePosts(posts: Post[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function addPost(post: Post): Post[] {
  const posts = getPosts();
  const updated = [post, ...posts];
  savePosts(updated);
  return updated;
}

export function updatePost(id: string, data: Partial<Post>): Post[] {
  const posts = getPosts();
  const updated = posts.map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
  );
  savePosts(updated);
  return updated;
}

export function deletePost(id: string): Post[] {
  const posts = getPosts().filter((p) => p.id !== id);
  savePosts(posts);
  return posts;
}

export function getPostById(id: string): Post | undefined {
  return getPosts().find((p) => p.id === id);
}
