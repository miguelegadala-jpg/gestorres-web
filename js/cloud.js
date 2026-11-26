/* ==========================================================================
   Nube de puntos arquitectónica
   Torres en 3D dibujadas como puntos (losas, aristas y parteluces), con un
   desfase cromático sutil en azules de la marca. La escena "se construye"
   piso a piso al cargar y responde suavemente al puntero.
   ========================================================================== */
(function () {
  "use strict";

  function createCloud(canvas, opts) {
    var ctx = canvas.getContext("2d", { alpha: true });
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var dprCap = coarse ? 1.5 : 1.75;

    // ---- Escena: torres [cx, cz, ancho, fondo, pisos, retranqueo] ----
    var towers = [
      [0, 0, 6, 6, 22, 16],     // torre principal con retranqueo
      [-9.5, 3, 7, 5, 12, 0],
      [8.5, -4, 5, 7, 16, 12],
      [3, 10, 15, 5, 4, 0],     // podio bajo
      [-15, -7, 5, 5, 8, 0],
      [15, 7, 6, 4, 6, 0]
    ];
    var FH = 1; // altura de piso
    var density = coarse ? 0.62 : 1;

    var pts = [];   // x,y,z por punto
    var meta = [];  // retardo de entrada

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function push(x, y, z, hNorm) {
      pts.push(x, y, z);
      meta.push(0.15 + hNorm * 1.0 + Math.random() * 0.35);
    }
    function line(x1, y1, z1, x2, y2, z2, step, hMax) {
      var dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var n = Math.max(1, Math.round(len / (step / density)));
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        var y = y1 + dy * t;
        push(x1 + dx * t, y, z1 + dz * t, Math.min(1, y / hMax));
      }
    }
    function rect(cx, cz, w, d, y, step, hMax) {
      var x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      line(x0, y, z0, x1, y, z0, step, hMax);
      line(x1, y, z0, x1, y, z1, step, hMax);
      line(x1, y, z1, x0, y, z1, step, hMax);
      line(x0, y, z1, x0, y, z0, step, hMax);
    }

    var hMax = 24;
    towers.forEach(function (t) {
      var cx = t[0], cz = t[1], w = t[2], d = t[3], floors = t[4], setback = t[5];
      for (var f = 0; f <= floors; f++) {
        var y = f * FH;
        var sw = w, sd = d;
        if (setback && f >= setback) { sw = w * 0.72; sd = d * 0.72; }
        rect(cx, cz, sw, sd, y, 0.32, hMax);
        // losa interior (sensación de entrepiso)
        if (f % 4 === 0 && f > 0) rect(cx, cz, sw * 0.6, sd * 0.6, y, 0.55, hMax);
      }
      // aristas verticales y parteluces de fachada
      function verticals(sw, sd, yA, yB) {
        var x0 = cx - sw / 2, x1 = cx + sw / 2, z0 = cz - sd / 2, z1 = cz + sd / 2;
        [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(function (c) {
          line(c[0], yA, c[1], c[0], yB, c[1], 0.2, hMax);
        });
        for (var x = x0 + 1; x < x1 - 0.2; x += 1) {
          line(x, yA, z0, x, yB, z0, 0.42, hMax);
          line(x, yA, z1, x, yB, z1, 0.6, hMax);
        }
        for (var z = z0 + 1; z < z1 - 0.2; z += 1) {
          line(x1, yA, z, x1, yB, z, 0.42, hMax);
          line(x0, yA, z, x0, yB, z, 0.6, hMax);
        }
      }
      if (setback) {
        verticals(w, d, 0, setback * FH);
        verticals(w * 0.72, d * 0.72, setback * FH, floors * FH);
      } else {
        verticals(w, d, 0, floors * FH);
      }
    });
    // Calles y retícula del suelo
    for (var g = -18; g <= 18; g += 6) {
      line(g, 0, -16, g, 0, 16, 0.55, hMax);
      line(-20, 0, g * 0.8, 20, 0, g * 0.8, 0.55, hMax);
    }

    var N = pts.length / 3;
    var start = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      // punto de partida: dispersos alrededor, por debajo del suelo
      var a = Math.random() * Math.PI * 2, r = rnd(14, 34);
      start[i * 3] = pts[i * 3] + Math.cos(a) * r * 0.4;
      start[i * 3 + 1] = -rnd(2, 14);
      start[i * 3 + 2] = pts[i * 3 + 2] + Math.sin(a) * r * 0.4;
    }
    var target = new Float32Array(pts);
    var delay = new Float32Array(meta);
    var sx = new Float32Array(N), sy = new Float32Array(N), sb = new Uint8Array(N), ss = new Float32Array(N);

    // ---- Cámara ----
    var W = 0, H = 0, dpr = 1, f = 1, cxp = 0, cyp = 0;
    var pointer = { x: 0, y: 0 }, cam = { yaw: 0.62, pitch: 0.5 };
    var t0 = performance.now(), visible = true, raf = 0, last = 0, scrolling = false, scrollT = 0;
    window.addEventListener("scroll", function () {
      scrolling = true;
      clearTimeout(scrollT);
      scrollT = setTimeout(function () { scrolling = false; play(); }, 140);
    }, { passive: true });

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var narrow = W < 900;
      cxp = narrow ? W * 0.5 : W * 0.7;
      cyp = narrow ? H * 0.6 : H * 0.62;
      f = Math.min(W * (narrow ? 1.25 : 0.62), H * 1.25);
      if (reduce) draw(performance.now(), true);
    }

    function ease(x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); }

    function project(now) {
      var t = (now - t0) / 1000;
      var yawT = 0.62 + (reduce ? 0 : Math.sin(t * 0.12) * 0.16) + pointer.x * 0.22;
      var pitchT = 0.5 + pointer.y * 0.07;
      cam.yaw += (yawT - cam.yaw) * 0.05;
      cam.pitch += (pitchT - cam.pitch) * 0.05;
      var cy = Math.cos(cam.yaw), syw = Math.sin(cam.yaw);
      var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      var dist = 46, ty = 9;
      var building = false;
      for (var i = 0; i < N; i++) {
        var k = i * 3, e = reduce ? 1 : ease((t - delay[i]) / 1.5);
        if (e < 1) building = true;
        var x = start[k] + (target[k] - start[k]) * e;
        var y = start[k + 1] + (target[k + 1] - start[k + 1]) * e - ty;
        var z = start[k + 2] + (target[k + 2] - start[k + 2]) * e;
        // yaw
        var x1 = x * cy - z * syw, z1 = x * syw + z * cy;
        // pitch
        var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
        if (z2 < 2) { sb[i] = 255; continue; }
        var inv = f / z2;
        sx[i] = cxp + x1 * inv;
        sy[i] = cyp - y2 * inv;
        ss[i] = Math.max(0.9, Math.min(2.4, inv * 0.06));
        sb[i] = z2 < 40 ? 0 : z2 < 52 ? 1 : 2; // profundidad
      }
      return building;
    }

    // Colores: núcleo navy + desfase cromático en azules de la marca
    var passes = [
      { dx: 1.7, dy: 0.4, comp: "multiply", c: ["rgba(64,168,214,.55)", "rgba(64,168,214,.38)", "rgba(64,168,214,.22)"] },
      { dx: -1.7, dy: -0.3, comp: "multiply", c: ["rgba(122,104,214,.45)", "rgba(122,104,214,.3)", "rgba(122,104,214,.18)"] },
      { dx: 0, dy: 0, comp: "source-over", c: ["rgba(30,32,58,.92)", "rgba(42,44,78,.62)", "rgba(60,64,100,.36)"] }
    ];

    function draw(now, force) {
      var building = project(now);
      ctx.clearRect(0, 0, W, H);
      for (var p = 0; p < passes.length; p++) {
        var P = passes[p];
        ctx.globalCompositeOperation = P.comp;
        for (var b = 0; b < 3; b++) {
          ctx.fillStyle = P.c[b];
          for (var i = 0; i < N; i++) {
            if (sb[i] !== b) continue;
            var s = ss[i];
            ctx.fillRect(sx[i] + P.dx - s / 2, sy[i] + P.dy - s / 2, s, s);
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
      return building;
    }

    function loop(now) {
      raf = 0;
      if (!visible || document.hidden || scrolling) return;
      // ~30 fps: suficiente para un movimiento lento y deja libre el hilo para el scroll
      if (now - last < 32) { raf = requestAnimationFrame(loop); return; }
      last = now;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function play() { if (!reduce && !raf) raf = requestAnimationFrame(loop); }

    // Eventos
    var host = opts && opts.pointerTarget || canvas;
    if (!coarse) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
      host.addEventListener("pointerleave", function () { pointer.x = 0; pointer.y = 0; });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) play();
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) play(); });
    var ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", resize);

    resize();
    if (reduce) draw(performance.now(), true); else play();
    return { points: N };
  }

  window.GestorresCloud = createCloud;
})();
