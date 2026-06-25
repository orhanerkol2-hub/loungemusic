document.getElementById('year').textContent = new Date().getFullYear();

const CHANNEL = {
  handle: '@loungemusiq',
  url: 'https://www.youtube.com/@loungemusiq',
  videosUrl: 'https://www.youtube.com/@loungemusiq/videos',
  channelId: '',
  uploadsPlaylistId: '',
  maxVideos: 6
};

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const header = $('[data-header]');
const heroBg = $('.hero-bg');
const videoGrid = $('#videoGrid');
const videoEmbed = $('#videoEmbed');
const videoIntro = $('#videoIntro');
const videoFeature = $('#videoFeature');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (header) header.classList.toggle('is-scrolled', y > 18);
  if (heroBg) heroBg.style.transform = `scale(1.04) translateY(${Math.min(y * 0.06, 36)}px)`;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el) => revealObserver.observe(el));

function esc(val = '') {
  return String(val).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function embedVideo(videoId) {
  videoIntro.hidden = true;
  videoEmbed.hidden = false;
  videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1" title="Lounge Musiq session" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
}

function playVideo(videoId) {
  embedVideo(videoId);
  $$('.video-card').forEach((c) => c.classList.remove('is-playing'));
  const active = $(`.video-card[data-video-id="${videoId}"]`);
  if (active) active.classList.add('is-playing');
  if (videoFeature) videoFeature.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      const res = await fetch(proxyUrl, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.length > 80) return text;
    } catch { /* next */ }
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
    /itemprop="channelId" content="(UC[^"]+)"/
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) return m[1];
  }
  return '';
}

function renderVideos(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const entries = Array.from(xml.getElementsByTagName('entry')).slice(0, CHANNEL.maxVideos);
  if (!entries.length) throw new Error('No videos found');

  const firstIdNode = entries[0].getElementsByTagName('yt:videoId')[0] || entries[0].getElementsByTagName('videoId')[0];
  const firstId = firstIdNode ? firstIdNode.textContent : '';
  if (firstId) embedVideo(firstId);

  const cards = entries.map((entry) => {
    const idNode = entry.getElementsByTagName('yt:videoId')[0] || entry.getElementsByTagName('videoId')[0];
    const titleNode = entry.getElementsByTagName('title')[0];
    const pubNode = entry.getElementsByTagName('published')[0];
    const id = idNode ? idNode.textContent : '';
    const title = titleNode ? titleNode.textContent : 'Lounge Musiq Session';
    const published = pubNode ? pubNode.textContent : '';
    if (!id) return '';

    return `
      <div class="video-card reveal is-visible${id === firstId ? ' is-playing' : ''}" data-video-id="${id}" role="button" tabindex="0" aria-label="Play ${esc(title)}">
        <div class="video-thumb">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(title)}" loading="lazy" />
          <span class="play-icon" aria-hidden="true">&#9654;</span>
        </div>
        <div class="video-info">
          <h3>${esc(title)}</h3>
          <p class="video-date">${fmtDate(published)}</p>
        </div>
      </div>`;
  }).join('');

  videoGrid.innerHTML = cards;

  videoGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.video-card');
    if (card && card.dataset.videoId) playVideo(card.dataset.videoId);
  });
  videoGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.video-card');
      if (card && card.dataset.videoId) { e.preventDefault(); playVideo(card.dataset.videoId); }
    }
  });
}

function renderFallback() {
  if (CHANNEL.uploadsPlaylistId) {
    videoIntro.hidden = true;
    videoEmbed.hidden = false;
    videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/videoseries?list=${CHANNEL.uploadsPlaylistId}&rel=0&modestbranding=1" title="Lounge Musiq uploads" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }

  videoGrid.innerHTML = `
    <a class="video-card" href="${CHANNEL.videosUrl}" target="_blank" rel="noopener">
      <div class="video-info">
        <h3>Watch the latest Lounge Musiq visuals</h3>
        <p class="video-date">Premium lounge visuals, sunset ambience and deep chill sessions.</p>
      </div>
    </a>
    <a class="video-card" href="${CHANNEL.url}" target="_blank" rel="noopener">
      <div class="video-info">
        <h3>Subscribe to the label channel</h3>
        <p class="video-date">Lounge Musiq — Premium Lounge Label</p>
      </div>
    </a>`;
}

async function loadVideos() {
  try {
    const channelId = await resolveChannelId();
    if (!channelId) throw new Error('Channel ID not resolved');
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xmlText = await fetchWithProxies(feedUrl);
    if (!xmlText || !xmlText.includes('<entry')) throw new Error('Feed unavailable');
    renderVideos(xmlText);
  } catch (err) {
    console.warn('Video load fallback:', err);
    renderFallback();
  }
}

loadVideos();
