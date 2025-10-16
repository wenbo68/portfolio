import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { comments, packageEnum } from '~/server/db/schema';

export const commentRouter = createTRPCRouter({
  /**
   * Fetches all comments and includes the author's details.
   * This is a public procedure, so anyone can view comments.
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Use Drizzle to fetch comments and join with the users table
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
   * This is a protected procedure, so only authenticated users can post.
   */
  add: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1, 'Comment cannot be empty.'),
        // parentId is optional; if present, it's a reply
        parentId: z.string().optional(),
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
      const { text, parentId, rating, websiteUrl, package: pkg } = input;
      const userId = ctx.session.user.id;

      // Use Drizzle to insert the new comment into the database
      await ctx.db.insert(comments).values({
        text,
        userId,
        parentId,
        rating,
        websiteUrl: websiteUrl || undefined, // Store undefined if empty string
        package: pkg,
      });

      return { success: true };
    }),
});
