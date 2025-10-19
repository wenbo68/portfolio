'use client';

import React, { useState } from 'react';
import { api } from '~/trpc/react';
import StarRating from './StarRating';
import ReviewOrReply from './ReviewOrReply';
import WriteReview from './WriteReview';

export default function Reviews() {
  const { data: commentTree } = api.comment.getAllAsTree.useQuery();

  const [error, setError] = useState('');

  if (!commentTree) return null;

  const topLevelReviews = commentTree.filter((c) => c.rating);
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
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <StarRating rating={parseFloat(averageRating)} interactive={false} />
          <span className="text-gray-300 font-semibold">{averageRating}</span>
        </div>
        <span className="text-gray-500 text-sm">
          {topLevelReviews.length} reviews
        </span>
      </div>

      {/* reviews */}
      {commentTree.length > 0 ? (
        <div className="flex flex-col gap-2 lg:gap-4">
          {commentTree.map((comment) => (
            <ReviewOrReply key={comment.id} comment={comment} className="p-5" />
          ))}
        </div>
      ) : null}

      {/* write a review */}
      <div className="flex flex-col gap-2">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <WriteReview setError={setError} />
      </div>
    </section>
  );
}
