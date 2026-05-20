import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../common/Icon';
import { navItems } from './Sidebar';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-morphism border-t border-slate-200/50 dark:border-slate-700/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                active ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''
              }`}>
                <Icon
                  name={item.icon}
                  fill={active ? 1 : 0}
                  className="text-xl"
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
