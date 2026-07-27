const API = '/api';

export async function processDocument({ sourceType, text, youtubeUrl, title, file }) {
  const formData = new FormData();
  formData.append('sourceType', sourceType);
  if (text) formData.append('text', text);
  if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
  if (title) formData.append('title', title);
  if (file) formData.append('file', file);

  const res = await fetch(`${API}/documents/process`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to process');
  return res.json();
}

export async function getDecks() {
  const res = await fetch(`${API}/decks`);
  return res.json();
}

export async function getDeck(id) {
  const res = await fetch(`${API}/decks/${id}`);
  return res.json();
}

export async function deleteDeck(id) {
  await fetch(`${API}/decks/${id}`, { method: 'DELETE' });
}

export async function getDeckStats(id) {
  const res = await fetch(`${API}/decks/${id}/stats`);
  return res.json();
}

export async function getDueCards(deckId) {
  const res = await fetch(`${API}/review/due/${deckId}`);
  return res.json();
}

export async function getAllCards(deckId) {
  const res = await fetch(`${API}/review/all/${deckId}`);
  return res.json();
}

export async function submitReview({ cardId, quality, isCorrect }) {
  const res = await fetch(`${API}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, quality, isCorrect }),
  });
  return res.json();
}

export async function saveSession({ deckId, cardsStudied, correctCount }) {
  const res = await fetch(`${API}/review/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deckId, cardsStudied, correctCount }),
  });
  return res.json();
}

export async function getGlobalStats() {
  const res = await fetch(`${API}/review/stats`);
  return res.json();
}

export async function analyzeWhiteboard(image) {
  const res = await fetch(`${API}/whiteboard/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed');
  return res.json();
}
