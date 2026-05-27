import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campussphere-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campussphere-token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authLogin = (data) => api.post('/auth/login', data);
export const authRegister = (data) => api.post('/auth/register', data);
export const authGetMe = () => api.get('/auth/me');
export const authChangePassword = (data) => api.put('/auth/change-password', data);

// ============ DASHBOARD ============
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getAiBriefing = () => api.get('/dashboard/ai-briefing');

// ============ COURSES ============
export const getCourses = () => api.get('/courses');
export const getCourse = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourseApi = (id) => api.delete(`/courses/${id}`);
export const enrollCourse = (id) => api.post(`/courses/${id}/enroll`);

// ============ NOTES ============
export const getNotes = (params) => api.get('/notes', { params });
export const getNote = (id) => api.get(`/notes/${id}`);
export const createNote = (data) => api.post('/notes', data);
export const updateNote = (id, data) => api.put(`/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
export const summarizeNote = (id) => api.post(`/notes/${id}/summarize`);

// ============ POSTS / COMMUNITY ============
export const getFeed = (params) => api.get('/posts', { params });
export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const toggleLike = (id) => api.post(`/posts/${id}/like`);
export const addComment = (id, data) => api.post(`/posts/${id}/comments`, data);

// ============ CLUBS ============
export const getClubs = () => api.get('/clubs');
export const joinClub = (id) => api.post(`/clubs/${id}/join`);

// ============ EVENTS ============
export const getEvents = (params) => api.get('/events', { params });
export const attendEvent = (id) => api.post(`/events/${id}/attend`);

// ============ WELLNESS ============
export const logWellness = (data) => api.post('/wellness/log', data);
export const getWellnessHistory = (params) => api.get('/wellness/history', { params });
export const getWellnessRecommendation = () => api.get('/wellness/recommendation');
export const getWellnessStats = () => api.get('/wellness/stats');

// ============ PLACEMENTS ============
export const getJobs = (params) => api.get('/placements/jobs', { params });
export const applyToJob = (id) => api.post(`/placements/jobs/${id}/apply`);
export const getApplications = () => api.get('/placements/applications');
export const getPlacementPrep = (company) => api.get(`/placements/prep/${company}`);

// ============ SCHEDULE ============
export const getSchedule = (params) => api.get('/schedule', { params });
export const addScheduleEntry = (data) => api.post('/schedule', data);
export const getNextClass = () => api.get('/schedule/next');

// ============ ATTENDANCE ============
export const getAttendanceStats = () => api.get('/attendance/stats');
export const markAttendance = (data) => api.post('/attendance/mark', data);

// ============ AI ============
export const aiChat = (data) => api.post('/ai/chat', data);
export const aiSummarize = (data) => api.post('/ai/summarize', data);
export const getAiInsights = () => api.get('/ai/insights');
export const getAiChatHistory = () => api.get('/ai/chat/history');

export default api;
