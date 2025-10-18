import type { CommentTree } from '~/type';

/**
 * Add review or reply to the tree.
 * Handles both top-level reviews and nested replies.
 */
export function addCommentToTree(
  comments: CommentTree[],
  newComment: CommentTree,
  parentId?: string
): CommentTree[] {
  // Case 1: It's a reply (parentId is provided).
  // We need to recursively find the parent and add to its replies.
  if (parentId) {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        // Found the parent, add the new reply.
        return {
          ...comment,
          replies: [...comment.replies, newComment],
        };
      }
      // Didn't find it here, so recurse into this comment's replies.
      return {
        ...comment,
        replies: addCommentToTree(comment.replies, newComment, parentId),
      };
    });
  }

  // Case 2: It's a top-level review (no parentId).
  // Add the new review to the beginning of the root comments array.
  else {
    return [newComment, ...comments];
  }
}
/**
 * Recursively searches for a comment by ID and removes it from the tree.
 * Returns a new, updated tree.
 */
export function removeCommentFromTree(
  comments: CommentTree[],
  commentId: string
): CommentTree[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: removeCommentFromTree(comment.replies, commentId),
    }));
}

/**
 * Recursively searches for a comment by ID and updates its data.
 * Returns a new, updated tree.
 */
export function updateCommentInTree(
  comments: CommentTree[],
  updatedComment: Partial<CommentTree> & { id: string }
): CommentTree[] {
  return comments.map((comment) => {
    if (comment.id === updatedComment.id) {
      // Found the comment, update it
      return { ...comment, ...updatedComment };
    }
    // Didn't find it, recurse into its replies
    return {
      ...comment,
      replies: updateCommentInTree(comment.replies, updatedComment),
    };
  });
}
