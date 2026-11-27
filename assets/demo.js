/* デモサイトの動き
 * GSAP + ScrollTrigger + Lenis（CDN）を使う。読み込めないときは、軽い動きだけにする。
 * - なめらかスクロール（Lenis）
 * - 見出しが1文字ずつ下から出る（data-split）
 * - 文章がスクロールに合わせて塗られていく（data-fill）
 * - 写真が幕を開けるように出る・ゆっくり動く（パララックス）
 * - 流れる文字の帯（.mq）：スクロールの速さ・向きで加速・反転
 * - 画面を止めて横に流れる推しポイント（data-hscroll）
 * - 数字のカウントアップ・施工前後スライダー・ヘッダーの出し入れ・右下の応募/相談ボタン
 * ?shot=1（スクリーンショット用）や「動きを減らす」設定のときは動かさない。
 */
(function () {
  var d = document, root = d.documentElement, W = window;
  var still = /[?&]shot=1/.test(location.search) || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js');
  var $$ = function (s, el) { return [].slice.call((el || d).querySelectorAll(s)); };

  /* ---------- 共通：数字・スライダー・メニュー ---------- */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (!isFinite(to) || to <= 0 || el._done) return;
    el._done = true;
    var text = el.textContent, dec = (String(to).split('.')[1] || '').length, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    }
    requestAnimationFrame(step);
  }
  $$('.ba-slider input').forEach(function (inp) {
    function f() { inp.parentNode.style.setProperty('--pos', inp.value + '%'); }
    inp.addEventListener('input', f); f();
  });
  var tg = d.getElementById('nav-toggle');
  $$('.site-nav a').forEach(function (a) { a.addEventListener('click', function () { if (tg) tg.checked = false; }); });

  /* ---------- 文字を1文字ずつに分ける ---------- */
  function split(el, cls) {
    if (el._split) return el._split;
    var out = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment(), prev = null, open = '';
          Array.from(n.textContent).forEach(function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(d.createTextNode(ch)); prev = null; return; }
            var c = d.createElement('span'); c.className = cls; c.textContent = ch;
            // 1文字ずつに分けると禁則処理が効かないので、句読点・閉じかっこは前の文字と、開きかっこは次の文字とくっつける
            if (/[、。，．,.」』）)！？!?ー～ァィゥェォッャュョ々]/.test(ch) && prev) { prev.appendChild(c); out.push(c); return; }
            if (/[「『（(]/.test(ch)) { open += ch; return; }
            var w = d.createElement('span'); w.className = cls + '-w';
            if (open) { var o = d.createElement('span'); o.className = cls; o.textContent = open; w.appendChild(o); out.push(o); open = ''; }
            w.appendChild(c); frag.appendChild(w); out.push(c); prev = w;
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    el.setAttribute('aria-label', el.textContent);
    return (el._split = out);
  }

  /* ---------- 動かさないとき ---------- */
  function lite() {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(function (el) { if (!still) count(el); });
    root.classList.add('mq-css'); // 帯はCSSでゆっくり流すだけ
    if (still) root.classList.add('still');
  }

  function start() {
    var gsap = W.gsap, ST = W.ScrollTrigger;
    if (still || !gsap || !ST) {
      if (!still && 'IntersectionObserver' in W) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); $$('[data-count]', e.target).forEach(count); io.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        $$('.rv').forEach(function (el) { io.observe(el); });
        root.classList.add('mq-css');
        var fc0 = d.querySelector('.float-cta');
        if (fc0) W.addEventListener('scroll', function () { fc0.classList.toggle('show', W.scrollY > W.innerHeight * 0.7); }, { passive: true });
      } else lite();
      return;
    }
    gsap.registerPlugin(ST);
    root.classList.add('gs');

    /* なめらかスクロール */
    if (W.Lenis) {
      var lenis = new W.Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (e) { var t = d.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); } }); });
    }

    /* ヒーロー：見出しが1文字ずつ → 説明・ボタン */
    var hero = d.querySelector('.hero, .page-head');
    if (hero) {
      var h1 = hero.querySelector('[data-split]');
      var tl = gsap.timeline({ delay: 0.15 });
      if (h1) tl.from(split(h1, 'ch'), { yPercent: 115, rotate: 8, duration: 1.1, ease: 'expo.out', stagger: 0.035 });
      tl.from(hero.querySelectorAll('.hero-script, .hero-en, .hero-lead, .hero-btns, .hero-badges, .page-head .en, .page-head-in > p'), { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=0.7');
      // やわらか系：写真・丸バッジがふわっと出て、スクロールで少しずつずれる
      var vis = hero.querySelectorAll('.hero-photo, .hero-photo2, .ring');
      if (vis.length) {
        tl.from(vis, { scale: 0.82, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.15 }, 0.1);
        [['.hero-photo', -6], ['.hero-photo2', -22], ['.ring', -34], ['.blob-1', 18], ['.blob-2', -14], ['.blob-3', 24]].forEach(function (x) {
          var el = hero.querySelector(x[0]);
          if (el) gsap.to(el, { yPercent: x[1], ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        });
      }
      var bg = hero.querySelector('.hero-bg img, .page-head-bg img');
      if (bg) gsap.fromTo(bg, { scale: 1.18 }, { scale: 1, yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      var inner = hero.querySelector('.hero-in');
      if (inner) gsap.to(inner, { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* セクション見出し：1文字ずつ */
    $$('.sec-head h2, .hs-head [data-split], .cta-in h2, .band-in h2').forEach(function (el) {
      gsap.from(split(el, 'ch'), { yPercent: 115, duration: 0.9, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    $$('.sec-head h2').forEach(function (el) { el.classList.add('line-draw'); ST.create({ trigger: el, start: 'top 80%', onEnter: function () { el.classList.add('drawn'); } }); });

    /* 文章がスクロールで塗られていく */
    $$('[data-fill]').forEach(function (el) {
      var chars = split(el, 'fc');
      gsap.fromTo(chars, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });

    /* ふわっと出る（まとめて少しずつずらす） */
    gsap.set('.rv', { opacity: 0, y: 46 });
    ST.batch('.rv', {
      start: 'top 88%',
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true });
        els.forEach(function (el) { $$('[data-count]', el).forEach(count); });
      },
    });

    /* 写真：幕が開くように出て、スクロールでゆっくり動く */
    $$('.card-img, .split-img, .interview-img, .article-img').forEach(function (box) {
      var img = box.querySelector('img');
      gsap.fromTo(box, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: box, start: 'top 85%' } });
      if (img) gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1.08, yPercent: 6, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.cta-bg img, .band-bg img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -12, scale: 1.2 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: img.parentNode.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* 流れる文字の帯：スクロールの速さで加速し、向きで反転 */
    var mqs = $$('.mq').map(function (el) { return { el: el, track: el.querySelector('.mq-track'), set: el.querySelector('.mq-set'), x: 0, dir: +el.getAttribute('data-dir') || 1 }; });
    var boost = 0, sdir = 1;
    ST.create({ start: 0, end: 'max', onUpdate: function (self) { sdir = self.direction; boost = Math.min(Math.abs(self.getVelocity()) / 140, 14); } });
    gsap.ticker.add(function (t, dt) {
      boost *= 0.93;
      mqs.forEach(function (m) {
        var w = m.set.offsetWidth; if (!w) return;
        m.x -= (0.045 + boost * 0.02) * dt * m.dir * sdir;
        if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
        m.track.style.transform = 'translate3d(' + m.x + 'px,0,0)';
      });
    });
    // 大きい帯は、速くスクロールすると少し傾く（boost が落ちると元に戻る）
    gsap.ticker.add(function () { d.body.style.setProperty('--skew', (-Math.min(boost, 12) * 0.5 * sdir).toFixed(2)); });

    /* 画面を止めて、推しポイントを横に流す */
    $$('[data-hscroll]').forEach(function (sec) {
      var pin = sec.querySelector('.hs-pin'), track = sec.querySelector('.hs-track'), panels = $$('.hs-panel', sec);
      var now = sec.querySelector('.hs-now'), bar = sec.querySelector('.hs-bar i');
      var dist = function () { return Math.max(0, track.scrollWidth - W.innerWidth + 40); };
      root.classList.add('has-hs');
      gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: sec, pin: pin, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) {
            var i = Math.min(panels.length - 1, Math.round(s.progress * (panels.length - 1)));
            if (now) now.textContent = String(i + 1).padStart(2, '0');
            if (bar) bar.style.transform = 'scaleX(' + s.progress + ')';
            panels.forEach(function (p, k) { p.classList.toggle('on', k === i); if (k <= i) $$('[data-count]', p).forEach(count); });
          },
        },
      });
    });

    /* ヘッダー：下にスクロールで隠れ、上で出る */
    var hd = d.querySelector('.site-header'), fc = d.querySelector('.float-cta'), last = 0;
    ST.create({ start: 0, end: 'max', onUpdate: function (s) {
      var y = s.scroll();
      if (hd) { hd.classList.toggle('scrolled', y > 40); hd.classList.toggle('hide', y > 300 && y > last && !(tg && tg.checked)); }
      if (fc) fc.classList.toggle('show', y > W.innerHeight * 0.7);
      last = y;
    } });

    W.addEventListener('load', function () { ST.refresh(); });
  }

  if (d.readyState === 'complete') start(); else W.addEventListener('load', start);
})();
