'use client';

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
// import toast from "react-hot-toast";
// import { useProductContext } from '~/app/_contexts/ProductProvider';
import { customToast } from '~/app/_components/Toast';
import { api } from '~/trpc/react';
import type { UpdateCommentInput } from '~/type';

interface AddReplyFields {
  parentId: string;
  setIsWritingReply: Dispatch<SetStateAction<boolean>>;
}

// interface UpdateReplyFields {
//   id: string;
//   text: string;
//   setIsEditing: Dispatch<SetStateAction<boolean>>;
//   handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
//   isUpdatePending: boolean;
// }

interface UpdateReplyFields {
  commentId: string;
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

type WriteReviewProps =
  | {
      // setError: Dispatch<SetStateAction<string>>;
      addInput: AddReplyFields;
      updateInput?: never;
    }
  | {
      // setError: Dispatch<SetStateAction<string>>;
      addInput?: never;
      updateInput: UpdateReplyFields;
    };

export default function WriteOrUpdateReply({
  // setError,
  addInput,
  updateInput,
}: WriteReviewProps) {
  // const { data: session } = useSession();
  const utils = api.useUtils();
  // const { productId } = useProductContext();

  const [text, setText] = useState(updateInput?.text ?? '');
  const [error, setError] = useState('');

  const invalidateQueries = async () => {
    await utils.comment.getCommentTree.invalidate();
    // await utils.comment.getAverageRating.invalidate({ productId });
    // await utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const addMutation = api.comment.add.useMutation({
    // onMutate: () => {
    //   const toastId = customToast.loading("Adding...");
    //   return { toastId };
    // },
    onSuccess: async (data, input, context) => {
      await invalidateQueries();
      // customToast.success("Add succeeded.", context?.toastId);
      handleCancel();
    },
    onError: (err, input, context) => {
      void invalidateQueries();
      setError('Failed to add reply. Please try again.');
      // customToast.error("Add failed. Please try again.", context?.toastId);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput) {
      setError('Something went wrong. Please cancel and try again.');
      return;
    }
    if (text.trim() === '') {
      setError('Please provide a valid comment.');
      return;
    }
    addMutation.mutate({ parentId: addInput.parentId, text });
  };

  const handleCancel = () => {
    if (addInput) {
      addInput.setIsWritingReply(false);
    } else {
      updateInput?.setIsEditing(false);
    }
    setError('');
  };

  const handleSubmit = (e: FormEvent<Element>) =>
    updateInput
      ? updateInput.handleUpdate({
          e,
          commentId: updateInput.commentId,
          type: 'reply',
          selectedPackage: undefined,
          rating: undefined,
          websiteUrl: undefined,
          text,
        })
      : handleAdd(e);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 ${
        updateInput ? '' : 'pt-3 pl-1.5'
      } text-text3 rounded text-sm`}
    >
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="scrollbar-hide bg-bg2 text-text2 w-full rounded p-2 outline-none"
          rows={2}
          autoFocus
        ></textarea>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateInput?.isUpdatePending || addMutation.isPending}
            className="hover:text-text2 disabled:hover:text-text3 cursor-pointer disabled:cursor-default"
          >
            Cancel
          </button>
          {updateInput ? (
            <button
              type="submit"
              disabled={updateInput?.isUpdatePending}
              className="hover:text-text2 disabled:hover:text-text3 cursor-pointer disabled:cursor-default"
            >
              {updateInput.isUpdatePending ? 'Saving' : 'Save'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="hover:text-text2 disabled:hover:text-text3 cursor-pointer disabled:cursor-default"
            >
              {addMutation.isPending ? 'Submitting' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
