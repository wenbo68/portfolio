'use client';

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import StarRating from '../rating/StarRating';
import { customToast } from '~/app/_components/Toast';
import { Dropdown } from '../../Dropdown';
import { useSession } from 'next-auth/react';
import type { PackageType } from '~/server/db/schema';

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  // const { data: session } = useSession();
  const utils = api.useUtils();

  // Form States
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('basic');
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const invalidateQueries = async () => {
    void utils.comment.getAverageRating.invalidate();
    await utils.comment.getCommentTree.invalidate();
  };

  const addMutation = api.comment.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading('Adding...');
      return { toastId };
    },
    onSuccess: async (data, input, context) => {
      await invalidateQueries();
      customToast.success('Review added successfully.', context?.toastId);
      // Reset form
      setRating(0);
      setText('');
      setWebsiteUrl('');
      setSelectedPackage('basic');
      setError('');
      onClose();
    },
    onError: async (err, input, context) => {
      await invalidateQueries();
      customToast.error(
        'Failed to add review. Please try again.',
        context?.toastId
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      customToast.error('Please provide a rating.');
      return;
    }
    // if (websiteUrl && websiteUrl.trim() !== '') {
    try {
      new URL(websiteUrl); // throws if invalid
    } catch {
      customToast.error('Please provide a valid URL.');
      return;
    }
    // }

    // // Basic URL validation if provided
    // if (!websiteUrl.startsWith('http')) {
    //   customToast.error('URL must start with http:// or https://');
    //   return;
    // }
    if (!text.trim()) {
      customToast.error('Please provide a comment.');
      return;
    }

    setError('');

    addMutation.mutate({
      rating,
      text,
      websiteUrl,
      package: selectedPackage,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg0 backdrop-blur-sm flex-col gap-2"
      onClick={onClose}
    >
      <div
        className="flex flex-col gap-4 scrollbar-hide bg-bg1 max-h-[90vh] w-full max-w-[90vw] overflow-y-auto rounded sm:max-w-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* {error && <p className="text-sm text-red-400">{error}</p>} */}
        {/* <h2 className="text-xl font-bold text-gray-300">Write a Review</h2> */}
        <form
          onSubmit={handleSubmit}
          className="text-text2 flex flex-col gap-4 text-sm"
        >
          {/* Package & Rating Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full flex flex-col gap-1">
              <label className="block font-medium text-text1">Package</label>
              <Dropdown
                options={[
                  { value: 'basic', label: 'Basic: Website/Blog' },
                  { value: 'standard', label: 'Standard: WebApp/E-commerce' },
                ]}
                value={selectedPackage}
                onChange={(v) => setSelectedPackage(v as PackageType)}
                triggerColor="bg-bg2"
                menuColor="bg-bg3"
                menuHighlightColor="hover:bg-bg2"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <span className="block font-medium text-text1">Rating</span>
              <div className="bg-bg2 rounded px-3 py-2.5 flex items-center h-[31.5px] sm:h-[36px]">
                <StarRating rating={rating} setRating={setRating} />
              </div>
            </div>
          </div>

          {/* Website URL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <label
                htmlFor="websiteUrl"
                className="block font-medium text-gray-300"
              >
                Website URL
              </label>
              <span className="text-xs text-gray-500">
                Must include http:// or https://
              </span>
            </div>
            <input
              type="text"
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="w-full bg-bg2 rounded px-3 py-2 outline-none text-text2"
            />
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="comment"
              className="block font-medium text-gray-300"
            >
              Comment
            </label>
            <textarea
              id="comment"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience..."
              className="scrollbar-hide bg-bg2 w-full rounded px-3 py-2 outline-none text-text2"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {/* <button
              type="button"
              onClick={onClose}
              disabled={addMutation.isPending}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button> */}
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded bg-blue-600/50 px-4 py-2 font-semibold text-text1 transition-all hover:bg-blue-500/50 disabled:cursor-default disabled:bg-blue-500/50"
            >
              {addMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
