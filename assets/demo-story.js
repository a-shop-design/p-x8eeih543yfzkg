/* 見た目の型「story」の動き（demo.js のあとに読む）
 * - 読み込み画面（1回の訪問で1度だけ）
 * - 写真のコラージュ：幕が開くように出て、6秒ごとに別の組に入れ替わる／手書き風のキャッチと大きな英字が出る
 * - 会社紹介の写真：スクロールに合わせて画面いっぱいに広がり、白黒からカラーになる
 * - 番号つきの強み：見ている項目に合わせて左の番号と見出しが切り替わる／写真が自動で切り替わる
 * - 写真の壁：スクロールで列が左右にずれる
 * - 応募ゾーンの動きは demo-cta.js（全部の型で共通）
 * - ヘッダー：スクロールでロゴが小さくなる／メニューはリンクを押すと閉じる
 */
(function () {
  var d = document, W = window, root = d.documentElement;
  var still = /[?&]shot=1/.test(location.search) || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $$ = function (s, el) { return [].slice.call((el || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* メニュー */
  var tg = d.getElementById('st-menu');
  $$('.st-modal a').forEach(function (a) { a.addEventListener('click', function () { if (tg) tg.checked = false; }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tg) tg.checked = false; });

  /* 写真のコラージュ */
  var fv = d.getElementById('st-fv');
  function startFv() {
    if (!fv) return;
    var panels = $$('.st-fv-panel', fv);
    panels.forEach(function (p) { $$('.st-fv-img', p).forEach(function (f, k) { f.style.setProperty('--k', k); }); });
    fv.classList.add('is-start');
    if (!panels.length) return;
    panels[0].classList.add('on');
    if (still || panels.length < 2) return;
    var cur = 0;
    setInterval(function () {
      var a = panels[cur], b = panels[(cur + 1) % panels.length];
      a.classList.remove('on'); a.classList.add('off');
      b.classList.remove('off'); b.classList.add('on');
      setTimeout(function () { a.classList.remove('off'); }, 1900);
      cur = (cur + 1) % panels.length;
    }, 6000);
  }

  /* 読み込み画面 */
  var ld = d.querySelector('.st-loader');
  var seen = false;
  try { seen = !!sessionStorage.getItem('st-loaded'); } catch (e) {}
  if (ld && !still && !seen) {
    root.classList.add('st-loading');
    setTimeout(function () {
      ld.classList.add('is-end');
      root.classList.remove('st-loading');
      try { sessionStorage.setItem('st-loaded', '1'); } catch (e) {}
      setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 900);
      startFv();
    }, 2500);
  } else {
    if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
    startFv();
  }

  /* スクロールに合わせて動くもの */
  var grow = d.querySelector('[data-grow]'), gImg = grow && grow.querySelector('.st-grow-img');
  var pts = $$('.st-point'), numCol = d.querySelector('.st-num-col'), labels = $$('.st-points-labels span');
  var hd = d.querySelector('.st-header');
  var curPt = -1, ticking = false;
  function onScroll() {
    ticking = false;
    var vh = W.innerHeight, vw = root.clientWidth, y = W.scrollY;
    if (hd) hd.classList.toggle('is-scrolled', y > 80);
    if (grow && gImg) {
      var r = grow.getBoundingClientRect();
      var p = still ? 1 : ease(clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
      var w0 = r.width, h0 = Math.min(r.width * 1.2, vh * 0.68);
      gImg.style.setProperty('--w', (w0 + (vw - w0) * p) + 'px');
      gImg.style.setProperty('--h', (h0 + (vh - h0) * p) + 'px');
      gImg.style.setProperty('--r', (-(vw - r.right) * p) + 'px');
      gImg.style.setProperty('--g', String(1 - p));
    }
    if (pts.length) {
      var idx = 0;
      pts.forEach(function (el, i) { if (el.getBoundingClientRect().top < vh * 0.55) idx = i; });
      if (idx !== curPt) {
        curPt = idx;
        if (numCol) numCol.style.setProperty('--n', idx);
        labels.forEach(function (l, i) { l.classList.toggle('on', i === idx); });
      }
    }
  }
  W.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  W.addEventListener('resize', onScroll);
  W.addEventListener('load', function () {
    onScroll();
    // なめらかスクロール（Lenis）が動いているときは、同じ時計（GSAPのticker）で毎フレーム合わせる
    if (W.gsap && !still) { var lastY = -1; W.gsap.ticker.add(function () { if (W.scrollY !== lastY) { lastY = W.scrollY; onScroll(); } }); }
  });
  onScroll();

  /* 強みの写真：3.6秒ごとに切り替え */
  if (!still) {
    var groups = $$('[data-slides]');
    setInterval(function () {
      groups.forEach(function (g) {
        var f = $$('figure', g), i = f.findIndex(function (x) { return x.classList.contains('on'); });
        f[i].classList.remove('on'); f[(i + 1) % f.length].classList.add('on');
      });
    }, 3600);
  }

  /* 写真の壁・コラージュ：GSAP があれば、スクロールで少しずつずらす */
  W.addEventListener('load', function () {
    var gsap = W.gsap, ST = W.ScrollTrigger;
    if (still || !gsap || !ST) return;
    $$('.st-row').forEach(function (row, i) {
      gsap.fromTo(row, { x: (i % 2 ? -1 : 1) * 80 }, { x: (i % 2 ? 1 : -1) * 80, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if (fv) {
      gsap.to(fv.querySelector('.st-fv-stage'), { yPercent: 10, ease: 'none', scrollTrigger: { trigger: fv, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(fv.querySelector('.st-fv-en'), { xPercent: -8, ease: 'none', scrollTrigger: { trigger: fv, start: 'top top', end: 'bottom top', scrub: true } });
    }
    ST.refresh();
  });
})();
