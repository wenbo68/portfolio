'use client';

import AvgRating from './rating/AvgRating';
import Comments from './Comments';
import { useSearchParams } from 'next/navigation';
import { api } from '~/trpc/react';
import { GetCommentTreeInputSchema } from '~/type';
import { ReviewFilterProvider } from '~/app/_contexts/filter/ReviewFilterProvider';
import ReviewFilters from '../filter/filters/ReviewFilters';
import ReviewFilterPills from '../filter/filterPills/ReviewFilterPills';
import CommentsFallback from './CommentsFallback';

export default function RatingAndCommentSection() {
  // 0. Fetch average rating data
  const { data: ratingData, isLoading: isRatingDataLoading } =
    api.comment.getAverageRating.useQuery();

  // 1. Get input from url
  const searchParams = useSearchParams();
  const packageType = searchParams.getAll('package');
  const rating = searchParams.getAll('rating').map(Number);
  const sort = searchParams.get('sort') ?? undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // 2. Construct the tRPC input object
  const rawInput = {
    packageType,
    rating,
    sort,
    page,
    pageSize: 10,
  };

  // 3. Validate the raw input
  const parsedInput = GetCommentTreeInputSchema.safeParse(rawInput);

  if (!parsedInput.success) {
    console.error('Zod validation failed:', parsedInput.error);
    return <p className="text-text1 font-semibold">Invalid search options.</p>;
  }

  // 4. Call procedure to fetch data
  // Use isFetching to detect refetches (filter changes)
  const { data: commentData, isFetching: isCommentFetching } =
    api.comment.getCommentTree.useQuery(
      parsedInput.success ? parsedInput.data : (undefined as any),
      {
        enabled: parsedInput.success,
      }
    );

  // 5. Initial Load State:
  // We only show the single big loader if the static structure (AvgRating) isn't ready yet.
  if (isRatingDataLoading)
    return (
      <div className="text-text3 animate-pulse text-center">
        Loading reviews...
      </div>
    );

  return (
    <section
      id="rating-and-comment-section"
      className="flex flex-col gap-5 sm:gap-7"
    >
      {/* This part remains visible during filter refetches */}
      <AvgRating ratingData={ratingData} />

      <ReviewFilterProvider>
        <div className="flex flex-col gap-4">
          {/* Filters remain mounted so scroll position #review-filters stays valid */}
          <ReviewFilters />
          <ReviewFilterPills />

          {/* Only the comments list enters loading state during refetch */}
          {isCommentFetching ? (
            <CommentsFallback />
          ) : (
            <Comments commentData={commentData} page={page} />
          )}
        </div>
      </ReviewFilterProvider>
    </section>
  );
}
