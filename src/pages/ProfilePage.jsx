import { useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Icon from '../components/common/Icon';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    year: user?.year || 1
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Reset Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await api.put('/users/profile', profileForm);
      if (response.data.success) {
        toast.success('Academic profile updated! 🎓');
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Could not update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.data.success) {
        toast.success('Security password updated! 🔐');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Avatar Upload Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatarFile(file);
    }
  };

  const uploadAvatarFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG/JPG)');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        toast.success('Avatar updated successfully! 👤');
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.response?.data?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadAvatarFile(file);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/25">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[10rem] rotate-12 absolute -right-10 -bottom-10">badge</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Academic Card & Settings</h1>
          <p className="text-white/80 text-sm mt-2 font-medium">
            Manage your student credentials, bios, upload custom avatars, and change security credentials.
          </p>
        </div>
      </div>

      {/* Profile Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card & Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col items-center text-center space-y-4">
            
            {/* Avatar block with drag and drop overlay */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group w-32 h-32 rounded-full relative cursor-pointer flex items-center justify-center overflow-hidden border-4 transition-all duration-300 ${
                isDragOver ? 'border-teal-500 scale-105 bg-teal-50/50' : 'border-indigo-100 dark:border-slate-700 bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}
            >
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader size="md" />
                </div>
              ) : (
                <>
                  {user?.avatar ? (
                    <img 
                      src={user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-white font-black text-3xl tracking-wide">{getUserInitials()}</span>
                  )}
                  {/* Hover upload overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                    <Icon name="photo_camera" className="text-xl mb-1" />
                    <span className="text-[9px] font-black tracking-wider uppercase">Upload Photo</span>
                  </div>
                </>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />

            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg">{user?.name}</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{user?.email}</p>
              {user?.department && (
                <span className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
                  {user.department} (Year {user.year || 1})
                </span>
              )}
            </div>

            {/* Quick stats list */}
            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Attendance Streak</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{user?.streak ?? 0} Days</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Role Status</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 capitalize block mt-0.5">{user?.role || 'Student'}</span>
              </div>
            </div>

            {user?.bio && (
              <p className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800 text-left">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}

          </div>
        </div>

        {/* Right Side: Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <h3 className="text-md font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="person" className="text-indigo-500" /> Edit Student Profile Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science, Mechanical Eng"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Academic Year *</label>
                  <select
                    value={profileForm.year}
                    onChange={(e) => setProfileForm({ ...profileForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Student Email (Locked)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Biography / About Me</label>
                <textarea
                  placeholder="Share a bit about your research interests, programming skills, or campus involvements..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold h-24 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updatingProfile ? <Loader size="sm" /> : <Icon name="save" className="text-sm" />}
                  Save Student Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <h3 className="text-md font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="lock" className="text-indigo-500" /> Security Credentials Settings
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updatingPassword ? <Loader size="sm" /> : <Icon name="security" className="text-sm" />}
                  Change Credentials Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
