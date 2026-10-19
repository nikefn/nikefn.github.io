// Playlist player for the chiptunes post. Markup: _includes/widgets/chiptune-player.html, tracks: _data/chiptunes.yml.
import { ChiptuneJsPlayer } from '/assets/js/chiptune/chiptune3.js';
const root = document.getElementById('ctp');
const BASE = root.dataset.base;
const playlist = JSON.parse(document.getElementById('ctp-playlist').textContent);
const statusEl = root.querySelector('.ctp-status');
const titleEl = root.querySelector('.ctp-title');
const playBtn = root.querySelector('.ctp-play');
const prevBtn = root.querySelector('.ctp-prev');
const nextBtn = root.querySelector('.ctp-next');
const seek = root.querySelector('.ctp-seek');
const timeEl = root.querySelector('.ctp-time');
const vol = root.querySelector('.ctp-vol');
const list = root.querySelector('.ctp-list');
const supported = typeof window.AudioContext === 'function' && typeof window.AudioWorkletNode === 'function';
let player = null;
let ready = false;
let broken = false;
let current = -1;
let playing = false;
let stopped = true;
let loading = false;
let duration = 0;
let seeking = false;
let pendingIndex = null;
let loadToken = 0;
let sent = 0;
let answered = 0;
let failures = 0;
let lastTime = '';
const itemBtns = [];
playlist.forEach(function (t, i) {
  const li = document.createElement('li');
  li.className = 'ctp-item';
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = t.title;
  b.addEventListener('click', function () { failures = 0; selectTrack(i, false); });
  li.appendChild(b);
  list.appendChild(li);
  itemBtns.push(b);
});
function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}
function setStatus(msg) { statusEl.textContent = msg; }
function setTime(pos) {
  const txt = fmt(pos) + ' / ' + fmt(duration);
  if (txt !== lastTime) { lastTime = txt; timeEl.textContent = txt; }
}
function setPlaying(p) {
  playing = p;
  playBtn.textContent = p ? 'Pause' : 'Play';
}
function highlight() {
  for (let i = 0; i < itemBtns.length; i++) {
    itemBtns[i].parentNode.classList.toggle('active', i === current);
    if (i === current) { itemBtns[i].setAttribute('aria-current', 'true'); } else { itemBtns[i].removeAttribute('aria-current'); }
  }
}
function engineFailed(msg) {
  broken = true;
  ready = false;
  loading = false;
  pendingIndex = null;
  setPlaying(false);
  setStatus(msg);
  if (player) { player.context.close().catch(function () {}); }
}
function trackFailed() {
  loading = false;
  failures++;
  if (failures >= playlist.length) {
    player.stop();
    stopped = true;
    setPlaying(false);
    setStatus('Could not play any track');
    return;
  }
  setStatus('Could not play this track, skipping');
  step(1, true);
}
function ensurePlayer() {
  if (broken) { return false; }
  if (player) {
    if (player.context.state === 'suspended') { player.context.resume().catch(function () {}); }
    return true;
  }
  if (!supported) { engineFailed('Audio playback is not supported in this browser'); return false; }
  setStatus('Loading engine');
  try {
    player = new ChiptuneJsPlayer({ repeatCount: 0 });
  } catch (e) {
    player = null;
    engineFailed('Could not start the audio engine');
    return false;
  }
  player.onInitialized(function () {
    if (broken) { return; }
    ready = true;
    player.setVol(vol.value / 100);
    setStatus('Ready');
    if (pendingIndex !== null) {
      const idx = pendingIndex;
      pendingIndex = null;
      loadTrack(idx, false);
    }
  });
  player.onMetadata(function (m) {
    answered++;
    if (answered !== sent) { return; }
    if (!m || !m.dur) { player.stop(); trackFailed(); return; }
    loading = false;
    stopped = false;
    failures = 0;
    duration = m.dur;
    seek.max = Math.max(1, Math.floor(duration));
    seek.value = 0;
    setTime(0);
    setStatus(playing ? 'Now playing' : 'Paused');
  });
  player.onProgress(function (p) {
    if (loading || seeking) { return; }
    const v = Math.floor(p.pos || 0);
    if (seek.valueAsNumber !== v) { seek.value = v; }
    setTime(p.pos);
  });
  player.onEnded(function () {
    if (loading || stopped || !playing) { return; }
    step(1, true);
  });
  player.onError(function (e) {
    const type = e && e.type;
    if (type === 'Init') { engineFailed('Could not start the audio engine'); return; }
    if (type === 'dur') { return; }
    if (type === 'ptr') {
      answered++;
      if (answered !== sent) { return; }
      trackFailed();
      return;
    }
    if (!loading && !stopped) { player.stop(); trackFailed(); }
  });
  return true;
}
function loadTrack(i, auto) {
  current = i;
  loadToken++;
  const token = loadToken;
  const t = playlist[i];
  loading = true;
  seeking = false;
  player.stop();
  titleEl.textContent = t.title;
  if (!auto) { setStatus('Loading'); setPlaying(true); }
  duration = 0;
  seek.max = 0;
  seek.value = 0;
  setTime(0);
  highlight();
  fetch(BASE + encodeURIComponent(t.file)).then(function (res) {
    if (!res.ok) { throw new Error('HTTP ' + res.status); }
    return res.arrayBuffer();
  }).then(function (ab) {
    if (token !== loadToken || broken) { return; }
    sent++;
    player.play(ab);
    if (!playing) { player.pause(); }
  }).catch(function () {
    if (token !== loadToken || broken) { return; }
    trackFailed();
  });
}
function selectTrack(i, auto) {
  if (!ensurePlayer()) { return; }
  if (!ready) { pendingIndex = i; return; }
  loadTrack(i, auto);
}
function step(d, auto) {
  const n = playlist.length;
  const base = current < 0 ? (d > 0 ? -1 : 0) : current;
  selectTrack((base + d + n) % n, auto);
}
function togglePlay() {
  if (!ensurePlayer()) { return; }
  if (!ready) { if (pendingIndex === null) { pendingIndex = current < 0 ? 0 : current; } return; }
  if (current < 0 || (stopped && !loading)) { failures = 0; loadTrack(current < 0 ? 0 : current, false); return; }
  if (playing) {
    player.pause();
    setPlaying(false);
    if (!loading) { setStatus('Paused'); }
  } else {
    player.unpause();
    setPlaying(true);
    if (!loading) { setStatus('Now playing'); }
  }
}
function commitSeek() {
  if (!seeking) { return; }
  seeking = false;
  if (player && ready && !loading && duration > 0) {
    const pos = parseFloat(seek.value);
    player.setPos(pos);
    setTime(pos);
  }
}
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', function () { failures = 0; step(1, false); });
prevBtn.addEventListener('click', function () { failures = 0; step(-1, false); });
seek.addEventListener('input', function () {
  if (loading || duration <= 0) { return; }
  seeking = true;
  setTime(parseFloat(seek.value));
});
seek.addEventListener('change', commitSeek);
seek.addEventListener('pointerup', commitSeek);
seek.addEventListener('pointercancel', commitSeek);
vol.addEventListener('input', function () {
  if (player && !broken) { player.setVol(vol.value / 100); }
});
