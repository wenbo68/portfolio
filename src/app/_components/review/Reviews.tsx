'use client';

import React, { useMemo } from 'react';
import { api } from '~/trpc/react';
import StarRating from './StarRating';
import type { Comment } from '~/type';
import Review from './Review';
import WriteReview from './WriteReview';

// --- MAIN COMPONENT ---
export default function Reviews() {
  const commentsQuery = api.comment.getAll.useQuery();
  // Get the tRPC utils for cache manipulation
  const utils = api.useUtils();

  const nestedComments = useMemo(() => {
    const commentList = commentsQuery.data;
    if (!commentList) return [];

    const commentMap: Record<string, Comment> = {};
    commentList.forEach((comment) => {
      // Ensure replies array exists for every comment
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    const result: Comment[] = [];
    commentList.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId];
        const child = commentMap[comment.id];
        if (parent && child && parent.replies) {
          // This check is now safer because we initialized replies above
          parent.replies.push(child);
        }
      } else {
        const top = commentMap[comment.id];
        if (top) {
          result.push(top);
        }
      }
    });
    return result;
  }, [commentsQuery.data]);

  const topLevelReviews = nestedComments.filter((c) => c.rating);
  const averageRating =
    topLevelReviews.length > 0
      ? (
          topLevelReviews.reduce(
            (acc, review) => acc + (review.rating ?? 0),
            0
          ) / topLevelReviews.length
        ).toFixed(1)
      : '0.0';

  return (
    <section className="flex flex-col gap-5">
      {/* title */}
      <div className="flex flex-col gap-0">
        <h2 className="text-lg font-semibold text-gray-300">Reviews</h2>
        <p className="text-sm text-gray-500">
          See what others are saying... or say something yourself!
        </p>
      </div>

      {/* overall rating */}
      {
        // topLevelReviews.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <StarRating
              rating={parseFloat(averageRating)}
              interactive={false}
            />
            <span className="text-gray-300 font-semibold">{averageRating}</span>
          </div>
          <span className="text-gray-500 text-sm">
            {topLevelReviews.length} reviews
          </span>
        </div>
        // )
      }

      {/* reviews */}
      {nestedComments.length > 0 ? (
        <div className="flex flex-col gap-2 lg:gap-4">
          {/* {commentsQuery.isPending ? (
          <p className="text-center text-gray-500">Loading comments...</p>
        ) : */}
          {nestedComments.map((comment) => (
            <Review
              key={comment.id}
              comment={comment}
              // Pass the utils down to the child component
              utils={utils}
            />
          ))}
        </div>
      ) : null}

      {/* write a review */}
      <WriteReview
        // Pass the utils down to the child component
        utils={utils}
      />
    </section>
  );
}
