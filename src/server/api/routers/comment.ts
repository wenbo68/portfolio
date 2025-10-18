import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { comments, packageEnum } from '~/server/db/schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { CommentTree } from '~/type';

export const commentRouter = createTRPCRouter({
  getAllAsTree: publicProcedure.query(async ({ ctx }) => {
    // 1. Fetch all comments as a flat list, just like before
    const allComments = await ctx.db.query.comments.findMany({
      with: {
        user: {
          columns: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });

    // 2. Create a map for efficient O(1) lookups and nest the comments
    const commentMap = new Map<string, CommentTree>();
    const nestedComments: CommentTree[] = [];

    // First pass: Initialize all comments in the map and add a 'replies' array
    for (const comment of allComments) {
      commentMap.set(comment.id, { ...comment, replies: [] });
    }

    // Second pass: Build the nested structure
    for (const comment of allComments) {
      const commentNode = commentMap.get(comment.id)!; // We know it exists from the first pass

      if (comment.parentId) {
        const parentNode = commentMap.get(comment.parentId);
        if (parentNode) {
          // It's a reply, push it into its parent's 'replies' array
          parentNode.replies.push(commentNode);
        }
      } else {
        // It's a top-level comment
        nestedComments.push(commentNode);
      }
    }

    return nestedComments;
  }),

  /**
   * Adds a new comment or reply.
   */
  add: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1, 'Comment cannot be empty.'),
        parentId: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        websiteUrl: z
          .string()
          .url('Please enter a valid URL.')
          .optional()
          .or(z.literal('')),
        package: z.enum(packageEnum.enumValues).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { text, parentId, rating, websiteUrl, package: pkg } = input;
      const userId = ctx.session.user.id;

      await ctx.db.insert(comments).values({
        text,
        userId,
        parentId,
        rating,
        websiteUrl: websiteUrl || undefined,
        package: pkg,
      });

      return { success: true };
    }),

  /**
   * NEW: Updates an existing comment or reply.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().min(1, 'Comment cannot be empty.'),
        // These are optional and only apply to top-level reviews
        rating: z.number().min(1).max(5).optional(),
        websiteUrl: z
          .string()
          .url('Please enter a valid URL.')
          .optional()
          .or(z.literal('')),
        package: z.enum(packageEnum.enumValues).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, text, rating, websiteUrl, package: pkg } = input;
      const userId = ctx.session.user.id;

      // Find the existing comment to verify ownership
      const originalComment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!originalComment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (originalComment.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments.',
        });
      }

      // Perform the update
      await ctx.db
        .update(comments)
        .set({
          text,
          rating,
          websiteUrl: websiteUrl || null, // Store null if empty string
          package: pkg,
        })
        .where(eq(comments.id, id));

      return { success: true };
    }),

  /**
   * NEW: Deletes a comment or reply (and all its children).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;

      // Find the existing comment to verify ownership
      const commentToDelete = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!commentToDelete) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (commentToDelete.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments.',
        });
      }

      // Perform the delete. The 'onDelete: cascade' in the schema
      // will handle deleting all nested replies automatically.
      await ctx.db.delete(comments).where(eq(comments.id, id));

      return { success: true };
    }),
});
