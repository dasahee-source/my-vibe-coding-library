// 규칙 엔진 단위 검증. DOM 없이 순수 로직만 확인한다.
const path = require('path');
const P = require(path.join(__dirname, '..', 'web', 'poker-engine.js'));
const B = require(path.join(__dirname, '..', 'web', 'blackjack-engine.js'));

let fails = 0;
const ok = (cond, label) => { if (!cond) { fails++; console.log('  ✗', label); } };
const C = (s) => ({ rank: s.slice(0, -1), suit: { s: 'spade', h: 'heart', d: 'diamond', c: 'club' }[s.slice(-1)] });
const H = (s) => s.split(' ').map(C);

console.log('포커 — 족보 판정');
const cat = (s) => P.evaluate(H(s)).category;
ok(cat('As Ks Qs Js 10s') === 8, '로열 플러시');
ok(cat('9h 8h 7h 6h 5h') === 8, '스트레이트 플러시');
ok(cat('7s 7h 7d 7c 2s') === 7, '포카드');
ok(cat('Ks Kh Kd 4s 4h') === 6, '풀하우스');
ok(cat('As Js 9s 5s 3s') === 5, '플러시');
ok(cat('5s 4h 3d 2c As') === 4, 'A-5 스트레이트');
ok(cat('As Kh Qd Jc 10s') === 4, '브로드웨이');
ok(cat('9s 9h 9d Ks 2h') === 3, '트리플');
ok(cat('Js Jh 4d 4c As') === 2, '투페어');
ok(cat('10s 10h 8d 5c 2h') === 1, '원페어');
ok(cat('As Qh 9d 7c 3h') === 0, '하이카드');
const sc = (s) => P.evaluate(H(s)).score;
ok(sc('As Ks Qs Js 10s') > sc('9h 8h 7h 6h 5h'), '로열 > 스트레이트 플러시');
ok(sc('As Ah 9d 9c Ks') > sc('Ks Kh 9d 9c As'), '상위 페어 우선');
ok(sc('As Kh Qd Jc 9s') > sc('As Kh Qd Jc 8s'), '킥커 비교');
ok(P.evaluate(H('As Ks 7h 7d 7c 2s 3h')).category === 3, '7장에서 최선 선택');

console.log('포커 — 20만 회 족보 분포');
{
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const SUITS = ['spade','heart','diamond','club'];
  const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s });
  const N = 200000, cnt = new Array(9).fill(0);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 7; k++) { const j = k + Math.floor(Math.random() * (52 - k)); [d[k], d[j]] = [d[j], d[k]]; }
    cnt[P.evaluate(d.slice(0, 7)).category]++;
  }
  const known = [17.41, 43.82, 23.50, 4.83, 4.62, 3.03, 2.60, 0.168, 0.0311];
  const tol   = [0.40,  0.50,  0.40,  0.20, 0.20, 0.20, 0.15, 0.05,  0.02];
  known.forEach((k, i) => {
    const pct = cnt[i] / N * 100;
    ok(Math.abs(pct - k) < tol[i], `${P.CATEGORY[i]} ${pct.toFixed(3)}% (이론 ${k}%)`);
  });
}

console.log('블랙잭 — 핸드 값');
const bc = (r) => ({ rank: r, suit: 'spade' });
ok(B.handValue([bc('A'), bc('K')]).total === 21, 'A+K = 21');
ok(B.handValue([bc('A'), bc('A'), bc('9')]).total === 21, 'A+A+9 = 21');
ok(B.handValue([bc('A'), bc('6')]).soft === true, 'A+6 은 소프트');
ok(B.handValue([bc('A'), bc('6'), bc('K')]).total === 17, 'A+6+K = 하드 17');
ok(B.handValue([bc('K'), bc('Q'), bc('5')]).busted, '버스트 판정');

console.log('블랙잭 — 기본 전략');
const S = (h, u) => B.basicStrategy(h.map(bc), bc(u)).code;
ok(S(['8','8'], '10') === 'P', '8 페어는 항상 스플릿');
ok(S(['A','A'], '6') === 'P', 'A 페어는 항상 스플릿');
ok(S(['10','10'], '6') === 'S', '20은 나누지 않는다');
ok(S(['A','7'], '9') === 'H', '소프트 18 대 9는 히트');
ok(S(['A','7'], '5') === 'D', '소프트 18 대 5는 더블');
ok(S(['9','2'], '6') === 'D', '11은 더블');
ok(S(['10','6'], '10') === 'R', '16 대 10은 서렌더');
ok(S(['10','2'], '3') === 'H', '12 대 3은 히트');
ok(S(['10','2'], '4') === 'S', '12 대 4는 스탠드');

console.log('블랙잭 — 100만 판 하우스 엣지 / 회계 불변식');
{
  // 하우스 엣지는 통계량이라 단일 시드로는 ±0.2%p 흔들린다.
  // 시드 5개를 합산해 표본을 키우고, 판정 범위는 "구현이 깨지면 반드시 벗어나는" 폭으로 잡는다.
  // (0.4~0.6%가 이론값이고, 완전히 잘못 구현하면 음수이거나 2% 이상으로 튄다)
  const SEEDS = [1, 7, 2024, 99, 12345];
  const PER_SEED = 200000;
  let wagered = 0, net = 0, mismatch = 0;

  for (const seed of SEEDS) {
    const shoe = new B.Shoe(6, seed);
    let bank = 0;
    for (let i = 0; i < PER_SEED; i++) {
      if (shoe.needsShuffle) shoe.shuffle();
      const bet = 10, before = bank;
      bank -= bet;
      const rd = new B.Round(shoe, bet).deal();
      if (rd.phase === 'insurance') rd.takeInsurance(0);
      let guard = 0;
      while (rd.phase === 'player' && guard++ < 40) {
        const o = rd.options();
        if (!o.length) { rd.advance(); if (rd.phase !== 'player') break; continue; }
        const a = B.basicStrategy(rd.hand.cards, rd.upcard, {
          canDouble: o.includes('double'), canSplit: o.includes('split'), canSurrender: o.includes('surrender') });
        if (a.code === 'P' && o.includes('split')) { bank -= rd.hand.bet; rd.split(); }
        else if (a.code === 'D' && o.includes('double')) { bank -= rd.hand.bet; rd.double(); }
        else if (a.code === 'R' && o.includes('surrender')) rd.surrender();
        else if (a.code === 'S') rd.stand();
        else rd.hit();
      }
      if (rd.phase === 'dealer') rd.playDealer();
      const r = rd.settle();
      const staked = rd.hands.reduce((s, h) => s + h.bet, 0) + rd.insurance;
      bank += staked + r.net;
      // 회계 불변식은 통계가 아니라 항등식이므로 허용 오차가 없다
      if (Math.abs((bank - before) - r.net) > 1e-9) mismatch++;
      wagered += rd.hands.reduce((s, h) => s + h.bet, 0);
      net += r.net;
    }
  }

  const edge = -net / wagered * 100;
  ok(mismatch === 0, `회계 불변식 — 자금 변화 = 순손익 (불일치 ${mismatch}건)`);
  ok(edge > 0 && edge < 1.2, `하우스 엣지 ${edge.toFixed(3)}% (이론 0.4~0.6%)`);
  console.log(`  ${(SEEDS.length * PER_SEED).toLocaleString()}판 · 엣지 ${edge.toFixed(3)}%`);
}

console.log(fails ? `\n실패 ${fails}건` : '\n전부 통과');
process.exit(fails ? 1 : 0);
