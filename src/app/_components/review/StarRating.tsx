'use client';

import { FaStar } from 'react-icons/fa';

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <FaStar
      className={`w-4 h-4 ${
        filled ? 'text-yellow-500/80' : 'text-gray-600'
      } ${className}`}
    />
  );
}

export default function StarRating({
  rating,
  setRating,
  interactive = true,
}: {
  rating: number;
  setRating?: (rating: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && setRating?.(star)}
          className={`focus:outline-none ${
            interactive ? 'cursor-pointer' : ''
          }`}
          aria-label={`Rate ${star} stars`}
          disabled={!interactive}
        >
          <Star filled={star <= rating} />
        </button>
      ))}
    </div>
  );
}
