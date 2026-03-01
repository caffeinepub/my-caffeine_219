import { useState } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronUp, Trash2, Reply, Loader2, RefreshCw } from 'lucide-react';
import type { Post, Reply as ReplyType } from '../backend';
import {
  useListPosts,
  useListReplies,
  useCreatePost,
  useAddReply,
  useDeletePost,
  useDeleteReply,
} from '../hooks/useQueries';
import UploadPasscodeModal from './UploadPasscodeModal';
import DeletePasscodeModal from './DeletePasscodeModal';

// ─── Reply Row ────────────────────────────────────────────────────────────────

function ReplyRow({ reply, onDelete }: { reply: ReplyType; onDelete: (id: bigint) => void }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteReply = useDeleteReply();

  const handleDelete = async () => {
    await deleteReply.mutateAsync({ id: reply.id, postId: reply.postId });
    setShowDeleteModal(false);
  };

  const formattedDate = new Date(Number(reply.createdAt) / 1_000_000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-3 py-2 border-b border-parchment-200 last:border-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
        <span className="text-xs font-serif text-ink-700">{reply.authorName.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-serif font-semibold text-ink-800">{reply.authorName}</span>
          <span className="text-xs text-ink-400 font-serif">{formattedDate}</span>
        </div>
        <p className="text-sm text-ink-700 font-serif mt-0.5 leading-relaxed">{reply.content}</p>
      </div>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="flex-shrink-0 p-1 text-ink-300 hover:text-seal-600 transition-colors"
        title="删除回复"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <DeletePasscodeModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmed={handleDelete}
        itemName={`${reply.authorName}的回复`}
        isLoading={deleteReply.isPending}
      />
    </div>
  );
}

// ─── Reply Section ────────────────────────────────────────────────────────────

function RepliesSection({ postId }: { postId: bigint }) {
  const { data: replies = [], isLoading } = useListReplies(postId);
  const addReply = useAddReply();

  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [pendingReply, setPendingReply] = useState<{ authorName: string; content: string } | null>(null);
  const [formError, setFormError] = useState('');

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyAuthor.trim() || !replyContent.trim()) {
      setFormError('请填写姓名和回复内容');
      return;
    }
    setFormError('');
    setPendingReply({ authorName: replyAuthor.trim(), content: replyContent.trim() });
    setShowPasscodeModal(true);
  };

  const handlePasscodeConfirmed = async () => {
    if (!pendingReply) return;
    try {
      await addReply.mutateAsync({ postId, ...pendingReply });
      setReplyAuthor('');
      setReplyContent('');
      setPendingReply(null);
      setShowPasscodeModal(false);
    } catch (err) {
      setShowPasscodeModal(false);
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-gold/30">
      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-ink-400 text-sm font-serif">
          <Loader2 className="w-4 h-4 animate-spin" />
          加载回复中...
        </div>
      ) : replies.length === 0 ? (
        <p className="text-xs text-ink-400 font-serif py-2 italic">暂无回复，来第一个留言吧</p>
      ) : (
        <div className="space-y-0">
          {replies.map((reply) => (
            <ReplyRow key={reply.id.toString()} reply={reply} onDelete={() => {}} />
          ))}
        </div>
      )}

      {/* Reply form */}
      <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={replyAuthor}
            onChange={(e) => setReplyAuthor(e.target.value)}
            placeholder="您的姓名"
            className="w-32 border border-parchment-300 rounded px-2 py-1.5 text-xs font-serif text-ink-800 bg-white focus:outline-none focus:ring-1 focus:ring-seal-400"
          />
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="输入回复内容..."
            className="flex-1 border border-parchment-300 rounded px-2 py-1.5 text-xs font-serif text-ink-800 bg-white focus:outline-none focus:ring-1 focus:ring-seal-400"
          />
          <button
            type="submit"
            disabled={addReply.isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-seal-600 text-white rounded text-xs font-serif hover:bg-seal-700 disabled:opacity-50 transition-colors"
          >
            {addReply.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Reply className="w-3 h-3" />}
            回复
          </button>
        </div>
        {formError && <p className="text-xs text-red-500 font-serif">{formError}</p>}
        {addReply.isError && (
          <p className="text-xs text-red-500 font-serif">回复失败：{(addReply.error as Error).message}</p>
        )}
      </form>

      <UploadPasscodeModal
        open={showPasscodeModal}
        onClose={() => { setShowPasscodeModal(false); setPendingReply(null); }}
        onConfirmed={handlePasscodeConfirmed}
        isLoading={addReply.isPending}
      />
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deletePost = useDeletePost();

  const handleDelete = async () => {
    await deletePost.mutateAsync(post.id);
    setShowDeleteModal(false);
  };

  const formattedDate = new Date(Number(post.createdAt) / 1_000_000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="bg-card border border-parchment-300 rounded-sm shadow-sm overflow-hidden">
      {/* Post header */}
      <div className="px-5 pt-4 pb-3 border-b border-parchment-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-seal-100 border border-seal-300 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-serif font-bold text-seal-700">{post.authorName.charAt(0)}</span>
            </div>
            <div>
              <span className="font-serif font-semibold text-ink-800 text-sm">{post.authorName}</span>
              <p className="text-xs text-ink-400 font-serif">{formattedDate}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 text-ink-300 hover:text-seal-600 transition-colors flex-shrink-0"
            title="删除帖子"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post content */}
      <div className="px-5 py-3">
        <p className="text-sm font-serif text-ink-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Toggle replies */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-serif text-seal-600 hover:text-seal-800 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {expanded ? '收起回复' : '展开回复'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="mt-2">
            <RepliesSection postId={post.id} />
          </div>
        )}
      </div>

      <DeletePasscodeModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmed={handleDelete}
        itemName={`${post.authorName}的帖子`}
        isLoading={deletePost.isPending}
      />
    </article>
  );
}

