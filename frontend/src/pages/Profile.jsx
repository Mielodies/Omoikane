import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Award, Layers, BarChart3, Edit3, Save } from 'lucide-react';
import { getProfile, updateProfile, getMe } from '../api.js';
import { useToast } from '../components/Toast.jsx';

const ACHIEVEMENTS = [
  { id: 'first_review', label: 'First Review', icon: '🎯' },
  { id: 'streak_7', label: '7-Day Streak', icon: '🔥' },
  { id: 'streak_30', label: '30-Day Streak', icon: '💫' },
  { id: 'cards_100', label: '100 Cards Studied', icon: '📚' },
  { id: 'cards_1000', label: '1000 Cards Studied', icon: '🏆' },
  { id: 'deck_creator', label: 'Deck Creator', icon: '🛠️' },
  { id: 'group_member', label: 'Group Member', icon: '👥' },
  { id: 'marketplace', label: 'Marketplace Seller', icon: '🏪' },
];

export default function Profile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState('#7c3aed');
  const [isPublic, setIsPublic] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([getProfile(userId), getMe()])
      .then(([p, me]) => {
        setProfile(p);
        setIsOwn(me.user?.id === Number(userId));
        setBio(p.bio || '');
        setAvatarColor(p.avatar_color || '#7c3aed');
        setIsPublic(p.is_public !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave() {
    try {
      const result = await updateProfile(bio, avatarColor, isPublic);
      setProfile({ ...profile, bio, avatar_color: avatarColor, is_public: isPublic });
      setEditing(false);
      toast('Profile updated');
    } catch {
      toast('Failed to update profile', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return <div className="card text-center py-16 text-gray-400">Profile not found</div>;
  }

  return (
    <div>
      <div className="card mb-6">
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ backgroundColor: profile.avatar_color || '#7c3aed' }}
          >
            {(profile.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-gray-400 hover:text-grape-400 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Level {profile.level || 1}
              </span>
              <span>{profile.xp || 0} XP</span>
              {profile.title && (
                <span className="bg-grape-500/20 text-grape-400 px-2 py-0.5 rounded-full text-xs">
                  {profile.title}
                </span>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  placeholder="Write something about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field h-20 resize-none"
                  maxLength={300}
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400">Avatar Color:</label>
                  <input
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  Public profile
                </label>
                <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-300">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-grape-400" />
          <h2 className="text-lg font-semibold">Achievements</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = (profile.achievements || []).includes(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-xl p-3 text-center transition-all ${
                  unlocked
                    ? 'bg-grape-500/20 border border-grape-500/30'
                    : 'bg-gray-800/40 border border-gray-800 opacity-40'
                }`}
                title={a.label}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-[10px] text-gray-400 leading-tight">{a.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {(profile.decks || []).length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-grape-400" />
            <h2 className="text-lg font-semibold">Public Decks</h2>
          </div>
          <div className="space-y-3">
            {profile.decks.map((deck) => (
              <div key={deck.id} className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{deck.title}</p>
                  <p className="text-xs text-gray-400">{deck.card_count} cards</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.stats && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{profile.stats.total_cards_studied || 0}</p>
              <p className="text-xs text-gray-500">Cards Studied</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{profile.stats.sessions || 0}</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{profile.stats.decks || 0}</p>
              <p className="text-xs text-gray-500">Decks</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{profile.stats.current_streak || 0}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
