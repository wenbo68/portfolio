'use client'; // 1. Make this a Client Component

// import ReviewFilters from "../filter/filters/ReviewFilters";
import AvgRating from './rating/AvgRating';
// import ReviewFilterPills from "../filter/filterPills/ReviewFilterPills";
import Comments from './Comments';
// import { ReviewFilterProvider } from "~/app/_contexts/filter/ReviewFilterProvider";
// import { useProductContext } from "~/app/_contexts/ProductProvider";
import { useSearchParams } from 'next/navigation';
import { api } from '~/trpc/react';
import { GetCommentTreeInputSchema } from '~/type';
// import { FilterProvider } from '~/app/_contexts/FilterProvider';
import { ReviewFilterProvider } from '~/app/_contexts/filter/ReviewFilterProvider';

export default function RatingAndCommentSection() {
  //0. Fetch average rating data
  const { data: ratingData, isLoading: isRatingDataPending } =
    api.comment.getAverageRating.useQuery();

  // 1. Get input from url (zod optional doesn't accept null so must use undefined)
  const searchParams = useSearchParams();
  const packageType = searchParams.getAll('package');
  const rating = searchParams.getAll('rating').map(Number);
  const sort = searchParams.get('sort') ?? undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1; // must not let it default to 0 when page is empty string

  // 2. Construct the tRPC input object from the context state
  const rawInput = {
    packageType,
    rating,
    sort,
    page,
    pageSize: 10,
  };

  // 3. Validate the raw input using the shared schema
  const parsedInput = GetCommentTreeInputSchema.safeParse(rawInput);

  // 4. if invalid input, don't call trpc procedure
  if (!parsedInput.success) {
    // You can optionally render an error state if the filters are somehow invalid
    console.error('Zod validation failed:', parsedInput.error);
    return <p className="text-text1 font-semibold">Invalid search options.</p>;
  }

  // 5. call procedure to fetch data
  const { data: commentData, isLoading: isCommentDataPending } =
    api.comment.getCommentTree.useQuery(
      parsedInput.success ? parsedInput.data : (undefined as any),
      {
        enabled: parsedInput.success,
      }
    );

  const isPending = isRatingDataPending || isCommentDataPending;

  if (isPending)
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
      <AvgRating ratingData={ratingData} />
      <ReviewFilterProvider>
        <Comments commentData={commentData} page={page} />
      </ReviewFilterProvider>
      {/* <WriteReview /> */}
    </section>
  );
}
