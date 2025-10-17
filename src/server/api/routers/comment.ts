import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { comments, packageEnum } from '~/server/db/schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

export const commentRouter = createTRPCRouter({
  /**
   * Fetches all comments.
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
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
    return allComments;
  }),

  /**
   * Adds a new comment or reply.
   */
  add: protectedProcedure
    // ... (your existing 'add' procedure is perfect, no changes needed)
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
