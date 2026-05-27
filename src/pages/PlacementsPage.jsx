import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

import { defaultDsaTopics } from '../services/dsaQuestions';

const PlacementsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'applications', 'ai-prep', 'dsa-tracker', 'resume-scorer', 'ai-interview'
  
  // Job Apply Form Modal State
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submittingApply, setSubmittingApply] = useState(false);

  // AI Placement Prep State
  const [targetJobType, setTargetJobType] = useState('Software Development');
  const [aiPrep, setAiPrep] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);

  // DSA Tracker State
  const [dsaProgress, setDsaProgress] = useState(() => {
    const saved = localStorage.getItem('cs_dsa_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Resume Scorer State
  const [resumeText, setResumeText] = useState('');
  const [resumeMode, setResumeMode] = useState('file'); // 'file', 'text'
  const [diagnosticFile, setDiagnosticFile] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  // AI Mock Interview State
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewRole, setInterviewRole] = useState('Frontend Developer');
  const [interviewDiff, setInterviewDiff] = useState('Medium');
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

  const fallbackJobCards = [
    {
      _id: 'fallback-1',
      title: 'AI Product Designer',
      company: 'Nova Labs',
      description: 'Shape product experiences for AI-driven education tools.',
      requirements: ['UX design', 'Figma', 'AI awareness'],
      salary: '$80,000 / year',
      location: 'Remote',
      type: 'full-time',
      deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-2',
      title: 'Cloud Support Engineer',
      company: 'Skyline Cloud',
      description: 'Help customers successfully deploy cloud infrastructure.',
      requirements: ['Linux', 'AWS/GCP', 'customer support'],
      salary: '$85,000 / year',
      location: 'Austin, TX',
      type: 'full-time',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-3',
      title: 'Growth Marketing Intern',
      company: 'CampusGrowth',
      description: 'Support growth campaigns for student tech products.',
      requirements: ['Marketing basics', 'social media', 'analytics'],
      salary: '$28 / hour',
      location: 'Remote',
      type: 'internship',
      deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-4',
      title: 'Backend Automation Engineer',
      company: 'Circuit Works',
      description: 'Automate backend workflows for enterprise-scale apps.',
      requirements: ['Node.js', 'Python', 'CI/CD'],
      salary: '$95,000 / year',
      location: 'Bengaluru, India',
      type: 'full-time',
      deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-5',
      title: 'Game Developer Intern',
      company: 'PixelForge',
      description: 'Build immersive game mechanics and interactive UI.',
      requirements: ['Unity', 'C#', 'game logic'],
      salary: '$32 / hour',
      location: 'Los Angeles, CA',
      type: 'internship',
      deadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-6',
      title: 'DevOps Intern',
      company: 'BuildWave',
      description: 'Support CI/CD pipelines and deployment tooling.',
      requirements: ['Docker', 'bash scripting', 'AWS'],
      salary: '$38 / hour',
      location: 'Seattle, WA',
      type: 'internship',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-7',
      title: 'Cybersecurity Analyst',
      company: 'SecureGrid',
      description: 'Monitor network security and respond to incidents.',
      requirements: ['Security fundamentals', 'incident response'],
      salary: '$98,000 / year',
      location: 'Remote',
      type: 'full-time',
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-8',
      title: 'Product Analyst',
      company: 'InsightHub',
      description: 'Translate data into product improvements.',
      requirements: ['data analysis', 'product thinking'],
      salary: '$72,000 / year',
      location: 'New York, NY',
      type: 'full-time',
      deadline: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-9',
      title: 'Frontend Design Intern',
      company: 'Lumen Creative',
      description: 'Create polished web interfaces for customer-facing apps.',
      requirements: ['React', 'CSS', 'visual design'],
      salary: '$30 / hour',
      location: 'Remote',
      type: 'internship',
      deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'fallback-10',
      title: 'Data Science Intern',
      company: 'Quantify AI',
      description: 'Build models, analyze data, and support ML pipelines.',
      requirements: ['Python', 'statistics', 'machine learning'],
      salary: '$42 / hour',
      location: 'Boston, MA',
      type: 'internship',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const getDisplayedJobs = () => {
    if (jobs.length >= 10) return jobs.slice(0, 10);
    return [...jobs, ...fallbackJobCards.slice(0, 10 - jobs.length)];
  };

  const fetchJobsAndApplications = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/placements/jobs'),
        api.get('/placements/applications'),
      ]);

      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data.jobs);
      }
      if (appsRes.data.success) {
        setApplications(appsRes.data.data.applications);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load placement listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error('Please upload your resume (PDF).');
      return;
    }

    try {
      setSubmittingApply(true);
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('coverLetter', coverLetter);

      const response = await api.post(`/placements/jobs/${applyingJob._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        setApplyingJob(null);
        setCoverLetter('');
        setResumeFile(null);
        fetchJobsAndApplications();
      }
    } catch (error) {
      console.error('Apply error:', error);
      toast.error(error.response?.data?.message || 'Could not submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleGeneratePrep = async () => {
    try {
      setLoadingPrep(true);
      const response = await api.post('/placements/prep', { jobType: targetJobType });
      if (response.data.success) {
        setAiPrep(response.data.data.prep);
        toast.success('AI Placement Prep Generated!');
      }
    } catch (error) {
      console.error('AI Prep error:', error);
      toast.error('Could not generate placement preparation recommendations.');
    } finally {
      setLoadingPrep(false);
    }
  };

  // DSA progress toggling
  const toggleDsaProblem = (problemId) => {
    const updated = {
      ...dsaProgress,
      [problemId]: !dsaProgress[problemId]
    };
    setDsaProgress(updated);
    localStorage.setItem('cs_dsa_progress', JSON.stringify(updated));
    toast.success(updated[problemId] ? 'Problem marked as solved! +10 XP' : 'Problem unchecked');
  };

  const getDsaTotalStats = () => {
    let total = 0;
    let solved = 0;
    defaultDsaTopics.forEach(t => {
      t.problems.forEach(p => {
        total++;
        if (dsaProgress[p.id]) {
          solved++;
        }
      });
    });
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percentage };
  };

  // Resume Diagnoser
  const handleDiagnoseResume = async (e) => {
    e.preventDefault();

    if (resumeMode === 'text' && !resumeText.trim()) {
      toast.error('Please paste your resume details.');
      return;
    }
    if (resumeMode === 'file' && !diagnosticFile) {
      toast.error('Please upload or select a resume file.');
      return;
    }

    try {
      setLoadingDiagnosis(true);
      let response;

      if (resumeMode === 'file') {
        const formData = new FormData();
        formData.append('resume', diagnosticFile);
        response = await api.post('/placements/diagnose-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/placements/diagnose-resume', {
          resumeText: resumeText,
        });
      }

      if (response.data.success) {
        setDiagnosis(response.data.data);
        toast.success('Resume Diagnostics Completed!');
      }
    } catch (error) {
      console.error('Resume diagnostic error:', error);
      toast.error(error.response?.data?.message || 'Resume diagnostic failed. Please try again.');
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  // AI Mock Interview
  const handleStartInterview = async () => {
    try {
      setLoadingAnswer(true);
      setInterviewStarted(true);
      setInterviewMessages([]);

      const systemPrompt = `You are a strict, experienced technical interviewer for a ${interviewRole} position. The difficulty is ${interviewDiff}. 
      You will conduct a mock technical interview. Ask exactly one relevant coding/conceptual question at a time.
      Wait for my answer. Once answered, rate my response with a score (e.g. 7/10), give highly critical technical feedback, and ask the next question.
      Start the interview right now by welcoming me, stating the role, and asking the first question. Keep your question concise.`;

      const response = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: 'Start the mock interview.' }],
        context: 'placement',
        contextRef: null // Avoid caching over multiple different starts
      });

      if (response.data.success) {
        setInterviewMessages([
          { role: 'assistant', content: response.data.data.response }
        ]);
      }
    } catch (error) {
      console.error('Interview start error:', error);
      toast.error('Failed to start interview. Try again.');
      setInterviewStarted(false);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleSendInterviewAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const currentAnswer = userAnswer;
    setUserAnswer('');
    
    // Add user answer locally
    const updatedMessages = [
      ...interviewMessages,
      { role: 'user', content: currentAnswer }
    ];
    setInterviewMessages(updatedMessages);

    try {
      setLoadingAnswer(true);
      
      const promptContext = `The user is answering your previous question during the ${interviewRole} interview (${interviewDiff} difficulty). 
      Provide a specific technical critique of their answer, score it out of 10, then ask the next technical question. 
      Keep it professional, direct, and under 150 words.
      
      Conversation History:
      ${updatedMessages.map(m => `${m.role === 'user' ? 'User' : 'Interviewer'}: ${m.content}`).join('\n')}`;

      const response = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: promptContext }],
        context: 'placement'
      });

      if (response.data.success) {
        setInterviewMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.data.data.response }
        ]);
      }
    } catch (error) {
      console.error('Mock interview send error:', error);
      toast.error('Interviewer connection lost.');
    } finally {
      setLoadingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader size="lg" />
      </div>
    );
  }

  const dsaStats = getDsaTotalStats();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Icon name="work" className="text-amber-500" /> Placement War Room
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Apply to active corporate openings, track your DSA readiness, diagnose resumes, or simulate live AI mock technical interviews.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 gap-1 self-start xl:self-auto overflow-x-auto max-w-full no-scrollbar">
          {[
            { id: 'listings', label: 'Job Openings', icon: 'business_center' },
            { id: 'applications', label: 'My Applications', icon: 'description' },
            { id: 'ai-prep', label: 'AI Study Planner', icon: 'auto_awesome' },
            { id: 'dsa-tracker', label: 'DSA Roadmap', icon: 'code' },
            { id: 'resume-scorer', label: 'Resume Diagnostic', icon: 'analytics' },
            { id: 'ai-interview', label: 'Mock Interview', icon: 'forum' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.8 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon name={tab.icon} className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs Panels */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getDisplayedJobs().length > 0 ? (
            getDisplayedJobs().map((job) => {
              const alreadyApplied = applications.some((app) => app.job?._id === job._id);
              return (
                <div key={job._id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{job.title}</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">{job.company}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950/30 capitalize">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Icon name="location_on" className="text-sm" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Icon name="payments" className="text-sm" /> {job.salary}</span>
                      <span className="flex items-center gap-1.5"><Icon name="calendar_month" className="text-sm" /> Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-3">
                      {job.description}
                    </p>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Role Requirements</span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requirements?.map((req) => (
                          <span key={req} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded text-slate-600 dark:text-slate-300">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-50 dark:border-slate-700/50 pt-4 flex justify-between items-center mt-4">
                    <span className="text-[10px] font-bold text-slate-400">Posted by Admin</span>
                    <button
                      disabled={alreadyApplied}
                      onClick={() => setApplyingJob(job)}
                      className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all shadow-sm ${
                        alreadyApplied
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
                      }`}
                    >
                      {alreadyApplied ? 'Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl shadow-sm">
              <Icon name="work_off" className="text-5xl text-slate-200 dark:text-slate-600 mb-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No job openings found</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Check back later for placements or generate AI preparation plans.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-black text-slate-800 dark:text-white text-base">Submitted Applications</h2>
          </div>
          {applications.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {applications.map((app) => (
                <div key={app._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-snug">{app.job?.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{app.job?.company} &bull; Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    {app.resume && (
                      <a href={app.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:underline pt-1">
                        <Icon name="picture_as_pdf" className="text-xs" /> View Submitted Resume
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <span className="text-[10px] font-bold text-slate-400 block">Status</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold capitalize">{app.status}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black capitalize border ${
                      app.status === 'applied'
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/40'
                        : app.status === 'interview' || app.status === 'shortlisted'
                        ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/40'
                        : app.status === 'offered'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/40'
                        : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-950/40'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Icon name="history" className="text-5xl text-slate-200 dark:text-slate-600 mb-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No applications yet</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">You haven't submitted any job applications yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai-prep' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Prep Panel Form */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <Icon name="auto_awesome" fill={1} className="text-indigo-500" /> AI Placement Prep Plan
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed font-semibold">
              Generate structured practice interview questions, target topics, and preparation guidelines using Gemini 3 Flash.
            </p>
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Domain</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Data Scientist"
                  value={targetJobType}
                  onChange={(e) => setTargetJobType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                />
              </div>

              <button
                onClick={handleGeneratePrep}
                disabled={loadingPrep}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingPrep ? <Loader size="sm" /> : <Icon name="auto_awesome" fill={1} className="text-sm" />}
                {loadingPrep ? 'Generating Plan...' : 'Generate Prep Plan'}
              </button>
            </div>
          </div>

          {/* Prep Results Display */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm min-h-[300px]">
            {loadingPrep ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader size="lg" />
                <span className="text-xs font-semibold text-slate-400">Gemini 3 Flash is writing custom practice questions...</span>
              </div>
            ) : aiPrep ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-base">Preparation Plan: {targetJobType}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Customized for {user?.name}</p>
                </div>

                {/* Key Study Topics */}
                {aiPrep.topics?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Study Core Areas</span>
                    <div className="flex flex-wrap gap-2">
                      {aiPrep.topics.map((t) => (
                        <span key={t} className="px-3 py-1 bg-indigo-50/70 dark:bg-indigo-900/25 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Questions */}
                {aiPrep.questions?.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Custom Practice Questions</span>
                    <div className="space-y-2.5">
                      {aiPrep.questions.map((q, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 mt-0.5">{idx + 1}</span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Tips */}
                {aiPrep.tips?.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Placement Strategies & Tips</span>
                    <ul className="space-y-2 pl-1.5">
                      {aiPrep.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                          <Icon name="check_circle" className="text-indigo-500 text-sm mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/25 flex items-center justify-center text-indigo-500">
                  <Icon name="auto_awesome" fill={1} className="text-xl" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">AI Preparation Plan</h4>
                <p className="text-xs font-bold max-w-[240px] mx-auto text-center leading-relaxed">
                  Enter your target role on the left panel to fetch personalized questions and study topics.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB 4: DSA ROADMAP TRACKER ============ */}
      {activeTab === 'dsa-tracker' && (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black">DSA Roadmap Mastery</h2>
              <p className="text-white/80 text-xs font-semibold max-w-lg">
                Complete classic interview programming questions across core structures to secure your next software engineering opportunity.
              </p>
              <div className="flex gap-4 pt-2">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] font-bold text-white/60 block uppercase tracking-wide">Solved Problems</span>
                  <span className="text-sm font-black">{dsaStats.solved} / {dsaStats.total}</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] font-bold text-white/60 block uppercase tracking-wide">Roadmap Progress</span>
                  <span className="text-sm font-black">{dsaStats.percentage}%</span>
                </div>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="38" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="white"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="239"
                  strokeDashoffset={239 - (239 * dsaStats.percentage) / 100}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="text-base font-black tracking-tight">{dsaStats.percentage}%</span>
            </div>
          </div>

          {/* Topics & Problems Node Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {defaultDsaTopics.map(topic => {
              const solvedCount = topic.problems.filter(p => dsaProgress[p.id]).length;
              const progressPercentage = Math.round((solvedCount / topic.problems.length) * 100);

              return (
                <div key={topic.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-5 shadow-sm space-y-4">
                  {/* Topic Title Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${topic.color}`}>
                        <Icon name={topic.icon} className="text-lg" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{topic.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{solvedCount} of {topic.problems.length} Solved</span>
                      </div>
                    </div>
                    {/* Linear mini progress */}
                    <div className="w-16 bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                      <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                    </div>
                  </div>

                  {/* Problem Node List */}
                  <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-700/40">
                    {topic.problems.map(problem => {
                      const isSolved = !!dsaProgress[problem.id];
                      return (
                        <div
                          key={problem.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            isSolved
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-950/20'
                              : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100/70 dark:border-slate-800/80 hover:border-slate-200/80 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleDsaProblem(problem.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isSolved
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                              }`}
                            >
                              {isSolved && <Icon name="check" className="text-xs font-black" />}
                            </button>
                            <div>
                              <a
                                href={problem.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                {problem.name} <Icon name="open_in_new" className="text-[10px]" />
                              </a>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                problem.difficulty === 'Easy' ? 'text-emerald-500' : 'text-amber-500'
                              }`}>{problem.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ TAB 5: RESUME DIAGNOSTIC SCORER ============ */}
      {activeTab === 'resume-scorer' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Input Box Card */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-5 shadow-sm space-y-4 h-fit">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                <Icon name="analytics" className="text-indigo-500" /> ATS Resume Diagnoser
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">
                Upload your resume document or paste its plain text to calculate a compatibility rating and reveal direct recruitment enhancements.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setResumeMode('file')}
                className={`flex-1 py-1.8 text-xs font-black rounded-xl transition-all ${
                  resumeMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-350'
                }`}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('text')}
                className={`flex-1 py-1.8 text-xs font-black rounded-xl transition-all ${
                  resumeMode === 'text'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-350'
                }`}
              >
                Paste Text
              </button>
            </div>

            <form onSubmit={handleDiagnoseResume} className="space-y-4">
              {resumeMode === 'file' ? (
                <div className="space-y-3">
                  {!diagnosticFile ? (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <Icon name="cloud_upload" className="text-slate-450 group-hover:text-indigo-500 text-3xl mb-2 transition-colors" />
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Drag & Drop Resume File</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Supports PDF, Word, LaTeX (.tex), Text, or Markdown</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.tex,.txt,.md"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDiagnosticFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="p-4 bg-indigo-50/10 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-950/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                          <Icon name="description" className="text-xl" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{diagnosticFile.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400">{(diagnosticFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDiagnosticFile(null)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 rounded-xl transition-all"
                      >
                        <Icon name="close" className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={12}
                  required
                  placeholder="Paste complete plain text details of your resume here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white font-medium resize-none leading-relaxed"
                />
              )}

              <button
                type="submit"
                disabled={loadingDiagnosis}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingDiagnosis ? <Loader size="sm" /> : <Icon name="troubleshoot" className="text-sm" />}
                {loadingDiagnosis ? 'Analyzing Content...' : 'Diagnose My Resume'}
              </button>
            </form>
          </div>

          {/* Results Diagnostic Card */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-6 shadow-sm min-h-[400px]">
            {loadingDiagnosis ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader size="lg" />
                <span className="text-xs font-semibold text-slate-400">Recruiter AI is scoring your achievements...</span>
              </div>
            ) : diagnosis ? (
              <div className="space-y-6 animate-fade-in">
                {/* Score Section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke={diagnosis.score >= 80 ? '#10b981' : '#f59e0b'}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="201"
                        strokeDashoffset={201 - (201 * diagnosis.score) / 100}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="text-lg font-black tracking-tight text-slate-800 dark:text-white">{diagnosis.score}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Compatibility Score: {diagnosis.score}/100</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {diagnosis.score >= 80 ? '🔥 Strong Candidate profile - Excellent structural compatibility!' : '⚠️ Needs optimization - Focus on metrics and action words.'}
                    </p>
                  </div>
                </div>

                {/* Specific metrics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(diagnosis.metrics || {}).map(([key, val]) => (
                    <div key={key} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/25 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{key}</span>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-normal">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Suggestions List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Actionable Enhancements</span>
                  <ul className="space-y-2.5">
                    {diagnosis.suggestions?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                        <Icon name="check_circle" className="text-indigo-500 text-sm mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-28 text-slate-400 dark:text-slate-500 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/25 flex items-center justify-center text-indigo-500">
                  <Icon name="troubleshoot" className="text-xl" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Resume Diagnostic Report</h4>
                <p className="text-xs font-bold max-w-[250px] mx-auto text-center leading-relaxed">
                  Enter your resume details on the left panel to fetch an ATS score rating and key tips.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB 6: AI MOCK INTERVIEW SIMULATOR ============ */}
      {activeTab === 'ai-interview' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[500px]">
          {/* Settings Panel */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-5 shadow-sm space-y-4 h-fit">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                <Icon name="forum" className="text-indigo-500" /> Interactive Mock Interview
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">
                Start a dynamic oral technical interview mock. The AI technical lead evaluates and scores every answer.
              </p>
            </div>

            <div className="space-y-4 border-t border-slate-50 dark:border-slate-700/50 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Developer Role</label>
                <select
                  disabled={interviewStarted}
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Fullstack Engineer">Fullstack Engineer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                <select
                  disabled={interviewStarted}
                  value={interviewDiff}
                  onChange={(e) => setInterviewDiff(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                >
                  <option value="Easy">Easy (Conceptual/Basics)</option>
                  <option value="Medium">Medium (Coding/Algorithms)</option>
                  <option value="Hard">Hard (System Design/Deep Dive)</option>
                </select>
              </div>

              {!interviewStarted ? (
                <button
                  onClick={handleStartInterview}
                  disabled={loadingAnswer}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon name="rocket_launch" className="text-sm" />
                  Start Mock Interview
                </button>
              ) : (
                <button
                  onClick={() => setInterviewStarted(false)}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon name="stop_circle" className="text-sm" />
                  Terminate Session
                </button>
              )}
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
            {interviewStarted ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Message Log */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[360px]">
                  {interviewMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={idx} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 flex items-center justify-center text-indigo-500 flex-shrink-0 mt-1">
                            <Icon name="support_agent" className="text-sm" />
                          </div>
                        )}
                        <div className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isUser
                            ? 'bg-indigo-600 text-white font-semibold rounded-tr-none'
                            : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 border border-slate-100/50 dark:border-slate-800/80 font-medium rounded-tl-none'
                        }`}>
                          <span className="text-[9px] font-black uppercase tracking-wider block opacity-60 mb-1">
                            {isUser ? 'Your Answer' : `${interviewRole} Interviewer`}
                          </span>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {isUser && (
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-1">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loadingAnswer && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 px-3">
                      <Loader size="sm" />
                      <span>Interviewer is analyzing your response...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendInterviewAnswer} className="border-t border-slate-50 dark:border-slate-700/50 pt-4 flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={loadingAnswer}
                    placeholder="Type your structured technical response..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none dark:text-white font-medium"
                  />
                  <button
                    type="submit"
                    disabled={loadingAnswer || !userAnswer.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <Icon name="send" className="text-xs" />
                    Submit Answer
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/25 flex items-center justify-center text-indigo-500">
                  <Icon name="forum" className="text-2xl" />
                </div>
                <h4 className="font-extrabold text-slate-700 dark:text-slate-300">Start Simulated Technical Session</h4>
                <p className="text-xs font-semibold max-w-[260px] mx-auto text-center leading-relaxed">
                  Select your target developer role and difficulty, then click "Start Mock Interview" to begin your interactive review.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Form Modal */}
      {applyingJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-base">Submit Application</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{applyingJob.title} &bull; {applyingJob.company}</p>
              </div>
              <button onClick={() => setApplyingJob(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resume File (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-900 file:text-indigo-600 hover:file:bg-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cover Letter / Statement of Purpose</label>
                <textarea
                  rows={6}
                  placeholder="Explain why you are the ideal fit for this internship or full-time position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {submittingApply ? <Loader size="sm" /> : <Icon name="send" className="text-xs" />}
                  {submittingApply ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementsPage;

