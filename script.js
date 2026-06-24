document.getElementById('year').textContent = new Date().getFullYear();

const CHANNEL = {
  name: 'Lounge Musiq',
  handle: '@loungemusiq',
  url: 'https://www.youtube.com/@loungemusiq',
  videosUrl: 'https://www.youtube.com/@loungemusiq/videos',
  channelId: '',
  uploadsPlaylistId: '',
  maxVideos: 6
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const header = $('[data-header]');
const cursorGlow = $('[data-cursor-glow]');
const heroBg = $('.hero-bg');
const videoGrid = $('#videoGrid');
const videoEmbed = $('#videoEmbed');
const videoIntro = $('#videoIntro');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (header) header.classList.toggle('is-scrolled', y > 18);
  if (heroBg) heroBg.style.transform = `scale(1.035) translateY(${Math.min(y * 0.08, 42)}px)`;
}, { passive: true });

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

$$('.reveal').forEach((item) => revealObserver.observe(item));

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[char]));
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function proxied(url) {
  return [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  ];
}

async function fetchWithProxies(url) {
  for (const proxyUrl of proxied(url)) {
    try {
      const response = await fetch(proxyUrl, { cache: 'no-store' });
      if (!response.ok) continue;
      const text = await response.text();
      if (text && text.length > 80) return text;
    } catch { /* Try next proxy */ }
  }
  return null;
}

async function resolveChannelId() {
  if (CHANNEL.channelId) return CHANNEL.channelId;

  const html = await fetchWithProxies(CHANNEL.url);
  if (!html) return '';

  const patterns = [
    /"channelId":"(UC[^"]+)"/,
    /"externalId":"(UC[^"]+)"/,
    /itemprop="channelId" content="(UC[^"]+)"/,
    /<meta itemprop="channelId" content="(UC[^"]+)"/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

function embedVideo(videoId, autoplay = false) {
  videoIntro.hidden = true;
  videoEmbed.hidden = false;
  const ap = autoplay ? '&autoplay=1' : '';
  videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0${ap}" title="Lounge Musiq" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

function playVideo(videoId, card) {
  $$('.video-card.is-playing', videoGrid).forEach((c) => c.classList.remove('is-playing'));
  if (card) card.classList.add('is-playing');
  embedVideo(videoId, true);
  const section = document.getElementById('videos');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderVideos(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const entries = Array.from(xml.getElementsByTagName('entry')).slice(0, CHANNEL.maxVideos);
  if (!entries.length) throw new Error('No videos found');

  const cards = entries.map((entry, index) => {
    const idNode = entry.getElementsByTagName('yt:videoId')[0] || entry.getElementsByTagName('videoId')[0];
    const titleNode = entry.getElementsByTagName('title')[0];
    const publishedNode = entry.getElementsByTagName('published')[0];
    const id = idNode ? idNode.textContent : '';
    const title = titleNode ? titleNode.textContent : 'Lounge Musiq Session';
    const published = publishedNode ? publishedNode.textContent : '';
    if (!id) return '';

    return `
      <div class="video-card reveal is-visible${index === 0 ? ' is-playing' : ''}" data-video-id="${id}" role="button" tabindex="0" title="${esc(title)}">
        <div class="video-thumb">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(title)}" loading="lazy" />
          <span class="play" aria-hidden="true">▶</span>
        </div>
        <div class="video-info">
          <h3>${esc(title)}</h3>
          <p class="date">${fmtDate(published)}</p>
        </div>
      </div>`;
  }).join('');

  videoGrid.hidden = false;
  videoGrid.innerHTML = cards;

  $$('.video-card[data-video-id]', videoGrid).forEach((card) => {
    card.addEventListener('click', () => playVideo(card.dataset.videoId, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playVideo(card.dataset.videoId, card);
      }
    });
  });

  const firstIdNode = entries[0].getElementsByTagName('yt:videoId')[0] || entries[0].getElementsByTagName('videoId')[0];
  const firstId = firstIdNode ? firstIdNode.textContent : '';
  if (firstId) embedVideo(firstId);
}

function renderFallback() {
  if (CHANNEL.uploadsPlaylistId) {
    videoIntro.hidden = true;
    videoEmbed.hidden = false;
    videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/videoseries?list=${CHANNEL.uploadsPlaylistId}&rel=0" title="Lounge Musiq uploads" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  videoGrid.innerHTML = `
    <a class="video-card" href="${CHANNEL.videosUrl}" target="_blank" rel="noopener">
      <div class="video-info">
        <h3>Watch the latest Lounge Musiq visuals</h3>
        <p class="date">Premium lounge visuals, sunset ambience and deep chill sessions.</p>
      </div>
    </a>
    <a class="video-card" href="${CHANNEL.url}" target="_blank" rel="noopener">
      <div class="video-info">
        <h3>Subscribe to the label channel</h3>
        <p class="date">Lounge Musiq — Premium Lounge Label</p>
      </div>
    </a>`;
}

async function loadVideos() {
  try {
    const channelId = await resolveChannelId();
    if (!channelId) throw new Error('Channel ID could not be resolved');

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xmlText = await fetchWithProxies(feedUrl);
    if (!xmlText || !xmlText.includes('<entry')) throw new Error('Feed not available');

    renderVideos(xmlText);
  } catch (error) {
    console.warn(error);
    renderFallback();
  }
}

loadVideos();
