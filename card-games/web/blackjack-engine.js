// 블랙잭 규칙 엔진. UI와 완전히 분리되어 있어 콘솔에서도 그대로 돌릴 수 있다.
//
// 채택한 규칙 (카지노마다 다르므로 RULES에 모아둠)
//   덱 6벌, 관통률 75% · 딜러는 소프트 17에서 스탠드(S17)
//   블랙잭 3:2 · 더블 후 스플릿 허용(DAS) · 스플릿은 4핸드까지
//   에이스 스플릿은 각 1장만 받고 종료 · 얼리 서렌더 없음(레이트만)

const RULES = {
  decks: 6,
  penetration: 0.75,
  dealerHitsSoft17: false,
  blackjackPays: 1.5,
  doubleAfterSplit: true,
  maxHands: 4,
  surrender: true,
  insurance: true,
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['spade', 'heart', 'diamond', 'club'];

function rankValue(rank) {
  if (rank === 'A') return 11;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

// 에이스를 일단 11로 세고, 21을 넘으면 하나씩 1로 내린다.
// soft = 아직 11로 쓰이는 에이스가 남아 있다는 뜻 (버스트 없이 한 장 더 받을 여지)
function handValue(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    total += rankValue(c.rank);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0, busted: total > 21 };
}

const isBlackjack = (cards) => cards.length === 2 && handValue(cards).total === 21;
const isPair = (cards) => cards.length === 2 && rankValue(cards[0].rank) === rankValue(cards[1].rank);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Shoe {
  constructor(decks = RULES.decks, seed = Math.floor(Math.random() * 1e9)) {
    this.decks = decks;
    this.rand = mulberry32(seed);
    this.cards = [];
    this.discarded = 0;
    this.shuffle();
  }
  shuffle() {
    this.cards = [];
    for (let d = 0; d < this.decks; d++) {
      for (const s of SUITS) for (const r of RANKS) this.cards.push({ rank: r, suit: s });
    }
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.total = this.cards.length;
    this.cutAt = Math.floor(this.total * (1 - RULES.penetration));
    this.needsShuffle = false;
  }
  draw() {
    if (!this.cards.length) this.shuffle();
    const c = this.cards.pop();
    if (this.cards.length <= this.cutAt) this.needsShuffle = true;
    return c;
  }
  get remaining() { return this.cards.length; }
}

// ── 기본 전략표 ────────────────────────────────────────────────
// 학생에게 보여줄 용도. H=히트 S=스탠드 D=더블(불가시 히트)
// P=스플릿 R=서렌더(불가시 히트) Ds=더블(불가시 스탠드)
function basicStrategy(hand, dealerUp, opts = {}) {
  const canDouble = opts.canDouble ?? true;
  const canSplit = opts.canSplit ?? true;
  const canSurrender = opts.canSurrender ?? true;
  const up = rankValue(dealerUp.rank) === 11 ? 11 : rankValue(dealerUp.rank);
  const { total, soft } = handValue(hand);

  const between = (lo, hi) => up >= lo && up <= hi;

  if (canSplit && isPair(hand)) {
    const r = rankValue(hand[0].rank);
    if (r === 11) return act('P', '에이스 페어는 항상 스플릿');
    if (r === 10) return act('S', '20은 나누지 않는다');
    if (r === 9) return between(2, 9) && up !== 7 ? act('P', '딜러 7에는 18로 충분') : act('S');
    if (r === 8) return act('P', '16을 깨는 유일한 방법');
    if (r === 7) return between(2, 7) ? act('P') : act('H');
    if (r === 6) return between(2, 6) ? act('P') : act('H');
    if (r === 5) return between(2, 9) ? act('D', '10으로 취급') : act('H');
    if (r === 4) return between(5, 6) ? act('P') : act('H');
    if (r === 3 || r === 2) return between(2, 7) ? act('P') : act('H');
  }

  if (soft) {
    if (total >= 19) return act('S');
    if (total === 18) {
      if (between(3, 6)) return act(canDouble ? 'D' : 'S', '소프트 18은 딜러 약패에 더블');
      if (between(2, 2) || between(7, 8)) return act('S');
      return act('H', '소프트 18도 9 이상에는 밀린다');
    }
    if (total === 17) return between(3, 6) ? act(canDouble ? 'D' : 'H') : act('H');
    if (total >= 15) return between(4, 6) ? act(canDouble ? 'D' : 'H') : act('H');
    return between(5, 6) ? act(canDouble ? 'D' : 'H') : act('H');
  }

  if (canSurrender && total === 16 && between(9, 11) && hand.length === 2 && !isPair(hand)) {
    return act('R', '16 대 강패는 손실을 절반으로');
  }
  if (canSurrender && total === 15 && up === 10 && hand.length === 2) return act('R');

  if (total >= 17) return act('S');
  if (total >= 13) return between(2, 6) ? act('S', '딜러가 터지길 기다린다') : act('H');
  if (total === 12) return between(4, 6) ? act('S') : act('H');
  if (total === 11) return canDouble ? act('D', '가장 유리한 더블') : act('H');
  if (total === 10) return between(2, 9) ? act(canDouble ? 'D' : 'H') : act('H');
  if (total === 9) return between(3, 6) ? act(canDouble ? 'D' : 'H') : act('H');
  return act('H');
}

function act(code, why = '') {
  const label = { H: '히트', S: '스탠드', D: '더블', P: '스플릿', R: '서렌더' }[code];
  return { code, label, why };
}

// ── 한 판 진행 ────────────────────────────────────────────────
class Round {
  constructor(shoe, bet) {
    this.shoe = shoe;
    this.dealer = [];
    this.hands = [{ cards: [], bet, done: false, doubled: false, surrendered: false, fromSplit: false }];
    this.active = 0;
    this.insurance = 0;
    this.phase = 'deal';
    this.results = null;
  }

  deal() {
    this.hands[0].cards.push(this.shoe.draw());
    this.dealer.push(this.shoe.draw());
    this.hands[0].cards.push(this.shoe.draw());
    this.dealer.push(this.shoe.draw()); // 두 번째는 홀카드
    this.phase = RULES.insurance && this.dealer[0].rank === 'A' ? 'insurance' : 'player';
    if (this.phase === 'player') this.checkNaturals();
    return this;
  }

  get upcard() { return this.dealer[0]; }
  get hand() { return this.hands[this.active]; }

  checkNaturals() {
    const dealerBJ = isBlackjack(this.dealer);
    if (dealerBJ || isBlackjack(this.hands[0].cards)) {
      this.hands.forEach((h) => { h.done = true; });
      this.phase = 'settle';
    }
  }

  takeInsurance(amount) {
    this.insurance = amount;
    this.phase = 'player';
    this.checkNaturals();
  }

  options() {
    const h = this.hand;
    if (!h || h.done) return [];
    const first = h.cards.length === 2;
    const out = ['hit', 'stand'];
    if (first && (!h.fromSplit || RULES.doubleAfterSplit)) out.push('double');
    if (first && isPair(h.cards) && this.hands.length < RULES.maxHands) out.push('split');
    if (RULES.surrender && first && !h.fromSplit) out.push('surrender');
    return [...new Set(out)];
  }

  hit() {
    const h = this.hand;
    h.cards.push(this.shoe.draw());
    if (handValue(h.cards).busted || handValue(h.cards).total === 21) this.stand();
    return this;
  }

  double() {
    const h = this.hand;
    h.bet *= 2;
    h.doubled = true;
    h.cards.push(this.shoe.draw());
    this.stand();
    return this;
  }

  surrender() {
    this.hand.surrendered = true;
    this.stand();
    return this;
  }

  split() {
    const h = this.hand;
    const moved = h.cards.pop();
    const fresh = {
      cards: [moved], bet: h.bet, done: false, doubled: false,
      surrendered: false, fromSplit: true,
    };
    h.fromSplit = true;
    this.hands.splice(this.active + 1, 0, fresh);
    h.cards.push(this.shoe.draw());
    fresh.cards.push(this.shoe.draw());
    // 에이스 스플릿은 각 한 장씩만
    if (rankValue(moved.rank) === 11) {
      h.done = true; fresh.done = true;
      this.advance();
    }
    return this;
  }

  stand() {
    this.hand.done = true;
    this.advance();
    return this;
  }

  advance() {
    const next = this.hands.findIndex((h) => !h.done);
    if (next === -1) { this.phase = 'dealer'; } else { this.active = next; }
  }

  // 딜러는 선택하지 않는다. 규칙이 전부다.
  playDealer() {
    const live = this.hands.some((h) => !h.surrendered && !handValue(h.cards).busted);
    if (live) {
      for (;;) {
        const { total, soft } = handValue(this.dealer);
        if (total < 17 || (total === 17 && soft && RULES.dealerHitsSoft17)) {
          this.dealer.push(this.shoe.draw());
        } else break;
      }
    }
    this.phase = 'settle';
    return this;
  }

  settle() {
    const dv = handValue(this.dealer);
    const dealerBJ = isBlackjack(this.dealer);
    const results = [];
    let net = 0;

    if (this.insurance) {
      const gain = dealerBJ ? this.insurance * 2 : -this.insurance;
      net += gain;
      results.push({ kind: 'insurance', text: dealerBJ ? '인슈어런스 적중' : '인슈어런스 실패', delta: gain });
    }

    for (const h of this.hands) {
      const pv = handValue(h.cards);
      const playerBJ = isBlackjack(h.cards) && !h.fromSplit;
      let delta = 0, text = '';

      if (h.surrendered) { delta = -h.bet / 2; text = '서렌더'; }
      else if (pv.busted) { delta = -h.bet; text = '버스트'; }
      else if (playerBJ && !dealerBJ) { delta = h.bet * RULES.blackjackPays; text = '블랙잭!'; }
      else if (dealerBJ && !playerBJ) { delta = -h.bet; text = '딜러 블랙잭'; }
      else if (dealerBJ && playerBJ) { delta = 0; text = '푸시'; }
      else if (dv.busted) { delta = h.bet; text = '딜러 버스트'; }
      else if (pv.total > dv.total) { delta = h.bet; text = '승'; }
      else if (pv.total < dv.total) { delta = -h.bet; text = '패'; }
      else { delta = 0; text = '푸시'; }

      net += delta;
      results.push({ kind: 'hand', text, delta, total: pv.total });
    }

    this.results = { results, net, dealerTotal: dv.total, dealerBJ };
    return this.results;
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    RULES, RANKS, SUITS, Shoe, Round, handValue, isBlackjack, isPair,
    basicStrategy, rankValue,
  };
}
