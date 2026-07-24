// 룰 엔진 JS 포팅. engine.py / scoring.py / cards.py 와 동작이 일치해야 한다.
// 규칙을 고칠 때는 반드시 양쪽을 함께 수정할 것.

const GWANG = 'gwang', YEOL = 'yeol', TTI = 'tti', PI = 'pi';
const HONG = 'hong', CHO = 'cho', CHUNG = 'chung', PLAIN = 'plain';
const GO_THRESHOLD = 7;

const RAW = [
  [1, GWANG, '송학 광', 0, null, false, false],
  [1, TTI, '홍단', 0, HONG, false, false],
  [1, PI, '피', 1, null, false, false],
  [1, PI, '피', 1, null, false, false],
  [2, YEOL, '꾀꼬리', 0, null, false, true],
  [2, TTI, '홍단', 0, HONG, false, false],
  [2, PI, '피', 1, null, false, false],
  [2, PI, '피', 1, null, false, false],
  [3, GWANG, '벚꽃 광', 0, null, false, false],
  [3, TTI, '홍단', 0, HONG, false, false],
  [3, PI, '피', 1, null, false, false],
  [3, PI, '피', 1, null, false, false],
  [4, YEOL, '두견새', 0, null, false, true],
  [4, TTI, '초단', 0, CHO, false, false],
  [4, PI, '피', 1, null, false, false],
  [4, PI, '피', 1, null, false, false],
  [5, YEOL, '다리', 0, null, false, false],
  [5, TTI, '초단', 0, CHO, false, false],
  [5, PI, '피', 1, null, false, false],
  [5, PI, '피', 1, null, false, false],
  [6, YEOL, '나비', 0, null, false, false],
  [6, TTI, '청단', 0, CHUNG, false, false],
  [6, PI, '피', 1, null, false, false],
  [6, PI, '피', 1, null, false, false],
  [7, YEOL, '멧돼지', 0, null, false, false],
  [7, TTI, '초단', 0, CHO, false, false],
  [7, PI, '피', 1, null, false, false],
  [7, PI, '피', 1, null, false, false],
  [8, GWANG, '공산 광', 0, null, false, false],
  [8, YEOL, '기러기', 0, null, false, true],
  [8, PI, '피', 1, null, false, false],
  [8, PI, '피', 1, null, false, false],
  [9, YEOL, '국진', 0, null, false, false],
  [9, TTI, '청단', 0, CHUNG, false, false],
  [9, PI, '피', 1, null, false, false],
  [9, PI, '피', 1, null, false, false],
  [10, YEOL, '사슴', 0, null, false, false],
  [10, TTI, '청단', 0, CHUNG, false, false],
  [10, PI, '피', 1, null, false, false],
  [10, PI, '피', 1, null, false, false],
  [11, GWANG, '오동 광', 0, null, false, false],
  [11, PI, '쌍피', 2, null, false, false],
  [11, PI, '피', 1, null, false, false],
  [11, PI, '피', 1, null, false, false],
  [12, GWANG, '비광', 0, null, true, false],
  [12, YEOL, '제비', 0, null, true, false],
  [12, TTI, '비띠', 0, PLAIN, true, false],
  [12, PI, '쌍피', 2, null, true, false],
];

const DECK = RAW.map(([month, kind, name, pi, tti, rain, godori], i) => ({
  month, kind, name, pi, tti, rain, godori, uid: i + 1,
}));

// 시드 고정 PRNG. 같은 시드는 같은 판을 만든다.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baseScore(cards) {
  const gwangs = cards.filter((c) => c.kind === GWANG);
  const yeols = cards.filter((c) => c.kind === YEOL);
  const ttis = cards.filter((c) => c.kind === TTI);
  const piPoints = cards.reduce((s, c) => s + c.pi, 0);

  let gwang = 0;
  if (gwangs.length === 5) gwang = 15;
  else if (gwangs.length === 4) gwang = 4;
  else if (gwangs.length === 3) gwang = gwangs.some((c) => c.rain) ? 2 : 3;

  const yeol = yeols.length >= 5 ? yeols.length - 4 : 0;
  const godori = yeols.filter((c) => c.godori).length === 3 ? 5 : 0;
  const tti = ttis.length >= 5 ? ttis.length - 4 : 0;
  const nColor = (c) => ttis.filter((x) => x.tti === c).length;
  const hongdan = nColor(HONG) === 3 ? 3 : 0;
  const chodan = nColor(CHO) === 3 ? 3 : 0;
  const chungdan = nColor(CHUNG) === 3 ? 3 : 0;
  const pi = piPoints >= 10 ? piPoints - 9 : 0;

  return {
    gwang, yeol, godori, tti, hongdan, chodan, chungdan, pi,
    nGwang: gwangs.length, nYeol: yeols.length, nTti: ttis.length, piPoints,
    total: gwang + yeol + godori + tti + hongdan + chodan + chungdan + pi,
  };
}

