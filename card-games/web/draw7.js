// 카드운세.
// 뒤집힌 52장 중 7장을 고르면 그 자리에서 열리고, 최선의 5장과 그 희귀도를 설명한다.
// 평가기는 홀덤과 같은 것을 쓴다 — 게임이 달라도 규칙 모듈은 하나면 된다.

// 7장으로 만든 최선의 족보가 각 카테고리일 확률 (%). 100만 회 시뮬레이션으로 검증한 값.
const HAND_ODDS = [17.41, 43.82, 23.50, 4.83, 4.62, 3.03, 2.60, 0.168, 0.0311];

const WHY = {
  8: '같은 무늬 5장이 연속으로 이어졌습니다. 포커에서 가장 높은 족보입니다.',
  7: '같은 숫자가 네 장 모였습니다.',
  6: '같은 숫자 세 장과 다른 숫자 두 장이 함께 모였습니다.',
  5: '같은 무늬가 다섯 장 모였습니다. 숫자는 이어지지 않아도 됩니다.',
  4: '숫자 다섯 개가 연속으로 이어졌습니다. 무늬는 달라도 됩니다.',
  3: '같은 숫자가 세 장 모였습니다.',
  2: '같은 숫자 두 장짜리 짝이 두 벌 나왔습니다.',
  1: '같은 숫자 두 장이 짝을 이뤘습니다.',
  0: '짝도 연속도 같은 무늬도 없어, 가장 높은 카드로만 겨룹니다.',
};

function luckGrade(betterPct) {
  if (betterPct < 0.2) return { label: '경이로운 행운', tone: 'gold' };
  if (betterPct < 3) return { label: '아주 운이 좋음', tone: 'gold' };
  if (betterPct < 10) return { label: '운이 좋음', tone: 'good' };
  if (betterPct < 35) return { label: '평범', tone: 'flat' };
  return { label: '아쉬움', tone: 'flat' };
}

function mountDraw7(root) {
  root.innerHTML = `
    <div class="zone">
      <h2 id="dHead">덮인 카드 52장 — 일곱 장을 고르세요</h2>
      <div class="deckgrid" id="dGrid"></div>
    </div>
    <div class="zone" id="dResultZone" style="display:none">
      <h2>뽑은 일곱 장</h2>
      <div class="cards" id="dPicked"></div>
      <div id="dReport"></div>
    </div>
    <div class="row" id="dCtl"></div>
    <p class="msg" id="dMsg">어느 자리에 무엇이 있는지는 아무도 모릅니다.</p>
    <div class="rules">확률은 <b>7장으로 만든 최선의 5장</b> 기준입니다.
      5장만 받는 경우와는 값이 다릅니다 — 장수가 늘면 좋은 족보가 나올 여지도 늘어나기 때문입니다.
      표시된 수치는 100만 회 시뮬레이션으로 확인한 값입니다.
      <span id="dTally"></span>
    </div>`;

  const $ = (id) => document.getElementById(id);
  let deck = [], picked = [], done = false;
  let draws = 0, bestSoFar = -1, bestName = '';

  function start() {
    deck = freshDeck52();
    picked = []; done = false;
    $('dResultZone').style.display = 'none';
    $('dHead').textContent = '덮인 카드 52장 — 일곱 장을 고르세요';
    say('어느 자리에 무엇이 있는지는 아무도 모릅니다.');
    render();
  }

  function say(html) { $('dMsg').innerHTML = html; }

  function render() {
    const g = $('dGrid');
    g.innerHTML = '';
    deck.forEach((c, i) => {
      const el = document.createElement('button');
      const chosen = picked.includes(i);
      el.className = 'slot' + (chosen ? ' chosen' : '');
      el.innerHTML = chosen || done ? cardSVG(c.rank, c.suit) : BACK_SVG;
      el.disabled = done || chosen;
      el.setAttribute('aria-label', chosen ? `${c.rank} 선택됨` : `${i + 1}번 자리`);
      el.onclick = () => pick(i);
      g.appendChild(el);
    });

    const c = $('dCtl'); c.innerHTML = '';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.textContent = label; if (cls) b.className = cls; b.onclick = fn; c.appendChild(b);
    };
    if (!done) {
      mk('무작위로 채우기', '', fillRandom);
      if (picked.length) mk('선택 취소', '', () => { picked = []; render(); say('다시 고르세요.'); });
    } else {
      mk('다시 뽑기', 'go', start);
    }

    $('dTally').innerHTML = draws
      ? ` 지금까지 <b>${draws}회</b> 뽑았고, 최고 기록은 <b>${bestName}</b>입니다.`
      : '';
  }

  function fillRandom() {
    while (picked.length < 7) {
      const i = Math.floor(Math.random() * 52);
      if (!picked.includes(i)) picked.push(i);
    }
    render();
    reveal();
  }

  function pick(i) {
    if (done || picked.includes(i)) return;
    picked.push(i);
    if (picked.length < 7) {
      say(`${picked.length}장 선택 — ${7 - picked.length}장 남았습니다.`);
      render();
      return;
    }
    render();
    reveal();
  }

  function reveal() {
    done = true;
    draws++;
    const cards = picked.map((i) => deck[i]);
    const r = evaluate(cards);

    if (r.score > bestSoFar) { bestSoFar = r.score; bestName = r.name; }

    const key = (c) => c.rank + c.suit;
    const bestSet = new Set(r.best.map(key));
    const unused = cards.filter((c) => !bestSet.has(key(c)));

    $('dHead').textContent = '뽑은 자리';
    $('dResultZone').style.display = '';
    const row = $('dPicked');
    row.innerHTML = '';
    cards.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'card' + (bestSet.has(key(c)) ? ' best' : ' dull');
      el.innerHTML = cardSVG(c.rank, c.suit);
      row.appendChild(el);
    });

    const odds = HAND_ODDS[r.category];
    const better = HAND_ODDS.slice(r.category + 1).reduce((a, b) => a + b, 0);
    const grade = luckGrade(better);
    const oneIn = Math.round(100 / odds);

    $('dReport').innerHTML = `
      <div class="verdictbox ${grade.tone}">
        <div class="vname">${r.name}</div>
        <div class="vgrade">${grade.label}</div>
      </div>
      <p class="vwhy">${WHY[r.category]}</p>
      <div class="odds">
        <div><span>이 족보가 나올 확률</span><b>${odds}%</b><em>약 ${oneIn}번에 한 번</em></div>
        <div><span>이보다 좋은 패가 나올 확률</span><b>${better.toFixed(2)}%</b>
             <em>${better < 50 ? '상위 ' + better.toFixed(1) + '%' : '흔한 편'}</em></div>
      </div>
      <p class="vwhy">금색 테두리 다섯 장이 <b>21가지 조합 중 선택된 최선</b>입니다.` +
      (unused.length
        ? ` 나머지 ${unused.map((c) => c.rank).join('·')}는 쓰이지 않았습니다.`
        : '') + '</p>';

    say(`<b>${r.name}</b> — ${grade.label}`);
    render();
  }

  start();
}
