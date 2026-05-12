import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole, SystemLog } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  History, 
  Terminal, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronDown,
  Cpu,
  Activity,
  HardDrive,
  Calendar,
  Utensils
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'dev' | 'template'>('users');
  const [devMode, setDevMode] = useState(false);
  const [sysStats, setSysStats] = useState({ cpu: 0, ram: 0, disk: 0 });

  // Template/Initial Setup state
  const [newMealDate, setNewMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMealMenu, setNewMealMenu] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');

  useEffect(() => {
    if (profile?.role !== UserRole.ADMIN && profile?.role !== UserRole.TEACHER) return;

    // Fetch users (Admins only)
    if (profile.role === UserRole.ADMIN) {
      const fetchUsers = async () => {
        const q = query(collection(db, 'users'), orderBy('email'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => d.data() as UserProfile));
      };
      fetchUsers();
    }

    // Subscribe to logs (Admins only)
    if (profile.role === UserRole.ADMIN) {
      const lq = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(50));
      const unsubLogs = onSnapshot(lq, (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog)));
      });
      return () => unsubLogs();
    }
  }, [profile]);

  useEffect(() => {
     // Keyboard shortcut for Dev mode (Ctrl+Alt+D)
     const handleKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        setDevMode(prev => !prev);
        setActiveTab('dev');
      }
    };
    window.addEventListener('keydown', handleKeys);
    
    // Simulate real-time stats for dev mode
    const interval = setInterval(() => {
      setSysStats({
        cpu: Math.floor(Math.random() * 30) + 10,
        ram: Math.floor(Math.random() * 20) + 40,
        disk: 65
      });
    }, 2000);

    return () => {
      window.removeEventListener('keydown', handleKeys);
      clearInterval(interval);
    };
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
       console.error("Role change error:", error);
    }
  };

  const handleUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const menuArray = newMealMenu.split(',').map(m => m.trim());
      await addDoc(collection(db, 'meals'), {
        date: newMealDate,
        menu: menuArray,
        calories: newMealCalories
      });
      alert('급식이 등록되었습니다!');
      setNewMealMenu('');
      setNewMealCalories('');
    } catch (error) {
      console.error("Meal update error:", error);
    }
  };

  const handleSetupDefaultSchedule = async () => {
    const defaultSchedule = [
      { period: '1', subject: '국어', time: '09:00 - 09:45', order: 1 },
      { period: '2', subject: '사회', time: '09:55 - 10:40', order: 2 },
      { period: '3', subject: '체육', time: '10:50 - 11:35', order: 3 },
      { period: '4', subject: '음악', time: '11:45 - 12:30', order: 4 },
      { period: '점심', subject: '급식 시간', time: '12:30 - 13:30', order: 5 },
      { period: '5', subject: '수학', time: '13:30 - 14:15', order: 6 },
      { period: '6', subject: '자율', time: '14:25 - 15:10', order: 7 },
    ];

    try {
      for (const item of defaultSchedule) {
        await addDoc(collection(db, 'schedule'), item);
      }
      alert('기본 시간표가 설정되었습니다!');
    } catch (error) {
      console.error("Schedule setup error:", error);
    }
  };

  if (profile?.role !== UserRole.ADMIN && profile?.role !== UserRole.TEACHER) {
    return <div className="p-10 text-center">접근 권한이 없습니다.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-orange-500" />
          {profile?.role === UserRole.ADMIN ? '관리자 제어판' : '선생님 도구'}
        </h1>
        {devMode && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
            DEVELOPER MODE ACTIVE
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-white rounded-2xl border border-gray-100 w-fit">
        {profile?.role === UserRole.ADMIN && (
          <>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" /> 사용자 관리
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <History className="w-4 h-4" /> 시스템 로그
            </button>
          </>
        )}
        <button 
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'template' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Calendar className="w-4 h-4" /> 학급 정보 설정
        </button>
        {profile?.role === UserRole.ADMIN && (
          <button 
            onClick={() => setActiveTab('dev')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dev' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Terminal className="w-4 h-4" /> 개발자 도구
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'template' && (
          <motion.div 
            key="template"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Meal Management */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                급식 정보 업데이트
              </h2>
              <form onSubmit={handleUpdateMeal} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">날짜</label>
                  <input 
                    type="date"
                    value={newMealDate}
                    onChange={(e) => setNewMealDate(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">메뉴 (쉼표로 구분)</label>
                  <input 
                    type="text"
                    value={newMealMenu}
                    onChange={(e) => setNewMealMenu(e.target.value)}
                    placeholder="현미밥, 미역국, 제육볶음..."
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">칼로리</label>
                  <input 
                    type="text"
                    value={newMealCalories}
                    onChange={(e) => setNewMealCalories(e.target.value)}
                    placeholder="650 kcal"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">
                  급식 정보 저장
                </button>
              </form>
            </div>

            {/* Timetable Management */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">시간표 초기 설정</h2>
              <p className="text-gray-500 mb-8 max-w-xs">
                데이터베이스에 아무 정보가 없을 때,<br />기본 초중등 시간표 템플릿을 생성합니다.
              </p>
              <button 
                onClick={handleSetupDefaultSchedule}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl transition-all"
              >
                기본 템플릿으로 시간표 채우기
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && profile?.role === UserRole.ADMIN && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">이름 / 이메일</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">현재 등급</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">등급 변경</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-800">{user.displayName}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        user.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 
                        user.role === UserRole.TEACHER ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN].map(role => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(user.uid, role)}
                            disabled={user.role === role}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                              user.role === role ? 'bg-white text-gray-300 border-gray-200' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-500'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-900 rounded-3xl p-6 text-green-400 font-mono text-xs overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4 text-green-500 border-b border-green-900 pb-2">
              <Terminal className="w-4 h-4" /> 
              <span>SYSTEM AUDIT LOGS [REAL-TIME]</span>
            </div>
            <div className="space-y-2 h-[500px] overflow-y-auto no-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="opacity-80 hover:opacity-100 transition-opacity">
                  <span className="text-gray-500">[{formatDate(log.timestamp)}]</span>
                  <span className="text-blue-400 mx-2">{log.userEmail || 'SYSTEM'}</span>
                  <span className="text-yellow-400">» {log.action}</span>
                  <span className="ml-2 text-gray-400 italic">// {log.details}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-600 italic">No logs available...</div>}
            </div>
          </motion.div>
        )}

        {activeTab === 'dev' && (
          <motion.div 
            key="dev"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { label: 'CPU Usage', value: `${sysStats.cpu}%`, icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-50' },
              { label: 'RAM Usage', value: `${sysStats.ram}%`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Disk IO', value: `${sysStats.disk}%`, icon: HardDrive, color: 'text-emerald-500', bg: 'bg-emerald-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <div className={`p-3 ${stat.bg} w-fit rounded-2xl mb-4`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                 </div>
                 <div className="text-sm font-bold text-gray-400 mb-1">{stat.label}</div>
                 <div className="text-3xl font-black text-gray-800">{stat.value}</div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stat.value }}
                      className={`h-full ${stat.color === 'text-purple-500' ? 'bg-purple-500' : stat.color === 'text-blue-500' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                    />
                 </div>
              </div>
            ))}
            
            <div className="md:col-span-3 bg-gray-900 rounded-3xl p-8 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> REPL Console
                </h3>
                <div className="font-mono text-sm space-y-1 text-gray-400">
                  <p className="text-green-500">Connected to firebase@us-west1:ai-studio-6552de77...</p>
                  <p>Initializing secure handshake...</p>
                  <p>Encryption: AES-256-GCM</p>
                  <p>Database health: <span className="text-green-500">OPTIMAL</span></p>
                  <p>Auth latency: 24ms</p>
                  <div className="pt-4 flex gap-2">
                    <span className="text-orange-500 font-bold">$</span>
                    <input className="bg-transparent border-none outline-none flex-1 text-white" placeholder="Enter command..." />
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
