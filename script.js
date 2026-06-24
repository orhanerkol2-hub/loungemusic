const CHANNEL = {
  name: "LoungeMusic",
  handle: "@LoungeMusiq",
  channelUrl: "https://www.youtube.com/@LoungeMusiq",

  // Recommended simple live option:
  // 1) Find your YouTube Channel ID. It usually starts with "UC".
  // 2) Convert it to your Uploads Playlist ID by replacing "UC" with "UU".
  // Example: UCabc123 -> UUabc123
  uploadsPlaylistId: "",

  // Advanced live card option:
  // Add a restricted YouTube Data API v3 browser key and the Channel ID.
  // Restrict the key in Google Cloud to your GitHub Pages domain.
  youtubeApiKey: "",
  youtubeChannelId: "",

  maxVideos: 8
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const channelLinks = $$('[data-channel-link]');
const featuredVideo = $('#featuredVideo');
const videoGrid = $('#videoGrid');
const videoEmpty = $('#videoEmpty');
const year = $('#year');
const header = $('[data-scroll-header]');

year.textContent = new Date().getFullYear();
channelLinks.forEach((link) => {
  link.href = CHANNEL.channelUrl;
});

window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
}, { passive: true });

function formatDate(value) {
  if (!value) return 'New upload';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(value));
}

function sanitize(text = '') {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getUploadsEmbedUrl() {
  if (!CHANNEL.uploadsPlaylistId) return '';
  const params = new URLSearchParams({
    list: CHANNEL.uploadsPlaylistId,
    rel: '0',
    modestbranding: '1'
  });
  return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
}

function renderPlaylistFallback() {
  const embedUrl = getUploadsEmbedUrl();

  if (!embedUrl) {
    videoEmpty.hidden = false;
    videoGrid.innerHTML = `
      <article class="video-card">
        <div class="video-placeholder" style="min-height: 210px;">
          <div>
            <span>LM</span>
            <p>Add your Uploads Playlist ID or YouTube API key.</p>
          </div>
        </div>
        <div class="video-card-content">
          <h3>Live YouTube area prepared</h3>
          <p>Open script.js and enter your YouTube configuration.</p>
        </div>
      </article>
    `;
    return;
  }

  featuredVideo.innerHTML = `
    <iframe
      title="${sanitize(CHANNEL.name)} latest uploads"
      src="${embedUrl}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>
  `;

  videoEmpty.hidden = true;
  videoGrid.innerHTML = `
    <article class="video-card">
      <div class="video-card-content">
        <h3>Live uploads playlist connected</h3>
        <p>The featured player automatically shows your newest YouTube uploads.</p>
      </div>
    </article>
    <article class="video-card">
      <div class="video-card-content">
        <h3>Upgrade available</h3>
        <p>Add a YouTube API key to display individual video cards with thumbnails and dates.</p>
      </div>
    </article>
  `;
}

function renderFeaturedVideo(video) {
  featuredVideo.innerHTML = `
    <iframe
      title="${sanitize(video.title)}"
      src="https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>
  `;
}

function renderVideoCards(videos) {
  videoGrid.innerHTML = videos.map((video) => `
    <a class="video-card" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener" aria-label="Watch ${sanitize(video.title)} on YouTube">
      <img src="${video.thumbnail}" alt="${sanitize(video.title)} thumbnail" loading="lazy" />
      <div class="video-card-content">
        <h3>${sanitize(video.title)}</h3>
        <p>${formatDate(video.publishedAt)}</p>
      </div>
    </a>
  `).join('');
}

async function fetchVideosFromYouTubeApi() {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: CHANNEL.youtubeChannelId,
    maxResults: String(CHANNEL.maxVideos),
    order: 'date',
    type: 'video',
    key: CHANNEL.youtubeApiKey
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || [])
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
    }));
}

async function initVideos() {
  const hasApiConfig = CHANNEL.youtubeApiKey && CHANNEL.youtubeChannelId;

  if (!hasApiConfig) {
    renderPlaylistFallback();
    return;
  }

  try {
    const videos = await fetchVideosFromYouTubeApi();
    if (!videos.length) {
      renderPlaylistFallback();
      return;
    }

    renderFeaturedVideo(videos[0]);
    renderVideoCards(videos);
    videoEmpty.hidden = true;
  } catch (error) {
    console.warn(error);
    renderPlaylistFallback();
  }
}

initVideos();
