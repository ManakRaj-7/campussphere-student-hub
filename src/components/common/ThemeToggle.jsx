import Icon from './Icon';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: 'light_mode', label: 'Light' },
    { value: 'dark', icon: 'dark_mode', label: 'Dark' },
    { value: 'system', icon: 'desktop_windows', label: 'System' },
  ];

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-full p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
            theme === option.value
              ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          title={option.label}
          aria-label={`Switch to ${option.label} theme`}
        >
          <Icon name={option.icon} fill={theme === option.value ? 1 : 0} className="text-base" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
