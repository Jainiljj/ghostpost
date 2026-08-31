import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, followUser, unfollowUser } from '../services/userService';
import { getUserPosts, getUserReplies } from '../services/postService';
import PostCard from '../components/PostCard';
import ProfileAvatar from '../components/ProfileAvatar';
import { FeedSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { Calendar, Users, UserCheck, UserPlus, UserMinus, Settings, MessageSquare, FileText, TrendingUp } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, updateUserInContext } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [activeTab, setActiveTab] = useState('posts'); // posts | replies
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsPage, setPostsPage] = useState(1);

  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const res = await getUserProfile(username);
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);
      } catch (err) {
        setProfileError(err.response?.status === 404 ? 'User not found.' : 'Failed to load profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  // Load posts/replies when tab or username changes
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      setPosts([]);
      setPostsPage(1);
      try {
        const res = activeTab === 'posts'
          ? await getUserPosts(username, 1)
          : await getUserReplies(username, 1);
        setPosts(res.data.posts);
        setPostsHasMore(res.data.hasMore);
      } catch {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    if (!profileLoading && !profileError) fetchPosts();
  }, [username, activeTab, profileLoading, profileError]);

  const handleLoadMore = async () => {
    const nextPage = postsPage + 1;
    try {
      const res = activeTab === 'posts'
        ? await getUserPosts(username, nextPage)
        : await getUserReplies(username, nextPage);
      setPosts((prev) => [...prev, ...res.data.posts]);
      setPostsHasMore(res.data.hasMore);
      setPostsPage(nextPage);
    } catch {
      // silent
    }
  };

  const handleFollow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(profile._id);
        setIsFollowing(false);
        setProfile((prev) => ({
          ...prev,
          followerCount: (prev.followerCount || 1) - 1,
        }));
        // Update own following list in context
        updateUserInContext({
          following: (currentUser.following || []).filter(
            (id) => id.toString() !== profile._id.toString()
          ),
        });
      } else {
        await followUser(profile._id);
        setIsFollowing(true);
        setProfile((prev) => ({
          ...prev,
          followerCount: (prev.followerCount || 0) + 1,
        }));
        updateUserInContext({
          following: [...(currentUser.following || []), profile._id],
        });
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-zinc-800 animate-pulse">
          <div className="h-40 bg-slate-200 dark:bg-zinc-800" />
          <div className="px-5 pb-5">
            <div className="w-20 h-20 rounded-full bg-slate-300 dark:bg-zinc-700 -mt-10 border-4 border-white dark:border-zinc-900" />
            <div className="mt-3 space-y-2">
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-40" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-24" />
            </div>
          </div>
        </div>
        <FeedSkeleton count={2} />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 text-center border border-slate-200/50 dark:border-zinc-800">
        <p className="text-slate-500 dark:text-zinc-400 font-semibold text-sm">{profileError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-zinc-800">
        {/* Banner */}
        <div
          className="h-40 bg-gradient-to-br from-ghost-500/60 via-purple-500/40 to-blue-500/40 relative"
          style={profile.headerImage ? { backgroundImage: `url(${profile.headerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />

        <div className="px-5 pb-5">
          {/* Avatar + Action button row */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="border-4 border-white dark:border-zinc-900 rounded-full">
              <ProfileAvatar user={profile} size="2xl" />
            </div>

            <div className="flex gap-2 mt-2">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/settings')}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              ) : currentUser ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  type="button"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    isFollowing
                      ? 'border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-300'
                      : 'bg-ghost-500 hover:bg-ghost-600 text-white shadow-sm'
                  }`}
                >
                  {followLoading ? (
                    <span>...</span>
                  ) : isFollowing ? (
                    <><UserMinus className="w-3.5 h-3.5" /><span>Unfollow</span></>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /><span>Follow</span></>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ghost-500 hover:bg-ghost-600 text-white text-xs font-bold transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </button>
              )}
            </div>
          </div>

          {/* Name & username */}
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium">@{profile.username}</p>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Joined {new Date(profile.joinedDate || profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Followers / Following */}
          <div className="flex items-center gap-5 mt-3 text-xs">
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {profile.followingCount ?? (profile.following?.length ?? 0)}{' '}
              <span className="font-normal text-slate-400 dark:text-zinc-500">Following</span>
            </span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {profile.followerCount ?? (profile.followers?.length ?? 0)}{' '}
              <span className="font-normal text-slate-400 dark:text-zinc-500">Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-100 dark:border-zinc-800">
          {[
            { key: 'posts', label: 'Posts', icon: FileText },
            { key: 'replies', label: 'Replies', icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all ${
                activeTab === key
                  ? 'text-slate-900 dark:text-white border-b-2 border-ghost-500'
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts / Replies Feed */}
      {postsLoading ? (
        <FeedSkeleton count={2} />
      ) : posts.length === 0 ? (
        <EmptyState
          message={activeTab === 'posts' ? 'No posts yet' : 'No replies yet'}
          description={
            isOwnProfile
              ? activeTab === 'posts'
                ? 'Your posts will appear here.'
                : 'Posts you reply to will appear here.'
              : `@${profile.username} hasn't ${activeTab === 'posts' ? 'posted' : 'replied'} yet.`
          }
          icon={activeTab === 'posts' ? FileText : MessageSquare}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onPostDeleted={handlePostDeleted} />
          ))}
          {postsHasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                type="button"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
