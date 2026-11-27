/*!
 * 閲覧トラッキング（診断書・デモ共通）
 * <script src="assets/track.js" data-endpoint="GASウェブアプリURL" data-t="案件トークン" defer></script>
 *
 * 送るイベント:
 *   view  … ページを開いた（パス・タイトル）
 *   leave … ページを離れた／タブを隠した（表示されていた秒数・最大スクロール率）
 * 送信は sendBeacon（不可なら fetch no-cors）。Content-Type は text/plain でプリフライトを避ける。
 * URLに ?preview=1 を付けて開くと、そのブラウザは以後計測しない（自分の確認用）。
 */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var ep = s.getAttribute('data-endpoint');
  var t = s.getAttribute('data-t');
  if (!ep || !t) return;
  try {
    if (/[?&]preview=1/.test(location.search)) localStorage.setItem('jl_optout', '1');
    if (localStorage.getItem('jl_optout') === '1') return;
  } catch (e) {}

  var vid = 'na';
  try {
    vid = localStorage.getItem('jl_vid');
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('jl_vid', vid);
    }
  } catch (e) {}

  function send(o) {
    o.t = t;
    o.vid = vid;
    o.path = location.pathname;
    o.title = document.title;
    o.ua = navigator.userAgent;
    var body = JSON.stringify(o);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ep, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return;
    } catch (e) {}
    try {
      fetch(ep, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body });
    } catch (e) {}
  }

  var maxScroll = 0;
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var top = h.scrollTop || document.body.scrollTop || 0;
    var p = max <= 0 ? 100 : Math.round((top / max) * 100);
    if (p > maxScroll) maxScroll = Math.min(100, p);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var visibleMs = 0;
  var lastShow = Date.now();
  var hidden = document.visibilityState === 'hidden';
  function leave() {
    if (hidden) return;
    visibleMs += Date.now() - lastShow;
    hidden = true;
    var sec = Math.round(visibleMs / 1000);
    visibleMs = 0;
    if (sec > 0) send({ ev: 'leave', sec: sec, scroll: maxScroll });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') leave();
    else {
      hidden = false;
      lastShow = Date.now();
    }
  });
  window.addEventListener('pagehide', leave);

  // 人が操作した印（巡回ロボットとの見分けに使う）。最初の1回だけ送る
  var acted = false;
  function act() {
    if (acted) return;
    acted = true;
    send({ ev: 'act' });
  }
  ['touchstart', 'pointerdown', 'keydown', 'wheel'].forEach(function (n) {
    window.addEventListener(n, act, { passive: true, once: true });
  });

  send({ ev: 'view' });
})();
