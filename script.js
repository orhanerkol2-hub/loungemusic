document.getElementById('year').textContent = new Date().getFullYear();

const CHANNEL = {
  handle: '@loungemusiq',
  url: 'https://www.youtube.com/@loungemusiq',
  videosUrl: 'https://www.youtube.com/@loungemusiq/videos',
  channelId: 'UCp-SzyWEpfsc6rZwG5LDEOw',
  maxVideos: 6,
  fallbackVideos: [
    { id: 'c3XNr_0GQKs', title: 'Lounge Musiq Session' },
    { id: 'zYd0tP2RivE', title: 'Lounge Musiq Session' },
    { id: 'tdKCGbM-cNo', title: 'Lounge Musiq Session' }
  ]
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
  if (header) header.classList.toggle('is-scrolled', y > 40);
  if (heroBg) heroBg.style.transform = `scale(1.06) translateY(${Math.min(y * 0.05, 30)}px)`;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
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
  videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1" title="Lounge Musiq session" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

function playVideo(videoId) {
  embedVideo(videoId);
  $$('.video-card').forEach((c) => c.classList.remove('is-playing'));
  const active = $(`.video-card[data-video-id="${videoId}"]`);
  if (active) active.classList.add('is-playing');
  if (videoFeature) videoFeature.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function bindGrid() {
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

function proxied(url) {
  return [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
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

function renderVideoCards(videos, firstId) {
  const cards = videos.map((v) => `
    <div class="video-card reveal is-visible${v.id === firstId ? ' is-playing' : ''}" data-video-id="${v.id}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}">
      <div class="video-thumb">
        <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${esc(v.title)}" loading="lazy" />
        <span class="play-sm" aria-hidden="true">&#9654;</span>
      </div>
      <div class="video-meta">
        <h3>${esc(v.title)}</h3>
        ${v.date ? `<p class="date">${fmtDate(v.date)}</p>` : ''}
      </div>
    </div>`).join('');

  videoGrid.innerHTML = cards;
  bindGrid();
}

function renderVideos(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const entries = Array.from(xml.getElementsByTagName('entry')).slice(0, CHANNEL.maxVideos);
  if (!entries.length) throw new Error('No videos found');

  const videos = entries.map((entry) => {
    const idNode = entry.getElementsByTagName('yt:videoId')[0] || entry.getElementsByTagName('videoId')[0];
    const titleNode = entry.getElementsByTagName('title')[0];
    const pubNode = entry.getElementsByTagName('published')[0];
    return {
      id: idNode ? idNode.textContent : '',
      title: titleNode ? titleNode.textContent : 'Lounge Musiq Session',
      date: pubNode ? pubNode.textContent : ''
    };
  }).filter((v) => v.id);

  if (!videos.length) throw new Error('No valid videos');

  embedVideo(videos[0].id);
  renderVideoCards(videos, videos[0].id);
}

function renderFallback() {
  const videos = CHANNEL.fallbackVideos;
  if (!videos.length) return;

  embedVideo(videos[0].id);
  renderVideoCards(videos, videos[0].id);
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
    console.warn('Using fallback videos:', err.message);
    renderFallback();
  }
}

loadVideos();
