'use client';

import { useState } from 'react';
import { type CommentTree } from '~/type';
import Comment from './Comment';
import Pagination from './../pagination/Pagination';
import { useSession } from 'next-auth/react';
import { customToast } from '~/app/_components/Toast';
import ReviewModal from './write-or-update-form/ReviewModal';

export default function Comments({
  commentData,
  page,
}: {
  commentData:
    | {
        commentTree: CommentTree[];
        totalPages: number;
      }
    | undefined;
  page: number;
}) {
  const { data: session } = useSession();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleOpenReviewModal = () => {
    if (!session) {
      customToast.error('Please login to write a review.');
      return;
    }
    setIsReviewModalOpen(true);
  };

  if (!commentData)
    return <div className="text-center">Failed to load reviews.</div>;

  const { commentTree, totalPages } = commentData;

  return (
    <>
      {commentTree.length === 0 ? (
        <div className="flex flex-col gap-4">
          {/* Removed Filters/Pills from here */}
          <div className="flex flex-col gap-0">
            <h2 className="text-center font-bold text-text1">
              No reviews found!
            </h2>
            <p className="text-center text-sm text-text3">
              Be the first to share your experience.
            </p>
          </div>
          <button
            onClick={handleOpenReviewModal}
            className="self-end w-full sm:w-40 cursor-pointer rounded bg-blue-600/50 px-4 py-2 text-sm font-semibold text-text1 hover:bg-blue-500/50 transition-colors"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Removed Filters/Pills from here */}

          {/* Review List */}
          <div className="flex flex-col gap-2 lg:gap-4">
            {commentTree.map((comment) => (
              <Comment key={comment.id} comment={comment} className="p-5" />
            ))}
          </div>

          <button
            onClick={handleOpenReviewModal}
            className="self-end w-full sm:w-40 cursor-pointer rounded bg-blue-600/50 px-4 py-2 text-sm font-semibold text-text1 hover:bg-blue-500/50 transition-colors"
          >
            Write a Review
          </button>

          {/* Pagination */}
          {commentTree.length > 0 && (
            <Pagination currentPage={page ?? 1} totalPages={totalPages} />
          )}
        </div>
      )}

      {/* Add Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </>
  );
}
