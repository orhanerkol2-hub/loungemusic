document.getElementById('year').textContent = new Date().getFullYear();

const CHANNEL = {
  handle: '@loungemusiq',
  url: 'https://www.youtube.com/@loungemusiq',
  videosUrl: 'https://www.youtube.com/@loungemusiq/videos',
  channelId: 'UCp-SzyWEpfsc6rZwG5LDEOw',
  maxVideos: 8,
  fallbackVideos: [
    { id: 'c3XNr_0GQKs', title: 'Sunset Lounge Session', mood: 'sunset' },
    { id: 'zYd0tP2RivE', title: 'Deep Lounge Vibes', mood: 'lounge' },
    { id: 'tdKCGbM-cNo', title: 'Late Night Chill', mood: 'night' }
  ]
};

const MOOD_KEYWORDS = {
  sunset: ['sunset', 'golden', 'warm', 'beach', 'ocean', 'summer', 'tropical', 'paradise', 'terrace', 'ibiza', 'sunrise', 'dusk'],
  night:  ['night', 'midnight', 'nocturnal', 'dark', 'late', 'dubai', 'city', 'neon', 'after', 'evening', 'moon'],
  focus:  ['focus', 'minimal', 'work', 'study', 'calm', 'still', 'ambient', 'pure', 'clear', 'drone', 'background'],
  lounge: ['lounge', 'deep', 'bass', 'chill', 'session', 'groove', 'jazz', 'smooth', 'relax', 'spa', 'hotel']
};

const MOOD_META = {
  sunset: { label: 'Sunset',     desc: 'golden hour · warm atmosphere',    color: '#e8956d' },
  lounge: { label: 'Deep Lounge',desc: 'deep bass · slow swell',            color: '#2a9d8f' },
  night:  { label: 'Late Night', desc: 'after-midnight calm',               color: '#252575' },
  focus:  { label: 'Focus',      desc: 'minimal · focused',                 color: '#1a6b8a' }
};

const MOOD_CYCLE = ['sunset', 'lounge', 'night', 'focus', 'sunset', 'lounge', 'night', 'focus'];

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
  try { return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

function detectMood(title, index) {
  const t = (title || '').toLowerCase();
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) return mood;
  }
  return MOOD_CYCLE[index % MOOD_CYCLE.length];
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

function buildCard(v, index) {
  const mood = v.mood || detectMood(v.title, index);
  const meta = MOOD_META[mood] || MOOD_META.lounge;
  const num = String(index + 1).padStart(2, '0');

  return `
    <div class="video-card mood-${mood} reveal is-visible" data-video-id="${v.id}" data-mood="${mood}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}">
      <div class="card-visual">
        <img class="card-thumb" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" aria-hidden="true" loading="lazy" />
        <span class="mood-tag">${esc(meta.label)}</span>
        <div class="card-play-btn" aria-hidden="true">&#9654;</div>
        <span class="card-num">${num}</span>
      </div>
      <div class="card-info">
        <h3>${esc(v.title)}</h3>
        <p class="card-mood-desc">${meta.desc}${v.date ? ' · ' + fmtDate(v.date) : ''}</p>
      </div>
    </div>`;
}

function bindGridEvents() {
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

function bindFilters() {
  const filters = $('#moodFilters');
  if (!filters) return;
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-filter');
    if (!btn) return;
    $$('.mood-filter').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');

    const filter = btn.dataset.filter;
    $$('.video-card').forEach(card => {
      if (filter === 'all' || card.dataset.mood === filter) {
        card.hidden = false;
      } else {
        card.hidden = true;
      }
    });
  });
}

function renderVideoCards(videos) {
  const cards = videos.map((v, i) => buildCard(v, i)).join('');
  videoGrid.innerHTML = cards;
  bindGridEvents();
  bindFilters();
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
  }).filter(v => v.id);

  if (!videos.length) throw new Error('No valid videos');

  embedVideo(videos[0].id);
  renderVideoCards(videos);
}

function renderFallback() {
  embedVideo(CHANNEL.fallbackVideos[0].id);
  renderVideoCards(CHANNEL.fallbackVideos);
}

async function loadVideos() {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL.channelId}`;
    const xmlText = await fetchWithProxies(feedUrl);
    if (!xmlText || !xmlText.includes('<entry')) throw new Error('Feed unavailable');
    renderVideos(xmlText);
  } catch (err) {
    console.warn('Using fallback videos:', err.message);
    renderFallback();
  }
}

loadVideos();
