import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

export default function AuthPage() {
  const { user, signIn, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-orange-100 max-w-sm w-full text-center border border-orange-50"
      >
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-orange-600">😊</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">행복반 커뮤니티</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          중학교 특수학급 '행복반' 친구들을 위한<br />통합 소통 플랫폼입니다.
        </p>
        
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-200 active:transform active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          구글 계정으로 로그인하기
        </button>
        
        <p className="mt-8 text-xs text-gray-400">
          학교 구글 계정을 사용하여 입장해주세요.
        </p>
      </motion.div>
    </div>
  );
}
