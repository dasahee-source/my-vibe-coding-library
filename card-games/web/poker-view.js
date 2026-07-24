// 헤즈업 홀덤 화면. 규칙을 단순화해 핸드 평가 과정이 잘 보이도록 했다.
//   앤티를 걸고 → 홀카드 2장 + 플랍 3장을 본 뒤 → 콜 또는 폴드
//   콜하면 턴·리버까지 열고 딜러와 7장씩으로 승부한다.

function mountPoker(root) {
  root.innerHTML = `
    <div class="zone">
      <h2>딜러</h2>
      <div class="cards" id="pkDealer"></div>
      <div class="total" id="pkDealerHand">—</div>
    </div>
    <div class="zone">
      <h2>공유 카드</h2>
      <div class="cards" id="pkBoard"></div>
    </div>
    <div class="zone">
      <h2>내 패</h2>
      <div class="cards" id="pkHole"></div>
      <div class="total" id="pkMyHand">—</div>
    </div>
    <div class="row" id="pkControls"></div>
    <p class="msg" id="pkMsg">앤티를 걸고 딜을 누르세요.</p>
    <div class="rules">
      금색 테두리가 <b>21가지 조합 중 선택된 최선의 5장</b>입니다.<br>
      족보는 정수 하나로 인코딩해 비교합니다 —
      <code>점수 = 카테고리 × 16⁵ + 킥커들</code>.
      덕분에 "같은 투페어면 높은 페어가 이기고, 그것도 같으면 킥커로" 같은 분기가 전부 사라집니다.
      <span id="pkStat"></span>
    </div>`;

  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = ['spade', 'heart', 'diamond', 'club'];
  const $ = (id) => document.getElementById(id);
  const money = (n) => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString();

  let bank = 1000, ante = 25, phase = 'bet';
  let deck = [], hole = [], dealer = [], board = [], staked = 0;
  let myEval = null, dEval = null, outcome = '';
  let played = 0, won = 0;

  function freshDeck() {
    const d = [];
    for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s });
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  const key = (c) => c.rank + c.suit;

  function cardEl(card, faceDown, highlight) {
    const el = document.createElement('div');
    el.className = 'card' + (highlight ? ' best' : '');
    el.innerHTML = faceDown ? BACK_SVG : cardSVG(card.rank, card.suit);
    return el;
  }

  function paint(el, cards, opts = {}) {
    el.innerHTML = '';
    const hi = new Set((opts.best || []).map(key));
    cards.forEach((c, i) => {
      const down = opts.hideAll && !opts.reveal;
      el.appendChild(cardEl(c, down, !down && hi.has(key(c))));
    });
  }

  function render() {
    const reveal = phase === 'showdown';
    paint($('pkDealer'), dealer, { hideAll: true, reveal, best: reveal && dEval ? dEval.best : [] });
    paint($('pkBoard'), board, { best: reveal && myEval ? myEval.best : [] });
    paint($('pkHole'), hole, { best: myEval ? myEval.best : [] });

    $('pkMyHand').innerHTML = myEval
      ? `<span>${myEval.name}</span>` : '—';
    $('pkDealerHand').innerHTML = reveal && dEval
      ? `<span>${dEval.name}</span>` : (dealer.length ? '<span class="soft">비공개</span>' : '—');

    $('pkStat').innerHTML = played
      ? ` 이번 세션 <b>${won}승 / ${played}판</b>` : '';

    const c = $('pkControls');
    c.innerHTML = '';
    const btn = (label, cls, fn, dis) => {
      const b = document.createElement('button');
      b.textContent = label; if (cls) b.className = cls;
      b.disabled = !!dis; b.onclick = fn; c.appendChild(b);
    };

    if (phase === 'bet') {
      for (const v of [10, 25, 100]) {
        btn(String(v), `chip c${v}` + (ante === v ? ' on' : ''), () => { ante = v; render(); });
      }
      btn('딜', 'go', deal, bank < ante * 3);
      if (bank < 30) btn('자금 리셋', '', () => { bank = 1000; render(); });
    } else if (phase === 'decide') {
      btn(`콜 (${money(ante * 2)} 추가)`, 'go', call, bank < ante * 2);
      btn('폴드', 'warn', fold);
    } else {
      btn('다음 판', 'go', reset);
    }

    document.getElementById('pkBank').textContent = money(bank);
  }

  function deal() {
    deck = freshDeck();
    hole = [deck.pop(), deck.pop()];
    dealer = [deck.pop(), deck.pop()];
    board = [deck.pop(), deck.pop(), deck.pop()];
    bank -= ante; staked = ante;
    myEval = evaluate([...hole, ...board]);
    dEval = null; outcome = '';
    phase = 'decide';
    say(`플랍까지 <b>${myEval.name}</b>. 콜하면 턴과 리버를 봅니다.`);
    render();
  }

  function fold() {
    phase = 'showdown';
    played++;
    dEval = evaluate([...dealer, ...board]);
    say(`폴드 — 앤티 <b>${money(ante)}</b>를 잃었습니다.`);
    render();
  }

  function call() {
    bank -= ante * 2; staked += ante * 2;
    board.push(deck.pop(), deck.pop());
    myEval = evaluate([...hole, ...board]);
    dEval = evaluate([...dealer, ...board]);
    phase = 'showdown';
    played++;

    let net;
    if (myEval.score > dEval.score) { net = staked; won++; outcome = '승'; }
    else if (myEval.score < dEval.score) { net = -staked; outcome = '패'; }
    else { net = 0; outcome = '무승부'; }
    bank += staked + net;

    say(`<b>${myEval.name}</b> 대 ${dEval.name} — <b>${outcome}</b> ` +
        `${net > 0 ? '+' : ''}${money(net)}`);
    render();
  }

  function reset() {
    phase = 'bet'; hole = []; dealer = []; board = [];
    myEval = null; dEval = null;
    say('앤티를 걸고 딜을 누르세요.');
    render();
  }

  function say(html) { $('pkMsg').innerHTML = html; }

  render();
}
