import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [briefing, setBriefing] = useState('');
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

  // Gamification & XP State
  const [xp, setXp] = useState(2450);
  const xpNeededForNextLevel = 3000;
  const currentLevel = 4;
  const userStreak = user?.streak || 5;

  // Pomodoro Focus Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes default
  const [timerMode, setTimerMode] = useState('work'); // work, short_break, long_break
  const [timerDuration, setTimerDuration] = useState(1500); // for progress bar calculations

  // Campus Utilities Simulation State
  const [activeMessMeal, setActiveMessMeal] = useState('lunch');
  const [busArrivalTimes, setBusArrivalTimes] = useState([
    { route: 'Route A (Hostel to Academic Block)', minutes: 3, capacity: 'Medium' },
    { route: 'Route B (Metro Station to Main Gate)', minutes: 8, capacity: 'High' },
    { route: 'Route C (Sports Complex Loop)', minutes: 14, capacity: 'Low' }
  ]);
  const [hostelComplaint, setHostelComplaint] = useState({ title: '', category: 'laundry' });
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCounter, setQrCounter] = useState(60);

  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/summary');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Pomodoro Timer tick logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Bus countdown ticking simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setBusArrivalTimes((prevTimes) =>
        prevTimes.map((bus) => ({
          ...bus,
          minutes: bus.minutes > 1 ? bus.minutes - 1 : 15
        }))
      );
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // QR Attendance countdown logic
  useEffect(() => {
    let timer;
    if (qrModalOpen && qrCounter > 0) {
      timer = setInterval(() => {
        setQrCounter((prev) => prev - 1);
      }, 1000);
    } else if (qrCounter === 0) {
      setQrModalOpen(false);
    }
    return () => clearInterval(timer);
  }, [qrModalOpen, qrCounter]);

  const handleTimerComplete = () => {
    if (timerMode === 'work') {
      const earnedXp = 150;
      setXp((prev) => Math.min(prev + earnedXp, xpNeededForNextLevel));
      toast.success(`Focus Cycle Completed! +${earnedXp} Scholar XP! 🎉`);
    } else {
      toast.success('Break cycle finished. Ready to focus again?');
    }
    resetTimer(timerMode === 'work' ? 'short_break' : 'work');
  };

  const resetTimer = (mode) => {
    setTimerActive(false);
    setTimerMode(mode);
    const duration = mode === 'work' ? 1500 : mode === 'short_break' ? 300 : 900;
    setTimeLeft(duration);
    setTimerDuration(duration);
  };

  const handleMessMealChange = (meal) => {
    setActiveMessMeal(meal);
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!hostelComplaint.title.trim()) {
      toast.error('Please describe your complaint.');
      return;
    }
    toast.success('Hostel complaint submitted successfully! Ticket #CS' + Math.floor(1000 + Math.random() * 9000));
    setHostelComplaint({ title: '', category: 'laundry' });
    setShowComplaintsModal(false);
  };

  const triggerQrAttendance = () => {
    setQrCounter(60);
    setQrModalOpen(true);
    toast.success('QR Attendance session established! Scan with your app.');
  };

  const generateBriefing = async () => {
    try {
      setGeneratingBriefing(true);
      const response = await api.get('/dashboard/ai-briefing');
      if (response.data.success) {
        setBriefing(response.data.data.briefing);
      }
    } catch (error) {
      console.error('Error generating AI briefing:', error);
      toast.error('Could not generate morning briefing');
    } finally {
      setGeneratingBriefing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader size="lg" />
      </div>
    );
  }

  const {
    nextClass = null,
    attendance = { streak: 5, percentage: 88 },
    upcomingEvents = [],
    activeJobs = [],
    todayMood = null,
  } = data || {};

  // Formatter for timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get Progress Percentages
  const xpPercent = Math.min((xp / xpNeededForNextLevel) * 100, 100);
  const timerPercent = ((timerDuration - timeLeft) / timerDuration) * 100;

  // Mess Menu Dictionary
  const messMenus = {
    breakfast: ['Pancakes & Maple Syrup', 'Scrambled Eggs & Hashbrowns', 'Greek Yogurt Bowl', 'Fresh Apple/Orange Juice'],
    lunch: ['Paneer Butter Masala', 'Butter Naan / Basmati Rice', 'Yellow Daal Tadka', 'Fruit Custard Dessert'],
    dinner: ['Flame Grilled Chicken Tikka', 'Aloo Gobi Dry', 'Soft Wheat Chapatis', 'Mint Raita & Salad Mix']
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 🚀 GAMIFIED XP & STREAK TOP BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Scholar Rank Level Details */}
        <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Icon name="military_tech" className="text-3xl text-yellow-300 font-extrabold animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Rank Status</span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Level {currentLevel}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight">Academic Elite Specialist</h2>
          </div>
        </div>

        {/* Dynamic XP Progress Bar */}
        <div className="flex-1 w-full max-w-md space-y-2 z-10">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300">{xp} / {xpNeededForNextLevel} Focus XP</span>
            <span className="text-indigo-400 font-bold">{Math.round(xpPercent)}% Complete</span>
          </div>
          <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-inner"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Streaks and Badges Quick View */}
        <div className="flex items-center gap-4 z-10">
          <div className="text-center bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-black tracking-widest text-pink-400 block mb-0.5">Focus Streak</span>
            <div className="flex items-center justify-center gap-1">
              <Icon name="local_fire_department" fill={1} className="text-orange-500 font-black" />
              <span className="text-base font-black">{userStreak} Days</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {['workspace_premium', 'verified', 'school'].map((badge, idx) => (
              <div 
                key={badge} 
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-sm"
                title={`Premium Badge: ${badge.toUpperCase()}`}
              >
                <Icon name={badge} fill={1} className={`text-sm ${idx === 0 ? 'text-teal-400' : idx === 1 ? 'text-indigo-400' : 'text-yellow-400'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stats, Timer, Next Class */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome glassmorphism banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[10rem] rotate-12 absolute -right-10 -bottom-10">school</span>
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-3 border border-white/10 uppercase tracking-widest">
                <Icon name="auto_awesome" fill={1} className="text-xs text-yellow-300" />
                Semester Operating System Active
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Scholar'}!
              </h1>
              <p className="text-white/80 text-sm mt-1.5 font-medium leading-relaxed">
                Empowered with your academic copilot and placement tools. Let's conquer your studies today!
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attendance Rate */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Attendance Rate</span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">{attendance.percentage || 88}%</h3>
                <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><Icon name="trending_up" className="text-xs" /> Above safe limit</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icon name="event_available" className="text-xl" />
              </div>
            </div>

            {/* Dopamine focus tracker */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Daily Focus Score</span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">92 / 100</h3>
                <p className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5"><Icon name="electric_bolt" className="text-xs" /> Highly Energetic</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icon name="bolt" className="text-xl" />
              </div>
            </div>

            {/* Burnout Indicator Warning */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Burnout Risk Index</span>
                <h3 className="text-xl font-black text-rose-500 dark:text-rose-400">Minimal</h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Balanced work cycles</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Icon name="health_and_safety" className="text-xl" />
              </div>
            </div>
          </div>

          {/* 🧠 DYNAMIC FOCUS timer - SMART PRODUCTIVITY POMODORO */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
            
            {/* Left side: clock visual and trigger */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG circular progress ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" strokeWidth="6" stroke="#f1f5f9" className="dark:stroke-slate-700/60" fill="transparent" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    strokeWidth="7" 
                    stroke="url(#timer-gradient)" 
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * timerPercent) / 100}
                    strokeLinecap="round" 
                    fill="transparent" 
                  />
                  <defs>
                    <linearGradient id="timer-gradient" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center time digits */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono tracking-wider text-slate-800 dark:text-white">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {timerMode.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimerActive(!timerActive)}
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-md active:scale-95 transition-all ${
                    timerActive 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                  }`}
                >
                  {timerActive ? 'Pause' : 'Start Focus'}
                </button>
                <button
                  onClick={() => resetTimer(timerMode)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black active:scale-95 transition-all border border-slate-200/20"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right side: instructions and mode selectors */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-1.5">
                  <Icon name="timer" className="text-rose-500 text-xl" /> Pomodoro Study Hub
                </h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 leading-relaxed">
                  Earn **+150 XP** for each full work block completed. Use shorter breaks to reset cognitive fatigue.
                </p>
              </div>

              {/* Mode Selectors */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'work', label: '25m Focus', icon: 'bolt' },
                  { id: 'short_break', label: '5m Reset', icon: 'spa' },
                  { id: 'long_break', label: '15m Chill', icon: 'bed' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => resetTimer(mode.id)}
                    className={`py-2 px-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      timerMode === mode.id
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Icon name={mode.icon} className="text-sm" />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-700/40 rounded-2xl p-3 flex items-center gap-3">
                <Icon name="workspace_premium" className="text-yellow-500 text-xl" />
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="font-extrabold text-slate-800 dark:text-white">XP Multiplier Active</span>: completing sessions unlocks top positions on the college leaderboards.
                </div>
              </div>
            </div>
          </div>

          {/* Next Class Block */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="schedule" className="text-indigo-500 text-xl" /> Next Upcoming Class
            </h2>
            {nextClass ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: nextClass.course?.color || '#6366f1' }}>
                    {nextClass.course?.code || 'CS'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{nextClass.course?.title}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Icon name="person" className="text-sm" /> {nextClass.course?.professor} &bull; <Icon name="location_on" className="text-sm" /> {nextClass.room || 'TBD'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    {nextClass.startTime} - {nextClass.endTime}
                  </span>
                  <button 
                    onClick={() => navigate('/wellness')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    View details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Icon name="hotel" className="text-4xl text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No classes scheduled right now. Relax!</p>
              </div>
            )}
          </div>

          {/* AI Morning Briefing Widget */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-950/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Icon name="auto_awesome" fill={1} className="text-indigo-400 text-xl" /> CampusSphere AI Daily Briefing
              </h2>
              <button
                onClick={generateBriefing}
                disabled={generatingBriefing}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {generatingBriefing ? <Loader size="sm" /> : <Icon name="sync" className="text-sm" />}
                {briefing ? 'Refresh' : 'Generate Briefing'}
              </button>
            </div>
            {briefing ? (
              <div className="space-y-3 leading-relaxed text-slate-200 text-sm font-medium bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-line">
                {briefing}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="chat" className="text-4xl text-indigo-400/40 mb-3" />
                <p className="text-slate-300 text-sm font-medium max-w-sm mx-auto mb-4">
                  Get a personalized, Gemini-powered morning briefing of your classes, attendance streak, and campus tips.
                </p>
                <button
                  onClick={generateBriefing}
                  disabled={generatingBriefing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-sm font-black shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 mx-auto"
                >
                  <Icon name="auto_awesome" fill={1} className="text-sm" /> Generate Now
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Campus Utilities, Placements & Events */}
        <div className="space-y-6">
          
          {/* 📍 REAL CAMPUS UTILITIES QUICK LINKS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="map" className="text-indigo-500 text-xl" /> Campus Utilities
              </h2>
              <button 
                onClick={triggerQrAttendance}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black transition-colors"
              >
                QR Attendance
              </button>
            </div>

            {/* Simulated Mess Menu Block */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mess Menu Today</span>
                <div className="flex bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/60">
                  {['breakfast', 'lunch', 'dinner'].map((meal) => (
                    <button
                      key={meal}
                      onClick={() => handleMessMealChange(meal)}
                      className={`px-2 py-0.5 text-[9px] font-black rounded-md capitalize transition-all ${
                        activeMessMeal === meal
                          ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-400'
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
              
              <ul className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {messMenus[activeMessMeal].map((dish, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{dish}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Simulated Bus Tracker Block */}
            <div className="space-y-2.5 pt-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Bus Arrival Tracker</span>
              <div className="space-y-2">
                {busArrivalTimes.map((bus, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate leading-snug">{bus.route}</p>
                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Crowd: {bus.capacity}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {bus.minutes} Mins
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaint trigger button */}
            <button
              onClick={() => setShowComplaintsModal(true)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1 border border-slate-200/10"
            >
              <Icon name="home_repair_service" className="text-base" /> File Hostel Complaint
            </button>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="campaign" className="text-rose-500 text-xl" /> Upcoming Events
              </h2>
              <button onClick={() => navigate('/community')} className="text-xs font-bold text-indigo-500 hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt) => (
                  <div key={evt._id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex flex-col items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                      <span>{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm -mt-1">{new Date(evt.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{evt.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Icon name="location_on" className="text-xs" /> {evt.location}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs font-medium text-slate-400 dark:text-slate-500">No upcoming events listed.</p>
              )}
            </div>
          </div>

          {/* Active Job Opportunities */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="work" className="text-amber-500 text-xl" /> Active Placements
              </h2>
              <button onClick={() => navigate('/placements')} className="text-xs font-bold text-indigo-500 hover:underline">
                View Jobs
              </button>
            </div>
            <div className="space-y-3">
              {activeJobs.length > 0 ? (
                activeJobs.map((job) => (
                  <div key={job._id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{job.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{job.company} &bull; {job.location}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950/30 capitalize">
                      {job.type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs font-medium text-slate-400 dark:text-slate-500">No active job listings.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 🏡 COMPLAINTS REGISTRATION MODAL */}
      {showComplaintsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-1.5">
                <Icon name="home_repair_service" className="text-indigo-500" /> File Hostel Complaint
              </h3>
              <button onClick={() => setShowComplaintsModal(false)} className="text-slate-400 hover:text-slate-650 p-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Utility Category</label>
                <select
                  value={hostelComplaint.category}
                  onChange={(e) => setHostelComplaint({ ...hostelComplaint, category: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                >
                  <option value="laundry">Laundry & Washing Machines</option>
                  <option value="electricity">Electrical & Lights</option>
                  <option value="mess">Mess & Dining Hygiene</option>
                  <option value="wifi">Hostel WiFi & Connectivity</option>
                  <option value="plumbing">Plumbing & Water Supply</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description of Issue</label>
                <textarea
                  rows={4}
                  placeholder="Explain the specific issue e.g. Washing machine #3 in Block B is leaking water..."
                  value={hostelComplaint.title}
                  onChange={(e) => setHostelComplaint({ ...hostelComplaint, title: e.target.value })}
                  className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintsModal(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📱 QR ATTENDANCE MODAL */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl max-w-sm w-full overflow-hidden p-6 animate-scale-up flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-black text-slate-800 dark:text-white text-base">QR Classroom Attendance</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold leading-relaxed">
              Show this QR code to the classroom scanner or scan the board. Generates temporary authentication token.
            </p>
            
            {/* Visual simulation of QR Code */}
            <div className="w-48 h-48 bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-center border-4 border-indigo-500/20 relative">
              <div className="w-full h-full bg-slate-950 dark:bg-white rounded-lg flex flex-wrap p-3 gap-0.5 opacity-85">
                {Array.from({ length: 196 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2.5 h-2.5 rounded-sm ${
                      (i % 3 === 0 || i % 7 === 0 || i < 20 || i > 175) 
                        ? 'bg-white dark:bg-slate-950' 
                        : 'bg-transparent'
                    }`} 
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse rounded-2xl pointer-events-none" />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black text-rose-500">
              <Icon name="alarm" className="text-sm font-extrabold" />
              <span>Token expires in: {qrCounter}s</span>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
