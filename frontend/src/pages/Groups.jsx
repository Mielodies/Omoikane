import { useState, useEffect } from 'react';
import { Users, Plus, LogIn, LogOut, Trash2, Copy, ArrowLeft } from 'lucide-react';
import { getGroups, createGroup, joinGroup, getGroup, leaveGroup, deleteGroup } from '../api.js';
import { useToast } from '../components/Toast.jsx';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const result = await createGroup(createName.trim());
      setGroups([...groups, { id: result.id, name: result.name, invite_code: result.invite_code, member_count: 1 }]);
      setCreateName('');
      toast('Group created');
    } catch {
      toast('Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const result = await joinGroup(joinCode.trim());
      setGroups([...groups, { id: result.group_id, name: result.name, member_count: result.member_count }]);
      setJoinCode('');
      toast('Joined group');
    } catch {
      toast('Invalid invite code', 'error');
    } finally {
      setJoining(false);
    }
  }

  async function openGroup(id) {
    try {
      const group = await getGroup(id);
      setSelectedGroup(group);
    } catch {
      toast('Failed to load group', 'error');
    }
  }

  async function handleLeave(id) {
    await leaveGroup(id);
    setGroups(groups.filter((g) => g.id !== id));
    setSelectedGroup(null);
    toast('Left group');
  }

  async function handleDelete(id) {
    await deleteGroup(id);
    setGroups(groups.filter((g) => g.id !== id));
    setSelectedGroup(null);
    toast('Group deleted');
  }

  function copyInviteCode(code) {
    navigator.clipboard.writeText(code);
    toast('Invite code copied');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div>
        <button
          onClick={() => setSelectedGroup(null)}
          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </button>
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-grape-400" />
              {selectedGroup.name}
            </h1>
            <div className="flex gap-2">
              {selectedGroup.is_owner ? (
                <button
                  onClick={() => handleDelete(selectedGroup.id)}
                  className="btn-danger text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Group
                </button>
              ) : (
                <button
                  onClick={() => handleLeave(selectedGroup.id)}
                  className="btn-danger text-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Leave Group
                </button>
              )}
            </div>
          </div>
          {selectedGroup.invite_code && (
            <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Invite Code</p>
                <p className="font-mono text-lg font-bold text-grape-400">{selectedGroup.invite_code}</p>
              </div>
              <button
                onClick={() => copyInviteCode(selectedGroup.invite_code)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="space-y-3">
          {(selectedGroup.members || []).map((member) => (
            <div key={member.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: member.avatar_color || '#7c3aed' }}
                >
                  {member.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{member.username}</p>
                  <p className="text-xs text-gray-400">Level {member.level || 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-grape-400">{member.xp || 0} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
        <Users className="w-6 h-6 text-grape-400" />
        Study Groups
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-grape-400" />
            <h2 className="text-lg font-semibold">Create Group</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
              {creating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-5 h-5 text-grape-400" />
            <h2 className="text-lg font-semibold">Join Group</h2>
          </div>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" disabled={joining} className="btn-primary w-full flex items-center justify-center gap-2">
              {joining ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <LogIn className="w-4 h-4" />}
              Join
            </button>
          </form>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No groups yet</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => openGroup(group.id)}
              className="card w-full text-left hover:border-grape-500/30 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-grape-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-grape-400" />
                </div>
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-gray-400">{group.member_count} members</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
