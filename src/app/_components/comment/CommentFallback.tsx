// src/app/_components/review/reviews/ReviewOrReplyFallback.tsx

export default function CommentFallback() {
  return (
    <div className="bg-bg2 rounded p-5">
      <div className="flex animate-pulse gap-3">
        {/* Avatar Skeleton */}
        <div className="bg-bg3 h-8 w-8 shrink-0 rounded-full"></div>

        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* Username Skeleton */}
              <div className="bg-bg3 h-4 w-1/4 rounded"></div>
              {/* Rating Skeleton */}
              <div className="bg-bg3 h-4 w-1/3 rounded"></div>
            </div>
            {/* Meta (Date/Package) Skeleton */}
            <div className="bg-bg3 h-3 w-1/4 rounded"></div>
          </div>

          {/* Text Content Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="bg-bg3 h-4 w-full rounded"></div>
            <div className="bg-bg3 h-4 w-full rounded"></div>
            {/* <div className="h-4 w-3/4 rounded bg-bg3"></div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
