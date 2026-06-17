---
title: "My Favourite Chiptunes"
layout: post
tag: personal
date: 2026-04-30 19:25
creative: true
author: niklaseffenberger
summary: "Favourite Chiptunes"
permalink: chiptunes
---

## My Favourite Chiptunes

Back in the days I did like a lot chiptune [tracker](https://en.wikipedia.org/wiki/Music_tracker) music. Below you find a selection of my favourite tracks.

Each file is only few kilobytes in size, yet fits a whole song. Have a listen :)..


Playback runs on [libopenmpt](https://lib.openmpt.org/libopenmpt/) via [chiptune.js](https://github.com/DrSnuggles/chiptune), compiled to WebAssembly.

<div id="ctp" class="ctp">
<div class="ctp-now">
<span class="ctp-status">Press play to start</span>
<span class="ctp-title">&nbsp;</span>
</div>
<div class="ctp-controls">
<button class="ctp-prev" type="button">Prev</button>
<button class="ctp-play" type="button">Play</button>
<button class="ctp-next" type="button">Next</button>
<input class="ctp-seek" type="range" min="0" max="1000" value="0" aria-label="Seek">
<span class="ctp-time">0:00 / 0:00</span>
<input class="ctp-vol" type="range" min="0" max="100" value="80" aria-label="Volume">
</div>
<ol class="ctp-list"></ol>
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
.ctp-item { padding:0.35rem 0.5rem; cursor:pointer; border-radius:4px; overflow-wrap:anywhere; }
.ctp-item:before { content:counter(ctp-counter) ".  "; counter-increment:ctp-counter; opacity:0.45; }
.ctp-item:hover { background:rgba(128,128,128,0.12); }
.ctp-item.active { background:rgba(128,128,128,0.22); font-weight:600; }
</style>

<script type="module">
import { ChiptuneJsPlayer } from '/assets/js/chiptune/chiptune3.js';

const BASE = '/assets/chiptunes/';
const playlist = [
  { file: 'chillin_with_kings.mod', title: "chillin' with kings!" },
  { file: 'eargasm.mod', title: "eargasm" },
  { file: 'morning_has_broken.mod', title: "morning has broken" },
  { file: 'norman_bates.mod', title: "Norman Bates" },
  { file: 'legends_never_die.mod', title: "legends never die" },
  { file: 'class_for_ever.mod', title: "class for ever!" },
  { file: 'annies_song.mod', title: "annie's song" },
  { file: 'a_weak_mind.mod', title: "a weak mind" },
  { file: 'the_brewery.mod', title: "the brewery" },
  { file: 'boozeline_2006.mod', title: "boozeline 2006" },
  { file: 'fairlight_setup.mod', title: "fairlight setup" },
  { file: 'die_trachtenpuppe.mod', title: "Die Trachtenpuppe" },
  { file: 'premiere_cracktro.mod', title: "Premiere cracktro" },
  { file: 'origin_cracktro.mod', title: "origin cracktro" },
  { file: '2000ad_cracktro_iv.mod', title: "2000AD cracktro IV" },
  { file: '2000ad_cracktro_02.mod', title: "2000AD cracktro 02" },
  { file: 'class_installer_02.mod', title: "class installer 02" },
  { file: 'class07.mod', title: "class07" },
  { file: 'cls_toon_8.it', title: "cls toon 8" },
  { file: 'sac02.mod', title: "sac02" },
  { file: 'sac06.mod', title: "sac06!!!" },
  { file: 'stamina.mod', title: "stamina" }
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

let player = null;
let ready = false;
let current = -1;
let playing = false;
let duration = 0;
let seeking = false;
let pendingIndex = null;

playlist.forEach(function (t, i) {
  const li = document.createElement('li');
  li.className = 'ctp-item';
  li.textContent = t.title;
  li.addEventListener('click', function () { selectTrack(i); });
  list.appendChild(li);
});

function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

function setStatus(msg) { statusEl.textContent = msg; }

function highlight() {
  const items = list.children;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle('active', i === current);
  }
}

function ensurePlayer() {
  if (player) return;
  setStatus('Loading engine');
  player = new ChiptuneJsPlayer({ repeatCount: 0 });
  player.onInitialized(function () {
    ready = true;
    player.setVol(vol.value / 100);
    setStatus('Ready');
    if (pendingIndex !== null) {
      const idx = pendingIndex;
      pendingIndex = null;
      loadTrack(idx);
    }
  });
  player.onMetadata(function (m) {
    duration = (m && m.dur) ? m.dur : 0;
    seek.max = Math.max(1, Math.floor(duration));
  });
  player.onProgress(function (p) {
    if (!seeking) { seek.value = Math.floor(p.pos || 0); }
    timeEl.textContent = fmt(p.pos) + ' / ' + fmt(duration);
  });
  player.onEnded(function () { next(); });
  player.onError(function () { setStatus('Could not play this track, skipping'); next(); });
}

function loadTrack(i) {
  current = i;
  const t = playlist[i];
  titleEl.textContent = t.title;
  setStatus('Now playing');
  seek.value = 0;
  highlight();
  player.load(BASE + encodeURIComponent(t.file));
  playing = true;
  playBtn.textContent = 'Pause';
}

function selectTrack(i) {
  ensurePlayer();
  if (!ready) { pendingIndex = i; return; }
  loadTrack(i);
}

function togglePlay() {
  ensurePlayer();
  if (!ready) { pendingIndex = (current < 0 ? 0 : current); return; }
  if (current < 0) { loadTrack(0); return; }
  player.togglePause();
  playing = !playing;
  playBtn.textContent = playing ? 'Pause' : 'Play';
}

function next() { selectTrack((current + 1) % playlist.length); }
function prev() { selectTrack((current - 1 + playlist.length) % playlist.length); }

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);
seek.addEventListener('input', function () {
  seeking = true;
  timeEl.textContent = fmt(seek.value) + ' / ' + fmt(duration);
});
seek.addEventListener('change', function () {
  if (player && ready) { player.setPos(parseFloat(seek.value)); }
  seeking = false;
});
vol.addEventListener('input', function () {
  if (player) { player.setVol(vol.value / 100); }
});
</script>

All of them are by incredible artist [maktone](https://modarchive.org/index.php?request=view_profile&query=69469) who wrote a lot of music for the release group [Fairlight](https://en.wikipedia.org/wiki/Fairlight_(group)). The tracks are free, and you may find his [archived site here](https://web.archive.org/web/20120910115924/http://sidchip.ath.cx/~maktone/).


<div class="breaker"></div>
