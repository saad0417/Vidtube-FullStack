import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  Trash2, 
  Edit3, 
  Loader2 
} from 'lucide-react';
import { commentApi } from '../../api/comment.api';
import { likeApi } from '../../api/like.api';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/formatters';
import { ConfirmationModal } from '../common/ConfirmationModal';
import toast from 'react-hot-toast';
import { getErrorMessage, DEFAULT_AVATAR } from '../../utils/helpers';

export const CommentsSection = ({ videoId }) => {
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);

  // New comment input
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    try {
      setLoading(true);
      const res = await commentApi.getVideoComments(videoId);
      if (res.data) {
        setComments(res.data.comments || []);
        setTotalComments(res.data.totalComments || (res.data.comments ? res.data.comments.length : 0));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await commentApi.addComment(videoId, newComment.trim());
      
      // Inject newly created comment with current user details
      const created = {
        ...res.data,
        owner: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        },
        likesCount: 0,
        isLiked: false,
      };

      setComments((prev) => [created, ...prev]);
      setTotalComments((prev) => prev + 1);
      setNewComment('');
      setIsFocused(false);
      toast.success('Comment added!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Comment Like
  const handleToggleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like comments');
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const wasLiked = c.isLiked;
          return {
            ...c,
            isLiked: !wasLiked,
            likesCount: wasLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
          };
        }
        return c;
      })
    );

    try {
      await likeApi.toggleCommentLike(commentId);
    } catch {
      // Revert if the toggle did not stick
      fetchComments();
    }
  };

  // Update Comment
  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      setIsUpdating(true);
      await commentApi.updateComment(commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, content: editContent.trim() } : c))
      );
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Comment updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update comment'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      setIsDeleting(true);
      await commentApi.deleteComment(commentToDelete._id);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete._id));
      setTotalComments((prev) => Math.max(0, prev - 1));
      setCommentToDelete(null);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete comment'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8 pt-6 border-t border-dark-border/60">
      {/* Header with count */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
        </h2>
      </div>

      {/* Add comment box */}
      <div className="flex gap-4 items-start">
        <img
          src={user?.avatar || DEFAULT_AVATAR}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover border border-dark-border shrink-0 mt-1"
        />

        <form onSubmit={handleAddComment} className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to add a comment...'}
            value={newComment}
            disabled={!isAuthenticated}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-transparent border-b border-dark-border focus:border-brand text-sm text-white placeholder-gray-500 py-2 focus:outline-none transition-colors"
          />

          {isFocused && (
            <div className="flex items-center justify-end gap-2 mt-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setNewComment('');
                  setIsFocused(false);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="btn-primary py-1.5 px-4 text-xs font-semibold"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Comment'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex flex-col gap-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-dark-card skeleton shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-32 rounded bg-dark-card skeleton" />
                <div className="h-4 w-5/6 rounded bg-dark-card skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No comments yet. Be the first to start the conversation!
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => {
            const author = comment.owner || {};
            const isAuthor = user?._id && (user._id === author._id || user._id === comment.owner);
            const isEditing = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="flex gap-4 items-start group">
                {/* Author Avatar */}
                <Link to={`/c/${author.username || ''}`} className="shrink-0">
                  <img
                    src={author.avatar || DEFAULT_AVATAR}
                    alt={author.fullName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-dark-border"
                  />
                </Link>

                {/* Comment Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/c/${author.username || ''}`}
                      className="text-xs font-semibold text-white hover:underline truncate"
                    >
                      @{author.username || author.fullName || 'user'}
                    </Link>
                    <span className="text-[11px] text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="input-field w-full text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-3 py-1 rounded-full text-xs font-medium text-gray-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateComment(comment._id)}
                          disabled={isUpdating || !editContent.trim()}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  )}

                  {/* Comment Actions (Like, Edit, Delete) */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleToggleLikeComment(comment._id)}
                      className={`flex items-center gap-1.5 text-xs font-medium rounded-full py-1 px-2 transition-colors ${
                        comment.isLiked
                          ? 'text-brand'
                          : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-brand' : ''}`} />
                      {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                    </button>

                    {isAuthor && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditContent(comment.content);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-dark-hover"
                          title="Edit comment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCommentToDelete(comment)}
                          className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-dark-hover"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteComment}
        title="Delete comment"
        message="Are you sure you want to delete your comment? This cannot be undone."
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
};
