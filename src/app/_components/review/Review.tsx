'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import type { Comment } from '~/type';
import StarRating from './StarRating';
import { api } from '~/trpc/react';
import type { AppRouter } from '~/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Define a type for the tRPC utils
type RouterOutput = inferRouterOutputs<AppRouter>;
type TRPCUtils = ReturnType<typeof api.useUtils>;

function Reply({
  parentId,
  onCancel,
  utils,
}: {
  parentId: string;
  onCancel: () => void;
  utils: TRPCUtils;
}) {
  const [text, setText] = useState('');
  const { data: session } = useSession();

  const addCommentMutation = api.comment.add.useMutation({
    // Step 1: onMutate runs before the server call
    onMutate: async (newReply) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await utils.comment.getAll.cancel();

      // Snapshot the previous value
      const previousComments = utils.comment.getAll.getData();

      // Optimistically update to the new value
      if (previousComments && session?.user) {
        const optimisticReply: RouterOutput['comment']['getAll'][number] = {
          id: `optimistic-${Date.now()}`, // Temporary ID
          text: newReply.text,
          parentId: newReply.parentId!,
          userId: session.user.id,
          createdAt: new Date(),
          rating: null,
          websiteUrl: null,
          package: null,
          user: {
            name: session.user.name ?? 'You',
            image: session.user.image ?? '',
          },
        };

        utils.comment.getAll.setData(undefined, [
          ...previousComments,
          optimisticReply,
        ]);
      }
      // Return a context object with the snapshotted value
      return { previousComments };
    },
    // Step 2: If the mutation fails, use the context we returned to roll back
    onError: (err, newReply, context) => {
      if (context?.previousComments) {
        utils.comment.getAll.setData(undefined, context.previousComments);
      }
      // You can also add a toast notification here to inform the user
      console.error('Failed to post reply:', err);
    },
    // Step 3: Always refetch after error or success to sync with the server
    onSettled: () => {
      void utils.comment.getAll.invalidate();
      setText('');
      onCancel();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === '') return;
    addCommentMutation.mutate({ text, parentId });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 ml-12 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        className="w-full bg-gray-700 text-gray-300 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500"
        rows={2}
      ></textarea>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-300 px-3 py-1 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addCommentMutation.isPending}
          className="bg-cyan-500 hover:bg-cyan-600 text-gray-300 font-bold text-sm py-1 px-3 rounded-lg transition-colors disabled:bg-gray-500"
        >
          {addCommentMutation.isPending ? 'Replying...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}

export default function Review({
  comment,
  utils,
}: {
  comment: Comment;
  utils: TRPCUtils;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="bg-gray-900 p-5 rounded">
      <div className="flex gap-3">
        {/* user profile */}
        <Image
          src={comment.user.image ?? ''}
          alt={comment.user.name ?? 'User'}
          width={40}
          height={40}
          className="w-8 h-8 rounded-full"
        />
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              {/* username */}
              <p className="text-sm font-semibold text-gray-400">
                {comment.user.name}
              </p>
              {/* date */}
              <p className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* rating */}
            {comment.rating && (
              <div className="flex gap-2">
                <StarRating rating={comment.rating} interactive={false} />
                <span className="text-sm font-semibold capitalize">
                  {comment.package}
                </span>
              </div>
            )}
          </div>

          {/* comment */}
          <p className="text-sm text-gray-400">{comment.text}</p>

          <div className="flex gap-4">
            {/* website link */}
            {comment.websiteUrl && (
              <a
                href={comment.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9q-.13 0-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
                  <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4 4 0 0 1-.82 1H12a3 3 0 0 0 0-6z" />
                </svg>
                View Website
              </a>
            )}

            {/* reply button */}
            {session && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-start text-sm text-gray-500 hover:text-gray-300"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* reply section */}
      {showReplyForm && (
        <Reply
          parentId={comment.id}
          onCancel={() => setShowReplyForm(false)}
          utils={utils}
        />
      )}

      {/* replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-7 pt-4 mt-4 border-l-2 border-gray-800 space-y-4">
          {comment.replies.map((reply) => (
            <Review key={reply.id} comment={reply} utils={utils} />
          ))}
        </div>
      )}
    </div>
  );
}
