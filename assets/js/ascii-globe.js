(function () {
  function start() {
    var root = document.getElementById("ascii-globe");
    if (!root) return;
    var pre = root.querySelector(".ascii-globe__canvas");
    if (!pre) return;

    // Equirectangular land/ocean mask: rows north->south (lat +90..-90),
    // cols west->east (lon -180..+180). '#' = land, anything else = ocean.
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

    // Fixed view-space light (upper-left, slightly toward viewer).
    var LX = -0.40, LY = 0.52, LZ = 0.76;
    var Ln = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
    LX /= Ln; LY /= Ln; LZ /= Ln;

    var TILT = -0.38; // axial tilt: tips north pole toward viewer
    var cosT = Math.cos(TILT), sinT = Math.sin(TILT);

    // Stuttgart
    var ST_LAT = 48.7758 * Math.PI / 180;
    var ST_LON = 9.1829 * Math.PI / 180;
    var stx = Math.cos(ST_LAT) * Math.sin(ST_LON);
    var sty = Math.sin(ST_LAT);
    var stz = Math.cos(ST_LAT) * Math.cos(ST_LON);

    var COLS = 0, ROWS = 0, Rcols = 0, cx = 0, cy = 0, aspect = 1.9;

    function measureCell() {
      var probe = document.createElement("pre");
      probe.className = "ascii-globe__canvas";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.left = "-9999px";
      probe.textContent = "MMMMMMMMMM\nM\nM\nM\nM\nM";
      root.appendChild(probe);
      var w = probe.getBoundingClientRect().width / 10;
      var h = probe.getBoundingClientRect().height / 6;
      root.removeChild(probe);
      return { w: w || 6.6, h: h || 6.6 };
    }

    function layout() {
      var cell = measureCell();
      aspect = cell.h / cell.w;
      var avail = root.clientWidth || 600;
      var cols = Math.floor(avail / cell.w);
      if (cols < 36) cols = 36;
      if (cols > 92) cols = 92;
      COLS = cols;
      Rcols = (COLS - 2) / 2;
      cx = (COLS - 1) / 2;
      ROWS = Math.round((2 * Rcols) / aspect) + 1;
      cy = (ROWS - 1) / 2;
    }

    function colorOcean(lit) {
      return "hsl(205,62%," + (16 + lit * 46).toFixed(0) + "%)";
    }
    function colorLand(lit) {
      return "hsl(124,42%," + (20 + lit * 44).toFixed(0) + "%)";
    }

    function render(spin) {
      var cosS = Math.cos(spin), sinS = Math.sin(spin);

      // Stuttgart projected into view space (spin then tilt).
      var msx = stx * cosS + stz * sinS;
      var msz = -stx * sinS + stz * cosS;
      var msy = sty;
      var vXm = msx;
      var vYm = msy * cosT - msz * sinT;
      var vZm = msy * sinT + msz * cosT;
      var markVisible = vZm > 0.04;
      var mCol = Math.round(cx + vXm * Rcols);
      var mRow = Math.round(cy - (vYm * Rcols) / aspect);

      var out = [];
      for (var sy = 0; sy < ROWS; sy++) {
        var yUp = -((sy - cy) * aspect) / Rcols;
        var rowHtml = "";
        var buf = "";
        var curColor = null;

        function flush() {
          if (buf === "") return;
          if (curColor === null) rowHtml += buf;
          else rowHtml += "<span style=\"color:" + curColor + "\">" + buf + "</span>";
          buf = "";
        }

        for (var sx = 0; sx < COLS; sx++) {
          var ch, color;
          var isMark = (markVisible && sx === mCol && sy === mRow);
          if (isMark) {
            ch = MARK_CHAR;
            color = "#ff3b30";
          } else {
            var vx = (sx - cx) / Rcols;
            var r2 = vx * vx + yUp * yUp;
            if (r2 > 1) {
              ch = " ";
              color = null;
            } else {
              var vz = Math.sqrt(1 - r2);
              var lit = vx * LX + yUp * LY + vz * LZ;
              lit = lit < 0 ? 0 : lit;
              lit = 0.1 + 0.9 * lit;

              // view -> world: undo tilt, then undo spin
              var ax = vx;
              var ay = yUp * cosT + vz * sinT;
              var az = -yUp * sinT + vz * cosT;
              var gx = ax * cosS - az * sinS;
              var gz = ax * sinS + az * cosS;
              var gy = ay;
              var lat = Math.asin(Math.max(-1, Math.min(1, gy)));
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
          if (color !== curColor) { flush(); curColor = color; }
          buf += ch;
        }
        flush();
        out.push(rowHtml);
      }
      pre.innerHTML = out.join("\n");
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SPEED = reduce ? 0.03 : 0.22; // rad/s
    var spin = 0;
    var last = 0;
    var acc = 0;
    var FRAME = 1000 / 22;

    function tick(ts) {
      if (!last) last = ts;
      var dt = ts - last;
      last = ts;
      acc += dt;
      spin += (dt / 1000) * SPEED;
      if (acc >= FRAME) {
        acc = 0;
        render(spin);
      }
      requestAnimationFrame(tick);
    }

    var resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        layout();
        render(spin);
      }, 150);
    }

    layout();
    render(spin);
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
