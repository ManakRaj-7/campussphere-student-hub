import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const PlacementsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'applications', 'ai-prep'
  
  // Job Apply Form Modal State
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submittingApply, setSubmittingApply] = useState(false);

  // AI Placement Prep State
  const [targetJobType, setTargetJobType] = useState('Software Development');
  const [aiPrep, setAiPrep] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);

  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Icon name="work" className="text-amber-500" /> Placement Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Apply to active corporate listings and generate personalized AI practice questions.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'listings'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Job Openings
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'applications'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            My Applications
          </button>
          <button
            onClick={() => setActiveTab('ai-prep')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'ai-prep'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AI Interview Prep
          </button>
        </div>
      </div>

      {/* Main Tabs Panels */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.length > 0 ? (
            jobs.map((job) => {
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden">
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
              Generate structured practice interview questions, target topics, and preparation guidelines using Gemini.
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
                <span className="text-xs font-semibold text-slate-400">Gemini is writing custom practice questions...</span>
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
