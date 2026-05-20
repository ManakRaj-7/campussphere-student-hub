import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import Loader from '../common/Loader';
import { useAuth } from '../../hooks/useAuth';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen message="Loading your campus..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950">
      <Sidebar />
      <TopBar />
      <MobileNav />

      {/* Main content area */}
      <main className="md:ml-[72px] pt-16 pb-20 md:pb-6 min-h-screen">
        <div className="px-4 md:px-6 py-4 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
