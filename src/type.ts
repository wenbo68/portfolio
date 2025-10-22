import z from 'zod';
import {
  packageEnum,
  type comments,
  type PackageType,
} from './server/db/schema';

// input type of getCommentTree procedure
export const GetCommentTreeInputSchema = z.object({
  rating: z.array(z.number()).optional(),
  packageType: z.array(z.enum(packageEnum.enumValues)).optional(),
  order: z.string().optional().default('created-desc'),
  page: z.number().min(1),
  pageSize: z.number().min(1),
});

export type GetCommentTreeInput = z.infer<typeof GetCommentTreeInputSchema>;

export type FlatCommentWithUser = typeof comments.$inferSelect & {
  userName: string | null;
  userImage: string | null;
};
export type CommentAndUser = typeof comments.$inferSelect & {
  user: {
    name: string | null;
    image: string | null;
  };
};
// return type of getCommentTree procedure
export type CommentTree = CommentAndUser & {
  replies: CommentTree[];
};

// used for handleUpdate() when clicking edit on review/reply
export type UpdateCommentInput = {
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

// comment filter types
export type FilterOption = { label: string; urlInput: string };
export type FilterGroupOption = { groupLabel: string; options: FilterOption[] };
