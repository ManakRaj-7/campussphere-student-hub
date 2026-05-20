import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import api from '../services/api';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const CommunityPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Navigation Tabs: 'feed', 'clubs', 'events', 'social'
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);

  // Feed State
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({}); // postId -> commentList

  // Clubs State
  const [clubs, setClubs] = useState([]);
  const [joiningClubId, setJoiningClubId] = useState(null);

  // Events State
  const [events, setEvents] = useState([]);
  const [attendingEventId, setAttendingEventId] = useState(null);

  // Event Scheduler State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'workshop', // workshop, sports, hackathon, social
    organizerType: 'user'
  });

  // Hyper-Social Campus Layer State
  const [socialTab, setSocialTab] = useState('confessions'); // confessions, memes, matches, free-now
  
  // Confessions state
  const [confessions, setConfessions] = useState(() => {
    const saved = localStorage.getItem('cs_confessions');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', text: "I accidentally submitted my biology lab report as a movie review of Shrek. The prof gave me an A anyway.", color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]', likes: 24, liked: false },
      { id: 'c2', text: "I've been using the department printer to print my 400-page fantasy novel chapter by chapter since freshman year.", color: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]', likes: 42, liked: false },
      { id: 'c3', text: "Still trying to figure out if that cute guy in the computer lab is coding in Python or just playing Minecraft.", color: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]', likes: 18, liked: false },
      { id: 'c4', text: "To the person who took my almond milk from the hostel fridge: I hope your next React app enters an infinite loop.", color: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]', likes: 31, liked: false }
    ];
  });
  const [newConfessionText, setNewConfessionText] = useState('');
  const [confessionColor, setConfessionColor] = useState('cyan'); // cyan, pink, purple, amber

  // Memes state
  const [memes, setMemes] = useState([
    { id: 'm1', title: 'Vite Speed', text: 'Vite hot reloading: ⚡ (0.01s)\n\nWebpack compiling: 💀 (45s)', upvotes: 142, skulls: 54, author: 'FrontendDev_26', voted: null },
    { id: 'm2', title: 'Class Attendance', text: 'Prof: "Attendance is not mandatory." \n\nAlso Prof: "The final exam will be based exactly on my spoken words in class."', upvotes: 89, skulls: 12, author: 'CrammingKing', voted: null },
    { id: 'm3', title: 'Infinite Loops', text: 'My brain at 3:00 AM trying to sleep:\n\nwhile(true) {\n  thinkAboutLife();\n}', upvotes: 213, skulls: 88, author: 'NoSleepCoder', voted: null }
  ]);
  const [newMemeTitle, setNewMemeTitle] = useState('');
  const [newMemeText, setNewMemeText] = useState('');

  // Interests matching state
  const [selectedInterest, setSelectedInterest] = useState('Competitive Coding');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMatches, setScannedMatches] = useState([]);
  const [wavedStudents, setWavedStudents] = useState({}); // studentId -> true

  // Free Now Navigator state
  const [checkedInZone, setCheckedInZone] = useState(() => {
    return localStorage.getItem('cs_checked_in_zone') || null;
  });
  const [campusZones, setCampusZones] = useState([
    { id: 'lib', name: 'Central Library Quiet Zone', activeCount: 14, icon: 'menu_book' },
    { id: 'cafe', name: 'Campus Cafe Lounge', activeCount: 22, icon: 'local_cafe' },
    { id: 'hostel', name: 'Valkyrie Hall Common Room', activeCount: 8, icon: 'home' },
    { id: 'lawn', name: 'Green Lawn Gazebos', activeCount: 5, icon: 'forest' }
  ]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('post:new', (newPost) => {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    });

    socket.on('post:liked', ({ postId, likes }) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, likes } : post
        )
      );
    });

    socket.on('comment:new', ({ postId, comment }) => {
      // Add comment to posts map
      setCommentsMap((prevMap) => {
        const existingComments = prevMap[postId] || [];
        return {
          ...prevMap,
          [postId]: [...existingComments, comment]
        };
      });

      // Update post comment count in main posts feed
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, commentCount: (post.commentCount || 0) + 1 }
            : post
        )
      );
    });

    return () => {
      socket.off('post:new');
      socket.off('post:liked');
      socket.off('comment:new');
    };
  }, [socket]);

  // Fetch initial data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'feed') {
          const response = await api.get('/posts');
          if (response.data.success) {
            setPosts(response.data.data);
          }
        } else if (activeTab === 'clubs') {
          const response = await api.get('/clubs');
          if (response.data.success) {
            setClubs(response.data.data);
          }
        } else if (activeTab === 'events') {
          const response = await api.get('/events');
          if (response.data.success) {
            setEvents(response.data.data);
          }
        }
      } catch (error) {
        console.error(`Error loading data for ${activeTab}:`, error);
        toast.error(`Failed to load ${activeTab}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Feed Actions
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    try {
      const response = await api.post('/posts', { content: newPostText });
      if (response.data.success) {
        toast.success('Post published!');
        setNewPostText('');
        // If not using sockets, manually prepend
        if (!socket) {
          setPosts((prev) => [response.data.data, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Could not create post');
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      if (response.data.success) {
        const updatedLikes = response.data.data.likes;
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, likes: updatedLikes } : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Action failed');
    }
  };

  const handleOpenComments = async (post) => {
    setSelectedPostForComments(post);
    setCommentText('');
    
    // Load comments if not cached
    if (!commentsMap[post._id]) {
      try {
        const response = await api.get(`/posts/${post._id}`);
        if (response.data.success) {
          setCommentsMap((prev) => ({
            ...prev,
            [post._id]: response.data.data.comments || []
          }));
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPostForComments) return;

    const postId = selectedPostForComments._id;
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content: commentText });
      if (response.data.success) {
        const newComment = response.data.data;
        
        setCommentsMap((prevMap) => {
          const currentComments = prevMap[postId] || [];
          return {
            ...prevMap,
            [postId]: [...currentComments, newComment]
          };
        });

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? { ...post, commentCount: (post.commentCount || 0) + 1 }
              : post
          )
        );

        setCommentText('');
        toast.success('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not submit comment');
    }
  };

  // Club Actions
  const handleJoinClub = async (clubId) => {
    setJoiningClubId(clubId);
    try {
      const response = await api.post(`/clubs/${clubId}/join`);
      if (response.data.success) {
        const { isMember, memberCount } = response.data.data;
        
        // Update clubs list
        setClubs((prevClubs) =>
          prevClubs.map((club) =>
            club._id === clubId
              ? { ...club, isMember, memberCount }
              : club
          )
        );

        toast.success(isMember ? 'Welcome to the club! 🎉' : 'Left the club');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club');
    } finally {
      setJoiningClubId(null);
    }
  };

  // Event Actions
  const handleAttendEvent = async (eventId) => {
    setAttendingEventId(eventId);
    try {
      const response = await api.post(`/events/${eventId}/attend`);
      if (response.data.success) {
        const { isAttending, attendeeCount } = response.data.data;

        setEvents((prevEvents) =>
          prevEvents.map((evt) =>
            evt._id === eventId
              ? { ...evt, isAttending, attendeeCount }
              : evt
          )
        );

        toast.success(isAttending ? 'RSVP registered! See you there! 📅' : 'RSVP cancelled');
      }
    } catch (error) {
      console.error('Error attending event:', error);
      toast.error('Failed to RSVP');
    } finally {
      setAttendingEventId(null);
    }
  };

  const handleScheduleEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post('/events', eventForm);
      if (response.data.success) {
        toast.success('Event scheduled successfully! 🚀');
        setEvents((prev) => [response.data.data, ...prev]);
        setShowScheduleModal(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          location: '',
          category: 'workshop',
          organizerType: 'user'
        });
      }
    } catch (error) {
      console.error('Error scheduling event:', error);
      toast.error(error.response?.data?.message || 'Could not schedule event');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/25">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[10rem] rotate-12 absolute -right-10 -bottom-10">groups</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Campus Hub & Community</h1>
          <p className="text-white/80 text-sm mt-2 font-medium">
            Connect with campus friends, explore student organizations, and attend inspiring campus events.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700/80 gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'feed', label: 'Feed & Discussions', icon: 'chat_bubble' },
          { id: 'clubs', label: 'Student Clubs', icon: 'diversity_3' },
          { id: 'events', label: 'Campus Events', icon: 'today' },
          { id: 'social', label: 'Campus Social Space', icon: 'auto_awesome_motion' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" message={`Loading ${activeTab}...`} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ============ TAB 1: DISCUSSIONS FEED ============ */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Feed List */}
              <div className="lg:col-span-2 space-y-5">
                {/* Create Post Card */}
                <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <textarea
                      placeholder="Share a campus update, ask a question, or start a study thread..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none h-24"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/30">
                    <div className="flex gap-2">
                      <button type="button" className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all">
                        <Icon name="image" className="text-xl" />
                      </button>
                      <button type="button" className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all">
                        <Icon name="tag" className="text-xl" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newPostText.trim()}
                      className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Post Feed
                    </button>
                  </div>
                </form>

                {/* Posts Feed */}
                {posts.length > 0 ? (
                  posts.map((post) => {
                    const hasLiked = post.likes?.includes(user?._id);
                    return (
                      <div key={post._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        {/* Post Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                              {post.author?.name ? post.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                                {post.author?.name || 'Anonymous Student'}
                                {post.isSponsored && (
                                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Sponsored
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                {post.author?.department} &bull; {new Date(post.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                              </p>
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <Icon name="more_horiz" />
                          </button>
                        </div>

                        {/* Post Body */}
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {/* Post Actions */}
                        <div className="flex items-center gap-6 pt-3 border-t border-slate-50 dark:border-slate-700/30 text-slate-500 dark:text-slate-400">
                          <button
                            onClick={() => handleToggleLike(post._id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 ${
                              hasLiked ? 'text-rose-500 dark:text-rose-400' : 'hover:text-rose-500'
                            }`}
                          >
                            <Icon name="favorite" fill={hasLiked ? 1 : 0} className="text-lg" />
                            {post.likes?.length || 0}
                          </button>
                          <button
                            onClick={() => handleOpenComments(post)}
                            className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Icon name="chat_bubble" className="text-lg" />
                            {post.commentCount || 0} Comments
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Icon name="forum" className="text-5xl text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No posts in the community yet. Be the first to start a conversation!</p>
                  </div>
                )}
              </div>

              {/* Sidebar: Online Stats & Suggestions */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-800 dark:text-white text-md flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Real-time Campus Stream
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isConnected ? 'Connected to live campus servers. All updates stream in instantly!' : 'Reconnecting to real-time events feed...'}
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="bolt" className="text-yellow-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Status</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ TAB 2: STUDENT CLUBS ============ */}
          {activeTab === 'clubs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.length > 0 ? (
                clubs.map((club) => {
                  const isMember = club.isMember;
                  return (
                    <div key={club._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-24 h-24 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <Icon name={club.icon || 'diversity_3'} className="text-[6rem]" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/10" style={{ backgroundColor: club.color || '#6366f1' }}>
                            <Icon name={club.icon || 'groups'} className="text-2xl" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-md">{club.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {club.memberCount || 0} Members
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                          {club.description}
                        </p>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-50 dark:border-slate-700/30 flex justify-between items-center">
                        <span className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-lg font-bold">
                          Official
                        </span>
                        <button
                          onClick={() => handleJoinClub(club._id)}
                          disabled={joiningClubId === club._id}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1 ${
                            isMember
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                          }`}
                        >
                          {joiningClubId === club._id ? (
                            <Loader size="sm" />
                          ) : (
                            <Icon name={isMember ? 'check' : 'person_add'} className="text-sm" />
                          )}
                          {isMember ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Icon name="explore" className="text-5xl text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No student clubs found.</p>
                </div>
              )}
            </div>
          )}

          {/* ============ TAB 3: CAMPUS EVENTS ============ */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Event Header & Action Buttons */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm">
                <div className="space-y-0.5">
                  <h3 className="font-black text-slate-800 dark:text-white">Upcoming Events Calendar</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">RSVP to academic, social, and professional events scheduled around the campus.</p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Icon name="add" className="text-sm" /> Schedule Event
                </button>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length > 0 ? (
                  events.map((evt) => {
                    const isAttending = evt.isAttending;
                    const eventDate = new Date(evt.date);
                    return (
                      <div key={evt._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                        {/* Card Image Placeholder with category styling */}
                        <div className="h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-indigo-600/30 flex items-center justify-center relative p-4">
                          <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 capitalize">
                            {evt.category || 'Workshop'}
                          </span>
                          <Icon
                            name={
                              evt.category === 'hackathon'
                                ? 'terminal'
                                : evt.category === 'sports'
                                ? 'sports_soccer'
                                : evt.category === 'social'
                                ? 'celebration'
                                : 'school'
                            }
                            className="text-indigo-600 dark:text-indigo-400 text-5xl opacity-40"
                          />
                        </div>

                        <div className="p-5 flex-1 space-y-3">
                          <h4 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                            {evt.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-2">
                            {evt.description}
                          </p>

                          <div className="space-y-1.5 pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Icon name="event" className="text-indigo-500" />
                              <span>
                                {eventDate.toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}{' '}
                                at {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Icon name="location_on" className="text-indigo-500" />
                              <span>{evt.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                              <Icon name="group" className="text-sm" />
                              <span>{evt.attendeeCount || 0} Attending</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="px-5 py-4 border-t border-slate-50 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/10 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {evt.organizer?.name ? `By ${evt.organizer.name.split(' ')[0]}` : 'Faculty Meet'}
                          </span>
                          <button
                            onClick={() => handleAttendEvent(evt._id)}
                            disabled={attendingEventId === evt._id}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1 ${
                              isAttending
                                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/20'
                                : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            }`}
                          >
                            {attendingEventId === evt._id ? (
                              <Loader size="sm" />
                            ) : (
                              <Icon name={isAttending ? 'check_circle' : 'star'} className="text-sm" />
                            )}
                            {isAttending ? 'Attending' : 'RSVP'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Icon name="calendar_today" className="text-5xl text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No upcoming events listed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ TAB 4: CAMPUS SOCIAL SPACE ============ */}
          {activeTab === 'social' && (
            <div className="space-y-6 animate-fade-in">
              {/* Secondary Navigation Headers */}
              <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 gap-1.5 self-start overflow-x-auto max-w-full no-scrollbar">
                {[
                  { id: 'confessions', label: 'Anonymous Confessions', icon: 'theater_comedy' },
                  { id: 'memes', label: 'Memes Board', icon: 'mood' },
                  { id: 'matches', label: 'Interests Matcher', icon: 'join_left' },
                  { id: 'free-now', label: 'Who\'s Free Now?', icon: 'person_pin' }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setSocialTab(subTab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      socialTab === subTab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200/20 dark:border-slate-700/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon name={subTab.icon} className="text-sm" />
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* ============ SUBTAB 1: ANONYMOUS CONFESSIONS ============ */}
              {socialTab === 'confessions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Write Confession Column */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                        <Icon name="theater_comedy" className="text-pink-500" /> Share Anonymously
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Got a hot take, a funny failure, or a secret campus crush? Spillage is welcome here. Completely untracked.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newConfessionText.trim()) return;

                        const colors = {
                          cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
                          pink: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]',
                          purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
                          amber: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        };

                        const newConf = {
                          id: 'c_' + Date.now(),
                          text: newConfessionText,
                          color: colors[confessionColor],
                          likes: 0,
                          liked: false
                        };

                        const updated = [newConf, ...confessions];
                        setConfessions(updated);
                        localStorage.setItem('cs_confessions', JSON.stringify(updated));
                        setNewConfessionText('');
                        toast.success('Confession shared anonymously! 🤫');
                      }}
                      className="space-y-4"
                    >
                      <textarea
                        rows={5}
                        required
                        maxLength={250}
                        placeholder="State your confession here..."
                        value={newConfessionText}
                        onChange={(e) => setNewConfessionText(e.target.value)}
                        className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white font-medium resize-none leading-relaxed"
                      />

                      {/* Color selectors */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Neon Card Theme</label>
                        <div className="flex gap-2.5 pt-1">
                          {['cyan', 'pink', 'purple', 'amber'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setConfessionColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                color === 'cyan' ? 'bg-cyan-400 border-cyan-300' :
                                color === 'pink' ? 'bg-pink-400 border-pink-300' :
                                color === 'purple' ? 'bg-purple-400 border-purple-300' :
                                'bg-amber-400 border-amber-300'
                              } ${confessionColor === color ? 'scale-125 ring-2 ring-indigo-500/50' : 'opacity-80 hover:opacity-100'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Icon name="send" className="text-sm" />
                        Confess Anonymously
                      </button>
                    </form>
                  </div>

                  {/* Confessions list */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {confessions.map(c => (
                      <div key={c.id} className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-transform ${c.color}`}>
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{c.text}</p>
                        
                        <div className="flex justify-between items-center border-t border-slate-500/10 pt-3">
                          <span className="text-[9px] font-black tracking-widest uppercase opacity-60">🤫 ANONYMOUS</span>
                          <button
                            onClick={() => {
                              const updated = confessions.map(item => {
                                if (item.id === c.id) {
                                  const isLiked = !item.liked;
                                  return {
                                    ...item,
                                    liked: isLiked,
                                    likes: isLiked ? item.likes + 1 : item.likes - 1
                                  };
                                }
                                return item;
                              });
                              setConfessions(updated);
                              localStorage.setItem('cs_confessions', JSON.stringify(updated));
                            }}
                            className={`flex items-center gap-1 text-[11px] font-bold transition-all active:scale-90 ${
                              c.liked ? 'text-pink-500 scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <Icon name="favorite" fill={c.liked ? 1 : 0} className="text-sm" />
                            {c.likes} Hearts
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ SUBTAB 2: MEMES BOARD ============ */}
              {socialTab === 'memes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Create Meme Card */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                        <Icon name="mood" className="text-yellow-500" /> Share Campus Meme
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Add to the student humor collective. Describe the funny reality of labs, exams, or campus food.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMemeTitle.trim() || !newMemeText.trim()) return;

                        const newMeme = {
                          id: 'm_' + Date.now(),
                          title: newMemeTitle,
                          text: newMemeText,
                          upvotes: 0,
                          skulls: 0,
                          author: user?.name?.split(' ')[0] || 'Scholar',
                          voted: null
                        };

                        setMemes([newMeme, ...memes]);
                        setNewMemeTitle('');
                        setNewMemeText('');
                        toast.success('Meme published to the board! 😂');
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Meme Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3-Hour Lab Session"
                          value={newMemeTitle}
                          onChange={(e) => setNewMemeTitle(e.target.value)}
                          className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Meme Text / Dialogue</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Use line breaks for dialogue: e.g.&#10;Professor: '...'&#10;Me: '...'"
                          value={newMemeText}
                          onChange={(e) => setNewMemeText(e.target.value)}
                          className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white font-medium resize-none leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Icon name="add" className="text-sm" />
                        Publish Meme
                      </button>
                    </form>
                  </div>

                  {/* Memes List */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {memes.map(m => (
                      <div key={m.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-lg">
                              @{m.author}
                            </span>
                            <Icon name="sentiment_very_satisfied" className="text-amber-500 text-base" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">{m.title}</h4>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mt-2 font-mono">
                              {m.text}
                            </div>
                          </div>
                        </div>

                        {/* Vote Buttons */}
                        <div className="flex gap-3 border-t border-slate-50 dark:border-slate-700/30 pt-3.5">
                          <button
                            onClick={() => {
                              const updated = memes.map(item => {
                                if (item.id === m.id) {
                                  const alreadyUpvoted = item.voted === 'up';
                                  return {
                                    ...item,
                                    voted: alreadyUpvoted ? null : 'up',
                                    upvotes: alreadyUpvoted ? item.upvotes - 1 : item.upvotes + 1,
                                    skulls: item.voted === 'skull' ? item.skulls - 1 : item.skulls
                                  };
                                }
                                return item;
                              });
                              setMemes(updated);
                            }}
                            className={`flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                              m.voted === 'up'
                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-950/30 dark:text-amber-400'
                                : 'bg-slate-50/50 border-slate-100 text-slate-500 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            🔥 {m.upvotes} Lit
                          </button>

                          <button
                            onClick={() => {
                              const updated = memes.map(item => {
                                if (item.id === m.id) {
                                  const alreadySkulled = item.voted === 'skull';
                                  return {
                                    ...item,
                                    voted: alreadySkulled ? null : 'skull',
                                    skulls: alreadySkulled ? item.skulls - 1 : item.skulls + 1,
                                    upvotes: item.voted === 'up' ? item.upvotes - 1 : item.upvotes
                                  };
                                }
                                return item;
                              });
                              setMemes(updated);
                            }}
                            className={`flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                              m.voted === 'skull'
                                ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/20 dark:border-purple-950/30 dark:text-purple-400'
                                : 'bg-slate-50/50 border-slate-100 text-slate-500 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            💀 {m.skulls} Dead
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ SUBTAB 3: INTERESTS FRIEND MATCHER ============ */}
              {socialTab === 'matches' && (
                <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="text-center max-w-lg mx-auto space-y-1.5">
                    <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center justify-center gap-1.5">
                      <Icon name="join_left" className="text-indigo-500" /> Interest Friend Finder
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Select your primary focus area to instantly search and locate other active students with overlapping profiles.
                    </p>
                  </div>

                  {/* Focus Selection */}
                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {['Competitive Coding', 'AI Research', 'Indie Music', 'Basketball', 'Gaming/Valorant', 'Speciality Coffee'].map(interest => (
                      <button
                        key={interest}
                        onClick={() => setSelectedInterest(interest)}
                        className={`px-3.5 py-1.8 rounded-xl text-xs font-black border transition-all ${
                          selectedInterest === interest
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center border-t border-slate-50 dark:border-slate-700/30 pt-4">
                    <button
                      onClick={() => {
                        setIsScanning(true);
                        setScannedMatches([]);
                        setTimeout(() => {
                          const students = [
                            { id: 'ms1', name: 'Kavya Sharma', department: 'Computer Science', year: '3rd Year', match: 96, interests: [selectedInterest, 'Indie Music', 'Gaming/Valorant'], avatar: 'KS', active: true },
                            { id: 'ms2', name: 'Rahul Verma', department: 'Electronics', year: '2nd Year', match: 89, interests: [selectedInterest, 'Basketball', 'Speciality Coffee'], avatar: 'RV', active: true },
                            { id: 'ms3', name: 'Diya Patel', department: 'Information Technology', year: '4th Year', match: 84, interests: [selectedInterest, 'Indie Music', 'AI Research'], avatar: 'DP', active: false }
                          ];
                          setScannedMatches(students);
                          setIsScanning(false);
                          toast.success('Ideal match findings retrieved!');
                        }, 1200);
                      }}
                      disabled={isScanning}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isScanning ? <Loader size="sm" /> : <Icon name="search" className="text-sm" />}
                      {isScanning ? 'Scanning Cohorts...' : 'Scan Active Cohorts'}
                    </button>
                  </div>

                  {/* Scanning Animation */}
                  {isScanning && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 animate-pulse">
                      <div className="w-16 h-16 rounded-full border-4 border-dashed border-indigo-500 animate-spin flex items-center justify-center">
                        <Icon name="radar" className="text-indigo-500 text-xl" />
                      </div>
                      <span className="text-xs font-bold text-indigo-500">Querying live campus database...</span>
                    </div>
                  )}

                  {/* Scanned Results */}
                  {scannedMatches.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-700/30 animate-fade-in">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Top Simulated Matches Found</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {scannedMatches.map(student => (
                          <div key={student.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-center space-y-3 relative hover:shadow-md transition-shadow">
                            {/* Matching Score Badge */}
                            <span className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">
                              {student.match}% Match
                            </span>

                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-black mx-auto relative shadow-sm">
                              {student.avatar}
                              {student.active && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                              )}
                            </div>

                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{student.name}</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{student.department} &bull; {student.year}</p>
                            </div>

                            {/* Matching interests tags */}
                            <div className="flex flex-wrap gap-1 justify-center">
                              {student.interests.map(tag => (
                                <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                setWavedStudents({ ...wavedStudents, [student.id]: true });
                                toast.success(`Simulated ping sent to ${student.name}!`);
                              }}
                              disabled={wavedStudents[student.id]}
                              className={`w-full py-1.8 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 border ${
                                wavedStudents[student.id]
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700'
                                  : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              <Icon name={wavedStudents[student.id] ? 'check_circle' : 'waving_hand'} className="text-xs" />
                              {wavedStudents[student.id] ? 'Ping Sent!' : 'Ping on Chat'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============ SUBTAB 4: WHO'S FREE NOW NAVIGATOR ============ */}
              {socialTab === 'free-now' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Info Panel & Interactive Simulator */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                        <Icon name="person_pin" className="text-emerald-500 animate-bounce" /> "Who's Free Now?" Navigator
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Broadcast your location or check where student groups are currently studying in real-time. Boost peer motivation.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Your Broadcast Status</span>
                      {checkedInZone ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                            <Icon name="check_circle" className="text-emerald-500" />
                            <span>Checked in at:</span>
                          </div>
                          <span className="text-xs font-black block p-2.5 rounded-xl border border-emerald-100/50 bg-emerald-50/20 text-emerald-600 dark:border-emerald-950/20 dark:text-emerald-400 leading-snug">
                            {campusZones.find(z => z.id === checkedInZone)?.name}
                          </span>
                          <button
                            onClick={() => {
                              const zoneId = checkedInZone;
                              setCheckedInZone(null);
                              localStorage.removeItem('cs_checked_in_zone');
                              setCampusZones(campusZones.map(z => z.id === zoneId ? { ...z, activeCount: z.activeCount - 1 } : z));
                              toast.success('Checked out from study spot.');
                            }}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/15 dark:text-rose-400 dark:hover:bg-rose-950/30 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 border border-rose-100 dark:border-rose-950/20"
                          >
                            <Icon name="logout" className="text-xs" /> Check Out
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-2">
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">You are not checked in to any campus zone. Select a zone on the right to broadcast.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Zones Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campusZones.map(zone => {
                      const isCurrent = checkedInZone === zone.id;
                      return (
                        <div key={zone.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                            isCurrent
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-900/30'
                          }`}>
                            <Icon name={zone.icon} className="text-lg" />
                          </div>

                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-snug">{zone.name}</h4>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {zone.activeCount} active students
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (isCurrent) {
                                  setCheckedInZone(null);
                                  localStorage.removeItem('cs_checked_in_zone');
                                  setCampusZones(campusZones.map(z => z.id === zone.id ? { ...z, activeCount: z.activeCount - 1 } : z));
                                  toast.success('Checked out.');
                                } else {
                                  let prevZone = checkedInZone;
                                  setCheckedInZone(zone.id);
                                  localStorage.setItem('cs_checked_in_zone', zone.id);
                                  setCampusZones(campusZones.map(z => {
                                    if (z.id === zone.id) return { ...z, activeCount: z.activeCount + 1 };
                                    if (z.id === prevZone) return { ...z, activeCount: z.activeCount - 1 };
                                    return z;
                                  }));
                                  toast.success(`Checked-In at ${zone.name}!`);
                                }
                              }}
                              className={`px-4 py-1.8 text-[10px] font-black rounded-xl transition-all border ${
                                isCurrent
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              {isCurrent ? 'Checked In' : 'Check In Here'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ COMMENT DRAWER MODAL ============ */}
      {selectedPostForComments && (
        <Modal
          isOpen={!!selectedPostForComments}
          onClose={() => setSelectedPostForComments(null)}
          title="Discussions Comments"
        >
          <div className="space-y-4 max-h-[80vh] flex flex-col">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <h5 className="font-black text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                Post Thread
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                {selectedPostForComments.content}
              </p>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[300px] min-h-[150px]">
              {(commentsMap[selectedPostForComments._id] || []).length > 0 ? (
                (commentsMap[selectedPostForComments._id] || []).map((comment) => (
                  <div key={comment._id} className="flex gap-2.5 items-start p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 border border-slate-50/30 dark:border-slate-700/10">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {comment.author?.name ? comment.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                          {comment.author?.name || 'Academic Scholar'}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  No comments yet. Start the conversation!
                </p>
              )}
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex gap-2">
              <input
                type="text"
                placeholder="Write an encouraging comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* ============ EVENT SCHEDULER MODAL ============ */}
      {showScheduleModal && (
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Campus Event"
        >
          <form onSubmit={handleScheduleEvent} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. ACM Coding Night, Winter Tech Talk"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description *</label>
              <textarea
                required
                placeholder="Detail what attendees will learn, discuss, or participate in..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="workshop">Workshop</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="sports">Sports</option>
                  <option value="social">Social Meetup</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location / Room *</label>
              <input
                type="text"
                required
                placeholder="e.g. Block C Lab 304, Basketball Court"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Schedule Now
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CommunityPage;
