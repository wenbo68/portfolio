'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import type { CommentTree, updateCommentInput } from '~/type';
import StarRating from './StarRating';
import { api } from '~/trpc/react';
import WriteReply from './WriteReply';
import WriteReview from './WriteReview';
import { TbDotsVertical } from 'react-icons/tb';
import { useMutationState } from '@tanstack/react-query';
import { dequal } from 'dequal'; // NEW: We'll use a tiny helper for deep equality checks
import {
  removeCommentFromTree,
  updateCommentInTree,
} from '~/app/_utils/comment';

export default function ReviewOrReply({
  comment,
  className,
}: {
  comment: CommentTree;
  className?: string;
}) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingReply, setIsWritingReply] = useState(false);

  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const deleteMutation = api.comment.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.comment.getAllAsTree.cancel();
      const previousComments = utils.comment.getAllAsTree.getData();

      if (previousComments) {
        // MODIFIED: Use the recursive helper to remove the comment
        const updatedComments = removeCommentFromTree(previousComments, id);
        utils.comment.getAllAsTree.setData(undefined, updatedComments);
      }
      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousComments) {
        utils.comment.getAllAsTree.setData(undefined, context.previousComments);
      }
      console.error('Failed to delete comment:', err);
    },
    onSettled: () => {
      // Sync with server state
      void utils.comment.getAllAsTree.invalidate();
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const updateMutation = api.comment.update.useMutation({
    onMutate: async (updatedComment) => {
      await utils.comment.getAllAsTree.cancel();
      const previousComments = utils.comment.getAllAsTree.getData();

      setIsEditing(false);

      if (previousComments) {
        // MODIFIED: Use the recursive helper to update the comment
        const updatedComments = updateCommentInTree(
          previousComments,
          updatedComment
        );
        utils.comment.getAllAsTree.setData(undefined, updatedComments);
      }

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        utils.comment.getAllAsTree.setData(undefined, context.previousComments);
      }
      console.error('Failed to update comment:', err);
    },

    onSettled: () => {
      void utils.comment.getAllAsTree.invalidate();
    },
  });

  const handleUpdate = ({
    e,
    id,
    type,
    selectedPackage,
    rating,
    websiteUrl,
    text,
  }: updateCommentInput) => {
    e.preventDefault();
    if (type === 'review') {
      if (rating === 0) {
        setError('Please provide a rating.');
        return;
      }
      if (websiteUrl) {
        try {
          new URL(websiteUrl);
        } catch {
          setError('Please provide a valid URL.');
          return;
        }
      }
    }
    if (text.trim() === '') {
      setError('Please provide a valid comment.');
      return;
    }
    setError('');
    updateMutation.mutate({
      id,
      text,
      rating,
      websiteUrl,
      package: selectedPackage,
    });
  };

  const isAuthor = session?.user?.id === comment.userId;

  // NEW: Check if the current comment is an optimistic one.
  // This assumes your optimistic IDs always start with "optimistic-".
  const isOptimistic = comment.id.startsWith('optimistic-');

  // MODIFIED: We will use a more powerful predicate to find the correct mutation
  const pendingAddMutations = useMutationState({
    filters: { status: 'pending' }, // We only care about pending mutations
    // The predicate function gives us full control to inspect each mutation
    select: (mutation) => ({
      // We select both the key and the variables for our check
      key: mutation.options.mutationKey,
      variables: mutation.state.variables as { parentId?: string },
    }),
  });

  // Now we check if any of the pending mutations match BOTH the path and our specific parentId
  const isAddingReply = pendingAddMutations.some(
    (m) =>
      // dequal is a fast way to check if two arrays are identical
      dequal(m.key?.[0], ['comment', 'add']) && // Does the path match?
      m.variables?.parentId === comment.id // Does the parentId match?
  );

  const dropdownOptions: {
    display: boolean;
    disabled: boolean;
    label: string;
    disabledLabel: string;
    onClick: () => void;
  }[] = [
    {
      display: !!session,
      disabled: isAddingReply,
      label: 'Reply',
      disabledLabel: 'Replying',
      onClick: () => {
        setIsWritingReply((prev) => !prev);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      disabled: updateMutation.isPending,
      label: 'Edit',
      disabledLabel: 'Editing',
      onClick: () => {
        setIsEditing(true);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      disabled: updateMutation.isPending, // disable delete when updating
      label: 'Delete',
      disabledLabel: 'Delete',
      onClick: () => {
        handleDelete();
        setShowDropdown(!showDropdown);
      },
    },
  ];

  return (
    <div className={`bg-gray-900 rounded ${className ?? ''}`}>
      {isEditing ? (
        comment.parentId ? (
          // rely edit mode
          <div className="flex flex-col gap-2">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <WriteReply
              setError={setError}
              updateInput={{
                id: comment.id,
                text: comment.text,
                setIsEditing,
                handleUpdate,
              }}
            />
          </div>
        ) : (
          // review edit mode
          <div className="flex flex-col gap-2">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <WriteReview
              setError={setError}
              updateInput={{
                id: comment.id,
                package: comment.package ?? 'basic',
                rating: comment.rating ?? 0,
                websiteUrl: comment.websiteUrl ?? '',
                text: comment.text,
                setIsEditing,
                handleUpdate,
              }}
            />
          </div>
        )
      ) : (
        // show review/reply
        <div className="flex gap-3">
          <Image
            src={comment.user.image ?? ''}
            alt={comment.user.name ?? 'User'}
            width={40}
            height={40}
            className="w-8 h-8 rounded-full"
          />
          <div className="w-full flex flex-col gap-2">
            <div className="flex flex-col">
              <div className="flex justify-between">
                {/* username */}
                <p className="text-sm font-semibold text-gray-400">
                  {comment.user.name}
                </p>

                <div className="relative flex gap-2 items-center">
                  {/* rating */}
                  {comment.rating ? (
                    <StarRating rating={comment.rating} interactive={false} />
                  ) : (
                    <div className="min-w-24"></div>
                  )}
                  {/* dropdown */}
                  <TbDotsVertical
                    onClick={(e) => setShowDropdown(!showDropdown)}
                    className="cursor-pointer"
                  />
                  {showDropdown && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full z-10 mt-2 w-full rounded bg-gray-800 p-2"
                    >
                      {/* only show dropdown if user is logged in and if the review/reply is not optimistic */}
                      {session ? (
                        !isOptimistic ? (
                          dropdownOptions.map((option) => {
                            return option.display ? (
                              <button
                                key={option.label}
                                type="button"
                                disabled={option.disabled}
                                onClick={option.onClick}
                                className={`w-full rounded p-2 text-left text-xs font-semibold hover:bg-gray-900 hover:text-blue-400 disabled:hover:bg-gray-800 disabled:hover:text-gray-400 transition-colors cursor-pointer`}
                              >
                                {option.disabled
                                  ? option.disabledLabel
                                  : option.label}
                              </button>
                            ) : null;
                          })
                        ) : (
                          <p className="text-xs">Processing. Please wait.</p>
                        )
                      ) : (
                        <p className="text-xs">
                          Please login to interact with the reviews.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 text-xs text-gray-500">
                {/* time */}
                <span className="">
                  {new Date(comment.createdAt).toLocaleDateString('ja-JP')}
                </span>
                {/* package */}
                {comment.package ? (
                  <span className="capitalize">{comment.package} Package</span>
                ) : null}
              </div>
            </div>

            {/* text */}
            <p className="text-sm text-gray-400">{comment.text}</p>

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
          </div>
        </div>
      )}

      {/* write reply form */}
      {isWritingReply && (
        <WriteReply
          setError={setError}
          addInput={{
            parentId: comment.id,
            setIsWritingReply,
          }}
        />
      )}

      {/* all replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-800">
          {comment.replies.map((reply) => (
            <ReviewOrReply
              key={reply.id}
              comment={reply}
              className="pl-10 mt-5"
            />
          ))}
        </div>
      )}
    </div>
  );
}
