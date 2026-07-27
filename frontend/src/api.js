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

export async function deleteBoard(id) {
  await fetch(`${API}/boards/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
}
