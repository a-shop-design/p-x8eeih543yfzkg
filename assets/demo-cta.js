/* お問い合わせ・応募ゾーン（全部の型で共通。demo.js のあとに読む）
 * ① 英字のコピーが画面に止まったまま → ② スクロールに合わせて暗転 → ③ 写真の3列が縮小しながら上下に動く
 * → ④ 見出しと入口3つが下から出る。暗転している間はヘッダー・追いかけるボタンを隠す。
 */
(function () {
  var d = document, W = window, root = d.documentElement;
  var still = /[?&]shot=1/.test(location.search) || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ctas = [].slice.call(d.querySelectorAll('[data-stcta]')).map(function (el) {
    return { el: el, main: el.querySelector('.st-cta-main'), inner: el.querySelector('.st-cta-inner'), sticky: el.querySelector('.st-cta-imgs-sticky'), col: el.querySelector('.st-col'), items: el.querySelector('.st-cta-items') };
  });
  if (!ctas.length) return;

  function step(c, vh, mobile) {
    var er = c.el.getBoundingClientRect();
    // ① コピーが画面に入ったら、文字と写真が出る
    if (er.top < vh * 0.5 && er.bottom > 0) c.el.classList.add('is-inview');
    else if (er.top >= vh * 0.6) c.el.classList.remove('is-inview');
    // ② コピーが止まったあと、スクロールに合わせて暗転
    var mr = c.main.getBoundingClientRect();
    var opa = still ? 1 : clamp(-mr.top / (vh * 0.8), 0, 1);
    c.main.style.setProperty('--opa', opa.toFixed(3));
    c.el.classList.toggle('is-bg-show', opa >= 0.98);
    root.classList.toggle('st-hd-hide', opa > 0.4 && er.bottom > vh * 0.5);
    // ③ 写真の3列：縮小しながら、1・3列目は上へ、2列目は下へ
    var ir = c.inner.getBoundingClientRect();
    var q = still ? 0.5 : clamp(-ir.top / Math.max(1, ir.height - vh), 0, 1);
    var s0 = mobile ? 1.35 : 1.5;
    var colH = c.col ? c.col.offsetHeight : vh * 2;
    var M = Math.max(0, Math.min(colH - vh, colH * 0.5) * 0.9);
    c.sticky.style.setProperty('--scale', (s0 - (s0 - 1) * q).toFixed(4));
    c.sticky.style.setProperty('--moveY', (-M * q).toFixed(1) + 'px');
    c.sticky.style.setProperty('--moveYr', (M * q).toFixed(1) + 'px');
    // ④ 見出しと入口3つ
    var tr = c.items.getBoundingClientRect();
    if (still || (tr.top < vh * 0.2 && tr.bottom > vh * 0.4)) c.el.classList.add('is-show');
    else if (tr.top > vh * 0.45) c.el.classList.remove('is-show');
  }
  var ticking = false;
  function run() {
    ticking = false;
    var vh = W.innerHeight, mobile = root.clientWidth < 768;
    ctas.forEach(function (c) { step(c, vh, mobile); });
  }
  W.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  W.addEventListener('resize', run);
  W.addEventListener('load', function () {
    run();
    // なめらかスクロール（Lenis）が動いているときは、同じ時計（GSAPのticker）で毎フレーム合わせる
    if (W.gsap && !still) { var lastY = -1; W.gsap.ticker.add(function () { if (W.scrollY !== lastY) { lastY = W.scrollY; run(); } }); }
  });
  run();
})();
