const API = '/api';

function getToken() {
  return localStorage.getItem('omoikane-token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(username, email, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('omoikane-token', data.token);
  return data;
}

export async function login(login, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('omoikane-token', data.token);
  return data;
}

export async function getMe() {
  const res = await fetch(`${API}/auth/me`, { headers: { ...authHeaders() } });
  return res.json();
}

export function logout() {
  localStorage.removeItem('omoikane-token');
}

export async function processDocument({ sourceType, text, youtubeUrl, title, file }) {
  const formData = new FormData();
  formData.append('sourceType', sourceType);
  if (text) formData.append('text', text);
  if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
  if (title) formData.append('title', title);
  if (file) formData.append('file', file);

  const res = await fetch(`${API}/documents/process`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to process');
  return res.json();
}

export async function getDecks() {
  const res = await fetch(`${API}/decks`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getDeck(id) {
  const res = await fetch(`${API}/decks/${id}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function deleteDeck(id) {
  await fetch(`${API}/decks/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getDeckStats(id) {
  const res = await fetch(`${API}/decks/${id}/stats`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getDueCards(deckId) {
  const res = await fetch(`${API}/review/due/${deckId}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getAllCards(deckId) {
  const res = await fetch(`${API}/review/all/${deckId}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function submitReview({ cardId, quality, isCorrect }) {
  const res = await fetch(`${API}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ cardId, quality, isCorrect }),
  });
  return res.json();
}

export async function saveSession({ deckId, cardsStudied, correctCount }) {
  const res = await fetch(`${API}/review/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ deckId, cardsStudied, correctCount }),
  });
  return res.json();
}

export async function getGlobalStats() {
  const res = await fetch(`${API}/review/stats`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function analyzeWhiteboard(image) {
  const res = await fetch(`${API}/whiteboard/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed');
  return res.json();
}

export async function getNotes() {
  const res = await fetch(`${API}/notes`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function createNote(title, body) {
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, body }),
  });
  return res.json();
}

export async function updateNote(id, title, body) {
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, body }),
  });
  return res.json();
}

export async function deleteNote(id) {
  await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getBoards() {
  const res = await fetch(`${API}/boards`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getBoard(id) {
  const res = await fetch(`${API}/boards/${id}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function createBoard(name, canvas_data) {
  const res = await fetch(`${API}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, canvas_data }),
  });
  return res.json();
}

export async function updateBoard(id, name, canvas_data) {
  const res = await fetch(`${API}/boards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, canvas_data }),
  });
  return res.json();
}

export async function forgotPassword(login) {
  const res = await fetch(`${API}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login }),
  });
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function changeUsername(newUsername, password) {
  const res = await fetch(`${API}/auth/change-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newUsername, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function deleteBoard(id) {
  await fetch(`${API}/boards/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getAccountStats() {
  const res = await fetch(`${API}/auth/stats`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function updateCard(id, data) {
  const res = await fetch(`${API}/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteCard(id) {
  await fetch(`${API}/cards/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getTags() {
  const res = await fetch(`${API}/tags`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function createTag(name, color) {
  const res = await fetch(`${API}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, color }),
  });
  return res.json();
}

export async function deleteTag(id) {
  await fetch(`${API}/tags/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getDeckTags(deckId) {
  const res = await fetch(`${API}/tags/deck/${deckId}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function addTagToDeck(deckId, tagId) {
  await fetch(`${API}/tags/deck/${deckId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ tagId }),
  });
}

export async function removeTagFromDeck(deckId, tagId) {
  await fetch(`${API}/tags/deck/${deckId}/${tagId}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function searchAll(query) {
  const res = await fetch(`${API}/decks/search?q=${encodeURIComponent(query)}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function exportDeck(deckId) {
  const res = await fetch(`${API}/ie/export/${deckId}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function importDeck(data) {
  const res = await fetch(`${API}/ie/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createShareLink(deckId) {
  const res = await fetch(`${API}/share/${deckId}`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function getSharedDeck(token) {
  const res = await fetch(`${API}/share/${token}`);
  return res.json();
}

export async function getStudyHistory() {
  const res = await fetch(`${API}/review/history`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getGroups() {
  const res = await fetch(`${API}/social/groups`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function createGroup(name) {
  const res = await fetch(`${API}/social/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function joinGroup(inviteCode) {
  const res = await fetch(`${API}/social/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ inviteCode }),
  });
  return res.json();
}

export async function getGroup(id) {
  const res = await fetch(`${API}/social/groups/${id}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function leaveGroup(id) {
  await fetch(`${API}/social/groups/${id}/leave`, { method: 'POST', headers: { ...authHeaders() } });
}

export async function deleteGroup(id) {
  await fetch(`${API}/social/groups/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}

export async function getMarketplace(query, sort) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (sort) params.set('sort', sort);
  const res = await fetch(`${API}/social/marketplace?${params}`);
  return res.json();
}

export async function publishDeck(deckId, description) {
  const res = await fetch(`${API}/social/marketplace/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ deckId, description }),
  });
  return res.json();
}

export async function downloadFromMarketplace(id) {
  const res = await fetch(`${API}/social/marketplace/download/${id}`, { method: 'POST', headers: { ...authHeaders() } });
  return res.json();
}

export async function getProfile(userId) {
  const res = await fetch(`${API}/social/profile/${userId}`);
  return res.json();
}

export async function updateProfile(bio, avatar_color, is_public) {
  const res = await fetch(`${API}/social/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ bio, avatar_color, is_public }),
  });
  return res.json();
}

export async function getLeaderboard(type) {
  const res = await fetch(`${API}/social/leaderboard?type=${type || 'xp'}`);
  return res.json();
}

export async function getWeakCards() {
  const res = await fetch(`${API}/recommendations/weak-cards`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getSuggestions() {
  const res = await fetch(`${API}/recommendations/suggestions`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getDeckTheme(deckId) {
  const res = await fetch(`${API}/themes/${deckId}`);
  return res.json();
}

export async function updateDeckTheme(deckId, theme) {
  const res = await fetch(`${API}/themes/${deckId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(theme),
  });
  return res.json();
}

export async function getRecommendations() {
  const res = await fetch(`${API}/recommendations/suggestions`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getGamificationProfile() {
  const res = await fetch(`${API}/gamification/profile`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function getDailyChallenges() {
  const res = await fetch(`${API}/gamification/challenges`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function awardXP(amount, reason) {
  const res = await fetch(`${API}/gamification/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ amount, reason }),
  });
  return res.json();
}
