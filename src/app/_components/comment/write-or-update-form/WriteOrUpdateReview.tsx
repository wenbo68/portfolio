'use client';

import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/trpc/react';
import StarRating from '../rating/StarRating';
import type { UpdateCommentInput } from '~/type';
// import { useProductContext } from '~/app/_contexts/ProductProvider';
import { customToast } from '~/app/_components/Toast';
import type { PackageType } from '~/server/db/schema';
import { Dropdown } from '../../Dropdown';
// import { MediaGrid, type MediaItem } from '../../MediaGrid';
// import type { MediaType } from '~/server/db/schema';

// interface UpdateReviewFields {
//   commentId: string;
//   rating: number;
//   text: string;
//   // media: {
//   //   key: string;
//   //   url: string;
//   //   type: MediaType;
//   //   position: number;
//   // }[];
//   setIsEditing: Dispatch<SetStateAction<boolean>>;
//   handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
//   isUpdatePending: boolean;
// }

interface UpdateReviewFields {
  commentId: string;
  package: PackageType;
  rating: number;
  websiteUrl: string;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({
    e,
    commentId,
    type,
    selectedPackage,
    rating,
    websiteUrl,
    text,
  }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

type WriteReviewProps = {
  updateInput?: UpdateReviewFields;
};

export default function WriteOrUpdateReview({ updateInput }: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  // const { productId } = useProductContext();

  const [rating, setRating] = useState(updateInput ? updateInput.rating : 0);
  const [text, setText] = useState(updateInput ? updateInput.text : '');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(
    updateInput ? updateInput.package : 'basic'
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    updateInput ? updateInput.websiteUrl : ''
  );
  const [error, setError] = useState('');

  // const [images, setImages] = useState<MediaItem[]>([]);
  // const [videos, setVideos] = useState<MediaItem[]>([]);

  // useEffect(() => {
  //   if (updateInput?.media) {
  //     const sortedMedia = [...updateInput.media].sort(
  //       (a, b) => a.position - b.position
  //     );
  //     setImages(
  //       sortedMedia
  //         .filter((m) => m.type === 'image')
  //         .map((m) => ({ key: m.key, url: m.url }))
  //     );
  //     setVideos(
  //       sortedMedia
  //         .filter((m) => m.type === 'video')
  //         .map((m) => ({ key: m.key, url: m.url }))
  //     );
  //   }
  // }, []);

  // const prepareMediaPayload = () => {
  //   const imagePayload = images.map((img, idx) => ({
  //     key: img.key,
  //     url: img.url,
  //     type: 'image' as const,
  //     position: idx,
  //   }));
  //   const videoPayload = videos.map((vid, idx) => ({
  //     key: vid.key,
  //     url: vid.url,
  //     type: 'video' as const,
  //     position: idx,
  //   }));
  //   return [...imagePayload, ...videoPayload];
  // };

  // const { data: canReview, isLoading: isCheckingEligibility } =
  //   api.comment.getCanReview.useQuery(
  //     { productId },
  //     { enabled: !!session && !updateInput }
  //   );

  const invalidateQueries = async () => {
    void utils.comment.getAverageRating.invalidate();
    await utils.comment.getCommentTree.invalidate();
  };

  const addMutation = api.comment.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading('Adding...');
      return { toastId };
    },
    onSuccess: (data, input, context) => {
      void invalidateQueries();
      customToast.success('Add succeeded.', context?.toastId);
    },
    onError: (err, input, context) => {
      void invalidateQueries();
      customToast.error('Add failed. Please try again.', context?.toastId);
      console.error('WriteReview AddMutation onError:', err);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide a rating.');
      return;
    }
    if (text.trim() === '') {
      setError('Please provide a valid comment.');
      return;
    }
    setError('');
    addMutation.mutate({
      // productId,
      rating,
      text,
      // media: prepareMediaPayload(), // Add media payload
    });
  };

  const handleCancel = () => {
    updateInput?.setIsEditing(false);
    setError('');
  };

  const handleSubmit = (e: FormEvent<Element>) => {
    if (updateInput) {
      updateInput.handleUpdate({
        e,
        commentId: updateInput.commentId,
        type: 'review',
        selectedPackage,
        rating,
        websiteUrl,
        text,
      });
    } else {
      handleAdd(e as React.FormEvent);
    }
  };

  // if (!session)
  //   return (
  //     <p
  //       className={`bg-bg2 ${
  //         updateInput ? `` : `p-4`
  //       } text-text2 flex flex-col gap-4 rounded text-sm`}
  //     >
  //       Please login first to submit a review.
  //     </p>
  //   );

  // if (!updateInput) {
  //   if (isCheckingEligibility) {
  //     return <div className="bg-bg2 h-32 animate-pulse rounded p-5"></div>;
  //   }
  //   if (!canReview) {
  //     return (
  //       <div className="bg-bg2 text-text2 rounded p-5 text-sm">
  //         You can only review products you have purchased and received (Order
  //         Status: Shipped).
  //       </div>
  //     );
  //   }
  // }

  return (
    <div className="flex flex-col gap-2">
      {/* {error && <p className="text-sm text-red-400">{error}</p>} */}

      <form
        onSubmit={handleSubmit}
        className={`${
          updateInput ? `` : `p-4`
        } text-text2 flex flex-col gap-4 rounded text-sm`}
      >
        {/* package & rating */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full flex flex-col gap-1">
            <label className="block font-medium">Package</label>
            <Dropdown
              options={[
                { value: 'basic', label: 'Basic: Website/Blog' },
                { value: 'standard', label: 'Standard: WebApp/E-commerce' },
              ]}
              value={selectedPackage}
              onChange={(v: string) => setSelectedPackage(v as PackageType)}
              menuColor="bg-bg3"
              menuHighlightColor="hover:bg-bg2"
            />
          </div>
          <div className="w-full flex flex-col gap-1">
            <span className="block font-medium">Rating</span>
            <div className="bg-gray-800 rounded px-3 py-2.5 flex items-center h-[31.5px] sm:h-[36px]">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="comment" className="text-text2 block font-medium">
            Comment
          </label>
          <textarea
            id="comment"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience..."
            className="scrollbar-hide bg-bg2 w-full rounded px-3 py-2 outline-none"
          ></textarea>
        </div>

        {/* --- Using MediaGrid --- */}
        {/* <div className="flex flex-col gap-3">
          <MediaGrid
            mediaType="image"
            maxItems={4}
            items={images}
            onChange={setImages}
            uploadThingRoute="commentImageUploader"
            gridClassName="grid grid-cols-4 gap-2"
          />

          <MediaGrid
            mediaType="video"
            maxItems={1}
            items={videos}
            onChange={setVideos}
            uploadThingRoute="commentVideoUploader"
            gridClassName="grid grid-cols-4 gap-2"
          />
        </div> */}

        {updateInput ? (
          <div className="text-text3 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateInput.isUpdatePending}
              className="hover:text-text2 disabled:hover:text-text3 cursor-pointer disabled:cursor-default"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateInput.isUpdatePending}
              className="hover:text-text2 disabled:hover:text-text3 cursor-pointer disabled:cursor-default"
            >
              {updateInput.isUpdatePending ? 'Saving' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="text-text1 min-w-36 cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
            >
              {addMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
