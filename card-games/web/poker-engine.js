// 포커 핸드 평가기.
//
// 핵심 아이디어: 족보를 정수 하나로 인코딩한다.
//   점수 = 카테고리 * 16^5 + 킥커5 * 16^4 + ... + 킥커1
// 16진 자리마다 카드 랭크(2~14)를 넣으면 비교가 정수 비교 한 번으로 끝난다.
// 두 핸드의 우열을 가리는 복잡한 분기문이 전부 사라진다.

const CATEGORY = [
  '하이카드', '원페어', '투페어', '트리플', '스트레이트',
  '플러시', '풀하우스', '포카드', '스트레이트 플러시',
];

const RANK_ORDER = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
const RANK_NAME = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10' };
const rankName = (v) => RANK_NAME[v] || String(v);

function encode(category, kickers) {
  let score = category;
  for (let i = 0; i < 5; i++) score = score * 16 + (kickers[i] || 0);
  return score;
}

// 정확히 5장을 평가한다.
function score5(cards) {
  const vals = cards.map((c) => RANK_ORDER[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);

  const uniq = [...new Set(vals)];
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    // A-2-3-4-5: 에이스를 1로 쓰는 유일한 예외
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5;
  }

  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  // 개수 내림차순, 같으면 랭크 내림차순
  const groups = Object.entries(counts)
    .map(([v, n]) => ({ v: +v, n }))
    .sort((a, b) => b.n - a.n || b.v - a.v);
  const shape = groups.map((g) => g.n).join('');
  const ordered = groups.map((g) => g.v);

  if (straightHigh && flush) return encode(8, [straightHigh]);
  if (shape === '41') return encode(7, ordered);
  if (shape === '32') return encode(6, ordered);
  if (flush) return encode(5, vals);
  if (straightHigh) return encode(4, [straightHigh]);
  if (shape === '311') return encode(3, ordered);
  if (shape === '221') return encode(2, ordered);
  if (shape === '2111') return encode(1, ordered);
  return encode(0, vals);
}

// 7장 중 5장을 고르는 21가지 조합을 모두 시도한다.
const COMBOS = (() => {
  const out = [];
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++)
    for (let c = b + 1; c < 7; c++) for (let d = c + 1; d < 7; d++)
      for (let e = d + 1; e < 7; e++) out.push([a, b, c, d, e]);
  return out;
})();

function evaluate(cards) {
  if (cards.length === 5) {
    const s = score5(cards);
    return { score: s, category: Math.floor(s / 16 ** 5), best: cards, name: describe(cards, s) };
  }
  let best = -1, bestCards = null;
  for (const idx of COMBOS) {
    const hand = idx.map((i) => cards[i]);
    const s = score5(hand);
    if (s > best) { best = s; bestCards = hand; }
  }
  return {
    score: best,
    category: Math.floor(best / 16 ** 5),
    best: bestCards,
    name: describe(bestCards, best),
  };
}

function describe(cards, score) {
  const cat = Math.floor(score / 16 ** 5);
  const vals = cards.map((c) => RANK_ORDER[c.rank]).sort((a, b) => b - a);
  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const by = (n) => Object.keys(counts).filter((k) => counts[k] === n).map(Number).sort((a, b) => b - a);

  switch (cat) {
    case 8: return vals[0] === 14 && vals[1] === 13 ? '로열 플러시' : `${rankName(Math.max(...vals))} 스트레이트 플러시`;
    case 7: return `${rankName(by(4)[0])} 포카드`;
    case 6: return `${rankName(by(3)[0])} 풀하우스`;
    case 5: return `${rankName(vals[0])} 하이 플러시`;
    case 4: return `${rankName(vals[0] === 14 && vals[1] === 5 ? 5 : vals[0])} 하이 스트레이트`;
    case 3: return `${rankName(by(3)[0])} 트리플`;
    case 2: { const p = by(2); return `${rankName(p[0])}·${rankName(p[1])} 투페어`; }
    case 1: return `${rankName(by(2)[0])} 원페어`;
    default: return `${rankName(vals[0])} 하이카드`;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { evaluate, score5, describe, CATEGORY, RANK_ORDER, rankName, COMBOS };
}
