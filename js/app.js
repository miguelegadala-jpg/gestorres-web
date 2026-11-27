/* ==========================================================================
   GESTORRES — Interacciones mínimas
   Sin efectos de scroll: el navegador maneja el desplazamiento de forma nativa.
   ========================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var yearEl = $("#year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Transición entre páginas ---------------- */
  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var arrived = false;
  try { arrived = sessionStorage.getItem("gt-transition") === "1"; sessionStorage.removeItem("gt-transition"); } catch (e) {}
  if (arrived && motionOK) {
    root.classList.add("arriving");
    setTimeout(function () { root.classList.remove("arriving"); }, 500);
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) root.classList.remove("leaving", "arriving"); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:)/i.test(href) || !/\.html(#.*)?$/i.test(href)) return;
    var url = new URL(href, location.href);
    if (url.pathname === location.pathname) return; // mismo documento: lo maneja el salto suave
    if (!motionOK) return;
    e.preventDefault();
    try { sessionStorage.setItem("gt-transition", "1"); } catch (err) {}
    root.classList.remove("menu-open");
    root.classList.add("leaving");
    setTimeout(function () { location.href = url.href; }, 200);
  });

  /* ---------------- Saltos suaves del menú (solo al hacer clic; el scroll normal no cambia) ---------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute("href");
    if (id === "#" || id === "#main") return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "start" });
    if (history.replaceState) history.replaceState(null, "", id);
    if (motionOK && target.tagName === "SECTION") {
      target.classList.remove("section-flash"); void target.offsetWidth; target.classList.add("section-flash");
      setTimeout(function () { target.classList.remove("section-flash"); }, 1300);
    }
  });

  /* ---------------- Menú móvil ---------------- */
  var toggle = $(".menu-toggle");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    if (toggle) { toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); }
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
  $$(".mobile-menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });


  /* ---------------- Motion ---------------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  if (!reduce && hasIO) root.classList.add("anim");

  // Header con sombra al bajar (sin escuchar el scroll)
  var header = $(".site-header"), sentinel = $(".top-sentinel");
  if (hasIO && header && sentinel) new IntersectionObserver(function (e) { header.classList.toggle("scrolled", !e[0].isIntersecting); }).observe(sentinel);

  // Menú: fondo que sigue al mouse + sección activa
  var nav = $(".nav"), ind = $(".nav-ind"), navLinks = $$(".nav a, .header-actions a.pill:not(.pill-primary)");
  function moveInd(a) { if (!ind) return; ind.style.width = a.offsetWidth + "px"; ind.style.transform = "translateX(" + a.offsetLeft + "px)"; }
  navLinks.forEach(function (a) { a.addEventListener("mouseenter", function () { moveInd(a); nav.classList.add("hovering"); }); a.addEventListener("focus", function () { moveInd(a); nav.classList.add("hovering"); }); });
  if (nav) { nav.addEventListener("mouseleave", function () { nav.classList.remove("hovering"); }); nav.addEventListener("focusout", function () { nav.classList.remove("hovering"); }); }
  if (hasIO) {
    var map = {};
    navLinks.forEach(function (a) { var h = a.getAttribute("href"); if (h.charAt(0) !== "#") return; var s = $(h); if (s) map[s.id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(map).forEach(function (k) { map[k].classList.remove("is-active"); map[k].removeAttribute("aria-current"); });
        var a = map[e.target.id]; if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
    var heroEl = document.getElementById("inicio"); if (heroEl) spy.observe(heroEl);
  }

  // Aparición de elementos al entrar en pantalla
  if (root.classList.contains("anim")) {
    var groups = [
      [".section-head", false], [".g-item", true], [".g-value", false], [".about-copy > *", true], [".band .glass", true], [".areas-card", false],
      [".svc-list li", true], [".checks li", true], [".dash", false], [".step", true],
      [".c-item", true], [".form", false], [".start-card", false], [".next-card", false], [".t-body", false], [".jump li", true], [".final-inner > *", true], [".strip .item", true], [".gallery figure", true], [".foot-grid > *", true]
    ];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.add("in"); io.unobserve(el);
        if (el.classList.contains("reveal")) {
          var d = parseFloat(el.style.getPropertyValue("--d")) || 0;
          setTimeout(function () { el.classList.remove("reveal", "in"); el.style.removeProperty("--d"); }, (d + 0.9) * 1000);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    groups.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        if (el.closest(".hero")) return;
        el.classList.add("reveal");
        if (g[1]) el.style.setProperty("--d", Math.min(i % 9, 8) * 0.08 + "s");
        io.observe(el);
      });
    });
  }


  /* ---------------- Página actual en el menú ---------------- */
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".nav a, .header-actions a.pill, .mobile-menu a").forEach(function (a) {
    var h = (a.getAttribute("href") || "").split("#");
    if (h[0] && !h[1] && h[0].toLowerCase() === here) { a.classList.add("is-active"); a.setAttribute("aria-current", "page"); }
  });

  /* ---------------- Fondos que se mueven y cambian ---------------- */
  // Animar solo las secciones visibles (ahorra batería y mantiene el scroll fluido)
  var liveEls = $$(".live-bg");
  if ("IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("live", e.isIntersecting); }); }, { rootMargin: "100px 0px" });
    liveEls.forEach(function (el) { lio.observe(el); });
  } else liveEls.forEach(function (el) { el.classList.add("live"); });

  function rotator(section, ctrlSel) {
    var stage = $(".bg-stage", section); if (!stage) return;
    var slides = $$(".bg-slide", stage), ctrls = $$(ctrlSel + " button", section), wrap = $(ctrlSel, section);
    var ms = parseInt(stage.getAttribute("data-rotate"), 10) || 6000, idx = 0, timer = null, stopped = false;
    if (wrap) wrap.style.setProperty("--rot", ms / 1000 + "s");
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-on", i === idx); });
      ctrls.forEach(function (b, i) {
        b.setAttribute("aria-pressed", String(i === idx));
      });
      if (wrap && wrap.classList.contains("timing")) { wrap.classList.remove("timing"); void wrap.offsetWidth; wrap.classList.add("timing"); }
    }
    function play() { if (reduce || stopped) return; clearInterval(timer); if (wrap) wrap.classList.add("timing"); timer = setInterval(function () { if (section.classList.contains("live") && !document.hidden) show(idx + 1); }, ms); }
    ctrls.forEach(function (b, i) {
      b.addEventListener("click", function () { stopped = true; clearInterval(timer); if (wrap) wrap.classList.remove("timing"); show(i); });
      b.addEventListener("mouseenter", function () { if (section.classList.contains("areas2")) { stopped = true; clearInterval(timer); if (wrap) wrap.classList.remove("timing"); show(i); } });
    });
    play();
  }
  // Valores: tocar o enfocar una letra muestra su significado
  var valueEls = $$(".value");
  valueEls.forEach(function (v) {
    v.setAttribute("tabindex", "0");
    v.addEventListener("click", function () {
      var willOpen = !v.classList.contains("open");
      valueEls.forEach(function (o) { o.classList.remove("open"); });
      v.classList.toggle("open", willOpen);
    });
  });
  // Valores: activar la animación de letras al llegar
  var vg = $(".values-grid"), vsec = $(".values-sec");
  if (vsec) { vsec.classList.add("live-bg"); if (lio) lio.observe(vsec); else vsec.classList.add("live"); }
  if (vg && root.classList.contains("anim")) {
    var vio = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { vg.classList.add("on"); vio.disconnect(); } }, { threshold: 0.35 });
    vio.observe(vg);
  }
  // Página de proceso: la línea de tiempo se llena al llegar a cada paso
  var tsteps = $$(".t-step");
  if (tsteps.length && "IntersectionObserver" in window) {
    var tio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("seen"); tio.unobserve(e.target); } }); }, { rootMargin: "0px 0px -35% 0px" });
    tsteps.forEach(function (s) { tio.observe(s); });
  }
  // Tarjetas de inicio: se abren una tras otra al llegar a la sección
  var xGrid = $(".explore-grid");
  if (xGrid && root.classList.contains("anim")) {
    var xCards = $$(".x-card", xGrid);
    xCards.forEach(function (c, i) { c.classList.add("x-pre"); c.style.setProperty("--d", (i * 0.12) + "s"); });
    var xio = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return; xio.disconnect();
      xCards.forEach(function (c) { c.classList.add("x-open"); });
      setTimeout(function () { xCards.forEach(function (c) { c.classList.remove("x-pre", "x-open"); c.style.removeProperty("--d"); }); }, 2400);
    }, { threshold: 0.15 });
    xio.observe(xGrid);
  }
  // Tarjetas de inicio: inclinación 3D y brillo siguiendo el mouse
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".x-card").forEach(function (card) {
      var raf = null;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.classList.add("tilting");
          card.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
          card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        });
      });
      card.addEventListener("pointerleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.classList.remove("tilting");
        card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------------- Títulos con efecto de máquina de escribir ---------------- */
  // Se escribe letra por letra sin cambiar el texto final: los nodos de texto originales se conservan
  // (así el selector de idioma sigue funcionando) y el resto reserva su espacio para que nada salte.
  if (root.classList.contains("anim") && "IntersectionObserver" in window) {
    var typing = [];
    var typeTitle = function (h) {
      var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while ((n = walker.nextNode())) if (n.nodeValue.length) nodes.push({ node: n, full: n.nodeValue });
      var total = 0; nodes.forEach(function (o) { total += o.full.length; });
      if (!total) { h.classList.add("tw-go"); return; }
      var caret = document.createElement("span"); caret.className = "tw-caret"; caret.setAttribute("aria-hidden", "true");
      nodes.forEach(function (o) {
        o.rest = document.createElement("span"); o.rest.className = "tw-rest"; o.rest.setAttribute("aria-hidden", "true");
        o.rest.textContent = o.full; o.node.nodeValue = "";
        o.node.parentNode.insertBefore(o.rest, o.node.nextSibling);
      });
      h.setAttribute("aria-label", nodes.map(function (o) { return o.full; }).join(""));
      h.classList.add("tw-go", "tw-typing");
      var job = { done: false };
      var finish = function () {
        if (job.done) return; job.done = true;
        nodes.forEach(function (o) { o.node.nodeValue = o.full; if (o.rest.parentNode) o.rest.parentNode.removeChild(o.rest); });
        h.removeAttribute("aria-label"); h.classList.remove("tw-typing");
        setTimeout(function () { if (caret.parentNode) caret.parentNode.removeChild(caret); }, 1400);
      };
      job.finish = finish; typing.push(job);
      var speed = Math.max(18, Math.min(48, 1500 / total)), i = 0, k = 0, last = null, acc = 0;
      var step = function (t) {
        if (job.done) return;
        if (last === null) last = t;
        acc += t - last; last = t;
        while (acc >= speed && k < nodes.length) {
          acc -= speed;
          var o = nodes[k]; i++;
          o.node.nodeValue = o.full.slice(0, i); o.rest.textContent = o.full.slice(i);
          o.rest.parentNode.insertBefore(caret, o.rest);
          if (i >= o.full.length) { k++; i = 0; }
        }
        if (k >= nodes.length) finish(); else requestAnimationFrame(step);
      };
      nodes[0].rest.parentNode.insertBefore(caret, nodes[0].rest);
      setTimeout(function () { requestAnimationFrame(step); }, 120);
    };
    // Si se cambia de idioma a mitad de la escritura, el título se completa al instante antes de traducirse
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-lang-toggle]")) typing.forEach(function (jb) { jb.finish(); });
    }, true);
    var twIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var h = e.target;
        // El título de la portada espera a que termine la intro del logo
        if (h.closest(".hero") && root.classList.contains("has-intro") && !root.classList.contains("intro-done")) return;
        twIO.unobserve(h); typeTitle(h);
      });
    }, { threshold: 0.3, rootMargin: "0px 0px -6% 0px" });
    $$(".hero h1, .page-hero h1, main h2").forEach(function (h) { twIO.observe(h); });
    // Re-revisa el título de la portada cuando termina la intro
    if (window.MutationObserver) new MutationObserver(function () {
      if (root.classList.contains("intro-done")) $$(".hero h1:not(.tw-go)").forEach(function (h) { twIO.unobserve(h); twIO.observe(h); });
    }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------------- Intro de la portada: logo grande y transición con el scroll ---------------- */
  var intro = $("#intro");
  if (intro) {
    var skipIntro = arrived || (location.hash && location.hash !== "#intro");
    if (skipIntro) intro.parentNode.removeChild(intro);
    else if (root.classList.contains("anim")) {
      root.classList.add("has-intro", "intro-active");
      // Al recargar, el navegador no recuerda la posición: la intro siempre empieza desde arriba
      try { history.scrollRestoration = "manual"; } catch (e) {}
      window.scrollTo(0, 0);
      var iTowers = $(".intro-towers", intro), iMark = $(".intro-mark", intro), iLogo = $(".intro-logo", intro),
          iBg = $(".intro-bg", intro), iHint = $(".intro-hint", intro), iStage = $(".intro-stage", intro),
          iTw = $$(".tw", intro), iBrand = $(".site-header .brand img"), iHero = $(".hero2"), iStrips = $$(".intro-strips span", intro), iLetters = $$(".il", intro), iTag = $(".it", intro), iBand = $(".intro-band", intro);
      var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
      var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
      var inOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      var iDone = false, grow = [.55, .35, .75];
      var introFrame = function (p) {
        var lr = iLogo.getBoundingClientRect();
        // 1) El nombre sube primero y se acomoda donde va el logo del menú; las letras hacen una ola al subir
        var m = inOut(seg(p, 0, .3)), br = iBrand ? iBrand.getBoundingClientRect() : null;
        if (br && br.width) {
          var s = br.width / lr.width, dx = (br.left + br.width / 2) - (lr.left + lr.width / 2), dy = (br.top + br.height / 2) - (lr.top + lr.height / 2);
          iMark.style.transform = "translate(" + (dx * m).toFixed(1) + "px," + (dy * m).toFixed(1) + "px) scale(" + (1 + (s - 1) * m).toFixed(4) + ")";
        }
        var raw = seg(p, 0, .3);
        iLetters.forEach(function (l, k) {
          var t = clamp(raw * 1.7 - k * .08), w = Math.sin(t * Math.PI);
          l.style.translate = "0 " + (-w * 26).toFixed(2) + "px";
        });
        iTag.style.filter = "opacity(" + (1 - seg(p, .02, .14) * .6).toFixed(3) + ")";
        iMark.style.opacity = (1 - seg(p, .72, .78)).toFixed(3);
        // 2) Una franja limpia aparece detrás del nombre: así nada se mezcla con él
        iBand.style.opacity = seg(p, .2, .3).toFixed(3);
        // 3) Ya sin el nombre, los edificios se mueven al centro y crecen hacia arriba
        var g = inOut(seg(p, .1, .38)), c = inOut(seg(p, .14, .36));
        iTw.forEach(function (t, k) { t.style.transform = "scaleY(" + (1 + g * grow[k]).toFixed(4) + ")"; });
        var tx = (0.5 - 150.5 / 638) * lr.width * c, ty = (0.5 - 0.4) * lr.height * c;
        // 4) La cámara entra en la torre central, pasando entre sus dos líneas
        var z = seg(p, .34, .7), ze = z * z * z;
        iTowers.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + (1 + ze * 24).toFixed(3) + ")";
        iTowers.style.opacity = (1 - seg(p, .62, .7)).toFixed(3);
        // 5) La portada aparece de arriba hacia abajo: el fondo se parte en columnas que caen desde el centro
        iBg.style.opacity = (1 - seg(p, .62, .72)).toFixed(3);
        var cols = iStrips.filter(function (s) { return s.offsetWidth > 0; }), nC = cols.length;
        cols.forEach(function (s, k) {
          var order = Math.abs(k - (nC - 1) / 2), st = .68 + order * .045, f = inOut(seg(p, st, st + .2));
          s.style.transform = "translate3d(0," + (f * 101).toFixed(2) + "%,0)";
          s.style.setProperty("--edge", f > 0 && f < 1 ? "1" : "0");
        });
        var o = seg(p, .68, 1);
        root.classList.toggle("intro-scrolled", p > .02);
        if (iHero) iHero.style.transform = p < 1 ? "scale(" + (1 + (1 - inOut(o)) * .08).toFixed(4) + ")" : "";
        root.classList.toggle("intro-active", p < .74);
        if (p > .72 && !iDone) { iDone = true; root.classList.add("intro-done"); }
        iStage.style.visibility = p >= .999 ? "hidden" : "";
      };
      // La intro ya no sigue al scroll: el primer gesto hacia abajo la reproduce completa, con ritmo fijo y fluido
      var DUR = 2400, playing = false, introClosed = false;
      var closeIntro = function () {
        if (introClosed) return; introClosed = true;
        window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey);
        window.removeEventListener("touchstart", onTouchStart); window.removeEventListener("touchmove", onTouchMove);
        intro.parentNode.removeChild(intro);
        if (iHero) iHero.style.transform = "";
        root.classList.remove("has-intro", "intro-active", "intro-scrolled", "intro-lock");
        root.classList.add("intro-done");
        window.scrollTo(0, 0);
      };
      var play = function () {
        if (playing) return; playing = true;
        var t0 = null;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = clamp((t - t0) / DUR);
          introFrame(p);
          if (p < 1) requestAnimationFrame(step); else closeIntro();
        };
        requestAnimationFrame(step);
      };
      var onWheel = function (e) { if (!introClosed) e.preventDefault(); if (e.deltaY > 0) play(); };
      var onKey = function (e) {
        if (["ArrowDown", "PageDown", "End", " ", "Spacebar", "Enter"].indexOf(e.key) > -1) { e.preventDefault(); play(); }
      };
      var ty0 = null;
      var onTouchStart = function (e) { ty0 = e.touches[0].clientY; };
      var onTouchMove = function (e) {
        if (!introClosed) e.preventDefault();
        if (ty0 !== null && ty0 - e.touches[0].clientY > 12) play();
      };
      root.classList.add("intro-lock");
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      if (iHint) iHint.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); play(); }, true);
      introFrame(0);
    }
  }

  var heroSec = $(".hero2"); if (heroSec) rotator(heroSec, ".bg-dots");
  var areasSec = $(".areas2"); if (areasSec) rotator(areasSec, ".areas-list");

  // Contador del año de fundación
  var cnt = $("[data-count]");
  if (cnt && root.classList.contains("anim")) {
    var target = parseInt(cnt.getAttribute("data-count"), 10);
    var cio2 = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return; cio2.disconnect();
      var t0 = null, from = target - 18;
      function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); var v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))); cnt.textContent = v; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    cio2.observe(cnt);
  }

  /* ---------------- Reporte de ejemplo ---------------- */
  var REPORT = {
    flujo: {
      kpis: [["Ingresos del mes", "RD$412,500", "+3.2%"], ["Gastos del mes", "RD$356,180", ""], ["Fondo de reserva", "RD$1.24 M", "+RD$56k"]],
      labels: ["Jun", "Jul", "Ago", "Sep", "Oct", "Nov"],
      series: [[398, 401, 405, 399, 408, 412], [362, 349, 371, 352, 360, 356]],
      names: ["Ingresos", "Gastos"], max: 450, unit: "k"
    },
    cxc: {
      kpis: [["Cuotas cobradas", "96%", "+2 pts"], ["Pendiente", "RD$38,400", ""], ["Apartamentos al día", "46 de 48", ""]],
      labels: ["Jun", "Jul", "Ago", "Sep", "Oct", "Nov"],
      series: [[89, 91, 92, 94, 95, 96]],
      names: ["% cobrado"], max: 100, unit: "%"
    },
    presupuesto: {
      kpis: [["Presupuesto ejecutado", "92%", ""], ["Ahorro acumulado", "RD$31,200", "−4.1%"], ["Partidas en rango", "6 de 6", ""]],
      labels: ["Seguridad", "Mant.", "Energía", "Personal", "Limpieza", "Reserva"],
      series: [[120, 85, 70, 95, 40, 50], [116, 78, 66, 95, 37, 50]],
      names: ["Presupuesto", "Real"], max: 130, unit: "k"
    }
  };

  var chart = $(".chart"), kpis = $(".kpis"), legend = $(".legend");
  var COLORS = ["#1f5fbf", "#9cc3f0"];
  function renderReport(key) {
    var d = REPORT[key]; if (!d || !chart) return;
    kpis.innerHTML = d.kpis.map(function (k) {
      return '<div class="kpi"><small>' + k[0] + '</small><b>' + k[1] + '</b>' + (k[2] ? ' <span class="ok">' + k[2] + '</span>' : '') + '</div>';
    }).join("");
    legend.innerHTML = d.names.map(function (n, i) {
      return '<span><i style="background:' + COLORS[i] + '"></i>' + n + '</span>';
    }).join("");
    var x0 = 40, x1 = 512, y0 = 14, y1 = 168, ph = y1 - y0;
    var groups = d.labels.length, gw = (x1 - x0) / groups, ns = d.series.length;
    var bw = Math.min(26, (gw * 0.62) / ns);
    var svg = '';
    for (var g = 0; g <= 4; g++) {
      var v = d.max * g / 4, y = y1 - ph * g / 4;
      svg += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y + '" y2="' + y + '" stroke="rgba(42,33,96,.08)"/>';
      svg += '<text x="' + (x0 - 6) + '" y="' + (y + 3) + '" text-anchor="end">' + Math.round(v) + (d.unit === "%" ? "%" : "k") + '</text>';
    }
    d.labels.forEach(function (lab, gi) {
      var gx = x0 + gw * gi + gw / 2;
      svg += '<text x="' + gx + '" y="' + (y1 + 16) + '" text-anchor="middle">' + lab + '</text>';
      d.series.forEach(function (s, si) {
        var h = ph * s[gi] / d.max, bx = gx - (bw * ns) / 2 + si * bw + 1;
        svg += '<rect class="bar" x="' + bx.toFixed(1) + '" y="' + (y1 - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="' + COLORS[si] + '"' + '><title>' + d.names[si] + ': ' + s[gi] + (d.unit === "%" ? "%" : "k") + '</title></rect>';
      });
    });
    chart.innerHTML = svg;
    $$(".bar", chart).forEach(function (b, i) { b.style.setProperty("--bd", (i * 0.04) + "s"); });
  }
  var chartSeen = !root.classList.contains("anim");
  var dashBody = [kpis, chart, legend], swapping = null;
  // Cambio de pestaña: desvanecer, cambiar los datos y volver a mostrar (sin saltos)
  function swapView(key) {
    if (reduce) { renderReport(key); return; }
    clearTimeout(swapping);
    chart.classList.remove("grow");
    dashBody.forEach(function (el) { el.classList.add("fading"); });
    swapping = setTimeout(function () {
      renderReport(key);
      dashBody.forEach(function (el) { el.classList.remove("fading"); });
      swapping = null;
    }, 180);
  }
  var tabs = $$(".tab");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      if (t.getAttribute("aria-selected") === "true") return;
      tabs.forEach(function (o) { o.setAttribute("aria-selected", String(o === t)); });
      swapView(t.getAttribute("data-view"));
    });
  });
  if (chart) {
    renderReport("flujo");
    if (!chartSeen) {
      var cio = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { chartSeen = true; chart.classList.add("grow"); cio.disconnect(); } }, { threshold: 0.3 });
      cio.observe(chart);
    }
  }

  /* ---------------- Formulario de cotización ---------------- */
  var form = $("#quote");
  if (form) {
    var success = $(".form-success", form), waBtn = $("#wa-send"), resetBtn = $("#form-reset");
    function check(field) {
      var input = $("input, textarea, select", field);
      var bad = false;
      if (input.required && !input.value.trim()) bad = true;
      if (input.type === "email" && input.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) bad = true;
      if (input.type === "tel" && input.value.trim() && input.value.replace(/\D/g, "").length < 7) bad = true;
      field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", String(bad));
      return !bad;
    }
    $$(".field", form).forEach(function (f) {
      var input = $("input, textarea, select", f);
      input.addEventListener("blur", function () { if (input.value) check(f); });
      input.addEventListener("input", function () { if (f.classList.contains("invalid")) check(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, first = null;
      $$(".field", form).forEach(function (f) { if (!check(f)) { ok = false; first = first || f; } });
      if (!ok) { $("input, textarea", first).focus(); return; }
      var v = function (n) { return (form.elements[n].value || "").trim(); };
      var msg = "Hola Gestorres, quisiera una cotización.%0A" +
        ["Nombre: " + v("nombre"), "Teléfono: " + v("telefono"),
         v("torre") && "Torre: " + v("torre"), v("sector") && "Sector: " + v("sector"),
         v("unidades") && "Apartamentos: " + v("unidades"), v("email") && "Correo: " + v("email"),
         v("mensaje") && "Mensaje: " + v("mensaje")].filter(Boolean).map(encodeURIComponent).join("%0A");
      if (waBtn) waBtn.href = "https://wa.me/18099105197?text=" + msg;
      success.hidden = false;
      var h = $("h3", success); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    });
    if (resetBtn) resetBtn.addEventListener("click", function () { success.hidden = true; $("input", form).focus(); });
  }

})();
