---
title: "My Favourite Chiptunes"
layout: post
tag: personal
date: 2026-04-30 19:25
creative: true
author: niklaseffenberger
summary: "A little in-browser player for my favourite tracker tunes"
permalink: chiptunes
---

## My Favourite Chiptunes

I have a soft spot for tracker music. Long before streaming, demosceners, keygen crews and bedroom musicians squeezed entire songs into a few kilobytes by stitching together short samples and pattern data inside *tracker* files (`.mod`, `.xm`, `.it`, `.s3m`, `.mo3`). The tunes below are some of my favourites, collected over the years from open scene archives.

What I love about these formats: nothing here is a recording. Each tune is more like a tiny score that gets *performed* live the moment you press play. The little player below does exactly that, right in your browser, using [libopenmpt](https://lib.openmpt.org/libopenmpt/) compiled to WebAssembly. No audio files are streamed; your machine plays the module note by note.

I have kept every track under its original filename on purpose. In the scene the filename is the credit, it tells you who made the tune or which group and release it came from, so renaming them felt wrong.

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
.ctp { border:1px solid rgba(128,128,128,0.35); border-radius:8px; padding:1rem; margin:1.5rem 0; font-size:0.95rem; }
.ctp-now { display:flex; flex-direction:column; gap:0.15rem; margin-bottom:0.75rem; }
.ctp-status { opacity:0.6; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; }
.ctp-title { font-weight:600; overflow-wrap:anywhere; }
.ctp-controls { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem; }
.ctp-controls button { cursor:pointer; background:transparent; border:1px solid rgba(128,128,128,0.5); border-radius:5px; padding:0.3rem 0.7rem; color:inherit; font:inherit; }
.ctp-controls button:hover { border-color:currentColor; }
.ctp-seek { flex:1 1 140px; min-width:110px; }
.ctp-time { font-variant-numeric:tabular-nums; opacity:0.7; font-size:0.8rem; white-space:nowrap; }
.ctp-vol { width:80px; flex:0 0 auto; }
.ctp-list { list-style:none; margin:0; padding:0; max-height:300px; overflow-y:auto; border-top:1px solid rgba(128,128,128,0.25); }
.ctp-item { padding:0.35rem 0.5rem; cursor:pointer; border-radius:4px; overflow-wrap:anywhere; }
.ctp-item:before { content:counter(ctp-counter) ".  "; counter-increment:ctp-counter; opacity:0.45; }
.ctp-list { counter-reset:ctp-counter; }
.ctp-item:hover { background:rgba(128,128,128,0.12); }
.ctp-item.active { background:rgba(128,128,128,0.22); font-weight:600; }
</style>

<script type="module">
import { ChiptuneJsPlayer } from '/assets/js/chiptune/chiptune3.js';

const BASE = '/assets/chiptunes/';
const playlist = [
  { file: 'dtn-super_mario_brothers.xm', title: 'dtn-super_mario_brothers.xm' },
  { file: 'traven-super_mario_cave.xm', title: 'traven-super_mario_cave.xm' },
  { file: 'traven-tetris_gb_ingame.xm', title: 'traven-tetris_gb_ingame.xm' },
  { file: 'nagz-tetris_groowe_4k.xm', title: 'nagz-tetris_groowe_4k.xm' },
  { file: 'dalezy-donkey_kong1.mod', title: 'dalezy-donkey_kong1.mod' },
  { file: 'QWAK_INTRO.mod', title: 'QWAK_INTRO.MOD' },
  { file: '4mat-l-f-f.it', title: '4mat-l-f-f [0-17].it' },
  { file: 'reed-a_synthetic_device.xm', title: 'reed-a_synthetic_device.xm' },
  { file: 'datachild-flexibility.it', title: 'datachild-flexibility [0-5].it' },
  { file: 'MEXS-Kissing_the_clouds.xm', title: 'MEXS-Kissing_the_clouds.xm' },
  { file: 'velvet_a_move-lupo.xm', title: 'velvet&a_move-lupo.xm' },
  { file: 'autumn_rain.xm', title: 'autumn_rain.xm' },
  { file: 'believe_in_yourself.mod', title: 'believe_in_yourself.mod' },
  { file: 'betrayal.mod', title: 'betrayal.mod' },
  { file: 'MOMENT_OF_CLARITY.mod', title: 'MOMENT_OF_CLARITY.MOD' },
  { file: 'charabia.mod', title: 'charabia.mod' },
  { file: 'springai.mod', title: 'springai.mod' },
  { file: 'southern_fried.mod', title: 'southern_fried.mod' },
  { file: 'cyb-city.s3m', title: 'cyb-city.s3m' },
  { file: 'pepperoni-encounter.mod', title: 'pepperoni-encounter.mod' },
  { file: 'BLiZZARD-1Click_DVD_Copy.xm', title: 'BLiZZARD - 1Click DVD Copy 4.2.9.2kg.XM' },
  { file: 'CiM-Nero_6kg.xm', title: 'CiM - Nero 6kg.xm' },
  { file: 'AGAiN-MusicMatch_Jukebox.mo3', title: 'AGAiN - MusicMatch Jukebox Pluscrkkg.mo3' },
  { file: 'VIEMS-Jag_e_vilse.xm', title: 'VIEMS - Jag e vilse [start].xm' },
  { file: 'dlz-msta.xm', title: 'dlz-msta.xm' }
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

<div class="breaker"></div>
