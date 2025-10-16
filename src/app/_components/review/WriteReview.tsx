'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/trpc/react';
import StarRating from './StarRating';
import { Dropdown } from '../Dropdown';
import type { AppRouter } from '~/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Define a type for the tRPC utils
type RouterOutput = inferRouterOutputs<AppRouter>;
type TRPCUtils = ReturnType<typeof api.useUtils>;

export default function WriteReview({ utils }: { utils: TRPCUtils }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard'>(
    'basic'
  );
  const [error, setError] = useState('');

  const addReviewMutation = api.comment.add.useMutation({
    // Step 1: onMutate runs before the server call
    onMutate: async (newReview) => {
      // Cancel any outgoing refetches
      await utils.comment.getAll.cancel();

      // Snapshot the previous value
      const previousComments = utils.comment.getAll.getData();

      // Optimistically update to the new value
      if (previousComments && session?.user) {
        // Create the optimistic comment object
        const optimisticReview: RouterOutput['comment']['getAll'][number] = {
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
        };

        // Add the new review to the top of the list
        utils.comment.getAll.setData(undefined, [
          optimisticReview,
          ...previousComments,
        ]);
      }
      // Return a context object with the snapshotted value
      return { previousComments };
    },
    // Step 2: If the mutation fails, roll back
    onError: (err, newReview, context) => {
      if (context?.previousComments) {
        utils.comment.getAll.setData(undefined, context.previousComments);
      }
      console.error('Failed to post review:', err);
      setError('Failed to submit review. Please try again.');
    },
    // Step 3: Always refetch after the mutation is settled
    onSettled: () => {
      void utils.comment.getAll.invalidate();
      // Clear the form on success or failure
      setRating(0);
      setText('');
      setWebsiteUrl('');
      setSelectedPackage('basic');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || text.trim() === '') {
      setError('Please provide a rating and a comment.');
      return;
    }
    setError('');
    addReviewMutation.mutate({
      text,
      rating,
      websiteUrl,
      package: selectedPackage,
    });
  };

  if (!session) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 p-5 rounded flex flex-col gap-4 text-gray-400 text-sm"
    >
      {error && <p className="text-red-400 ">{error}</p>}

      {/* package & rating */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full flex flex-col  gap-1">
          <label className="block font-medium">Package</label>
          <Dropdown
            options={[
              { value: 'basic', label: 'Basic: Website/Blog' },
              { value: 'standard', label: 'Standard: Web App' },
            ]}
            value={selectedPackage}
            onChange={(v: string) =>
              setSelectedPackage(v as 'basic' | 'standard')
            }
          />
        </div>
        <div className="w-full flex flex-col  gap-1">
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
          type="url"
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
          required
        ></textarea>
      </div>

      {/* submit button */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={addReviewMutation.isPending}
          className="min-w-36 bg-blue-600/50 hover:bg-blue-500/50 text-gray-300 font-semibold py-2 px-4 rounded transition-all disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer"
        >
          {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
