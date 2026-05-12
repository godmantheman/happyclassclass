import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { SharedFile, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  File, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  FileArchive, 
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FileShare() {
  const { profile, user } = useAuth();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoading(true);
    const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
    try {
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedFile));
      setFiles(fetched);
    } catch (error) {
      console.error("Fetch files error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    setUploading(true);
    try {
      const fileRef = ref(storage, `shared/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'files'), {
        name: file.name,
        url,
        type: file.type,
        uploadedBy: user.uid,
        uploaderName: profile.displayName,
        createdAt: serverTimestamp()
      });

      fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm("파일을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, 'files', fileId));
        fetchFiles();
      } catch (error) {
        console.error("Delete file error:", error);
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('zip') || type.includes('archive')) return <FileArchive className="w-8 h-8 text-purple-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const canUpload = profile?.role === UserRole.TEACHER || profile?.role === UserRole.ADMIN;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">파일 공유함</h1>
          <p className="text-gray-500 mt-1">학급 활동 사진과 문서를 보관하는 공간입니다.</p>
        </div>
        {canUpload && (
          <label className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 transition-all cursor-pointer">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            파일 올리기
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={file.id}
              className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-orange-50 transition-colors">
                  {getFileIcon(file.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{file.name}</h3>
                  <p className="text-xs text-gray-400">{file.uploaderName} • {formatDate(file.createdAt)}</p>
                </div>
                <div className="flex gap-2 w-full pt-2">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-600 py-3 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors"
                  >
                    <Download className="w-4 h-4" /> 다운로드
                  </a>
                  {(profile?.role === UserRole.ADMIN || file.uploadedBy === user?.uid) && (
                    <button 
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl py-20 text-center border border-dashed border-gray-200">
           <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400">공유된 파일이 아직 없습니다.</p>
        </div>
      )}
    </div>
  );
}

function FolderOpen({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.97 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2" /></svg>
  );
}
