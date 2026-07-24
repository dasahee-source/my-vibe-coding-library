// 입문용 카드 게임 4종. 각 모듈은 mount(root) 하나만 노출한다.
// 난이도 순서: 워(선택 없음) → 하이로우(선택 하나) → 메모리(상태 관리) → 원카드(규칙 분기)

const G_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const G_SUITS = ['spade', 'heart', 'diamond', 'club'];
const G_VALUE = { A: 14, K: 13, Q: 12, J: 11, 10: 10, 9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2 };

function freshDeck52() {
  const d = [];
  for (const s of G_SUITS) for (const r of G_RANKS) d.push({ rank: r, suit: s });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function faceEl(card, cls = '') {
  const el = document.createElement('div');
  el.className = 'card ' + cls;
  el.innerHTML = card ? cardSVG(card.rank, card.suit) : BACK_SVG;
  return el;
}

const SUIT_KR = { spade: '스페이드', heart: '하트', diamond: '다이아', club: '클럽' };

// ══ 1. 워 ═══════════════════════════════════════════════════
// 플레이어의 선택이 하나도 없는 게임. 셔플과 큐만으로 완성된다.
function mountWar(root) {
  root.innerHTML = `
    <div class="zone"><h2>상대</h2>
      <div class="cards" id="wOpp"></div>
      <div class="total" id="wOppN">26장</div></div>
    <div class="zone"><h2>나</h2>
      <div class="cards" id="wMe"></div>
      <div class="total" id="wMeN">26장</div></div>
    <div class="row" id="wCtl"></div>
    <p class="msg" id="wMsg">카드를 뒤집으세요. 높은 쪽이 두 장 다 가져갑니다.</p>
    <div class="rules">선택지가 없는 게임입니다. 그래서 셔플·비교·큐 처리만으로 완성되고,
      코드가 가장 짧습니다. 무승부가 나면 각자 3장을 덮어놓고 4번째 카드로 다시 겨루는
      <b>워</b>가 발생합니다.</div>`;

  const $ = (id) => document.getElementById(id);
  let me = [], opp = [], busy = false;

  function start() {
    const d = freshDeck52();
    me = d.slice(0, 26); opp = d.slice(26);
    busy = false;
    $('wMsg').textContent = '카드를 뒤집으세요. 높은 쪽이 두 장 다 가져갑니다.';
    show(null, null);
  }

  function show(a, b) {
    $('wMe').innerHTML = ''; $('wOpp').innerHTML = '';
    $('wMe').appendChild(a ? faceEl(a) : faceEl(null));
    $('wOpp').appendChild(b ? faceEl(b) : faceEl(null));
    $('wMeN').textContent = me.length + '장';
    $('wOppN').textContent = opp.length + '장';
    ctl();
  }

  function ctl() {
    const c = $('wCtl'); c.innerHTML = '';
    const over = !me.length || !opp.length;
    const b = document.createElement('button');
    b.className = 'go'; b.textContent = over ? '새 게임' : '뒤집기';
    b.disabled = busy;
    b.onclick = over ? start : () => flip();   // 직접 참조하면 Event가 pot으로 들어온다
    c.appendChild(b);
    if (!over) {
      const a = document.createElement('button');
      a.textContent = '10판 연속'; a.disabled = busy;
      a.onclick = () => auto(10);
      c.appendChild(a);
    }
  }

  function flip(pot = []) {
    if (!me.length || !opp.length) return;
    const a = me.shift(), b = opp.shift();
    pot.push(a, b);
    show(a, b);
    const va = G_VALUE[a.rank], vb = G_VALUE[b.rank];
    if (va > vb) { me.push(...pot); $('wMsg').innerHTML = `<b>내가 획득</b> ${pot.length}장`; }
    else if (vb > va) { opp.push(...pot); $('wMsg').innerHTML = `상대가 획득 ${pot.length}장`; }
    else {
      $('wMsg').innerHTML = '<b>워!</b> 각자 3장을 덮고 다시 겨룹니다.';
      for (let i = 0; i < 3; i++) {
        if (me.length > 1) pot.push(me.shift());
        if (opp.length > 1) pot.push(opp.shift());
      }
      if (me.length && opp.length) {
        busy = true;
        setTimeout(() => { if (!root.isConnected) return; busy = false; flip(pot); }, 600);
        return;
      }
    }
    show(a, b);
    if (!me.length) $('wMsg').innerHTML = '카드가 떨어졌습니다 — <b>패배</b>';
    if (!opp.length) $('wMsg').innerHTML = '상대 카드가 떨어졌습니다 — <b>승리</b>';
  }

  function auto(n) {
    busy = true;
    let i = 0;
    const tick = () => {
      if (!root.isConnected) return;   // 게임 선택으로 빠져나간 경우
      if (i++ >= n || !me.length || !opp.length) { busy = false; ctl(); return; }
      busy = false; flip(); busy = true;
      setTimeout(tick, 420);
    };
    tick();
  }

  start();
}

// ══ 2. 하이로우 ═════════════════════════════════════════════
// 선택이 하나뿐인데, 그 하나를 잘하려면 남은 카드를 세야 한다.
function mountHighLow(root) {
  root.innerHTML = `
    <div class="zone"><h2>현재 카드</h2>
      <div class="cards" id="hCard"></div>
      <div class="total" id="hStreak">연속 0 · 최고 0</div></div>
    <div class="zone"><h2>남은 덱에서의 확률</h2>
      <div id="hProb" class="probs"></div></div>
    <div class="row" id="hCtl"></div>
    <p class="msg" id="hMsg">다음 카드가 높을지 낮을지 고르세요.</p>
    <div class="rules">확률은 <b>남은 카드를 실제로 세서</b> 계산합니다.
      뽑힌 카드가 덱에서 빠지므로 매번 값이 달라집니다 — 조건부 확률이 눈에 보이는 예제입니다.
      같은 숫자가 나오면 무승부로 넘어갑니다.</div>`;

  const $ = (id) => document.getElementById(id);
  let deck = [], cur = null, streak = 0, best = 0;

  function start() {
    deck = freshDeck52();
    cur = deck.pop();
    streak = 0;
    render('다음 카드가 높을지 낮을지 고르세요.');
  }

  function counts() {
    const v = G_VALUE[cur.rank];
    let hi = 0, lo = 0, eq = 0;
    for (const c of deck) {
      const x = G_VALUE[c.rank];
      if (x > v) hi++; else if (x < v) lo++; else eq++;
    }
    return { hi, lo, eq, n: deck.length };
  }

  function render(msg) {
    $('hCard').innerHTML = '';
    $('hCard').appendChild(faceEl(cur));
    $('hStreak').textContent = `연속 ${streak} · 최고 ${best}`;
    const { hi, lo, eq, n } = counts();
    const pct = (x) => n ? (x / n * 100).toFixed(1) + '%' : '—';
    $('hProb').innerHTML =
      `<div class="pbar"><span>높다</span><i style="width:${n ? hi / n * 100 : 0}%"></i>` +
      `<b>${pct(hi)}</b><em>${hi}장</em></div>` +
      `<div class="pbar"><span>같다</span><i style="width:${n ? eq / n * 100 : 0}%"></i>` +
      `<b>${pct(eq)}</b><em>${eq}장</em></div>` +
      `<div class="pbar"><span>낮다</span><i style="width:${n ? lo / n * 100 : 0}%"></i>` +
      `<b>${pct(lo)}</b><em>${lo}장</em></div>`;
    if (msg) $('hMsg').innerHTML = msg;

    const c = $('hCtl'); c.innerHTML = '';
    const mk = (label, cls, fn, dis) => {
      const b = document.createElement('button');
      b.textContent = label; if (cls) b.className = cls;
      b.disabled = !!dis; b.onclick = fn; c.appendChild(b);
    };
    if (!deck.length) { mk('새 게임', 'go', start); return; }
    mk('높다', 'go', () => guess('hi'));
    mk('낮다', '', () => guess('lo'));
    mk('새 게임', '', start);
  }

  function guess(pick) {
    const prev = cur;
    cur = deck.pop();
    const a = G_VALUE[prev.rank], b = G_VALUE[cur.rank];
    let msg;
    if (a === b) msg = `${prev.rank} → ${cur.rank} · 같은 숫자, 무승부`;
    else if ((b > a) === (pick === 'hi')) {
      streak++; best = Math.max(best, streak);
      msg = `${prev.rank} → ${cur.rank} · <b>적중</b>`;
    } else {
      msg = `${prev.rank} → ${cur.rank} · 실패, 연속 ${streak}에서 끊김`;
      streak = 0;
    }
    render(msg + (deck.length ? '' : ' · 덱을 모두 사용했습니다'));
  }

  start();
}

// ══ 3. 메모리 ══════════════════════════════════════════════
// 게임 로직은 거의 없고, 전부 상태 관리 연습이다.
function mountMemory(root) {
  root.innerHTML = `
    <div class="zone"><h2>짝을 찾으세요</h2>
      <div class="grid16" id="mGrid"></div></div>
    <div class="row" id="mCtl"></div>
    <p class="msg" id="mMsg">카드를 두 장 뒤집어 같은 숫자를 찾으세요.</p>
    <div class="rules">카드 한 장이 가지는 상태는 <code>덮임</code>, <code>뒤집힘</code>,
      <code>맞춤</code> 세 가지입니다. 여기에 "두 장이 뒤집힌 동안은 입력을 막는다"는
      잠금 상태가 하나 더 붙습니다. 화면과 데이터를 분리하지 않으면 금방 엉키는 구조라
      상태 관리 연습에 좋습니다.</div>`;

  const $ = (id) => document.getElementById(id);
  let tiles = [], open = [], lock = false, moves = 0, found = 0;

  function start() {
    const d = freshDeck52().slice(0, 8);
    const pairs = [];
    for (const c of d) {
      const other = G_SUITS.find((s) => s !== c.suit);
      pairs.push({ ...c }, { rank: c.rank, suit: other });
    }
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    tiles = pairs.map((c) => ({ card: c, state: 'down' }));
    open = []; lock = false; moves = 0; found = 0;
    say('카드를 두 장 뒤집어 같은 숫자를 찾으세요.');
    render();
  }

  function say(html) { $('mMsg').innerHTML = html; }

  function render() {
    const g = $('mGrid');
    g.innerHTML = '';
    tiles.forEach((t, i) => {
      const el = document.createElement('button');
      el.className = 'tilecard' + (t.state === 'matched' ? ' matched' : '');
      el.setAttribute('aria-label', t.state === 'down' ? '덮인 카드' : `${t.card.rank}`);
      el.innerHTML = t.state === 'down' ? BACK_SVG : cardSVG(t.card.rank, t.card.suit);
      el.onclick = () => pick(i);
      g.appendChild(el);
    });
    const c = $('mCtl'); c.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'go'; b.textContent = '새 게임'; b.onclick = start;
    c.appendChild(b);
    const s = document.createElement('span');
    s.className = 'msg'; s.style.margin = '0 0 0 6px';
    s.textContent = `시도 ${moves} · 맞춘 짝 ${found}/8`;
    c.appendChild(s);
  }

  function pick(i) {
    const t = tiles[i];
    if (lock || t.state !== 'down' || open.length >= 2) return;
    t.state = 'up';
    open.push(i);
    render();
    if (open.length < 2) return;

    moves++;
    const [a, b] = open;
    if (tiles[a].card.rank === tiles[b].card.rank) {
      tiles[a].state = tiles[b].state = 'matched';
      open = []; found++;
      say(`<b>${tiles[a].card.rank}</b> 짝을 찾았습니다.`);
      render();
      if (found === 8) say(`<b>완료!</b> ${moves}번 만에 모두 찾았습니다.`);
    } else {
      lock = true;
      say('다릅니다. 다시 덮습니다.');
      setTimeout(() => {
        if (!root.isConnected) return;
        tiles[a].state = tiles[b].state = 'down';
        open = []; lock = false;
        render();
      }, 800);
    }
  }

  start();
}

// ══ 4. 원카드 ══════════════════════════════════════════════
// 특수 카드마다 다른 동작을 붙이는 구조. 규칙 분기 연습.
function mountOneCard(root) {
  root.innerHTML = `
    <div class="zone"><h2>상대</h2>
      <div class="cards" id="oOpp"></div></div>
    <div class="zone"><h2>바닥</h2>
      <div class="cards" id="oTop"></div>
      <div class="total" id="oState"></div></div>
    <div class="zone"><h2>내 패</h2>
      <div class="cards" id="oHand"></div></div>
    <div class="row" id="oCtl"></div>
    <p class="msg" id="oMsg"></p>
    <div class="rules">특수 카드 — <code>A</code> 3장 공격 · <code>2</code> 2장 공격 ·
      <code>7</code> 무늬 지정 · <code>J</code> <code>Q</code> <code>K</code> 한 번 더.
      공격을 받으면 같은 종류의 공격 카드로 받아칠 수 있고, 못 받아치면 쌓인 만큼 가져옵니다.</div>`;

  const $ = (id) => document.getElementById(id);
  let deck = [], mine = [], theirs = [], top = null, wildSuit = null;
  let attack = 0, turn = 0, over = false, picking = false;

  function start() {
    deck = freshDeck52();
    mine = deck.splice(0, 7);
    theirs = deck.splice(0, 7);
    do { top = deck.pop(); } while (['A', '2', '7', 'J', 'Q', 'K'].includes(top.rank));
    wildSuit = null; attack = 0; turn = 0; over = false; picking = false;
    say('같은 숫자나 같은 무늬를 내세요.');
    render();
  }

  const activeSuit = () => wildSuit || top.suit;
  const isAttack = (c) => c.rank === 'A' || c.rank === '2';
  const again = (c) => ['J', 'Q', 'K'].includes(c.rank);

  function legal(c) {
    if (attack > 0) return isAttack(c);   // 공격 중에는 받아치기만
    return c.rank === top.rank || c.suit === activeSuit();
  }

  function say(html) { $('oMsg').innerHTML = html; }

  function render() {
    $('oOpp').innerHTML = '';
    theirs.forEach(() => $('oOpp').appendChild(faceEl(null, 'sm')));
    $('oTop').innerHTML = '';
    $('oTop').appendChild(faceEl(top));
    $('oState').innerHTML =
      `무늬 <b>${SUIT_KR[activeSuit()]}</b>` +
      (wildSuit ? ' <span class="soft">지정됨</span>' : '') +
      (attack ? ` · <span class="bust">공격 ${attack}장</span>` : '') +
      ` · 덱 ${deck.length}장 · 상대 ${theirs.length}장`;

    const h = $('oHand'); h.innerHTML = '';
    mine.forEach((c, i) => {
      const el = faceEl(c, legal(c) && turn === 0 && !over && !picking ? 'playable' : 'dull');
      el.tabIndex = 0;
      el.onclick = () => play(i);
      el.onkeydown = (e) => { if (e.key === 'Enter') play(i); };
      h.appendChild(el);
    });

    const c = $('oCtl'); c.innerHTML = '';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.textContent = label; if (cls) b.className = cls; b.onclick = fn; c.appendChild(b);
    };
    if (over) { mk('새 게임', 'go', start); return; }
    if (picking) {
      for (const s of G_SUITS) mk(SUIT_KR[s], '', () => { wildSuit = s; picking = false; endTurn(); });
      return;
    }
    if (turn === 0) {
      const can = mine.some(legal);
      mk(attack ? `${attack}장 받기` : '한 장 가져오기', can ? '' : 'go', drawPenalty);
    }
    mk('새 게임', '', start);
  }

  function drawPenalty() {
    const n = attack || 1;
    for (let i = 0; i < n; i++) { if (!deck.length) reshuffle(); if (deck.length) mine.push(deck.pop()); }
    say(attack ? `공격을 받아 ${n}장 가져왔습니다.` : '한 장 가져왔습니다.');
    attack = 0;
    endTurn();
  }

  function reshuffle() {
    if (deck.length) return;
    deck = freshDeck52().filter((c) => !mine.some((m) => m.rank === c.rank && m.suit === c.suit));
  }

  function play(i) {
    if (turn !== 0 || over || picking) return;
    const c = mine[i];
    if (!legal(c)) { say(attack ? '공격 중에는 A나 2로만 받아칠 수 있습니다.' : '낼 수 없는 카드입니다.'); return; }
    mine.splice(i, 1);
    top = c; wildSuit = null;
    if (isAttack(c)) attack += c.rank === 'A' ? 3 : 2;
    if (mine.length === 0) { over = true; say('<b>승리!</b> 카드를 모두 냈습니다.'); render(); return; }
    if (c.rank === '7') { picking = true; say('무늬를 지정하세요.'); render(); return; }
    if (again(c)) { say(`${c.rank} — 한 번 더 냅니다.`); render(); return; }
    endTurn();
  }

  function endTurn() {
    turn = 1;
    render();
    setTimeout(() => { if (root.isConnected) oppTurn(); }, 700);
  }

  function oppTurn() {
    if (over) return;
    // 상대 전략: 낼 수 있으면 특수 카드를 먼저, 없으면 가져온다
    const playable = theirs.map((c, i) => ({ c, i })).filter(({ c }) =>
      attack > 0 ? isAttack(c) : (c.rank === top.rank || c.suit === activeSuit()));
    if (!playable.length) {
      const n = attack || 1;
      for (let k = 0; k < n; k++) { if (!deck.length) reshuffle(); if (deck.length) theirs.push(deck.pop()); }
      say(attack ? `상대가 ${n}장 가져갔습니다.` : '상대가 한 장 가져갔습니다.');
      attack = 0;
      turn = 0; render(); return;
    }
    playable.sort((x, y) => (isAttack(y.c) ? 2 : again(y.c) ? 1 : 0) - (isAttack(x.c) ? 2 : again(x.c) ? 1 : 0));
    const { c, i } = playable[0];
    theirs.splice(i, 1);
    top = c; wildSuit = null;
    if (isAttack(c)) attack += c.rank === 'A' ? 3 : 2;
    say(`상대가 ${c.rank} ${SUIT_KR[c.suit]}를 냈습니다.`);
    if (!theirs.length) { over = true; say('<b>패배</b> — 상대가 카드를 모두 냈습니다.'); render(); return; }
    if (c.rank === '7') {
      const counts = {};
      for (const t of theirs) counts[t.suit] = (counts[t.suit] || 0) + 1;
      wildSuit = G_SUITS.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
      say(`상대가 7을 내고 ${SUIT_KR[wildSuit]}로 바꿨습니다.`);
    }
    if (again(c)) { render(); setTimeout(() => { if (root.isConnected) oppTurn(); }, 700); return; }
    turn = 0;
    render();
  }

  start();
}
