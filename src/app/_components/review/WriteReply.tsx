'use client';

import { useSession } from 'next-auth/react';
import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import { addCommentToTree } from '~/app/_utils/comment';
import { api } from '~/trpc/react';
import type { CommentTree, updateCommentInput } from '~/type';

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
    id,
    type,
    selectedPackage,
    rating,
    websiteUrl,
    text,
  }: updateCommentInput) => void;
}

type WriteReviewProps =
  | {
      setError: Dispatch<SetStateAction<string>>;
      addInput: AddReplyFields;
      updateInput?: never;
    }
  | {
      setError: Dispatch<SetStateAction<string>>;
      addInput?: never;
      updateInput: UpdateReplyFields;
    };

export default function WriteReply({
  setError,
  addInput,
  updateInput,
}: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [text, setText] = useState(updateInput?.text ?? '');

  const addMutation = api.comment.add.useMutation({
    // mutationKey: ['comment', 'add'],
    onMutate: async (newReply) => {
      await utils.comment.getAllAsTree.cancel();
      const previousComments = utils.comment.getAllAsTree.getData();

      if (previousComments && session?.user) {
        const optimisticReply: CommentTree = {
          id: `optimistic-${Date.now()}`,
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
          replies: [],
        };

        // MODIFIED: Use the new helper to correctly place the reply
        const updatedComments = addCommentToTree(
          previousComments,
          optimisticReply,
          newReply.parentId
        );
        utils.comment.getAllAsTree.setData(undefined, updatedComments);

        // This can now be safely called after setting data
        addInput?.setIsWritingReply(false);
        setText('');
      }
      return { previousComments };
    },

    onError: (err, newReply, context) => {
      if (context?.previousComments) {
        utils.comment.getAllAsTree.setData(undefined, context.previousComments);
      }
      console.error('Failed to post reply:', err);
      setError(err.message);
    },

    onSettled: () => {
      void utils.comment.getAllAsTree.invalidate();
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    if (!addInput) return;
    e.preventDefault();
    if (text.trim() === '') return;
    addMutation.mutate({ text, parentId: addInput.parentId });
  };

  return (
    <form
      onSubmit={(e: FormEvent<Element>) =>
        updateInput
          ? updateInput.handleUpdate({
              e,
              id: updateInput.id,
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
          className="hover:text-gray-400"
        >
          Cancel
        </button>
        {updateInput ? (
          <button type="submit" className="hover:text-gray-400">
            Save
          </button>
        ) : (
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="hover:text-gray-400"
          >
            {addMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </form>
  );
}
