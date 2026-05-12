import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Post, PostType, ScheduleItem, Meal } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Bell, 
  Calendar, 
  Utensils, 
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState<Post[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Notices
        const noticeQuery = query(
          collection(db, 'posts'),
          where('type', '==', PostType.NOTICE),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const noticeSnap = await getDocs(noticeQuery);
        setNotices(noticeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));

        // Fetch Schedule
        const scheduleQuery = query(collection(db, 'schedule'), orderBy('order', 'asc'));
        const scheduleSnap = await getDocs(scheduleQuery);
        setSchedule(scheduleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem)));

        // Fetch Today's Meal
        const today = new Date().toISOString().split('T')[0];
        const mealQuery = query(collection(db, 'meals'), where('date', '==', today), limit(1));
        const mealSnap = await getDocs(mealQuery);
        if (!mealSnap.empty) {
          setMeal({ id: mealSnap.docs[0].id, ...mealSnap.docs[0].data() } as Meal);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {profile?.role === 'teacher' || profile?.role === 'admin' 
              ? '반갑습니다, 행복반 선생님! 🍎' 
              : '안녕하세요, 행복반 친구들! 😊'}
          </h1>
          <p className="text-orange-50 opacity-90">오늘도 즐겁고 행복한 하루 보내세요.</p>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
          <Clock className="w-8 h-8" />
          <div>
            <div className="text-xs opacity-80">{currentTime.toLocaleDateString('ko-KR')}</div>
            <div className="text-xl font-bold">
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Notices Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              최근 공지사항
            </h2>
            <Link to="/notices" className="text-sm text-orange-500 hover:underline flex items-center">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
              </div>
            ) : notices.length > 0 ? (
              notices.map(notice => (
                <Link 
                  key={notice.id} 
                  to={`/post/${notice.id}`}
                  className="block p-4 rounded-2xl hover:bg-orange-50 transition-colors group"
                >
                  <div className="font-semibold text-gray-800 line-clamp-1 group-hover:text-orange-600">
                    {notice.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(notice.createdAt)}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                새로운 공지사항이 없습니다.
              </div>
            )}
          </div>
        </motion.div>

        {/* Timetable */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-orange-500" />
            오늘의 시간표
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-2xl" />)}
              </div>
            ) : schedule.length > 0 ? (
              schedule.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border ",
                    item.period === '점심' 
                      ? "bg-orange-50 border-orange-100" 
                      : "bg-gray-50 border-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      item.period === '점심' ? "bg-orange-200 text-orange-700" : "bg-gray-200 text-gray-600"
                    )}>
                      {item.period}
                    </span>
                    <span className="font-semibold">{item.subject}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{item.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-3xl">
                시간표가 등록되지 않았습니다.
              </div>
            )}
          </div>
        </motion.div>

        {/* Meals */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Utensils className="w-5 h-5 text-orange-500" />
            오늘의 급식
          </h2>
          {loading ? (
            <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
          ) : meal ? (
            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {meal.menu.map((food, idx) => (
                  <span key={idx} className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-orange-700 border border-orange-100 shadow-sm">
                    {food}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-orange-100">
                <span className="text-gray-500 text-sm">총 열량</span>
                <span className="font-bold text-orange-600">{meal.calories || '정보 없음'}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl py-12 text-center">
              <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">급식 정보가 없습니다.</p>
            </div>
          )}
          <button className="w-full mt-6 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
            식단표 다운로드 <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

