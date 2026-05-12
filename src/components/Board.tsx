import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Post, PostType, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  Loader2 
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BoardProps {
  type: PostType;
  title: string;
}

export default function Board({ type, title }: BoardProps) {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [type]);

  async function fetchPosts() {
    setLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    try {
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(fetched);
    } catch (error) {
      console.error("Board fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  const canWrite = 
    type === PostType.FREE || 
    profile?.role === UserRole.TEACHER || 
    profile?.role === UserRole.ADMIN;

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newContent || !user || !profile) return;
    
    setUploading(true);
    try {
      let attachmentUrl = '';
      let attachmentName = '';

      if (file) {
        const fileRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        attachmentUrl = await getDownloadURL(uploadResult.ref);
        attachmentName = file.name;
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile.displayName,
        title: newTitle,
        content: newContent,
        type: type,
        attachmentUrl,
        attachmentName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewTitle('');
      setNewContent('');
      setFile(null);
      setIsModalOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Post creation error:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 mt-1">
            {type === PostType.NOTICE ? '선생님이 전하는 중요한 소식입니다.' : 
             type === PostType.FREE ? '친구들과 자유롭게 이야기를 나누어보세요.' : 
             '학습에 필요한 자료들을 모아두었어요.'}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 transition-all"
          >
            <Plus className="w-5 h-5" />
            글쓰기
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="검색어를 입력하세요..." 
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Post List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={post.id}
            >
              <Link 
                to={`/post/${post.id}`}
                className="block bg-white p-6 rounded-3xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       {post.attachmentUrl && (
                        <span className="bg-orange-100 text-orange-600 p-1 rounded-md">
                          {post.attachmentName?.match(/\.(jpg|jpeg|png|gif)$/i) ? <ImageIcon className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                        </span>
                       )}
                       <h3 className="font-bold text-xl group-hover:text-orange-600 transition-colors line-clamp-1">
                         {post.title}
                       </h3>
                    </div>
                    <p className="text-gray-500 line-clamp-2 text-sm mb-4 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{post.authorName}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
                     <FileText className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-3xl py-20 text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400">아직 게시물이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">새 글 작성하기</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">제목</label>
                  <input 
                    required
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">내용</label>
                  <textarea 
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="친구들과 나누고 싶은 이야기를 적어보세요"
                    rows={8}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                   <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-sm font-semibold">
                     <Paperclip className="w-4 h-4" />
                     {file ? file.name : '파일 첨부'}
                     <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                     />
                   </label>
                   {file && (
                     <button onClick={() => setFile(null)} className="text-red-500">
                       <X className="w-4 h-4" />
                     </button>
                   )}
                </div>

                <div className="pt-4">
                  <button 
                    disabled={uploading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : '작성 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
