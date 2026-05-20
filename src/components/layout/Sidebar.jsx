import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../common/Icon';

const navItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/notes', icon: 'note_stack', label: 'Notes' },
  { path: '/placements', icon: 'work', label: 'Placements' },
  { path: '/community', icon: 'groups', label: 'Community' },
  { path: '/wellness', icon: 'self_improvement', label: 'Wellness' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[72px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-slate-100 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-bold text-lg">C</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title={item.label}
            >
              <Icon
                name={item.icon}
                fill={active ? 1 : 0}
                className={`text-2xl ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
              />
              <span className={`text-[10px] font-medium mt-0.5 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Ask AI Button */}
      <div className="flex flex-col items-center gap-3 py-4 px-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => navigate('/notes')}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200"
          title="Ask AI"
        >
          <Icon name="auto_awesome" fill={1} className="text-white text-xl" />
        </button>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Ask AI</span>
      </div>
    </aside>
  );
};

export { navItems };
export default Sidebar;
