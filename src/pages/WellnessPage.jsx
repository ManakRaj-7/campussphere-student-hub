import { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const WellnessPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [fetchingAi, setFetchingAi] = useState(false);

  // Form State
  const [mood, setMood] = useState('good'); // great, good, okay, low, bad
  const [focusLevel, setFocusLevel] = useState('medium'); // high, medium, low, very_low
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');

  // Interactive Breathing Guide State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Hold
  const [breathingCounter, setBreathingCounter] = useState(4);

  // Breathing loop timer
  useEffect(() => {
    let timer;
    if (breathingActive) {
      timer = setInterval(() => {
        setBreathingCounter((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            setBreathingPhase((phase) => {
              if (phase === 'Inhale') {
                return 'Hold';
              } else if (phase === 'Hold') {
                return 'Exhale';
              } else if (phase === 'Exhale') {
                return 'Inhale';
              }
              return 'Inhale';
            });
            // Reset phase durations: Inhale 4s, Hold 4s, Exhale 4s
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase('Inhale');
      setBreathingCounter(4);
    }

    return () => clearInterval(timer);
  }, [breathingActive]);

  // Load history & recommendations on mount
  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    setLoading(true);
    try {
      // Get wellness history
      const historyResponse = await api.get('/wellness/history');
      if (historyResponse.data.success) {
        setHistory(historyResponse.data.data?.logs || []);
      }

      // Get latest AI wellness recommendation
      const aiResponse = await api.get('/wellness/recommendation');
      if (aiResponse.data.success && aiResponse.data.data) {
        setAiRecommendation(aiResponse.data.data.recommendation || '');
      }
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      toast.error('Failed to load wellness history');
    } finally {
      setLoading(false);
    }
  };

  const handleLogWellness = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post('/wellness/log', { mood, focusLevel, subject, note });
      if (response.data.success) {
        toast.success('Wellness status logged successfully! 🧘‍♀️');
        setNote('');
        setSubject('');

        const newLog = response.data.data?.log || response.data.data;
        setHistory((prev) => [newLog, ...(Array.isArray(prev) ? prev : [])]);

        // Update recommendation if backend returned one
        if (newLog?.aiRecommendation) {
          setAiRecommendation(newLog.aiRecommendation);
        } else {
          await handleFetchAiRecommendation();
        }
      }
    } catch (error) {
      console.error('Error logging wellness:', error);
      toast.error(error.response?.data?.message || 'Could not save wellness log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchAiRecommendation = async () => {
    setFetchingAi(true);
    try {
      const response = await api.get('/wellness/recommendation');
      if (response.data.success && response.data.data) {
        setAiRecommendation(response.data.data.recommendation || '');
        toast.success('Serenity insights updated!');
      } else {
        toast.error('No recommendation returned yet.');
      }
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      toast.error('Could not retrieve new wellness advice');
    } finally {
      setFetchingAi(false);
    }
  };

  const getMoodEmoji = (m) => {
    switch (m) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'okay': return '😐';
      case 'low': return '😔';
      case 'bad': return '😫';
      default: return '🙂';
    }
  };

  const getMoodBadgeColor = (m) => {
    switch (m) {
      case 'great': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'good': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
      case 'okay': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 'low': return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      case 'bad': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Serenity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-teal-500/25">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[10rem] rotate-12 absolute -right-10 -bottom-10">self_improvement</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mindfulness & Wellness</h1>
          <p className="text-white/80 text-sm mt-2 font-medium">
            Take a deep breath. Align your focus, log your daily energy, and unlock Gemini 3 Flash-powered suggestions to navigate academic stress.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" message="Restoring mindfulness dashboard..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: Daily Check-in & Breathing Exercise */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Daily check-in log */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-5">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="favorite" className="text-rose-500 text-xl" /> Log Daily Serenity Status
              </h2>

              <form onSubmit={handleLogWellness} className="space-y-6">
                {/* Mood Selector Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    How is your mood today?
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { id: 'great', label: 'Great', color: 'hover:border-emerald-400 text-emerald-600' },
                      { id: 'good', label: 'Good', color: 'hover:border-indigo-400 text-indigo-600' },
                      { id: 'okay', label: 'Okay', color: 'hover:border-amber-400 text-amber-600' },
                      { id: 'low', label: 'Low', color: 'hover:border-rose-400 text-rose-600' },
                      { id: 'bad', label: 'Bad', color: 'hover:border-red-400 text-red-600' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMood(item.id)}
                        className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all duration-200 active:scale-95 ${
                          mood === item.id
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 text-slate-500'
                        }`}
                      >
                        <span className="text-3xl mb-1 filter drop-shadow-sm">{getMoodEmoji(item.id)}</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus level block */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Mental Focus Capacity
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'high', label: 'Energized / High' },
                      { id: 'medium', label: 'Focused / Balanced' },
                      { id: 'low', label: 'Fatigued / Low' },
                      { id: 'very_low', label: 'Overwhelmed' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFocusLevel(item.id)}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black border text-center uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                          focusLevel === item.id
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject tracker input */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Subject / Focus area (Optional)
                  </label>
                  <input
                    placeholder="e.g. Calculus, Data Structures, or Project Planning"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Journal entry notes */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Serenity Journal Note (Optional)
                  </label>
                  <textarea
                    placeholder="Reflect on today's classes, stress triggers, or personal achievements. Journaling clears the workspace of the mind..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader size="sm" /> : <Icon name="spa" />}
                  Save Check-in & Fetch AI Serenity Plan
                </button>
              </form>
            </div>

            {/* Stress-relief Breathing Guide (Calming animation!) */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-2xl p-6 text-white border border-indigo-950/20 shadow-md flex flex-col md:flex-row items-center gap-6">
              {/* Animated Circle Container */}
              <div className="flex-shrink-0 relative w-36 h-36 flex items-center justify-center">
                {/* Outer halo */}
                <div 
                  className={`absolute inset-0 rounded-full bg-teal-500/25 blur-md transition-all duration-[4000ms] ${
                    breathingActive && breathingPhase === 'Inhale' 
                      ? 'scale-110 opacity-70' 
                      : breathingActive && breathingPhase === 'Exhale'
                      ? 'scale-75 opacity-25'
                      : 'scale-90 opacity-40'
                  }`}
                />
                {/* Breathing ball */}
                <div 
                  className={`w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-[4000ms] ${
                    breathingActive && breathingPhase === 'Inhale'
                      ? 'scale-110 shadow-teal-500/30'
                      : breathingActive && breathingPhase === 'Exhale'
                      ? 'scale-75 shadow-indigo-500/10'
                      : 'scale-90 shadow-teal-500/20'
                  }`}
                >
                  <span className="text-xs font-black tracking-wider uppercase">{breathingPhase}</span>
                  <span className="text-2xl font-black mt-0.5">{breathingCounter}</span>
                </div>
              </div>

              {/* Instructions and Controls */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                  <h3 className="text-md font-black flex items-center justify-center md:justify-start gap-1.5 text-teal-400">
                    <Icon name="air" /> Calm Mind Breathing Guide
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-md">
                    Follow the box breathing ritual (4s Inhale, 4s Hold, 4s Exhale) to stabilize heart-rate variability and optimize study endurance.
                  </p>
                </div>
                <button
                  onClick={() => setBreathingActive(!breathingActive)}
                  className={`px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 mx-auto md:mx-0 ${
                    breathingActive
                      ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-100'
                      : 'bg-teal-400 hover:bg-teal-500 text-slate-900 shadow-teal-500/20'
                  }`}
                >
                  <Icon name={breathingActive ? 'pause' : 'play_arrow'} className="text-sm" />
                  {breathingActive ? 'Stop Calming Ritual' : 'Start Calm Breathing'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Gemini 3 Flash Wellness Advisor & History Logs */}
          <div className="space-y-6">
            {/* Gemini 3 Flash Wellness Advice Panel */}
            <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white border border-teal-900/20 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-teal-400 text-sm flex items-center gap-1.5">
                  <Icon name="auto_awesome" fill={1} className="text-sm text-teal-400" />
                  Gemini 3 Flash Wellness Advice
                </h3>
                <button
                  onClick={handleFetchAiRecommendation}
                  disabled={fetchingAi}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 transition-all disabled:opacity-50"
                  title="Refresh Wellness Insights"
                >
                  {fetchingAi ? <Loader size="sm" /> : <Icon name="sync" className="text-sm" />}
                </button>
              </div>

              {aiRecommendation ? (
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs font-semibold leading-relaxed text-slate-200 whitespace-pre-line">
                  {aiRecommendation}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Icon name="self_improvement" className="text-4xl text-teal-500/40 mb-2" />
                  <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
                    No customized wellness advice loaded. Fill in a Daily Check-in card to fetch tailored AI mindfulness guidance!
                  </p>
                </div>
              )}
            </div>

            {/* Check-in History Cards list */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Icon name="history" className="text-indigo-500 text-xl" /> History & Mood Insights
              </h3>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {history.length > 0 ? (
                  history.map((log) => (
                    <div key={log._id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 border rounded-lg uppercase tracking-wider ${getMoodBadgeColor(log.mood)}`}>
                            {log.mood}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                          {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 capitalize">
                        <Icon name="bolt" className="text-xs text-amber-500" /> Focus Capacity: <span className="font-extrabold text-slate-700 dark:text-slate-300">{log.focusLevel}</span>
                      </div>

                      {log.subject && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                          <Icon name="class" className="text-xs text-sky-500" /> Subject: <span className="font-extrabold text-slate-700 dark:text-slate-300">{log.subject}</span>
                        </div>
                      )}

                      {log.note && (
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-500/25 pl-2 leading-relaxed">
                          &ldquo;{log.note}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    No wellness history tracked yet. Log today to start a trend!
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default WellnessPage;
