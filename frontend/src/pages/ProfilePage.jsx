/**
 * NeuraMind — User Profile & Account Page
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../features/auth/authSlice';
import NmButton from '../components/NmButton';
import NmCard from '../components/NmCard';
import axios from 'axios';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    // Fetch project/history count for authenticated user
    axios
      .get('/api/history', { withCredentials: true })
      .then((res) => {
        if (res.data?.count !== undefined) {
          setHistoryCount(res.data.count);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email[0].toUpperCase();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 w-full space-y-6">
      {/* Profile Header */}
      <NmCard variant="glass" className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* User Avatar */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User Avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--nm-accent-glow)] shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--nm-accent)] to-[var(--nm-accent-glow)] flex items-center justify-center text-white text-2xl font-bold border-2 border-[var(--nm-accent-glow)] shadow-lg">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-[var(--nm-text-primary)] tracking-tight">
                  {user.name}
                </h1>
                {user.emailVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] text-[11px] font-mono border border-[rgba(34,197,94,0.3)]">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="text-sm font-mono text-[var(--nm-text-muted)]">{user.email}</p>

              <div className="flex items-center gap-3 pt-2 text-xs text-[var(--nm-text-secondary)]">
                <span className="capitalize px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
                  Provider: {user.provider || 'Email'}
                </span>
                <span>
                  Member since:{' '}
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          </div>

          <NmButton
            variant="danger"
            onClick={handleLogout}
            icon="pi pi-sign-out"
            className="w-full sm:w-auto"
          >
            Logout
          </NmButton>
        </div>
      </NmCard>

      {/* Account Stats & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NmCard className="p-5 text-center">
          <div className="text-3xl font-bold text-[var(--nm-accent-light)] font-mono">
            {historyCount}
          </div>
          <div className="text-xs text-[var(--nm-text-muted)] mt-1 uppercase tracking-wider">
            Generated Pages
          </div>
        </NmCard>

        <NmCard className="p-5 text-center">
          <div className="text-3xl font-bold text-green-400 font-mono">Active</div>
          <div className="text-xs text-[var(--nm-text-muted)] mt-1 uppercase tracking-wider">
            Account Status
          </div>
        </NmCard>

        <NmCard className="p-5 text-center">
          <div className="text-3xl font-bold text-indigo-400 font-mono">Pro</div>
          <div className="text-xs text-[var(--nm-text-muted)] mt-1 uppercase tracking-wider">
            Developer Tier
          </div>
        </NmCard>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/generate" className="no-underline">
          <NmCard hoverable className="p-6 h-full flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-semibold text-[var(--nm-text-primary)] group-hover:text-[var(--nm-accent-light)] transition-colors">
                Create New UI Page
              </h3>
              <p className="text-xs text-[var(--nm-text-muted)] mt-1">
                Prompt-to-UI and Wireframe generation
              </p>
            </div>
            <i className="pi pi-arrow-right text-[var(--nm-accent)] text-lg group-hover:translate-x-1 transition-transform" />
          </NmCard>
        </Link>

        <Link to="/history" className="no-underline">
          <NmCard hoverable className="p-6 h-full flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-semibold text-[var(--nm-text-primary)] group-hover:text-[var(--nm-accent-light)] transition-colors">
                View Project History
              </h3>
              <p className="text-xs text-[var(--nm-text-muted)] mt-1">
                Access your past generated pages and designs
              </p>
            </div>
            <i className="pi pi-arrow-right text-[var(--nm-accent)] text-lg group-hover:translate-x-1 transition-transform" />
          </NmCard>
        </Link>
      </div>
    </main>
  );
};

export default ProfilePage;