function goAdjust(goCount) {
  if (goCount <= 0) return [0, 1];
  return [goCount === 1 ? 1 : 2, 2 ** Math.max(0, goCount - 2)];
}

function settle(winnerCards, loserCards, { goCount = 0, shake = 0, loserWentGo = false } = {}) {
  const b = baseScore(winnerCards);
  const lb = baseScore(loserCards);
  const [bonus, goMult] = goAdjust(goCount);
  const gwangbak = b.nGwang >= 3 && lb.nGwang === 0;
  const pibak = b.pi > 0 && lb.piPoints < 7;
  const meongbak = b.nYeol >= 7 && lb.nYeol === 0;

  let mult = goMult;
  for (const f of [gwangbak, pibak, meongbak, loserWentGo]) if (f) mult *= 2;
  mult *= 2 ** shake;

  return {
    base: b.total, total: (b.total + bonus) * mult, multiplier: mult,
    gwangbak, pibak, meongbak, gobak: loserWentGo, goCount, shake,
  };
}

class Engine {
  constructor(seed = Math.floor(Math.random() * 1e9)) {
    this.rand = mulberry32(seed);
    this.players = [0, 1].map((i) => ({
      index: i, hand: [], captured: [], goCount: 0, shake: 0, lastGoScore: 0,
    }));
    this.field = [];
    this.deck = [];
    this.turn = 0;
    this.finished = false;
    this.settlement = null;
    this.winner = null;
    this.ppeokOwner = {};
    this.deal();
  }

  deal() {
    const deck = DECK.slice();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    for (const p of this.players) {
      p.hand = deck.splice(0, 10).sort((a, b) => a.month - b.month || a.uid - b.uid);
    }
    this.field = deck.splice(0, 8);
    this.deck = deck;
  }

  get current() { return this.players[this.turn]; }
  get opponent() { return this.players[1 - this.turn]; }
  fieldMatches(month) { return this.field.filter((c) => c.month === month); }
  score(i) { return baseScore(this.players[i].captured).total; }

  bombable() {
    const hand = this.current.hand;
    const months = new Set();
    for (let m = 1; m <= 12; m++) {
      if (hand.filter((c) => c.month === m).length === 3 && this.fieldMatches(m).length === 1) {
        months.add(m);
      }
    }
    return [...months];
  }

  _pull(card) {
    const i = this.field.findIndex((c) => c.uid === card.uid);
    if (i >= 0) this.field.splice(i, 1);
  }

  _take(p, cards, res) {
    for (const c of cards) this._pull(c);
    p.captured.push(...cards);
    res.captured.push(...cards);
  }

  _steal(res) {
    const victim = this.opponent;
    const pool = victim.captured.filter((c) => c.kind === PI).sort((a, b) => a.pi - b.pi);
    if (!pool.length) return;
    const card = pool[0];
    victim.captured.splice(victim.captured.findIndex((c) => c.uid === card.uid), 1);
    this.current.captured.push(card);
    res.events.push('STEAL');
  }

  _resolvePending(p, pending, res) {
    if (pending.length) {
      this._take(p, pending, res);
      delete this.ppeokOwner[pending[0].month];
    }
  }

  bomb(month) {
    const p = this.current;
    const res = { player: p.index, played: null, flipped: null, captured: [], events: ['BOMB', 'SHAKE'], pendingGo: false };
    const cards = p.hand.filter((c) => c.month === month);
    p.hand = p.hand.filter((c) => c.month !== month);
    this._take(p, this.fieldMatches(month).concat(cards), res);
    p.shake += 1;
    this._steal(res);
    this._maybeGo(res);
    return res;
  }

