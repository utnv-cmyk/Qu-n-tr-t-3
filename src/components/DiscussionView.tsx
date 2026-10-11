import React, { useState, useRef, useEffect } from 'react';
import {
  MessagesSquare,
  Send,
  Heart,
  MessageCircle,
  Paperclip,
  Trash2,
  Sparkles,
  User,
  ShieldCheck,
  Edit3,
  X,
  Search,
  Check,
  CornerDownRight,
  Upload,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { DiscussionComment, DiscussionPost, FileItem, Member } from '../types';
import { FileIconBadge } from './FileIconBadge';
import { processUploadedFile, sanitizeDiscussions } from '../storage';
import { APP_CONFIG, formatBytes } from '../config';

interface Props {
  posts: DiscussionPost[];
  members: Member[];
  currentMember: Member;
  onUpdatePosts: (posts: DiscussionPost[]) => void;
  onDeletePost?: (post: DiscussionPost) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const DiscussionView: React.FC<Props> = ({
  posts,
  members,
  currentMember,
  onUpdatePosts,
  onDeletePost,
  onOpenTrash,
  trashCount = 0,
  onViewFile,
  showToast,
}) => {
  // Bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');

  // Đăng thảo luận mới
  const [newPostAuthorId, setNewPostAuthorId] = useState<string>(currentMember.id);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFiles, setNewPostFiles] = useState<FileItem[]>([]);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Bình luận / Trả lời
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentAuthorId, setCommentAuthorId] = useState<string>(currentMember.id);
  const [commentInput, setCommentInput] = useState('');

  // Chỉnh sửa bài viết
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);
  const [editAuthorId, setEditAuthorId] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFiles, setEditFiles] = useState<FileItem[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Chỉnh sửa bình luận (comment)
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
    content: string;
  } | null>(null);

  // Tự động kiểm tra và chuẩn hóa tên người đăng / bình luận theo đúng danh sách thành viên trong nhóm
  useEffect(() => {
    if (!members || members.length === 0 || !posts || posts.length === 0) return;
    const { cleaned, changed } = sanitizeDiscussions(posts, members);
    if (changed) {
      onUpdatePosts(cleaned);
    }
  }, [members, posts, onUpdatePosts]);

  // Đảm bảo tác giả đăng bài mới luôn là thành viên hợp lệ trong nhóm
  useEffect(() => {
    if (members.length > 0 && !members.some((m) => m.id === newPostAuthorId)) {
      setNewPostAuthorId(members[0].id);
    }
    if (members.length > 0 && !members.some((m) => m.id === commentAuthorId)) {
      setCommentAuthorId(members[0].id);
    }
  }, [members, newPostAuthorId, commentAuthorId]);

  const handleSyncNamesWithGroup = () => {
    const { cleaned, changed } = sanitizeDiscussions(posts, members);
    onUpdatePosts(cleaned);
    if (changed) {
      showToast('Đã sửa lại toàn bộ tên người đăng và phản hồi theo đúng danh sách thành viên trong nhóm!', 'success');
    } else {
      showToast('Tất cả thảo luận và phản hồi đã đúng tên các thành viên trong nhóm.', 'success');
    }
  };

  // Thêm file đính kèm cho bài viết mới
  const handleAddNewFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const processedList: FileItem[] = [];
      for (const f of filesArray) {
        const processed = await processUploadedFile(f);
        processedList.push(processed);
      }
      setNewPostFiles((prev) => [...prev, ...processedList]);
      showToast(`Đã đính kèm ${processedList.length} tệp.`);
      if (newFileInputRef.current) newFileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = (fileId: string) => {
    setNewPostFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Thêm file đính kèm khi sửa bài viết
  const handleAddEditFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const processedList: FileItem[] = [];
      for (const f of filesArray) {
        const processed = await processUploadedFile(f);
        processedList.push(processed);
      }
      setEditFiles((prev) => [...prev, ...processedList]);
      showToast(`Đã đính kèm thêm ${processedList.length} tệp.`);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleRemoveEditFile = (fileId: string) => {
    setEditFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Tạo thảo luận mới
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      showToast('Vui lòng nhập nội dung bài thảo luận!', 'warning');
      return;
    }

    const author = members.find((m) => m.id === newPostAuthorId) || currentMember;

    const newPost: DiscussionPost = {
      id: 'post_' + Date.now(),
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      authorRole: author.role,
      title: newPostTitle.trim() || undefined,
      content: newPostContent.trim(),
      createdAt: new Date().toLocaleString('vi-VN'),
      attachedFiles: newPostFiles,
      likes: 0,
      isLiked: false,
      comments: [],
    };

    onUpdatePosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostFiles([]);
    showToast(`Đã đăng bài thảo luận thành công với tư cách "${author.name}"!`);
  };

  // Like bài viết
  const handleLike = (post: DiscussionPost) => {
    const updated = posts.map((p) => {
      if (p.id === post.id) {
        const liked = !p.isLiked;
        return {
          ...p,
          isLiked: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      }
      return p;
    });
    onUpdatePosts(updated);
  };

  // Thêm bình luận
  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;

    const author = members.find((m) => m.id === commentAuthorId) || currentMember;

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: 'c_' + Date.now(),
              authorId: author.id,
              authorName: author.name,
              authorRole: author.role,
              authorAvatar: author.avatar,
              content: commentInput.trim(),
              createdAt: 'Vừa xong',
            },
          ],
        };
      }
      return p;
    });

    onUpdatePosts(updated);
    setCommentInput('');
    setActiveCommentId(null);
    showToast(`Đã gửi phản hồi với tên "${author.name}" thành công.`);
  };

  // Mở modal sửa bài viết của thành viên
  const handleOpenEditPost = (post: DiscussionPost) => {
    setEditingPost(post);
    const matched = members.find(
      (m) =>
        m.id === post.authorId ||
        m.name.trim().toLowerCase() === post.authorName.trim().toLowerCase()
    );
    setEditAuthorId(matched ? matched.id : members[0]?.id || currentMember.id);
    setEditTitle(post.title || '');
    setEditContent(post.content);
    setEditFiles(post.attachedFiles || (post.attachment ? [post.attachment] : []));
  };

  // Lưu chỉnh sửa bài viết của thành viên
  const handleSaveEditPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editContent.trim()) {
      showToast('Nội dung bài viết không được để trống!', 'warning');
      return;
    }

    const author = members.find((m) => m.id === editAuthorId) || {
      id: editingPost.authorId || currentMember.id,
      name: editingPost.authorName,
      role: editingPost.authorRole,
      avatar: editingPost.authorAvatar,
    };

    const updated = posts.map((p) =>
      p.id === editingPost.id
        ? {
            ...p,
            authorId: author.id,
            authorName: author.name,
            authorRole: author.role,
            authorAvatar: author.avatar,
            title: editTitle.trim() || undefined,
            content: editContent.trim(),
            attachedFiles: editFiles,
          }
        : p
    );

    onUpdatePosts(updated);
    showToast(`Đã lưu thay đổi bài thảo luận của "${author.name}"!`);
    setEditingPost(null);
  };

  // Xóa bài viết của thành viên (Chuyển vào thùng rác để khôi phục được)
  const handleDeletePost = (post: DiscussionPost) => {
    const postTitle = post.title ? `"${post.title}"` : `của ${post.authorName}`;
    if (onDeletePost) {
      onDeletePost(post);
    } else {
      onUpdatePosts(posts.filter((p) => p.id !== post.id));
    }
    showToast(`Đã chuyển bài thảo luận ${postTitle} vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
  };

  // Bắt đầu sửa bình luận
  const handleStartEditComment = (postId: string, comment: DiscussionComment) => {
    setEditingComment({
      postId,
      commentId: comment.id,
      content: comment.content,
    });
  };

  // Lưu chỉnh sửa bình luận
  const handleSaveEditComment = () => {
    if (!editingComment) return;
    if (!editingComment.content.trim()) {
      showToast('Nội dung phản hồi không được để trống!', 'warning');
      return;
    }

    const updated = posts.map((post) => {
      if (post.id === editingComment.postId) {
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === editingComment.commentId
              ? {
                  ...c,
                  content: editingComment.content.trim(),
                  updatedAt: '(Đã chỉnh sửa)',
                }
              : c
          ),
        };
      }
      return post;
    });

    onUpdatePosts(updated);
    showToast('Đã cập nhật phản hồi thảo luận thành công!');
    setEditingComment(null);
  };

  // Xóa bình luận của thành viên
  const handleDeleteComment = (postId: string, comment: DiscussionComment) => {
    if (confirm(`Bạn có chắc muốn xóa phản hồi này của "${comment.authorName}"?`)) {
      const updated = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter((c) => c.id !== comment.id),
          };
        }
        return post;
      });

      onUpdatePosts(updated);
      showToast(`Đã xóa phản hồi của "${comment.authorName}".`);
    }
  };

  // Lọc bài viết theo từ khóa và thành viên
  const filteredPosts = posts.filter((post) => {
    const matchSearch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchMember =
      filterMemberId === 'all' ||
      post.authorId === filterMemberId ||
      post.authorName === members.find((m) => m.id === filterMemberId)?.name;

    return matchSearch && matchMember;
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">💬 Diễn Đàn Trao Đổi Học Tập</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              Tổ 3 – Lớp 11A1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Không gian trao đổi bài tập khó, giải đáp thắc mắc, phản hồi và góp ý xây dựng chuyên đề học tập
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleSyncNamesWithGroup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-xs"
            title="Đồng bộ lại toàn bộ người đăng bài và bình luận theo đúng danh sách thành viên trong nhóm"
          >
            <RefreshCw size={13} className="text-blue-600" />
            <span>Đồng bộ tên theo nhóm</span>
          </button>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục bài thảo luận đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Post Creator Box */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">✍️ Tạo bài thảo luận mới:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Người đăng:</label>
            <select
              value={newPostAuthorId}
              onChange={(e) => setNewPostAuthorId(e.target.value)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.role === 'leader' ? '(Tổ trưởng)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          {/* Tiêu đề thảo luận */}
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Tiêu đề bài thảo luận (tùy chọn, ví dụ: Hỏi bài tập Hóa câu 5, Ôn tập giữa kỳ...)"
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold outline-none transition-all placeholder:font-normal"
          />

          <div className="flex items-start gap-3">
            <img
              src={members.find((m) => m.id === newPostAuthorId)?.avatar || currentMember.avatar}
              alt="Avatar"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Bạn muốn thảo luận bài tập gì hoặc chia sẻ kinh nghiệm học tập gì với các bạn trong Tổ 3?"
                className="w-full p-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-xs sm:text-sm outline-none resize-none transition-all"
              />

              {/* Danh sách file chuẩn bị đính kèm */}
              {newPostFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {newPostFiles.map((file) => (
                    <div
                      key={file.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium"
                    >
                      <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      <span className="text-[10px] text-blue-500">({file.sizeFormatted})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(file.id)}
                        className="p-0.5 hover:bg-blue-200 rounded-md text-blue-700 ml-1"
                        title="Xóa tệp đính kèm"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={newFileInputRef}
                    onChange={handleAddNewFiles}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Paperclip size={14} className="text-slate-500" />
                    <span>Đính kèm tệp</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    Đính kèm tài liệu Word, PDF, hình ảnh, bài giải...
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send size={13} /> Đăng thảo luận
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Tìm kiếm và Lọc thảo luận */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm nội dung bài thảo luận, tiêu đề hoặc tên thành viên..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Lọc theo:</label>
          <select
            value={filterMemberId}
            onChange={(e) => setFilterMemberId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
          >
            <option value="all">Tất cả thành viên ({posts.length})</option>
            {members.map((m) => {
              const count = posts.filter(
                (p) => p.authorId === m.id || p.authorName === m.name
              ).length;
              return (
                <option key={m.id} value={m.id}>
                  {m.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <MessagesSquare size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy bài thảo luận nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Chưa có thảo luận nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm. Bạn có thể đăng câu hỏi hoặc chia sẻ đầu tiên!
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {post.authorName}
                        </h4>
                        {post.authorRole === 'leader' ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            👑 Tổ trưởng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                            Thành viên Tổ 3
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {post.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Nút Sửa & Xóa thảo luận cho các thành viên */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                    <button
                      onClick={() => handleOpenEditPost(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-blue-700 hover:bg-white rounded-lg transition-all text-xs font-bold shadow-2xs"
                      title="Sửa nội dung bài thảo luận của thành viên"
                    >
                      <Edit3 size={13} className="text-blue-600" />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => handleDeletePost(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-white rounded-lg transition-all text-xs font-bold shadow-2xs"
                      title="Xóa bài thảo luận này (Chuyển vào Thùng rác)"
                    >
                      <Trash2 size={13} className="text-rose-500" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Post Title if exists */}
                {post.title && (
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {post.title}
                  </h3>
                )}

                {/* Post Content */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Attached files */}
                {post.attachedFiles && post.attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {post.attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onViewFile(file)}
                        className="cursor-pointer inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 text-xs font-semibold text-slate-800 transition-colors shadow-2xs group"
                        title="Bấm để xem trực tiếp tệp này"
                      >
                        <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                        <span className="group-hover:text-blue-600 transition-colors">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({file.sizeFormatted})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Like & Comment */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      post.isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                    }`}
                  >
                    <Heart size={16} className={post.isLiked ? 'fill-rose-600' : ''} />
                    <span>{post.likes} Thích</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveCommentId(activeCommentId === post.id ? null : post.id)
                    }
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span>{post.comments.length} Phản hồi</span>
                  </button>
                </div>

                {/* Comments & Replies Section */}
                <div className="space-y-3 pt-2 pl-3 sm:pl-4 border-l-2 border-slate-100">
                  {post.comments.map((comment) => {
                    const isEditingThisComment =
                      editingComment?.postId === post.id &&
                      editingComment?.commentId === comment.id;

                    const authorMember = members.find(
                      (m) => m.name === comment.authorName || m.id === comment.authorId
                    );
                    const avatar = comment.authorAvatar || authorMember?.avatar;

                    return (
                      <div
                        key={comment.id}
                        className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-2 border border-slate-100/80 transition-all hover:bg-slate-100/60"
                      >
                        {/* Header của bình luận */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={comment.authorName}
                                className="w-6 h-6 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                {comment.authorName.charAt(0)}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">{comment.authorName}</span>
                              {comment.authorRole === 'leader' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                  Tổ trưởng
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                • {comment.createdAt} {comment.updatedAt && <span className="italic text-slate-400">{comment.updatedAt}</span>}
                              </span>
                            </div>
                          </div>

                          {/* Bộ nút Sửa & Xóa phản hồi của thành viên */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditComment(post.id, comment)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
                              title="Sửa nội dung phản hồi này"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(post.id, comment)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                              title="Xóa phản hồi này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Nội dung hoặc Khung sửa bình luận */}
                        {isEditingThisComment ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              rows={2}
                              value={editingComment.content}
                              onChange={(e) =>
                                setEditingComment({
                                  ...editingComment,
                                  content: e.target.value,
                                })
                              }
                              className="w-full p-2.5 bg-white border border-blue-400 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Nhập nội dung chỉnh sửa phản hồi..."
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingComment(null)}
                                className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg text-[11px] font-bold"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleSaveEditComment}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Check size={12} /> Lưu phản hồi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-600 leading-relaxed whitespace-pre-line pl-8">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Form Gửi câu trả lời mới */}
                  {activeCommentId === post.id && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 bg-slate-100/70 p-2.5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2 shrink-0">
                        <img
                          src={
                            members.find((m) => m.id === commentAuthorId)?.avatar ||
                            currentMember.avatar
                          }
                          alt="Avatar"
                          className="w-7 h-7 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <select
                          value={commentAuthorId}
                          onChange={(e) => setCommentAuthorId(e.target.value)}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none max-w-[170px]"
                          title="Chọn thành viên trong nhóm để gửi phản hồi"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.role === 'leader' ? '(Tổ trưởng)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Viết câu trả lời thảo luận..."
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInput.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Chỉnh Sửa Bài Viết Thảo Luận của Thành Viên */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl my-8 p-6 border border-slate-200 animate-scale-up text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Chỉnh Sửa Bài Thảo Luận
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cập nhật nội dung, tiêu đề, thành viên đăng bài và tệp đính kèm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditPost} className="space-y-4">
              {/* Chọn thành viên là tác giả */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Thành viên đăng bài thảo luận <span className="text-red-500">*</span>
                </label>
                <select
                  value={editAuthorId}
                  onChange={(e) => setEditAuthorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold focus:bg-white focus:border-blue-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.role === 'leader' ? '👑 Tổ trưởng' : 'Thành viên'} ({m.groupName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu đề thảo luận */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề bài thảo luận (tùy chọn)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hoặc chủ đề thảo luận..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Nội dung bài viết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung thảo luận <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none focus:bg-white focus:border-blue-500"
                  placeholder="Nhập nội dung bài viết thảo luận..."
                />
              </div>

              {/* Quản lý tệp đính kèm */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Tệp đính kèm ({editFiles.length})
                </label>

                {editFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {editFiles.map((file) => (
                      <div
                        key={file.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-medium shadow-2xs"
                      >
                        <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                        <span className="truncate max-w-[160px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({file.sizeFormatted})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditFile(file.id)}
                          className="p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 ml-1"
                          title="Xóa tệp này"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleAddEditFiles}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    <span>Đính kèm thêm tệp từ thiết bị</span>
                  </button>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Lưu thay đổi bài viết</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
