const Loader = ({ fullScreen = true, message = 'Loading...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated gradient spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-teal-400 border-l-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Branding */}
      <div className="text-center">
        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          CampusSphere
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{message}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

export default Loader;
