'use client';

import type { inferRouterOutputs } from '@trpc/server';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { AppRouter } from '~/server/api/root';
import { api } from '~/trpc/react';

type RouterOutput = inferRouterOutputs<AppRouter>;
type TRPCUtils = ReturnType<typeof api.useUtils>;

// ... (Your Reply component can stay the same)
export default function Reply({
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
    onMutate: async (newReply) => {
      await utils.comment.getAll.cancel();
      const previousComments = utils.comment.getAll.getData();
      if (previousComments && session?.user) {
        const optimisticReply: RouterOutput['comment']['getAll'][number] = {
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
        };
        utils.comment.getAll.setData(undefined, [
          ...previousComments,
          optimisticReply,
        ]);
      }
      return { previousComments };
    },
    onError: (err, newReply, context) => {
      if (context?.previousComments) {
        utils.comment.getAll.setData(undefined, context.previousComments);
      }
      console.error('Failed to post reply:', err);
    },
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
