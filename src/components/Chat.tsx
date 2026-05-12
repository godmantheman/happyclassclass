import React, { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Send, User as UserIcon, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Chat() {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetched.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !profile) return;

    try {
      await addDoc(collection(db, 'chat_messages'), {
        authorId: user.uid,
        authorName: profile.displayName,
        text: input,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("메시지를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, 'chat_messages', messageId));
    } catch (error) {
      console.error("Delete message error:", error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("모든 채팅 기록을 삭제하시겠습니까? (되돌릴 수 없습니다)")) return;
    try {
      const q = query(collection(db, 'chat_messages'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Clear chat error:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-50">
      {/* Chat Header */}
      <div className="bg-orange-500 p-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">행복반 실시간 채팅</h1>
          <p className="text-xs text-orange-100 italic">친구들과 즐겁게 이야기해요!</p>
        </div>
        <div className="flex items-center gap-4">
          {profile?.role === UserRole.ADMIN && (
            <button 
              onClick={handleClearAll}
              className="p-2 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
              title="전체 채팅 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-200 flex items-center justify-center">
                 <UserIcon className="w-4 h-4 text-orange-600" />
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.authorId === user?.uid;
            const canDelete = isMe || profile?.role === UserRole.ADMIN;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && <span className="text-xs font-bold text-gray-500 ml-1">{msg.authorName}</span>}
                  <div className="flex items-end gap-2">
                    {isMe && canDelete && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className={`
                      px-5 py-3 rounded-2xl text-sm shadow-sm
                      ${isMe 
                        ? 'bg-orange-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-orange-100'}
                    `}>
                      {msg.text}
                    </div>
                    {!isMe && canDelete && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5">{formatDate(msg.createdAt)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-orange-300 outline-none transition-all shadow-sm"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
