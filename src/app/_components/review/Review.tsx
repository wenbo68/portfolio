'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import type { Comment } from '~/type';
import StarRating from './StarRating';
import { api } from '~/trpc/react';
// import type { AppRouter } from '~/server/api/root';
// import type { inferRouterOutputs } from '@trpc/server';
import { Dropdown } from '../Dropdown'; // Assuming Dropdown is in a shared folder
import Reply from './Reply';

// Define a type for the tRPC utils
// type RouterOutput = inferRouterOutputs<AppRouter>;
type TRPCUtils = ReturnType<typeof api.useUtils>;

// Main component updated with Edit/Delete logic
export default function Review({
  comment,
  utils,
}: {
  comment: Comment;
  utils: TRPCUtils;
}) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State for the edit form
  const [editText, setEditText] = useState(comment.text);
  const [editRating, setEditRating] = useState(comment.rating ?? 0);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState(
    comment.websiteUrl ?? ''
  );
  const [editPackage, setEditPackage] = useState(comment.package ?? 'basic');

  // NEW: Delete mutation
  const deleteMutation = api.comment.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.comment.getAll.cancel();
      const previousComments = utils.comment.getAll.getData();

      // Optimistically remove the comment from the UI
      if (previousComments) {
        // This simple filter works because your query fetches a flat list.
        // The cascade on the DB handles the children.
        const updatedComments = previousComments.filter((c) => c.id !== id);
        utils.comment.getAll.setData(undefined, updatedComments);
      }
      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousComments) {
        utils.comment.getAll.setData(undefined, context.previousComments);
      }
      console.error('Failed to delete comment:', err);
    },
    onSettled: () => {
      // Sync with server state
      void utils.comment.getAll.invalidate();
    },
  });

  // NEW: Update mutation
  const updateMutation = api.comment.update.useMutation({
    onMutate: async (updatedComment) => {
      await utils.comment.getAll.cancel();
      const previousComments = utils.comment.getAll.getData();

      // Optimistically update the comment in the UI
      if (previousComments) {
        const updatedComments = previousComments.map((c) =>
          c.id === updatedComment.id ? { ...c, ...updatedComment } : c
        );
        utils.comment.getAll.setData(undefined, updatedComments);
      }
      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        utils.comment.getAll.setData(undefined, context.previousComments);
      }
      console.error('Failed to update comment:', err);
    },
    onSettled: () => {
      void utils.comment.getAll.invalidate();
      setIsEditing(false); // Exit editing mode
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: comment.id,
      text: editText,
      rating: comment.parentId ? undefined : editRating, // Only top-level comments have ratings
      websiteUrl: comment.parentId ? undefined : editWebsiteUrl,
      package: comment.parentId ? undefined : editPackage,
    });
  };

  const isAuthor = session?.user?.id === comment.userId;

  if (isEditing) {
    // RENDER THE EDIT FORM
    return (
      <form
        onSubmit={handleUpdate}
        className="bg-gray-800 p-5 rounded space-y-4 text-gray-400 text-sm"
      >
        {/* Render rating/package/URL fields only for top-level comments */}
        {!comment.parentId && (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full flex flex-col gap-1">
                <label className="block font-medium">Package</label>
                <Dropdown
                  options={[
                    { value: 'basic', label: 'Basic: Website/Blog' },
                    { value: 'standard', label: 'Standard: Web App' },
                  ]}
                  value={editPackage}
                  onChange={(v: string) =>
                    setEditPackage(v as 'basic' | 'standard')
                  }
                />
              </div>
              <div className="w-full flex flex-col gap-1">
                <span className="block font-medium">Rating</span>
                <div className="bg-gray-700 rounded px-3 py-2.5 flex items-center">
                  <StarRating rating={editRating} setRating={setEditRating} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="websiteUrl" className="block font-medium">
                Website Url
              </label>
              <input
                type="url"
                id="websiteUrl"
                value={editWebsiteUrl}
                onChange={(e) => setEditWebsiteUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="w-full bg-gray-700 rounded px-3 py-2 outline-none"
              />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="comment" className="block font-medium">
            Comment
          </label>
          <textarea
            id="comment"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-gray-700 rounded py-2 px-3 outline-none"
            required
          ></textarea>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-gray-400 hover:text-gray-300 px-3 py-1 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-cyan-500 hover:bg-cyan-600 text-gray-300 font-bold text-sm py-1 px-3 rounded-lg transition-colors disabled:bg-gray-500"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    );
  }

  // RENDER THE COMMENT VIEW
  return (
    <div className="bg-gray-900 p-5 rounded">
      <div className="flex gap-3">
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
              <p className="text-sm font-semibold text-gray-400">
                {comment.user.name}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
            {comment.rating && (
              <div className="flex gap-2">
                <StarRating rating={comment.rating} interactive={false} />
                <span className="text-sm font-semibold capitalize">
                  {comment.package}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-400">{comment.text}</p>

          <div className="flex items-center gap-4">
            {comment.websiteUrl && (
              <a /* ... your link svg and code ... */>View Website</a>
            )}

            {session && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-start text-sm text-gray-500 hover:text-gray-300"
              >
                Reply
              </button>
            )}

            {/* NEW: Edit and Delete Buttons */}
            {isAuthor && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-start text-sm text-gray-500 hover:text-gray-300"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-start text-sm text-red-500 hover:text-red-400 disabled:text-gray-600"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <Reply
          parentId={comment.id}
          onCancel={() => setShowReplyForm(false)}
          utils={utils}
        />
      )}

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
