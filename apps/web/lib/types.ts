export type SocialNetwork = "facebook" | "instagram" | "linkedin";

export type PostStatus = "draft" | "scheduled" | "published" | "error";

export type Tone = "professional" | "commercial" | "educational" | "humorous";

export interface Post {
  id: string;
  content: string;
  network: SocialNetwork;
  status: PostStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  hashtags: string[];
  title?: string;
}

export interface GenerateRequest {
  idea: string;
  network: SocialNetwork;
  tone: Tone;
}

export interface GenerateResponse {
  content: string;
  hashtags: string[];
}
