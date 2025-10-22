import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { comments, packageEnum, users } from '~/server/db/schema';
import { TRPCError } from '@trpc/server';
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm';
import {
  GetCommentTreeInputSchema,
  type CommentTree,
  type FlatCommentWithUser,
} from '~/type';

export const commentRouter = createTRPCRouter({
  getAverageRating: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        average: avg(comments.rating),
        count: count(comments.rating),
      })
      .from(comments)
      .where(isNotNull(comments.rating));

    const averageRating = result[0]?.average ?? null;
    const ratingCount = result[0]?.count ?? 0;

    return {
      averageRating: averageRating ? parseFloat(averageRating) : 0,
      ratingCount: ratingCount,
    };
  }),

  getCommentTree: publicProcedure
    .input(GetCommentTreeInputSchema)
    .query(async ({ ctx, input }) => {
      const { rating, packageType, order, page, pageSize } = input;

      // ... (Steps 1, 2, and 3 for getting topLevelCommentIds are correct and unchanged)
      const conditions = [isNull(comments.parentId)];
      if (rating && rating.length > 0) {
        conditions.push(inArray(comments.rating, rating));
      }
      if (packageType && packageType.length > 0) {
        conditions.push(inArray(comments.package, packageType));
      }
      const whereClause = and(...conditions);

      const countResult = await ctx.db
        .select({ value: count() })
        .from(comments)
        .where(whereClause);

      const totalCommentCount = countResult[0]?.value ?? 0;
      const totalPages = Math.ceil(totalCommentCount / pageSize);

      // 3. Build the dynamic ORDER BY clauses for use in the raw SQL
      let topLevelOrderByClause;
      let finalOrderByClause;

      switch (order) {
        case 'rating-desc':
          topLevelOrderByClause = desc(comments.rating); // Use Drizzle's desc() helper
          finalOrderByClause = sql`root_rating DESC, "createdAt" ASC`;
          break;
        case 'rating-asc':
          topLevelOrderByClause = asc(comments.rating); // Use Drizzle's asc() helper
          finalOrderByClause = sql`root_rating ASC, "createdAt" ASC`;
          break;
        case 'created-asc':
          topLevelOrderByClause = asc(comments.createdAt); // Use Drizzle's asc() helper
          finalOrderByClause = sql`root_created_at ASC, "createdAt" ASC`;
          break;
        default: // 'created-desc'
          topLevelOrderByClause = desc(comments.createdAt); // Use Drizzle's desc() helper
          finalOrderByClause = sql`root_created_at DESC, "createdAt" ASC`;
          break;
      }

      // 4. Use a single RAW Recursive CTE query for everything
      const query = sql<FlatCommentWithUser>`
        WITH RECURSIVE 
        paginated_top_level_ids AS (
          -- FIX: Removed the "AS c" alias.
          -- The Drizzle whereClause and orderBy objects correctly reference the base table.
          SELECT ${comments.id} as id
          FROM ${comments}
          WHERE ${whereClause}
          ORDER BY ${topLevelOrderByClause}
          LIMIT ${pageSize}
          OFFSET ${(page - 1) * pageSize}
        ),
        comment_tree AS (
          -- Base Case: Alias 'c' is fine here because it's used consistently within this block.
          SELECT 
            c.*,
            c.rating AS root_rating,
            c."createdAt" AS root_created_at
          FROM ${comments} AS c
          WHERE c.id IN (SELECT id FROM paginated_top_level_ids)
          
          UNION ALL
          
          -- Recursive Step: This part is unchanged and correct.
          SELECT 
            c.*,
            ct.root_rating,
            ct.root_created_at
          FROM ${comments} AS c
          JOIN comment_tree AS ct ON ct.id = c."parentId"
        )
        -- Final selection, joining with users (unchanged and correct)
        SELECT 
          ct.id,
          ct.text,
          ct.rating,
          ct."websiteUrl",
          ct.package,
          ct."userId",
          ct."parentId",
          ct."createdAt",
          u.name AS "userName",
          u.image AS "userImage"
        FROM comment_tree AS ct
        LEFT JOIN ${users} AS u ON ct."userId" = u.id
        ORDER BY ${finalOrderByClause};
      `;

      const rawResult = await ctx.db.execute(query);
      // db.execute returns a RowList (an array-like result); cast it to the expected type.
      const commentResult = rawResult as unknown as FlatCommentWithUser[];

      // 5. Build the tree structure (this logic remains the same and is correct)
      const commentMap = new Map<string, CommentTree>();
      const topLevelCommentIds = commentResult
        .filter((c) => c.parentId === null)
        .map((c) => c.id);

      for (const comment of commentResult) {
        const { userName, userImage, ...commentData } = comment;
        commentMap.set(comment.id, {
          ...commentData,
          user: { name: userName, image: userImage },
          replies: [],
        });
      }

      const commentTree: CommentTree[] = [];
      for (const comment of commentResult) {
        const commentNode = commentMap.get(comment.id)!;
        if (comment.parentId && commentMap.has(comment.parentId)) {
          const parentNode = commentMap.get(comment.parentId)!;
          parentNode.replies.push(commentNode);
        } else if (topLevelCommentIds.includes(comment.id)) {
          // This check ensures we only push the paginated top-level comments
          commentTree.push(commentNode);
        }
      }

      return {
        commentTree,
        totalPages,
      };
    }),

  // searchAndFilter: publicProcedure
  //   .input(
  //     z.object({
  //       rating: z.array(z.number()),
  //       order: z.string(),
  //       page: z.number(),
  //       pageSize: z.number(),
  //       needTotalPages: z.boolean(),
  //     })
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const { rating, order, page, pageSize, needTotalPages } = input;

  //     // 1. create subquery for getting how many total media there are
  //     // also create query for getting the actual data
  //     const fromClause = (qb: any) => qb.from(comments).$dynamic();

  //     const countSubquery = fromClause(ctx.db.select({ id: comments.id }));
  //     const dataQueryBuilder = fromClause(
  //       ctx.db.select({
  //         comments: comments,
  //       })
  //     );

  //     // 2. apply all conditions to count and data query
  //     const conditions = [];
  //     if (rating && rating.length > 0) {
  //       conditions.push(inArray(comments.rating, rating));
  //     }
  //     if (conditions.length > 0) {
  //       countSubquery.where(and(...conditions));
  //       dataQueryBuilder.where(and(...conditions));
  //     }

  //     // 3. Get the Total Count from the Subquery
  //     // This is now very efficient. The database does all the hard work and returns one row.
  //     const countResult = needTotalPages
  //       ? await ctx.db.select({ count: count() }).from(countSubquery.as('sq'))
  //       : [];
  //     const totalCommentCount = countResult[0]?.count ?? 0;
  //     const totalPages = Math.ceil(totalCommentCount / pageSize);

  //     // 4. add order by to data query
  //     let orderByClause;
  //     switch (order) {
  //       case 'rating-desc':
  //         orderByClause = desc(comments.rating);
  //         break;
  //       case 'rating-asc':
  //         orderByClause = asc(comments.rating);
  //         break;
  //       case 'created-desc':
  //         orderByClause = desc(comments.createdAt);
  //         break;
  //       case 'created-asc':
  //         orderByClause = asc(comments.createdAt);
  //         break;
  //     }
  //     if (orderByClause) dataQueryBuilder.orderBy(orderByClause);

  //     // 5. get all media for chosen page
  //     const pageComments = await dataQueryBuilder
  //       .limit(pageSize)
  //       .offset((page - 1) * pageSize);

  //     return {
  //       pageComments,
  //       totalPages,
  //     };
  //   }),

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
