import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '📝 New Lecture Notes uploaded',
      message: 'Professor uploaded Data Structures lecture notes.',
      time: '10m ago',
      read: false,
      link: '/notes'
    },
    {
      id: 2,
      title: '🔥 Study Streak Alert!',
      message: 'You are on a 5-day focus streak. Complete a session today!',
      time: '1h ago',
      read: false,
      link: '/'
    },
    {
      id: 3,
      title: '💼 New Placement Opening',
      message: 'Google posted Software Engineering Intern position.',
      time: '3h ago',
      read: true,
      link: '/placements'
    },
    {
      id: 4,
      title: '🎉 Hackathon Registration Open',
      message: 'Register for CodeCraft 2026. Limited slots available.',
      time: 'Yesterday',
      read: true,
      link: '/community'
    },
    {
      id: 5,
      title: '🧘 Mindful Wellness Recommendation',
      message: 'Feeling high load? Wellness AI recommends a 5-min breathing break.',
      time: '1 day ago',
      read: true,
      link: '/wellness'
    }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Could navigate to search page or open search modal
      console.log('Search:', searchQuery);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setShowNotifications(false);
    navigate(n.link);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[72px] h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left - Greeting & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
               {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-fuchsia-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <Icon name="auto_awesome" className="text-white text-lg" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">CampusSphere</span>
          </div>
        </div>

        {/* Center - Search */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
            <input
               type="text"
               placeholder="Search courses, notes, events..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              Alt+K
            </kbd>
          </div>
        </form>

        {/* Right - Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <button className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Icon name="search" className="text-xl" />
          </button>

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Icon name="notifications" className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 text-[9px] font-black text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white/95 dark:bg-slate-850/95 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-slate-950/80 border border-slate-200/60 dark:border-slate-750/80 py-2.5 z-50 animate-scale-up">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Campus Notifications</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{unreadCount} unread updates</p>
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${!n.read ? 'bg-indigo-50/20 dark:bg-indigo-950/5' : ''}`}
                        >
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] leading-snug block truncate ${!n.read ? 'font-black text-slate-850 dark:text-white' : 'font-extrabold text-slate-600 dark:text-slate-350'}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed truncate">
                              {n.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!n.read && (
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                            )}
                            <button 
                              onClick={(e) => deleteNotification(e, n.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded transition-colors"
                            >
                              <Icon name="close" className="text-xs" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        <Icon name="notifications_off" className="text-3xl text-slate-200 dark:text-slate-700" />
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-450">All caught up! No notifications.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <button 
            onClick={() => navigate('/profile')}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <Icon name="settings" className="text-xl" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{getUserInitials()}</span>
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <Icon name="expand_more" className="hidden md:block text-slate-400 text-lg" />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon name="person" className="text-lg" />
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate('/'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon name="settings" className="text-lg" />
                    Settings
                  </button>

                  {/* Mobile Theme Toggle */}
                  <div className="sm:hidden px-4 py-2 border-t border-slate-100 dark:border-slate-700">
                    <ThemeToggle />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Icon name="logout" className="text-lg" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
