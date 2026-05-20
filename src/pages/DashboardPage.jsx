import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [briefing, setBriefing] = useState('');
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

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
    enrolledCourses = [],
    nextClass = null,
    attendance = { streak: 0, percentage: 100 },
    recentNotes = [],
    upcomingEvents = [],
    activeJobs = [],
    todayMood = null,
  } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/25">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[10rem] rotate-12 absolute -right-10 -bottom-10">school</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/95 text-xs font-semibold backdrop-blur-md mb-4 border border-white/10">
            <Icon name="auto_awesome" fill={1} className="text-sm text-yellow-300" />
            Active Streak: {attendance.streak} Days
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Scholar'}!
          </h1>
          <p className="text-white/80 text-sm mt-2 font-medium">
            You're enrolled in {user?.department || 'your selected courses'} (Year {user?.year || 1}). Let's make today highly productive!
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stats & Next Class */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Stat */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{attendance.percentage}%</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Class presence index</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icon name="event_available" className="text-2xl" />
              </div>
            </div>

            {/* Attendance Streak Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Mood Status</span>
                <h3 className="text-lg font-black text-slate-800 dark:text-white capitalize">
                  {todayMood ? `${todayMood.mood} (${todayMood.focusLevel})` : 'Not Logged'}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {todayMood ? 'Daily check-in completed' : 'Log wellness log for today'}
                </p>
              </div>
              <div 
                onClick={() => navigate('/wellness')} 
                className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 cursor-pointer hover:scale-105 transition-transform"
              >
                <Icon name="mood" className="text-2xl" />
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
                    View
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
                <Icon name="auto_awesome" fill={1} className="text-indigo-400 text-xl" /> CampusSphere AI Briefing
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

        {/* Right Column: Campus Feed & Jobs */}
        <div className="space-y-6">
          
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
    </div>
  );
};

export default DashboardPage;
