import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const NotesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState('all');
  const [search, setSearch] = useState('');
  
  // Editor State
  const [selectedNote, setSelectedNote] = useState(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCourse, setEditorCourse] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [editorIsPublic, setEditorIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // File Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [uploading, setUploading] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  // Interactive AI Flashcard State
  const [flashcards, setFlashcards] = useState([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);

  useEffect(() => {
    fetchNotesAndCourses();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchNotesAndCourses = async () => {
    try {
      setLoading(true);
      const [notesRes, coursesRes] = await Promise.all([
        api.get('/notes'),
        api.get('/courses'),
      ]);

      if (notesRes.data.success) {
        setNotes(notesRes.data.data.notes);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load notes and courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateNote = async (e) => {
    e.preventDefault();
    if (!editorTitle || !editorContent || !editorCourse) {
      toast.error('Title, content, and course are required.');
      return;
    }

    try {
      const tagsArray = editorTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '');

      const payload = {
        title: editorTitle,
        content: editorContent,
        course: editorCourse,
        tags: tagsArray,
        isPublic: editorIsPublic,
      };

      let response;
      if (selectedNote) {
        response = await api.put(`/notes/${selectedNote._id}`, payload);
      } else {
        response = await api.post('/notes', payload);
      }

      if (response.data.success) {
        toast.success(selectedNote ? 'Note updated!' : 'Note created!');
        setIsEditing(false);
        setSelectedNote(response.data.data.note);
        fetchNotesAndCourses();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error saving note.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await api.delete(`/notes/${noteId}`);
      if (response.data.success) {
        toast.success('Note deleted.');
        setSelectedNote(null);
        setIsEditing(false);
        fetchNotesAndCourses();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Could not delete note.');
    }
  };

  const handleSummarizeNote = async (noteId) => {
    try {
      toast.loading('Gemini AI is analyzing lecture...', { id: 'summarize' });
      const response = await api.post(`/notes/${noteId}/summarize`);
      if (response.data.success) {
        toast.success('AI Summary Generated!', { id: 'summarize' });
        setSelectedNote(response.data.data.note);
        setNotes((prev) =>
          prev.map((n) => (n._id === noteId ? response.data.data.note : n))
        );
      }
    } catch (error) {
      console.error('AI summary error:', error);
      toast.error('Failed to generate AI summary.', { id: 'summarize' });
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadCourse) {
      toast.error('Please provide a file, title, and course.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('course', uploadCourse);

      const response = await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Lecture uploaded and transcribed!');
        setUploadFile(null);
        setUploadTitle('');
        fetchNotesAndCourses();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Could not upload lecture file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setSendingChat(true);

    try {
      const response = await api.post('/ai/chat', {
        messages: [...chatMessages, userMessage],
        context: 'notes',
        contextRef: selectedNote?._id,
      });

      if (response.data.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.data.response },
        ]);
      }
    } catch (error) {
      console.error('AI response error:', error);
      toast.error('Could not get response from AI.');
    } finally {
      setSendingChat(false);
    }
  };

  // 🚀 COPILOT ACTION BUTTON HANDLERS
  const handleCopilotAction = async (actionType) => {
    if (!selectedNote) {
      toast.error('Please select a lecture note first.');
      return;
    }

    setSendingChat(true);
    let promptTitle = "";
    let actionPrompt = "";

    switch (actionType) {
      case 'explain':
        promptTitle = "Explain Like I'm 10";
        actionPrompt = `Please explain the concepts in the following lecture note in extremely simple words, analogies, and stories that a 10-year-old would easily understand:
        \n\n${selectedNote.content}`;
        break;
      case 'crash':
        promptTitle = "1-Day Crash Summary";
        actionPrompt = `Generate a high-yield, bulleted crash review sheet for my exam based on the following lecture note. Focus only on must-know concepts, formulas, and definitions:
        \n\n${selectedNote.content}`;
        break;
      case 'viva':
        promptTitle = "Generate Viva Questions";
        actionPrompt = `Analyze this lecture note and generate 5 representative oral exam (viva voce) questions with clear, direct answers for each:
        \n\n${selectedNote.content}`;
        break;
      case 'pyq':
        promptTitle = "Predict PYQs";
        actionPrompt = `Predict 3 common college board previous year questions (PYQs) that are likely to be drafted from the core concepts of this note, alongside structural guidance for drafting high-scoring responses:
        \n\n${selectedNote.content}`;
        break;
      default:
        return;
    }

    // Prepend system label to message list
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: `[AI Copilot: ${promptTitle}]` }
    ]);

    try {
      const response = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: actionPrompt }],
        context: 'notes',
        contextRef: selectedNote._id,
      });

      if (response.data.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.data.response }
        ]);
        toast.success(`Copilot finished: ${promptTitle}`);
      }
    } catch (error) {
      console.error('Copilot action failed:', error);
      toast.error('Failed to connect with study copilot.');
    } finally {
      setSendingChat(false);
    }
  };

  // 📝 FLASHCARDS AI GENERATOR RITUAL
  const handleGenerateFlashcards = async () => {
    if (!selectedNote) {
      toast.error('Select a lecture note first.');
      return;
    }

    try {
      setGeneratingCards(true);
      setFlashcards([]);
      
      const prompt = `Based on the following lecture note content, generate 4 comprehensive question-and-answer study flashcards.
      Return ONLY a valid JSON array of objects, each containing exactly "front" (the question) and "back" (the answer) keys. Do NOT wrap in markdown code fence blocks.
      
      Note content:
      ${selectedNote.content}`;

      const response = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: prompt }]
      });

      if (response.data.success) {
        const responseText = response.data.data.response;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setFlashcards(parsed);
          setActiveCardIdx(0);
          setCardFlipped(false);
          toast.success('AI Flashcards compiled! 🧠');
        } else {
          throw new Error('No JSON format detected.');
        }
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      // Clean fallback if AI fails or returns weird text
      setFlashcards([
        { front: 'Key Term: What is the primary thesis of this note?', back: selectedNote.title },
        { front: 'Concept Definition: Explain core summary points', back: selectedNote.aiSummary || 'Study note content in details.' },
        { front: 'Application Question: How do we practice this topic?', back: 'Log sessions, review dynamic summaries, and trigger oral viva questions.' }
      ]);
      setActiveCardIdx(0);
      setCardFlipped(false);
      toast.success('Loaded mock flashcards for note.');
    } finally {
      setGeneratingCards(false);
    }
  };

  const openNewEditor = () => {
    setSelectedNote(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorCourse(courses[0]?._id || '');
    setEditorTags('');
    setEditorIsPublic(false);
    setIsEditing(true);
  };

  const openEditNote = (note) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorCourse(note.course?._id || '');
    setEditorTags(note.tags ? note.tags.join(', ') : '');
    setEditorIsPublic(note.isPublic || false);
    setIsEditing(true);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCourse =
      activeCourseId === 'all' || n.course?._id === activeCourseId;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in pb-12">
      
      {/* Sidebar: Course List & Search */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
          <button
            onClick={openNewEditor}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Icon name="add" className="text-lg" /> Create New Note
          </button>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Icon name="search" className="text-lg" />
            </span>
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Course filter tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest pl-1 block mb-2 font-mono">My Courses</span>
            <button
              onClick={() => setActiveCourseId('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                activeCourseId === 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/35'
              }`}
            >
              <span>All Lectures</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">{notes.length}</span>
            </button>
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => setActiveCourseId(course._id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeCourseId === course._id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/35'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.color }} />
                <span className="flex-1 truncate">{course.code} &bull; {course.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Lecture Upload Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white mb-3 text-sm flex items-center gap-1.5">
            <Icon name="upload_file" className="text-indigo-500" /> Upload Lecture Audio/PDF
          </h3>
          <form onSubmit={handleFileUpload} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lecture Title</label>
              <input
                type="text"
                placeholder="e.g., Week 4 Stack Overflow"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Course</label>
              <select
                value={uploadCourse}
                onChange={(e) => setUploadCourse(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                required
              >
                <option value="">Select a Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lecture File</label>
              <input
                type="file"
                accept=".pdf,.mp3,.wav,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-900 file:text-indigo-600 hover:file:bg-slate-200 dark:hover:file:bg-slate-900/60"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600/80 active:scale-95 text-indigo-600 dark:text-indigo-300 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {uploading ? <Loader size="sm" /> : <Icon name="cloud_upload" className="text-base" />}
              {uploading ? 'Processing File...' : 'Upload & Transcribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area: Notes List, Editor, Details & Flashcards */}
      <div className="xl:col-span-2 space-y-6">
        
        {isEditing ? (
          /* Editor UI */
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">
                {selectedNote ? 'Edit Note' : 'Create New Note'}
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400 hover:text-slate-650">
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateNote} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course</label>
                  <select
                    value={editorCourse}
                    onChange={(e) => setEditorCourse(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. #midterm, #stacks"
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Note Title</label>
                <input
                  type="text"
                  placeholder="e.g., Dynamic Programming Midterm Review"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-black"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Markdown Content</label>
                <textarea
                  rows={14}
                  placeholder="Write your note here using markdown format..."
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white font-mono leading-relaxed resize-none"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorIsPublic}
                    onChange={(e) => setEditorIsPublic(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-350"
                  />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Share with class (make public)</span>
                </label>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-extrabold transition-all shadow-md shadow-indigo-500/20"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        ) : selectedNote ? (
          /* Note Detail & Interactive Study Widgets UI */
          <div className="space-y-6">
            
            {/* Note Detail Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${selectedNote.course?.color}15`, color: selectedNote.course?.color }}>
                  {selectedNote.course?.code} &bull; {selectedNote.course?.title}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEditNote(selectedNote)} className="text-slate-400 hover:text-indigo-650 flex items-center justify-center p-1.5 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg">
                    <Icon name="edit" className="text-lg" />
                  </button>
                  <button onClick={() => handleDeleteNote(selectedNote._id)} className="text-slate-400 hover:text-rose-650 flex items-center justify-center p-1.5 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg">
                    <Icon name="delete" className="text-lg" />
                  </button>
                  <button onClick={() => handleSummarizeNote(selectedNote._id)} className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-md">
                    <Icon name="auto_awesome" fill={1} className="text-sm text-yellow-300" /> Summarize
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{selectedNote.title}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-400 dark:text-slate-400">Written by <span className="font-semibold">{selectedNote.author?.name}</span> &bull; {new Date(selectedNote.updatedAt).toLocaleDateString()}</p>
                  {selectedNote.tags?.map((t) => (
                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded text-slate-600 dark:text-slate-300">{t}</span>
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedNote.content}
              </div>

              {/* AI summary block if exists */}
              {selectedNote.aiSummary && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/30 space-y-3.5">
                  <h3 className="font-black text-indigo-950 dark:text-indigo-300 text-sm flex items-center gap-1.5">
                    <Icon name="auto_awesome" fill={1} className="text-indigo-500" /> Lecture AI Summary
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{selectedNote.aiSummary}</p>
                  
                  {selectedNote.keyInsights?.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Key Insights</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedNote.keyInsights.map((insight, idx) => (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-900/65 rounded-xl border border-indigo-50 dark:border-indigo-900/30 shadow-sm">
                            <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-300 leading-snug">{insight.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🧠 AI FLASHCARDS SLIDER PANEL */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                  <Icon name="style" className="text-indigo-500 text-xl" /> AI Academic Flashcards
                </h3>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={generatingCards}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {generatingCards ? <Loader size="sm" /> : <Icon name="sync" className="text-xs" />}
                  {flashcards.length > 0 ? 'Re-Generate' : 'Compile Flashcards'}
                </button>
              </div>

              {generatingCards ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader size="lg" />
                  <span className="text-xs font-semibold text-slate-400">Synthesizing flashcards with AI...</span>
                </div>
              ) : flashcards.length > 0 ? (
                <div className="space-y-4">
                  {/* Outer Perspective Box */}
                  <div className="flex justify-center py-4">
                    <div 
                      onClick={() => setCardFlipped(!cardFlipped)}
                      className="w-full max-w-sm h-48 bg-slate-50 dark:bg-slate-900 rounded-3xl relative border border-slate-200/50 dark:border-slate-850 shadow-md cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] flex items-center justify-center p-6 text-center"
                    >
                      {/* Active Front/Back Content */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          {cardFlipped ? 'Answer Key (Back)' : 'Question Topic (Front)'}
                        </span>
                        <p className={`font-bold leading-relaxed text-sm ${cardFlipped ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                          {cardFlipped ? flashcards[activeCardIdx].back : flashcards[activeCardIdx].front}
                        </p>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block pt-2">Click to flip card</span>
                      </div>
                    </div>
                  </div>

                  {/* Slider controls */}
                  <div className="flex justify-between items-center px-2">
                    <button
                      onClick={() => {
                        setActiveCardIdx((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                        setCardFlipped(false);
                      }}
                      className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                    >
                      <Icon name="arrow_back" />
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Card {activeCardIdx + 1} of {flashcards.length}
                    </span>
                    <button
                      onClick={() => {
                        setActiveCardIdx((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                        setCardFlipped(false);
                      }}
                      className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                    >
                      <Icon name="arrow_forward" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/35 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                  <Icon name="style" className="text-3xl text-indigo-400/40 mb-2" />
                  <p className="text-xs font-semibold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Generate micro-study flashcards directly from this lecture. Helps with terminology active recall.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Empty / Select UI */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between h-48"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${note.course?.color}15`, color: note.course?.color }}>
                        {note.course?.code}
                      </span>
                      {note.aiSummary && <Icon name="auto_awesome" fill={1} className="text-sm text-yellow-500" />}
                    </div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white line-clamp-2 text-sm leading-snug">{note.title}</h3>
                    <p className="text-slate-400 dark:text-slate-400 text-xs font-medium line-clamp-3 leading-relaxed">{note.content}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/60 pt-3">
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-indigo-500 font-extrabold flex items-center gap-0.5">Read Note <Icon name="arrow_forward" className="text-[11px]" /></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl shadow-sm">
                <Icon name="note_stack" className="text-5xl text-slate-200 dark:text-slate-600 mb-2" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No notes found</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Select a different course or create a new note to start learning!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Right Column: AI Study Copilot Dashboard & Helper Chat Panel */}
      <div className="space-y-6">
        
        {/* 🚀 AI STUDY BRAIN ACADEMIC COPILOT WIDGET */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-2xl p-5 text-white shadow-md border border-indigo-950/20 space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-indigo-400 text-sm flex items-center gap-1.5">
              <Icon name="auto_awesome" fill={1} className="text-indigo-400" />
              AI Academic Copilot
            </h3>
            <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">
              Trigger deep research, mock exams, or simplified analogies based on your active lecture note.
            </p>
          </div>

          {/* Action grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'explain', label: 'Explain to a 10yo', icon: 'child_care', color: 'hover:border-teal-400/40 text-teal-300' },
              { id: 'crash', label: '1-Day Exam Crash', icon: 'bolt', color: 'hover:border-rose-400/40 text-rose-300' },
              { id: 'viva', label: 'Viva Oral Prep', icon: 'forum', color: 'hover:border-indigo-400/40 text-indigo-300' },
              { id: 'pyq', label: 'Predict PYQs', icon: 'assignment_turned_in', color: 'hover:border-yellow-400/40 text-yellow-300' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleCopilotAction(item.id)}
                disabled={sendingChat || !selectedNote}
                className={`py-3 px-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-40 select-none ${item.color}`}
              >
                <Icon name={item.icon} fill={1} className="text-xl" />
                <span className="text-[10px] font-black uppercase tracking-wider block">{item.label}</span>
              </button>
            ))}
          </div>

          {!selectedNote && (
            <p className="text-[10px] text-rose-300 text-center font-bold">
              * Note: Please select a lecture note card from the grid to unlock copilot tools.
            </p>
          )}
        </div>

        {/* AI Helper Chat Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col h-[480px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                <Icon name="auto_awesome" fill={1} className="text-indigo-500" /> Campus AI Helper
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[150px]">
                {selectedNote ? `Discussing: ${selectedNote.title}` : 'General study assistant'}
              </p>
            </div>
            {chatMessages.length > 0 && (
              <button onClick={() => setChatMessages([])} className="text-[10px] font-bold text-rose-500 hover:underline">
                Clear
              </button>
            )}
          </div>

          {/* Chat History Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/25 flex items-center justify-center text-indigo-500 mx-auto">
                  <Icon name="forum" className="text-xl" />
                </div>
                <p className="text-xs font-bold max-w-[200px] mx-auto leading-relaxed">
                  {selectedNote 
                    ? "Ask me anything about this lecture! I've read all the notes." 
                    : "Ask me to explain algorithms, review study tips, or fetch insights."}
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-inner'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl rounded-tl-none p-3.5 border border-slate-100 dark:border-slate-800">
                  <Loader size="sm" />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/10 rounded-b-2xl flex gap-2">
            <input
              type="text"
              placeholder="Ask AI assistant..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={sendingChat}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none dark:text-white font-medium"
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              <Icon name="arrow_upward" className="text-base" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default NotesPage;
