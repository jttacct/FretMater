import React, { useState } from 'react';
import { MilestonePost, LeaderboardUser } from '../types/guitar';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import {
  Users,
  Trophy,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Award,
  Flame,
  Send,
  Play,
} from 'lucide-react';

export const SocialFeedView: React.FC = () => {
  const [posts, setPosts] = useState<MilestonePost[]>(storage.getPosts());
  const [leaderboard] = useState<LeaderboardUser[]>(storage.getLeaderboard());
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [filter, setFilter] = useState<'feed' | 'leaderboard'>('feed');

  const handleLike = (id: string) => {
    storage.likePost(id);
    setPosts(storage.getPosts());
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: MilestonePost = {
      id: `post-${Date.now()}`,
      author: 'You (Guitar Virtuoso)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      badge: 'Pro Shredder ⚡',
      title: newPostTitle || 'Daily Practice Completed!',
      content: newPostContent,
      timestamp: 'Just now',
      likes: 1,
      commentsCount: 0,
      exerciseScore: { accuracy: 96, streak: 14, xp: 420 },
      hasAudioSample: true,
    };

    storage.addPost(newPost);
    setPosts(storage.getPosts());
    setNewPostTitle('');
    setNewPostContent('');
  };

  return (
    <div className="space-y-6">
      {/* Subnav Toggle */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'feed'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community Milestone Feed</span>
          </button>
          <button
            onClick={() => setFilter('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Global Leaderboards</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline pr-2">
          Collaborative Musician Network
        </span>
      </div>

      {filter === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Post Composer Card */}
            <form
              onSubmit={handleCreatePost}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl"
            >
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Share Practice Milestone or Loop</span>
              </h3>
              <input
                type="text"
                placeholder="Milestone title (e.g. Cleared Pentatonic Level 4 at 130 BPM)"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 mb-2 focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Share your breakthrough, practice takeaways, or questions with fellow guitarists..."
                rows={2}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-slate-500">
                  Includes your current 14-day streak badge automatically
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Milestone</span>
                </button>
              </div>
            </form>

            {/* Posts List */}
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700/80 transition-all"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{post.author}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                          {post.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{post.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-base font-bold text-slate-100">{post.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{post.content}</p>
                </div>

                {/* Score Pill & Audio Player */}
                {post.exerciseScore && (
                  <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">
                      {post.exerciseScore.accuracy}% Accuracy
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-orange-400 flex items-center gap-1 font-bold">
                      <Flame className="w-3.5 h-3.5" /> {post.exerciseScore.streak} Day Streak
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400 font-bold">+{post.exerciseScore.xp} XP</span>
                  </div>
                )}

                {/* Actions: Likes & Comments */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
                      <span>{post.likes} Applauds</span>
                    </button>
                    <div className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </div>
                  </div>
                  <button
                    onClick={() => soundEngine.playClick(true)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px] font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Practice With This</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar: Top Streaks & Mini Leaderboard */}
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Weekly Honor Roll</span>
              </h3>
              <div className="space-y-3">
                {leaderboard.slice(0, 4).map((user) => (
                  <div key={user.rank} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-amber-400 w-4">#{user.rank}</span>
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-white block truncate max-w-[110px]">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{user.badge}</span>
                      </div>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">
                      {user.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/20 rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-bold text-amber-300 mb-1">Collaborative Challenge</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join 1,420 guitarists this week mastering the <strong>D Dorian Funk Jam</strong>! Pluck in real time with the audio pitch detector to claim your badge.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Full Leaderboard View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Global FretMaster Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-400">
                Rankings calculated in real-time from verified audio pitch detection accuracy, drills, and streaks.
              </p>
            </div>
            <span className="text-xs font-mono bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full border border-amber-500/20">
              Updated Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 w-12 text-center">Rank</th>
                  <th className="pb-3">Musician</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Specialty</th>
                  <th className="pb-3">Daily Streak</th>
                  <th className="pb-3">Pitch Accuracy</th>
                  <th className="pb-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {leaderboard.map((user) => (
                  <tr
                    key={user.rank}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      user.name.includes('You') ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <td className="py-3.5 text-center font-bold text-amber-400 text-sm">
                      #{user.rank}
                    </td>
                    <td className="py-3.5 font-sans">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <span className="font-bold text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.tier === 'Virtuoso'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-3.5 font-sans text-slate-400">{user.badge}</td>
                    <td className="py-3.5 text-orange-400 font-bold">
                      🔥 {user.streakDays} days
                    </td>
                    <td className="py-3.5 text-emerald-400 font-bold">
                      {user.accuracy}%
                    </td>
                    <td className="py-3.5 text-right font-bold text-amber-300 text-sm">
                      {user.xp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
