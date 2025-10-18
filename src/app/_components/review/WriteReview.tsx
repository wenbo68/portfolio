'use client';

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/trpc/react';
import StarRating from './StarRating';
import { Dropdown } from '../Dropdown';
import type { AppRouter } from '~/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';
import type { PackageType } from '~/server/db/schema';
import type { updateCommentInput } from '~/type';
import { addCommentToTree } from '~/app/_utils/comment';

type RouterOutput = inferRouterOutputs<AppRouter>;

interface UpdateReviewFields {
  id: string;
  package: PackageType;
  rating: number;
  websiteUrl: string;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({
    e,
    id,
    type,
    selectedPackage,
    rating,
    websiteUrl,
    text,
  }: updateCommentInput) => void;
}

type WriteReviewProps = {
  setError: Dispatch<SetStateAction<string>>;
  updateInput?: UpdateReviewFields;
};

export default function WriteReview({
  setError,
  updateInput,
}: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [selectedPackage, setSelectedPackage] = useState<PackageType>(
    updateInput ? updateInput.package : 'basic'
  );
  const [rating, setRating] = useState(updateInput ? updateInput.rating : 0);
  const [websiteUrl, setWebsiteUrl] = useState(
    updateInput ? updateInput.websiteUrl : ''
  );
  const [text, setText] = useState(updateInput ? updateInput.text : '');

  const addMutation = api.comment.add.useMutation({
    // Step 1: onMutate runs before the server call
    onMutate: async (newReview) => {
      // Cancel any outgoing refetches
      await utils.comment.getAllAsTree.cancel();

      // Snapshot the previous value
      const previousComments = utils.comment.getAllAsTree.getData();

      // Optimistically update to the new value
      if (previousComments && session?.user) {
        // [number] to get the type of a single instance of the array return by api.comment.getAll
        const optimisticReview: RouterOutput['comment']['getAllAsTree'][number] =
          {
            id: `optimistic-${Date.now()}`, // Temporary ID
            text: newReview.text,
            rating: newReview.rating!,
            websiteUrl: newReview.websiteUrl!,
            package: newReview.package!,
            parentId: null,
            userId: session.user.id,
            createdAt: new Date(),
            user: {
              name: session.user.name ?? 'You',
              image: session.user.image ?? '',
            },
            replies: [],
          };

        const updatedComments = addCommentToTree(
          previousComments,
          optimisticReview
        );

        utils.comment.getAllAsTree.setData(undefined, updatedComments);
      }

      // Return a context object with the snapshotted value
      return { previousComments };
    },
    // Step 2: If the mutation fails, roll back
    onError: (err, newReview, context) => {
      if (context?.previousComments) {
        utils.comment.getAllAsTree.setData(undefined, context.previousComments);
      }
      console.error('WriteReview addMutation onError:', err);
      setError(err.message);
    },
    onSuccess: () => {
      // Clear the form only on a successful submission.
      setRating(0);
      setText('');
      setWebsiteUrl('');
      setSelectedPackage('basic');
    },
    // Step 3: Always refetch after the mutation is settled
    onSettled: () => {
      void utils.comment.getAllAsTree.invalidate();
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide a rating.');
      return;
    }
    if (websiteUrl.trim() !== '') {
      try {
        new URL(websiteUrl); // throws if invalid
      } catch {
        setError('Please provide a valid URL.');
        return;
      }
    } else {
      setError('Please provide a valid URL.');
      return;
    }
    if (text.trim() === '') {
      setError('Please provide a valid comment.');
      return;
    }
    setError('');
    addMutation.mutate({
      package: selectedPackage,
      rating,
      websiteUrl,
      text,
    });
  };

  if (!session)
    return (
      <p
        className={`bg-gray-900 ${
          updateInput ? `` : `p-5`
        } rounded flex flex-col gap-4 text-gray-400 text-sm`}
      >
        Please login first to submit a review.
      </p>
    );

  return (
    <form
      onSubmit={(e: FormEvent<Element>) =>
        updateInput
          ? updateInput.handleUpdate({
              e,
              id: updateInput.id,
              type: 'review',
              selectedPackage,
              rating,
              websiteUrl,
              text,
            })
          : handleAdd(e)
      }
      className={`bg-gray-900 ${
        updateInput ? `` : `p-5`
      } rounded flex flex-col gap-4 text-gray-400 text-sm`}
    >
      {/* package & rating */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full flex flex-col gap-1">
          <label className="block font-medium">Package</label>
          <Dropdown
            options={[
              { value: 'basic', label: 'Basic: Website/Blog' },
              { value: 'standard', label: 'Standard: Web App' },
            ]}
            value={selectedPackage}
            onChange={(v: string) => setSelectedPackage(v as PackageType)}
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <span className="block font-medium">Rating</span>
          <div className="bg-gray-800 rounded px-3 py-2.5 flex items-center">
            <StarRating rating={rating} setRating={setRating} />
          </div>
        </div>
      </div>

      {/* website url */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <label htmlFor="websiteUrl" className="block font-medium">
            Website Url
          </label>
          <span className="text-xs text-gray-500">
            Please include http:// or https://
          </span>
        </div>

        <input
          type="text"
          id="websiteUrl"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://your-site.com"
          className="w-full bg-gray-800 rounded px-3 py-2 outline-none"
        />
      </div>

      {/* comment */}
      <div className="flex flex-col gap-1">
        <label htmlFor="comment" className="block font-medium text-gray-400">
          Comment
        </label>
        <textarea
          id="comment"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience..."
          className="w-full bg-gray-800 rounded py-2 px-3 outline-none scrollbar-hide"
        ></textarea>
      </div>

      {/* save/cancel for editing; submit button for adding*/}
      {updateInput ? (
        <div className="flex justify-end gap-4 text-gray-500">
          <button
            type="button"
            onClick={() => {
              updateInput.setIsEditing(false);
              setError('');
            }}
            className="hover:text-gray-400"
          >
            Cancel
          </button>
          <button type="submit" className="hover:text-gray-400">
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="min-w-36 bg-blue-600/50 hover:bg-blue-500/50 text-gray-300 font-semibold py-2 px-4 rounded transition-all disabled:bg-blue-600/50 cursor-pointer"
          >
            {addMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </form>
  );
}
