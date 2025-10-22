'use client';

import ReviewFilters from './ReviewFilters';
import AvgRating from './rating/AvgRating';
import WriteReview from './write-form/WriteReview';
import Reviews from './reviews/Reviews';
import ReviewLabels from './ReviewLabels';

export default function ReviewSection() {
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
      <AvgRating />

      {/* write a review */}
      <WriteReview />

      {/* review filters */}
      {/* <div id="review-filters"> */}
      <ReviewFilters />
      {/* </div> */}

      {/* active filters */}
      <ReviewLabels />

      {/* reviews */}
      <Reviews />
    </section>
  );
}