  play(card, choice = 0, flipChoice = 0) {
    const p = this.current;
    const res = { player: p.index, played: card, flipped: null, captured: [], events: [], pendingGo: false };
    p.hand = p.hand.filter((c) => c.uid !== card.uid);

    const matches = this.fieldMatches(card.month);
    let handLanded = false;
    let pending = [];

    if (matches.length === 0) {
      this.field.push(card);
      handLanded = true;
    } else if (matches.length <= 2) {
      const picked = matches.length === 2 ? matches[choice] : matches[0];
      this._pull(picked);
      pending = [card, picked];
    } else {
      this._take(p, matches.concat([card]), res);
      delete this.ppeokOwner[card.month];
    }

    const flipped = this.deck.length ? this.deck.pop() : null;
    res.flipped = flipped;
    if (!flipped) {
      this._resolvePending(p, pending, res);
      return this._endTurn(res);
    }

    const fMatches = this.fieldMatches(flipped.month);

    if (flipped.month === card.month) {
      if (handLanded) {
        this._pull(card);
        this._take(p, [flipped, card], res);
        res.events.push('JJOK');
        this._steal(res);
      } else if (pending.length) {
        const remaining = this.fieldMatches(card.month);
        if (remaining.length) {
          this._take(p, remaining.concat(pending, [flipped]), res);
        } else {
          this.field.push(...pending, flipped);
          this.ppeokOwner[card.month] = p.index;
          res.events.push('PPEOK');
        }
        pending = [];
      } else {
        this._take(p, [flipped], res);
      }
    } else {
      const handPair = pending.length === 2;
      this._resolvePending(p, pending, res);
      pending = [];
      if (fMatches.length === 0) {
        this.field.push(flipped);
      } else if (fMatches.length === 1) {
        this._take(p, [flipped, fMatches[0]], res);
        if (handPair) { res.events.push('TTADAK'); this._steal(res); }
      } else if (fMatches.length === 2) {
        this._take(p, [flipped, fMatches[flipChoice]], res);
      } else {
        this._take(p, fMatches.concat([flipped]), res);
        delete this.ppeokOwner[flipped.month];
      }
    }

    this._resolvePending(p, pending, res);

    if (this.field.length === 0 && res.captured.length) {
      res.events.push('SSAKSSULI');
      this._steal(res);
    }
    return this._endTurn(res);
  }

  _maybeGo(res) {
    const p = this.current;
    const s = this.score(p.index);
    if (s >= GO_THRESHOLD && s > p.lastGoScore) res.pendingGo = true;
    return res;
  }

  _endTurn(res) {
    const p = this.current;
    this._maybeGo(res);
    if (res.pendingGo) return res;
    if (!p.hand.length && !this.deck.length) this._finishDraw();
    else this.turn = 1 - this.turn;
    return res;
  }

  declare(go) {
    const p = this.current;
    const res = { player: p.index, played: null, flipped: null, captured: [], events: [], pendingGo: false };
    if (go) {
      p.goCount += 1;
      p.lastGoScore = this.score(p.index);
      res.events.push('GO');
      if (!p.hand.length && !this.deck.length) this._finishDraw();
      else this.turn = 1 - this.turn;
    } else {
      res.events.push('STOP');
      this._finish(p.index);
    }
    return res;
  }

  _finish(winner) {
    const w = this.players[winner];
    const l = this.players[1 - winner];
    this.settlement = settle(w.captured, l.captured, {
      goCount: w.goCount, shake: w.shake + l.shake, loserWentGo: l.goCount > 0,
    });
    this.winner = winner;
    this.finished = true;
  }

  _finishDraw() { this.settlement = null; this.winner = null; this.finished = true; }
}

// 한 수 앞만 보는 기준선 정책 (ai.py의 GreedyPolicy와 동일한 가중치)
const KIND_WEIGHT = { [GWANG]: 8, [YEOL]: 3, [TTI]: 3, [PI]: 1 };
function cardValue(c) {
  let v = KIND_WEIGHT[c.kind];
  if (c.kind === PI) v *= c.pi;
  if (c.godori) v += 2;
  if (c.tti && c.tti !== PLAIN) v += 1.5;
  return v;
}

function chooseCard(engine) {
  let best = null;
  for (const card of engine.current.hand) {
    const m = engine.fieldMatches(card.month);
    let cand;
    if (m.length === 0) cand = [-cardValue(card) * 0.3, card, 0];
    else if (m.length === 1) cand = [cardValue(m[0]) + cardValue(card) * 0.1, card, 0];
    else if (m.length === 2) {
      const pick = cardValue(m[0]) >= cardValue(m[1]) ? 0 : 1;
      cand = [cardValue(m[pick]), card, pick];
    } else cand = [m.reduce((s, c) => s + cardValue(c), 0), card, 0];
    if (!best || cand[0] > best[0]) best = cand;
  }
  return best;
}

function chooseGo(engine) {
  const me = engine.current;
  if (baseScore(engine.opponent.captured).total >= 5) return false;
  if (engine.score(me.index) >= 10) return false;
  return me.hand.length >= 3;
}

if (typeof module !== 'undefined') {
  module.exports = { DECK, Engine, baseScore, settle, goAdjust, chooseCard, chooseGo, cardValue };
}
