import type { comments, PackageType } from './server/db/schema';

type CommentAndUser = typeof comments.$inferSelect & {
  user: {
    name: string | null;
    image: string | null;
  };
};

export type CommentTree = CommentAndUser & {
  replies: CommentTree[];
};

export type updateCommentInput = {
  e: React.FormEvent;
  id: string;
  text: string;
} & (
  | {
      type: 'review';
      selectedPackage: PackageType;
      rating: number;
      websiteUrl: string;
    }
  | {
      type: 'reply';
      selectedPackage: undefined;
      rating: undefined;
      websiteUrl: undefined;
    }
);