// ─── Main ClanInteraction Component ──────────────────────────────────────────

export default function ClanInteraction() {
  const { data: posts = [], isLoading, isError, refetch } = useListPosts();
  const createPost = useCreatePost();

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [pendingPost, setPendingPost] = useState<{ authorName: string; content: string } | null>(null);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) {
      setFormError('请填写姓名和留言内容');
      return;
    }
    setFormError('');
    setPendingPost({ authorName: authorName.trim(), content: content.trim() });
    setShowPasscodeModal(true);
  };

  const handlePasscodeConfirmed = async () => {
    if (!pendingPost) return;
    try {
      await createPost.mutateAsync(pendingPost);
      setAuthorName('');
      setContent('');
      setPendingPost(null);
      setShowPasscodeModal(false);
      setShowNewPostForm(false);
    } catch (err) {
      setShowPasscodeModal(false);
    }
  };

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-seal-600" />
          <h2 className="font-serif text-xl font-bold text-ink-900 tracking-wider">族人留言板</h2>
          <span className="text-xs text-ink-400 font-serif border border-parchment-300 px-2 py-0.5 rounded-full">
            {posts.length} 条留言
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 text-ink-400 hover:text-ink-700 transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-seal-600 text-white rounded text-sm font-serif hover:bg-seal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            发布留言
          </button>
        </div>
      </div>

      {/* New post form */}
      {showNewPostForm && (
        <div className="mb-5 bg-parchment-50 border border-parchment-300 rounded-sm p-4">
          <h3 className="font-serif text-sm font-semibold text-ink-800 mb-3 tracking-wide">✍ 发布新留言</h3>
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">您的姓名 *</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="请输入您的姓名"
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">留言内容 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入留言内容..."
                rows={4}
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400 resize-none"
              />
            </div>
            {formError && <p className="text-xs text-red-500 font-serif">{formError}</p>}
            {createPost.isError && (
              <p className="text-xs text-red-500 font-serif">发布失败：{(createPost.error as Error).message}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowNewPostForm(false); setFormError(''); setAuthorName(''); setContent(''); }}
                className="px-4 py-2 border border-parchment-300 text-ink-700 rounded text-sm font-serif hover:bg-parchment-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createPost.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-seal-600 text-white rounded text-sm font-serif hover:bg-seal-700 disabled:opacity-50 transition-colors"
              >
                {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                发布留言
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="font-serif">加载留言中...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-seal-600 font-serif">
          <p>加载失败，请稍后重试</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline">重新加载</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-parchment-300 rounded-sm">
          <MessageSquare className="w-10 h-10 text-parchment-400 mx-auto mb-3" />
          <p className="font-serif text-ink-400 text-sm">暂无留言，来第一个留言吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id.toString()} post={post} />
          ))}
        </div>
      )}

      <UploadPasscodeModal
        open={showPasscodeModal}
        onClose={() => { setShowPasscodeModal(false); setPendingPost(null); }}
        onConfirmed={handlePasscodeConfirmed}
        isLoading={createPost.isPending}
      />
    </section>
  );
}
