import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const CoursesPage = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', code: '', department: '', professor: '', room: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      if (res.data.success) setCourses(res.data.data.courses);
    } catch (err) {
      console.error(err);
      toast.error('Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.code || !form.department) {
        toast.error('Title, code and department are required');
        return;
      }
      if (editingId) {
        const res = await api.put(`/courses/${editingId}`, form);
        if (res.data.success) {
          toast.success('Course updated');
          setEditingId(null);
          setForm({ title: '', code: '', department: '', professor: '', room: '' });
          fetchCourses();
        }
      } else {
        const res = await api.post('/courses', form);
        if (res.data.success) {
          toast.success('Course added');
          setForm({ title: '', code: '', department: '', professor: '', room: '' });
          fetchCourses();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({ title: c.title, code: c.code, department: c.department, professor: c.professor || '', room: c.room || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.data.success) {
        toast.success('Course deleted');
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not delete course');
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-slate-950/30">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manage Courses</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Add, edit or delete courses used across the app.</p>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} placeholder="Course title" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500" />
          <input value={form.code} onChange={(e)=>setForm(f=>({...f,code:e.target.value}))} placeholder="Course code (e.g. CS301)" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500" />
          <input value={form.department} onChange={(e)=>setForm(f=>({...f,department:e.target.value}))} placeholder="Department" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500" />
          <input value={form.professor} onChange={(e)=>setForm(f=>({...f,professor:e.target.value}))} placeholder="Professor" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500" />
          <input value={form.room} onChange={(e)=>setForm(f=>({...f,room:e.target.value}))} placeholder="Room" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500" />
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700" type="submit">{editingId? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={()=>{setEditingId(null); setForm({title:'',code:'',department:'',professor:'',room:''})}} className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c._id} className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-slate-950/20 flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{c.code} — {c.department}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">Professor: {c.professor || '—'} | Room: {c.room || '—'}</div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button onClick={()=>handleEdit(c)} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Edit</button>
              <button onClick={()=>handleDelete(c._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
