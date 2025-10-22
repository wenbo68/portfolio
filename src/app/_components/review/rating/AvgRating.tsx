import { api } from '~/trpc/react';
import StarRating from './StarRating';

export default function AvgRating() {
  const { data: ratingData } = api.comment.getAverageRating.useQuery();
  if (!ratingData) return null;
  const { averageRating, ratingCount } = ratingData;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <StarRating
          rating={Number(averageRating.toFixed(1))}
          interactive={false}
        />
        <span className="text-gray-300 font-semibold">
          {averageRating.toFixed(1)}
        </span>
      </div>
      <span className="text-gray-500 text-sm">{ratingCount} reviews</span>
    </div>
  );
}
