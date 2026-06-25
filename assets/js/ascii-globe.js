(function () {
  function start() {
    var root = document.getElementById("ascii-globe");
    if (!root) return;
    var pre = root.querySelector(".ascii-globe__canvas");
    if (!pre) return;

    var RAW_MASK = [
      "................................................",
      "........#######...####.........#################",
      "..##############.#####...#######################",
      ".###############.###...#########################",
      "......###########.....##########################",
      "..###############.....##########################",
      ".....############.....##########################",
      "......############....##########################",
      ".........#######....############################",
      "...........#####..##############.####.#######...",
      ".............###..###############.#....######...",
      "..............#####....#########......########..",
      "..............#######.##########.......#######..",
      "...............######..#########........#####...",
      "...............######...#######..#.....######...",
      "................#####...######...##...########..",
      ".................###.....####..........#######..",
      ".................##........................#...#",
      ".................#.............................#",
      ".................#..............................",
      "................................................",
      "################################################",
      "################################################",
      "################################################"
    ];
    var MASK_ROWS = RAW_MASK.length;
    var MASK_COLS = 48;
    var MASK = RAW_MASK.map(function (r) {
      while (r.length < MASK_COLS) r += ".";
      return r.slice(0, MASK_COLS);
    });

    function isLand(latRad, lonRad) {
      var latDeg = latRad * 180 / Math.PI;
      var lonDeg = lonRad * 180 / Math.PI;
      var row = Math.floor((90 - latDeg) / 180 * MASK_ROWS);
      var col = Math.floor((lonDeg + 180) / 360 * MASK_COLS);
      if (row < 0) row = 0; else if (row >= MASK_ROWS) row = MASK_ROWS - 1;
      col = ((col % MASK_COLS) + MASK_COLS) % MASK_COLS;
      return MASK[row].charAt(col) === "#";
    }

    var RAMP_OCEAN = ".\u00b7:+o";
    var RAMP_LAND = "+oxX#%@$";
    var MARK_CHAR = "\u25cf";

    var LX = -0.40, LY = 0.52, LZ = 0.76;
    var Ln = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
    LX /= Ln; LY /= Ln; LZ /= Ln;

    var ST_LAT = 48.7758 * Math.PI / 180;
    var ST_LON = 9.1829 * Math.PI / 180;
    var stx = Math.cos(ST_LAT) * Math.sin(ST_LON);
    var sty = Math.sin(ST_LAT);
    var stz = Math.cos(ST_LAT) * Math.cos(ST_LON);

    var COLS = 0, ROWS = 0;
    var Rx = 0, Ry = 0;
    var cx = 0, cy = 0;
    var cellW = 4.8, cellH = 8;
    var pxPerRad = 100;

    var FALLBACK_ASPECT = 1.7;
    var COLS_MIN = 40, COLS_MAX = 130;
    var ROWS_MIN = 24, ROWS_MAX = 110;
    var DIAMETER_CAP = 460;

    function measureCell() {
      var probe = document.createElement("pre");
      probe.className = "ascii-globe__canvas";
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;" +
        "margin:0;padding:0;border:0;width:auto;max-width:none;" +
        "white-space:pre;display:block;";
      var N = 100, L = 20;
      var rowStr = new Array(N + 1).join("M");
      probe.textContent = rowStr;
      root.appendChild(probe);
      var r1 = probe.getBoundingClientRect();
      var w = r1.width / N;
      var h1 = r1.height;
      var many = rowStr;
      for (var i = 1; i < L; i++) many += "\n" + rowStr;
      probe.textContent = many;
      var hL = probe.getBoundingClientRect().height;
      root.removeChild(probe);

      var advance = (hL - h1) / (L - 1);
      if (!isFinite(w) || w <= 0) w = 4.8;
      if (!isFinite(advance) || advance <= 0) advance = w * FALLBACK_ASPECT;
      var aspect = advance / w;
      if (!isFinite(aspect) || aspect < 0.5 || aspect > 4) {
        advance = w * FALLBACK_ASPECT;
      }
      return { w: w, h: advance };
    }

    function layout() {
      var cell = measureCell();
      cellW = cell.w;
      cellH = cell.h;

      var avail = root.clientWidth || 600;
      var discPx = Math.min(avail, DIAMETER_CAP);
      if (discPx < 200) discPx = Math.min(avail, 200);

      COLS = Math.round(discPx / cellW);
      if (COLS < COLS_MIN) COLS = COLS_MIN;
      if (COLS > COLS_MAX) COLS = COLS_MAX;

      Rx = (COLS - 2) / 2;
      Ry = Rx * cellW / cellH;

      ROWS = Math.round(2 * Ry) + 2;
      if (ROWS < ROWS_MIN) ROWS = ROWS_MIN;
      if (ROWS > ROWS_MAX) ROWS = ROWS_MAX;
      Ry = (ROWS - 2) / 2;

      cx = (COLS - 1) / 2;
      cy = (ROWS - 1) / 2;

      pxPerRad = Math.max(1, Rx * cellW);
    }

    function colorOcean(lit) {
      return "hsl(205,62%," + (16 + lit * 46).toFixed(0) + "%)";
    }
    function colorLand(lit) {
      return "hsl(124,42%," + (20 + lit * 44).toFixed(0) + "%)";
    }

    function render() {
      var cosS = Math.cos(spin), sinS = Math.sin(spin);
      var cosT = Math.cos(tilt), sinT = Math.sin(tilt);

      var msx = stx * cosS + stz * sinS;
      var msz = -stx * sinS + stz * cosS;
      var msy = sty;
      var vXm = msx;
      var vYm = msy * cosT - msz * sinT;
      var vZm = msy * sinT + msz * cosT;
      var markVisible = vZm > 0.04;
      var mCol = Math.round(cx + vXm * Rx);
      var mRow = Math.round(cy - vYm * Ry);

      var out = [];
      for (var sy = 0; sy < ROWS; sy++) {
        var ny = (sy - cy) / Ry;
        var rowHtml = "";
        var buf = "";
        var curColor = null;

        for (var sx = 0; sx < COLS; sx++) {
          var ch, color;
          if (markVisible && sx === mCol && sy === mRow) {
            ch = MARK_CHAR;
            color = "#ff3b30";
          } else {
            var nx = (sx - cx) / Rx;
            var r2 = nx * nx + ny * ny;
            if (r2 > 1) {
              ch = " ";
              color = null;
            } else {
              var vz = Math.sqrt(1 - r2);
              var vx = nx;
              var vy = -ny;

              var lit = vx * LX + vy * LY + vz * LZ;
              if (lit < 0) lit = 0;
              lit = 0.1 + 0.9 * lit;

              var ax = vx;
              var ay = vy * cosT + vz * sinT;
              var az = -vy * sinT + vz * cosT;
              var gx = ax * cosS - az * sinS;
              var gz = ax * sinS + az * cosS;
              var gy = ay;
              var lat = Math.asin(gy < -1 ? -1 : (gy > 1 ? 1 : gy));
              var lon = Math.atan2(gx, gz);

              if (isLand(lat, lon)) {
                ch = RAMP_LAND.charAt(Math.min(RAMP_LAND.length - 1, Math.floor(lit * RAMP_LAND.length)));
                color = colorLand(lit);
              } else {
                ch = RAMP_OCEAN.charAt(Math.min(RAMP_OCEAN.length - 1, Math.floor(lit * RAMP_OCEAN.length)));
                color = colorOcean(lit);
              }
            }
          }
          if (color !== curColor) {
            if (buf !== "") {
              rowHtml += curColor === null ? buf : "<span style=\"color:" + curColor + "\">" + buf + "</span>";
            }
            buf = "";
            curColor = color;
          }
          buf += ch;
        }
        if (buf !== "") {
          rowHtml += curColor === null ? buf : "<span style=\"color:" + curColor + "\">" + buf + "</span>";
        }
        out.push(rowHtml);
      }
      pre.innerHTML = out.join("\n");
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var AUTO_SPEED = reduce ? 0.0 : 0.22;
    var spin = 0;
    var tilt = -0.38;
    var TILT_MIN = -1.2, TILT_MAX = 1.2;
    var vel = AUTO_SPEED;
    var dragging = false;
    var needsRender = true;

    var last = 0, acc = 0;
    var FRAME = 1000 / 30;

    function tick(ts) {
      if (!last) last = ts;
      var dt = (ts - last) / 1000;
      last = ts;
      if (dt > 0.1) dt = 0.1;

      if (!dragging) {
        if (Math.abs(vel) > 1e-4) {
          spin += vel * dt;
          needsRender = true;
        }
        var k = 1 - Math.exp(-dt / 0.45);
        vel += (AUTO_SPEED - vel) * k;
        if (Math.abs(vel - AUTO_SPEED) < 1e-4) vel = AUTO_SPEED;
      }

      acc += dt * 1000;
      if (needsRender && acc >= FRAME) {
        acc = 0;
        needsRender = false;
        render();
      }
      requestAnimationFrame(tick);
    }

    var INERTIA_CAP = 4.0;
    var lastX = 0, lastY = 0, lastT = 0;
    var activePointer = null;

    function now(e) {
      if (e && e.timeStamp) return e.timeStamp;
      if (window.performance && performance.now) return performance.now();
      return Date.now();
    }

    function clampTilt() {
      if (tilt < TILT_MIN) tilt = TILT_MIN;
      else if (tilt > TILT_MAX) tilt = TILT_MAX;
    }

    function beginDrag(x, y, e) {
      dragging = true;
      vel = 0;
      lastX = x;
      lastY = y;
      lastT = now(e);
      pre.classList.add("is-dragging");
    }

    function moveDrag(x, y, e) {
      if (!dragging) return;
      var dx = x - lastX;
      var dy = y - lastY;
      var dSpin = dx / pxPerRad;
      spin += dSpin;
      tilt += dy / pxPerRad;
      clampTilt();

      var t = now(e);
      var dtm = t - lastT;
      if (dtm > 0) vel = dSpin / (dtm / 1000);

      lastX = x;
      lastY = y;
      lastT = t;
      needsRender = true;
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      pre.classList.remove("is-dragging");
      if (vel > INERTIA_CAP) vel = INERTIA_CAP;
      else if (vel < -INERTIA_CAP) vel = -INERTIA_CAP;
    }

    if (window.PointerEvent) {
      pre.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        activePointer = e.pointerId;
        if (pre.setPointerCapture) {
          try { pre.setPointerCapture(e.pointerId); } catch (err) {}
        }
        beginDrag(e.clientX, e.clientY, e);
        e.preventDefault();
      });
      pre.addEventListener("pointermove", function (e) {
        if (activePointer !== e.pointerId) return;
        moveDrag(e.clientX, e.clientY, e);
        e.preventDefault();
      });
      var pointerEnd = function (e) {
        if (activePointer !== e.pointerId) return;
        activePointer = null;
        if (pre.releasePointerCapture) {
          try { pre.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        endDrag();
      };
      pre.addEventListener("pointerup", pointerEnd);
      pre.addEventListener("pointercancel", pointerEnd);
    } else {
      pre.addEventListener("mousedown", function (e) {
        if (e.button != null && e.button !== 0) return;
        beginDrag(e.clientX, e.clientY, e);
        e.preventDefault();
      });
      window.addEventListener("mousemove", function (e) {
        moveDrag(e.clientX, e.clientY, e);
      });
      window.addEventListener("mouseup", endDrag);

      pre.addEventListener("touchstart", function (e) {
        var t = e.changedTouches[0];
        if (!t) return;
        beginDrag(t.clientX, t.clientY, e);
        e.preventDefault();
      }, { passive: false });
      pre.addEventListener("touchmove", function (e) {
        var t = e.changedTouches[0];
        if (!t) return;
        moveDrag(t.clientX, t.clientY, e);
        e.preventDefault();
      }, { passive: false });
      pre.addEventListener("touchend", endDrag);
      pre.addEventListener("touchcancel", endDrag);
    }

    var resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        layout();
        needsRender = true;
        render();
      }, 150);
    }

    layout();
    render();
    requestAnimationFrame(tick);

    if (window.ResizeObserver) {
      new ResizeObserver(onResize).observe(root);
    } else {
      window.addEventListener("resize", onResize);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
