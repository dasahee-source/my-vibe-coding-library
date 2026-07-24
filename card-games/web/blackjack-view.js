// 블랙잭 화면. 엔진은 위쪽에 전역으로 로드되어 있고 여기서는 표시만 담당한다.
function mountBlackjack(root) {
  root.innerHTML = `<div class="zone">
    <h2>딜러</h2>
    <div class="cards" id="dealerCards"></div>
    <div class="total" id="dealerTotal">—</div>
  </div>

  <div class="zone">
    <h2>내 패</h2>
    <div id="seats"></div>
  </div>

  <div class="row" id="controls"></div>
  <div id="coach"></div>
  <p class="msg" id="msg">칩을 고르고 딜을 누르세요.</p>

  <div class="rules">
    <label class="sw"><input type="checkbox" id="hint" checked> 기본 전략 코치 표시</label><br>
    규칙 — 덱 <code>6벌</code> · 딜러 소프트 17 <code>스탠드</code> · 블랙잭 <code>3:2</code> ·
    더블 후 스플릿 <code>허용</code> · 스플릿 <code>4핸드</code>까지 · 레이트 서렌더 <code>허용</code><br>
    이 규칙 조합의 하우스 엣지는 약 <b id="edge">0.5%</b>입니다. 기본 전략대로만 쳤을 때의 값이고,
    시뮬레이션 20만 판에서 0.508%로 확인했습니다.
    <span id="acc"></span>
  </div>`;

  const $ = (id) => document.getElementById(id);
  const money = (n) => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString();

  let bank = 1000, pl = 0, bet = 25;
  let shoe = new Shoe(RULES.decks);
  let round = null, revealed = false;
  let followed = 0, decided = 0;

  function cardEl(card, faceDown = false) {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = faceDown ? BACK_SVG : cardSVG(card.rank, card.suit);
    return d;
  }

  function totalText(cards, hidden = false) {
    if (hidden) {
      const v = handValue([cards[0]]);
      return `<span>${v.total}</span> <span class="soft">+ ?</span>`;
    }
    const v = handValue(cards);
    if (v.busted) return `<span class="bust">${v.total} 버스트</span>`;
    if (isBlackjack(cards)) return `<span>21</span> <span class="soft">블랙잭</span>`;
    return `<span>${v.total}</span>` + (v.soft ? ' <span class="soft">소프트</span>' : '');
  }

  function render() {
    $('bank').textContent = money(bank);
    const plEl = $('pl');
    plEl.textContent = (pl > 0 ? '+' : '') + money(pl);
    plEl.className = pl > 0 ? 'up' : pl < 0 ? 'dn' : '';
    $('shoe').textContent = shoe.remaining;

    const dc = $('dealerCards');
    dc.innerHTML = '';
    if (round) {
      const hide = !revealed && round.dealer.length === 2;
      round.dealer.forEach((c, i) => dc.appendChild(cardEl(c, hide && i === 1)));
      $('dealerTotal').innerHTML = totalText(round.dealer, hide);
    } else {
      $('dealerTotal').textContent = '—';
    }

    const seats = $('seats');
    seats.innerHTML = '';
    if (!round) {
      seats.innerHTML = '<p class="msg" style="margin:0">베팅을 기다리는 중입니다.</p>';
    } else {
      round.hands.forEach((h, i) => {
        const box = document.createElement('div');
        box.className = 'seat' + (round.phase === 'player' && i === round.active ? ' on' : '');
        const label = round.hands.length > 1 ? `핸드 ${i + 1} · ` : '';
        box.innerHTML = `<div class="tag">${label}베팅 <b>${money(h.bet)}</b>` +
          (h.doubled ? ' · 더블' : '') + (h.surrendered ? ' · 서렌더' : '') + '</div>';
        const cr = document.createElement('div');
        cr.className = 'cards';
        h.cards.forEach((c) => cr.appendChild(cardEl(c)));
        box.appendChild(cr);
        const tot = document.createElement('div');
        tot.className = 'total';
        tot.innerHTML = totalText(h.cards);
        box.appendChild(tot);
        if (h.verdict) {
          const v = document.createElement('div');
          v.className = 'verdict';
          v.style.color = h.delta > 0 ? '#6fd39f' : h.delta < 0 ? '#ff8a7a' : 'var(--dim)';
          v.textContent = `${h.verdict}  ${h.delta > 0 ? '+' : ''}${money(h.delta)}`;
          box.appendChild(v);
        }
        seats.appendChild(box);
      });
    }

    buildControls();
    buildCoach();
    $('acc').innerHTML = decided
      ? ` 이번 세션 전략 일치율 <b>${Math.round(followed / decided * 100)}%</b> (${followed}/${decided})`
      : '';
  }

  function btn(label, cls, fn, disabled = false) {
    const b = document.createElement('button');
    b.textContent = label;
    if (cls) b.className = cls;
    b.disabled = disabled;
    b.onclick = fn;
    return b;
  }

  function buildControls() {
    const c = $('controls');
    c.innerHTML = '';

    if (!round) {
      for (const v of [10, 25, 100]) {
        const b = btn(String(v), `chip c${v}` + (bet === v ? ' on' : ''), () => { bet = v; render(); });
        c.appendChild(b);
      }
      c.appendChild(btn('딜', 'go', deal, bank < bet));
      if (bank < 10) c.appendChild(btn('자금 리셋', '', () => { bank = 1000; pl = 0; render(); }));
      return;
    }

    if (round.phase === 'insurance') {
      const half = Math.floor(round.hands[0].bet / 2);
      c.appendChild(btn(`인슈어런스 ${money(half)}`, '', () => takeIns(half)));
      c.appendChild(btn('사지 않음', 'go', () => takeIns(0)));
      return;
    }

    if (round.phase === 'player') {
      const o = round.options();
      c.appendChild(btn('히트', '', () => move('hit'), !o.includes('hit')));
      c.appendChild(btn('스탠드', 'go', () => move('stand'), !o.includes('stand')));
      c.appendChild(btn('더블', '', () => move('double'), !o.includes('double') || bank < round.hand.bet));
      c.appendChild(btn('스플릿', '', () => move('split'), !o.includes('split') || bank < round.hand.bet));
      c.appendChild(btn('서렌더', 'warn', () => move('surrender'), !o.includes('surrender')));
      return;
    }

    c.appendChild(btn('다음 판', 'go', () => { round = null; revealed = false; render(); }));
  }

  function buildCoach() {
    const box = $('coach');
    box.innerHTML = '';
    if (!$('hint').checked || !round || round.phase !== 'player') return;
    const o = round.options();
    const a = basicStrategy(round.hand.cards, round.upcard, {
      canDouble: o.includes('double'), canSplit: o.includes('split'),
      canSurrender: o.includes('surrender'),
    });
    const d = document.createElement('div');
    d.className = 'coach';
    d.innerHTML = `기본 전략: <b>${a.label}</b>` + (a.why ? `<br><span class="why">${a.why}</span>` : '');
    box.appendChild(d);
  }

  function recommended() {
    const o = round.options();
    return basicStrategy(round.hand.cards, round.upcard, {
      canDouble: o.includes('double'), canSplit: o.includes('split'),
      canSurrender: o.includes('surrender'),
    }).code;
  }

  function deal() {
    if (shoe.needsShuffle) { shoe.shuffle(); say('슈를 새로 섞었습니다.'); }
    bank -= bet;                      // 판돈은 딜 시점에 빠져나간다
    round = new Round(shoe, bet).deal();
    revealed = false;
    if (round.phase === 'settle') { finish(); return; }
    if (round.phase === 'insurance') say('딜러 업카드가 에이스입니다. 인슈어런스를 살 수 있습니다.');
    else say('');
    render();
  }

  function takeIns(amount) {
    if (amount) bank -= amount;
    round.takeInsurance(amount);
    if (round.phase === 'settle') { finish(); return; }
    say(amount ? '인슈어런스를 걸었습니다.' : '');
    render();
  }

  const CODE = { hit: 'H', stand: 'S', double: 'D', split: 'P', surrender: 'R' };

  function move(action) {
    const want = recommended();
    decided++;
    if (CODE[action] === want) followed++;

    if (action === 'double' || action === 'split') bank -= round.hand.bet;
    round[action]();

    if (round.phase === 'dealer') {
      revealed = true;
      round.playDealer();
    }
    if (round.phase === 'settle') { finish(); return; }
    render();
  }

  function finish() {
    revealed = true;
    if (round.phase === 'dealer') round.playDealer();
    const r = round.settle();

    let hi = 0;
    for (const item of r.results) {
      if (item.kind === 'hand') {
        round.hands[hi].verdict = item.text;
        round.hands[hi].delta = item.delta;
        hi++;
      }
    }
    // 판돈은 이미 빠져나가 있으므로, 되돌려받을 원금 + 순손익을 더한다.
    // delta는 원금을 제외한 손익이다 (승 +bet, 패 -bet, 푸시 0, 블랙잭 +1.5bet).
    const staked = round.hands.reduce((s, h) => s + h.bet, 0) + round.insurance;
    bank += staked + r.net;
    pl += r.net;

    const ins = r.results.find((x) => x.kind === 'insurance');
    const parts = r.results.filter((x) => x.kind === 'hand').map((x) => x.text);
    say(`딜러 ${r.dealerTotal}${r.dealerBJ ? ' 블랙잭' : ''} — ${parts.join(', ')}` +
        (ins ? ` · ${ins.text}` : '') +
        ` · <b>${r.net > 0 ? '+' : ''}${money(r.net)}</b>`);
    render();
  }

  function say(html) { $('msg').innerHTML = html; }

  $('hint').addEventListener('change', render);
  render();
}
