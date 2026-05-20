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

  // Navigation Tabs: 'feed', 'clubs', 'events'
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
      <div className="flex border-b border-slate-200 dark:border-slate-700/80 gap-6">
        {[
          { id: 'feed', label: 'Feed & Discussions', icon: 'chat_bubble' },
          { id: 'clubs', label: 'Student Clubs', icon: 'diversity_3' },
          { id: 'events', label: 'Campus Events', icon: 'today' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${
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
