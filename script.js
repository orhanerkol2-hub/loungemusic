const CHANNEL = {
  name: "Lounge Musiq",
  handle: "@loungemusiq",
  channelUrl: "https://www.youtube.com/@loungemusiq",

  // Simple live option:
  // YouTube Channel ID starts with UC. The uploads playlist starts with UU.
  // Example: UCabc123 -> UUabc123
  uploadsPlaylistId: "",

  // Advanced live cards option:
  // Add a restricted YouTube Data API v3 browser key and the Channel ID.
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
const header = $('[data-header]');
const cursorGlow = $('[data-cursor-glow]');
const heroBg = $('.hero-bg');
const moodTitle = $('[data-now-title]');
const moodCopy = $('[data-now-copy]');

year.textContent = new Date().getFullYear();
channelLinks.forEach((link) => { link.href = CHANNEL.channelUrl; });

const moodContent = {
  sunset: {
    title: 'Sunset Lounge Session',
    copy: 'Warm keys, soft percussion, deep bass and smooth ocean-night atmosphere.'
  },
  night: {
    title: 'Dubai Night Chill',
    copy: 'A darker late-night mood with elegant bass, skyline ambience and premium hotel-lounge energy.'
  },
  focus: {
    title: 'Luxury Focus Flow',
    copy: 'Minimal distraction, soft rhythmic motion and calm background energy for work and reading.'
  }
};

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 18);
  if (heroBg) heroBg.style.transform = `scale(1.035) translateY(${Math.min(y * 0.08, 42)}px)`;
}, { passive: true });

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });

$('[data-theme-toggle]')?.addEventListener('click', (event) => {
  document.body.classList.toggle('warm-mode');
  event.currentTarget.textContent = document.body.classList.contains('warm-mode') ? '☀' : '☾';
});

$$('[data-mood]').forEach((button) => {
  button.addEventListener('click', () => {
    const mood = moodContent[button.dataset.mood];
    if (!mood) return;
    $$('[data-mood]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    moodTitle.textContent = mood.title;
    moodCopy.textContent = mood.copy;
  });
});

$$('[data-tilt-card]').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 7;
    const rotateY = (x - 0.5) * 7;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
    card.style.removeProperty('--mx');
    card.style.removeProperty('--my');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

$$('.reveal').forEach((item) => revealObserver.observe(item));

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
        <div class="video-card-content">
          <h3>Live YouTube area prepared</h3>
          <p>Add your Uploads Playlist ID in script.js to activate the newest-video player.</p>
        </div>
      </article>
      <article class="video-card">
        <div class="video-card-content">
          <h3>Direct channel link active</h3>
          <p>All YouTube buttons already point to ${sanitize(CHANNEL.handle)}.</p>
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
  if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

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
