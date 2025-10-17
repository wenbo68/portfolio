// --- TYPES ---
export interface User {
  name?: string | null;
  image?: string | null;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
  userId: string;
  parentId: string | null;
  rating?: number | null;
  websiteUrl?: string | null;
  package?: 'basic' | 'standard' | null;
  replies?: Comment[];
}
