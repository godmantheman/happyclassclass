import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, Comment, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  MessageCircle, 
  Send,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'posts', id));
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
        } else {
          alert("존재하지 않는 게시물입니다.");
          navigate(-1);
        }
      } catch (error) {
        console.error("Fetch post error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Subscribe to comments
    const q = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(fetched);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !post) return;
    if (window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, 'posts', id));
        navigate(-1);
      } catch (error) {
        console.error("Delete post error:", error);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentInput || !user || !profile) return;

    try {
      await addDoc(collection(db, 'posts', id, 'comments'), {
        postId: id,
        authorId: user.uid,
        authorName: profile.displayName,
        content: commentInput,
        createdAt: serverTimestamp()
      });
      setCommentInput('');
    } catch (error) {
      console.error("Add comment error:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, 'posts', id, 'comments', commentId));
      } catch (error) {
        console.error("Delete comment error:", error);
      }
    }
  };

  const isAuthor = user?.uid === post?.authorId;
  const isAdmin = profile?.role === UserRole.ADMIN;

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
           {isAdmin && !isAuthor && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <ShieldAlert className="w-3 h-3" /> 관리자 제어 모드
              </span>
           )}
           {(isAuthor || isAdmin) && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              게시물 삭제
            </button>
           )}
        </div>
      </div>

      {/* Main Content */}
      <motion.article 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
      >
        <header className="mb-8 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-gray-700">{post.authorName}</div>
                <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
              </div>
            </div>
            {post.attachmentUrl && (
              <a 
                href={post.attachmentUrl} 
                target="_blank" 
                rel="noreferrer"
                download={post.attachmentName}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-gray-600 border border-gray-200 shadow-sm"
              >
                <Download className="w-4 h-4" />
                {post.attachmentName || '첨부파일'}
              </a>
            )}
          </div>
        </header>

        <div className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[200px]">
          {post.content}
        </div>

        {post.attachmentUrl && post.attachmentName?.match(/\.(jpg|jpeg|png|gif)$/i) && (
           <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100">
             <img src={post.attachmentUrl} alt="첨부 이미지" className="w-full h-auto" />
           </div>
        )}
      </motion.article>

      {/* Comments Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-orange-500" />
          댓글 {comments.length}
        </h2>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="divide-y divide-gray-50">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-700">{comment.authorName}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    {(user?.uid === comment.authorId || isAdmin) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                첫 번째 댓글을 남겨보세요!
              </div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="relative mt-4">
            <input 
              type="text" 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
