// Quote of the hour for the quotebank post. Markup: _includes/widgets/quote-of-the-hour.html, data: github.com/nikefn/quotebank.
// Like the repo's tools/qotd.py, the pick hashes the UTC time, so every visitor sees the same quote in the same hour.
// "New quote" draws a random one, optionally from one category.
(function () {
  var root = document.getElementById('qoth');
  if (!root) return;
  var textEl = root.querySelector('.qoth-text');
  var byEl = root.querySelector('.qoth-by');
  var drawBtn = root.querySelector('.qoth-draw');
  var catSel = root.querySelector('.qoth-cat');
  var CHECKED = ['verified', 'paraphrase', 'reattributed'];
  var pool = [];
  var current = null;
  var hourly = true;

  function hourPick() {
    var key = new Date().toISOString().slice(0, 13); // e.g. 2026-10-19T14
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)).then(function (buf) {
      var v = new DataView(buf);
      var n = BigInt(v.getUint32(0)) * 4294967296n + BigInt(v.getUint32(4));
      return pool[Number(n % BigInt(pool.length))];
    });
  }

  function render(e) {
    current = e;
    textEl.textContent = '"' + e.quote.replace(/ \/ /g, ', ') + '"';
    byEl.textContent = '- ' + (e.author || 'Unknown');
  }

  function draw() {
    var list = pool.filter(function (e) {
      return (!catSel.value || e.category === catSel.value) && e !== current;
    });
    if (!list.length) return;
    hourly = false;
    render(list[Math.floor(Math.random() * list.length)]);
  }

  function showHour() { hourPick().then(render); }

  // Refresh at the top of each hour, unless the visitor has drawn their own.
  function tick() {
    var now = new Date();
    setTimeout(function () {
      if (hourly) showHour();
      tick();
    }, 3600000 - (now.getUTCMinutes() * 60000 + now.getUTCSeconds() * 1000 + now.getUTCMilliseconds()) + 50);
  }

  drawBtn.addEventListener('click', draw);
  catSel.addEventListener('change', draw);

  fetch(root.dataset.src)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      pool = data.entries
        .filter(function (e) { return e.language === 'en' && CHECKED.indexOf(e.attribution) !== -1; })
        .sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var cats = {};
      pool.forEach(function (e) { cats[e.category] = true; });
      Object.keys(cats).sort().forEach(function (c) {
        var o = document.createElement('option');
        o.value = o.textContent = c;
        catSel.appendChild(o);
      });
      drawBtn.disabled = false;
      showHour();
      tick();
    })
    .catch(function () {
      textEl.textContent = 'The quote bank could not be reached right now.';
    });
})();
