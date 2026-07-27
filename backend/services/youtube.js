export async function extractYouTubeTranscript(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  const transcriptUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetch(
    `https://yt.lemnoslife.com/videos?part=snippet&id=${videoId}`
  );

  if (!res.ok) {
    const directRes = await fetch(
      `https://noembed.com/embed?url=${transcriptUrl}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return `${data.title || 'YouTube Video'}\n\n(YouTube transcript extraction requires the video to have captions enabled. Please paste the transcript text manually for best results.)`;
    }
  }

  const data = await res.json();
  const snippet = data?.items?.[0]?.snippet;
  if (snippet) {
    return `${snippet.title || 'YouTube Video'}\n\n${snippet.description || 'No description available.'}`;
  }

  throw new Error('Could not extract YouTube content. Please paste the transcript text manually.');
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
