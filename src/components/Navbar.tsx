import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { 
  Home, 
  Bell, 
  MessageSquare, 
  BookOpen, 
  FolderOpen, 
  Users, 
  Settings, 
  LogOut,
  MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: '홈', path: '/', icon: Home },
    { name: '공지사항', path: '/notices', icon: Bell },
    { name: '자유게시판', path: '/freeboard', icon: MessageSquare },
    { name: '수업자료실', path: '/classroom', icon: BookOpen },
    { name: '파일공유함', path: '/files', icon: FolderOpen },
    { name: '채팅', path: '/chat', icon: MessageCircle },
  ];

  if (profile?.role === UserRole.ADMIN) {
    navItems.push({ name: '관리자', path: '/admin', icon: Settings });
  }

  return (
    <nav className="bg-white border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold bg-orange-500 text-white p-1 rounded-lg">
              😊
            </Link>
            <span className="font-bold text-orange-800 hidden sm:block">행복반 커뮤니티</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  location.pathname === item.path
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-orange-500"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-semibold text-orange-600">
                {profile?.role === UserRole.ADMIN ? '관리자' : profile?.role === UserRole.TEACHER ? '선생님' : '학생'}
              </span>
              <span className="text-sm font-medium">{profile?.displayName || '사용자'}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-11 right-0 left-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50">
           {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md transition-colors",
                  location.pathname === item.path
                    ? "text-orange-600"
                    : "text-gray-400 hover:text-orange-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            ))}
      </div>
    </nav>
  );
}
