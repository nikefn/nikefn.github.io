---
title: "My Favourite Chiptunes"
layout: post
tag: personal
date: 2026-01-12 19:25
creative: true
author: niklaseffenberger
description: "Favourite Chiptunes"
permalink: chiptunes
---

## My Favourite Chiptunes

Back in the days I did like a lot chiptune [tracker](https://en.wikipedia.org/wiki/Music_tracker) music. Below you find a selection of my favourite pieces.

Each file is only few kilobytes in size, yet fits a whole song. Have a listen :)..




<div id="ctp" class="ctp">
<div class="ctp-now" aria-live="polite" aria-atomic="true">
<span class="ctp-status">Press play to start</span>
<span class="ctp-title">&nbsp;</span>
</div>
<div class="ctp-controls">
<button class="ctp-prev" type="button" aria-label="Previous track">Prev</button>
<button class="ctp-play" type="button">Play</button>
<button class="ctp-next" type="button" aria-label="Next track">Next</button>
<input class="ctp-seek" type="range" min="0" max="0" value="0" step="1" aria-label="Seek">
<span class="ctp-time">0:00 / 0:00</span>
<input class="ctp-vol" type="range" min="0" max="100" value="80" aria-label="Volume">
</div>
<ol class="ctp-list" aria-label="Playlist"></ol>
</div>

<style>
.ctp { font-family:inherit; border:1px solid rgba(128,128,128,0.35); border-radius:8px; padding:1rem; margin:1.5rem 0; font-size:0.95rem; }
.ctp-now { display:flex; flex-direction:column; gap:0.15rem; margin-bottom:0.75rem; }
.ctp-status { opacity:0.6; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; }
.ctp-title { font-weight:600; overflow-wrap:anywhere; }
.ctp-controls { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem; }
.ctp-controls button { cursor:pointer; background:transparent; border:1px solid rgba(128,128,128,0.5); border-radius:5px; padding:0.3rem 0.7rem; color:inherit; font:inherit; }
.ctp-controls button:hover { border-color:currentColor; }
.ctp-seek { flex:1 1 140px; min-width:110px; }
.ctp-time { font-family:inherit; font-variant-numeric:tabular-nums; opacity:0.7; font-size:0.8rem; white-space:nowrap; }
.ctp-vol { width:80px; flex:0 0 auto; }
.ctp-list { list-style:none; margin:0; padding:0; max-height:300px; overflow-y:auto; border-top:1px solid rgba(128,128,128,0.25); counter-reset:ctp-counter; }
.ctp-item { margin:0; padding:0; border-radius:4px; }
.ctp-item button { display:block; width:100%; margin:0; padding:0.35rem 0.5rem; background:transparent; border:0; border-radius:4px; color:inherit; font:inherit; text-align:left; cursor:pointer; overflow-wrap:anywhere; }
.ctp-item button:before { content:counter(ctp-counter) ".  "; counter-increment:ctp-counter; opacity:0.45; }
.ctp-item:hover { background:rgba(128,128,128,0.12); }
.ctp-item.active { background:rgba(128,128,128,0.22); font-weight:600; }
.ctp-controls button:focus-visible, .ctp-controls input:focus-visible { outline:2px solid currentColor; outline-offset:2px; }
.ctp-item button:focus-visible { outline:2px solid currentColor; outline-offset:-2px; }
</style>

<script type="module">
import { ChiptuneJsPlayer } from '/assets/js/chiptune/chiptune3.js';
const BASE = '/assets/chiptunes/';
const playlist = [
  { file: 'chillin_with_kings.mod', title: "Chillin' with Kings" },
  { file: 'eargasm.mod', title: "Eargasm" },
  { file: 'norman_bates.mod', title: "Norman Bates" },
  { file: 'legends_never_die.mod', title: "Legends Never Die" },
  { file: 'class_for_ever.mod', title: "Class for Ever" },
  { file: 'annies_song.mod', title: "Annie's Song" },
  { file: 'a_weak_mind.mod', title: "A Weak Mind" },
  { file: 'the_brewery.mod', title: "The Brewery" },
  { file: 'fairlight_setup.mod', title: "Fairlight Setup" },
  { file: 'die_trachtenpuppe.mod', title: "Die Trachtenpuppe" },
  { file: 'premiere_cracktro.mod', title: "Premiere Cracktro" },
  { file: 'origin_cracktro.mod', title: "Origin Cracktro" },
  { file: '2000ad_cracktro_iv.mod', title: "2000AD Cracktro IV" },
  { file: '2000ad_cracktro_02.mod', title: "2000AD Cracktro II" },
  { file: 'class_installer_02.mod', title: "Class Installer 02" },
  { file: 'class_07.mod', title: "Class 07" },
  { file: 'class_toon_8.it', title: "Class Toon 8" },
  { file: 'sac_06.mod', title: "SAC 06" },
  { file: 'stamina.mod', title: "Stamina" }
];
const root = document.getElementById('ctp');
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
</script>

All of them are by incredible artist [maktone](https://modarchive.org/index.php?request=view_profile&query=69469) who wrote a lot of music for the release group [Fairlight](https://en.wikipedia.org/wiki/Fairlight_(group)). The tracks are free, and you may find his [archived site here](https://web.archive.org/web/20120910115924/http://sidchip.ath.cx/~maktone/).

Playback runs with [libopenmpt](https://lib.openmpt.org/libopenmpt/) and [chiptune.js](https://github.com/DrSnuggles/chiptune).

<div class="breaker"></div>
