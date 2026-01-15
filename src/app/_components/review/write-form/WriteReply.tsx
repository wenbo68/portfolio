'use client';

// import { useSession } from 'next-auth/react';
import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import toast from 'react-hot-toast';
// import { addCommentToTree } from '~/app/_utils/comment';
import { api } from '~/trpc/react';
import type { UpdateCommentInput } from '~/type';

interface AddReplyFields {
  parentId: string;
  setIsWritingReply: Dispatch<SetStateAction<boolean>>;
}

interface UpdateReplyFields {
  id: string;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({
    e,
    commentId: id,
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

export default function WriteReply({
  // setError,
  addInput,
  updateInput,
}: WriteReviewProps) {
  // const { data: session } = useSession();
  const utils = api.useUtils();

  const [text, setText] = useState(updateInput?.text ?? '');

  const [error, setError] = useState('');

  const addMutation = api.comment.add.useMutation({
    // onMutate: async (newReply) => {
    //   await utils.comment.getAllAsTree.cancel();
    //   const previousComments = utils.comment.getAllAsTree.getData();

    //   if (previousComments && session?.user) {
    //     const optimisticReply: CommentTree = {
    //       id: `optimistic-${Date.now()}`,
    //       text: newReply.text,
    //       parentId: newReply.parentId!,
    //       userId: session.user.id,
    //       createdAt: new Date(),
    //       rating: null,
    //       websiteUrl: null,
    //       package: null,
    //       user: {
    //         name: session.user.name ?? 'You',
    //         image: session.user.image ?? '',
    //       },
    //       replies: [],
    //     };

    //     // MODIFIED: Use the new helper to correctly place the reply
    //     const updatedComments = addCommentToTree(
    //       previousComments,
    //       optimisticReply,
    //       newReply.parentId
    //     );
    //     utils.comment.getAllAsTree.setData(undefined, updatedComments);

    //     // This can now be safely called after setting data
    //     addInput?.setIsWritingReply(false);
    //     setText('');
    //   }
    //   return { previousComments };
    // },

    onError: (err, newReply, context) => {
      void utils.comment.getCommentTree.invalidate();

      // if (context?.previousComments) {
      //   utils.comment.getAllAsTree.setData(undefined, context.previousComments);
      // }
      // console.error('Failed to post reply:', err);
      // setError('Failed to add reply. Please try again.');

      toast.custom((t) => (
        <div className={`rounded bg-gray-800 px-4 py-2 text-sm text-gray-300`}>
          Submission failed. Please try again.
        </div>
      ));
    },

    onSuccess: () => {
      void utils.comment.getCommentTree.invalidate();

      // This can now be safely called after setting data
      addInput?.setIsWritingReply(false);
      setText('');

      toast.custom((t) => (
        <div className={`rounded bg-gray-800 px-4 py-2 text-sm text-gray-300`}>
          Submission succeeded.
        </div>
      ));
    },

    onSettled: () => {
      // void utils.comment.getCommentTree.invalidate();
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    if (!addInput) return;
    e.preventDefault();
    if (text.trim() === '') return;
    addMutation.mutate({ text, parentId: addInput.parentId });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form
        onSubmit={(e: FormEvent<Element>) =>
          updateInput
            ? updateInput.handleUpdate({
                e,
                commentId: updateInput.id,
                type: 'reply',
                selectedPackage: undefined,
                rating: undefined,
                websiteUrl: undefined,
                text,
              })
            : handleAdd(e)
        }
        className={`flex flex-col gap-3 bg-gray-900 ${
          updateInput ? '' : 'pl-10 pt-5 '
        }rounded text-sm text-gray-500`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="w-full bg-gray-800 text-gray-400 rounded p-2 outline-none scrollbar-hide"
          rows={2}
        ></textarea>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (addInput) {
                addInput.setIsWritingReply(false);
              } else {
                updateInput?.setIsEditing(false);
              }
              setError('');
            }}
            disabled={updateInput?.isUpdatePending}
            className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500"
          >
            Cancel
          </button>
          {updateInput ? (
            <button
              type="submit"
              disabled={updateInput?.isUpdatePending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500"
            >
              {updateInput.isUpdatePending ? 'Saving' : 'Save'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500"
            >
              {addMutation.isPending ? 'Submitting' : 'Submit'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
