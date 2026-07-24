// 화투 48장 도안. 목판화 느낌을 노려 평면 색면 + 굵은 먹선으로 단순화했다.
// 월별 식물 모티프를 바탕에 깔고, 광/열끗/띠 요소를 그 위에 얹는다.
// 전부 직접 그린 벡터라 외부 이미지 의존이 없다.

const PAPER = '#f3ead7';
const INK = '#17130f';

// ── 월별 바탕 식물 ──────────────────────────────────────────────
const PLANT = {
  1: `<path d="M4 84 L15 60 L26 84Z" fill="#1d4d3a"/>
      <path d="M7 68 L15 50 L23 68Z" fill="#2a6350"/>
      <rect x="13.5" y="78" width="3" height="8" fill="#5a4632"/>`,
  2: `<path d="M10 86 C12 68 20 58 16 44" stroke="#4a3a2c" stroke-width="2.5" fill="none"/>
      <circle cx="16" cy="43" r="5" fill="#d4607f"/><circle cx="24" cy="52" r="4" fill="#d4607f"/>
      <circle cx="9" cy="56" r="4" fill="#c9526f"/><circle cx="21" cy="66" r="3.5" fill="#d4607f"/>`,
  3: `<path d="M8 86 C10 70 18 62 14 48" stroke="#4a3a2c" stroke-width="2.5" fill="none"/>
      <circle cx="14" cy="46" r="5.5" fill="#eaa8bc"/><circle cx="24" cy="56" r="4.5" fill="#eaa8bc"/>
      <circle cx="7" cy="62" r="4.5" fill="#e295ad"/><circle cx="20" cy="72" r="4" fill="#eaa8bc"/>`,
  4: `<path d="M14 30 C12 46 16 60 12 76" stroke="#3d5c3a" stroke-width="2" fill="none"/>
      <ellipse cx="11" cy="46" rx="4" ry="6" fill="#7a5fa8"/>
      <ellipse cx="16" cy="60" rx="4" ry="7" fill="#6b5296"/>
      <ellipse cx="10" cy="74" rx="3.5" ry="5" fill="#7a5fa8"/>`,
  5: `<path d="M8 86 L12 56 M18 86 L15 58 M13 86 L14 52" stroke="#3d5c3a" stroke-width="2.5" fill="none"/>
      <path d="M14 52 l-5 6 l5 4 l5 -4Z" fill="#6b5fa8"/>`,
  6: `<circle cx="15" cy="62" r="10" fill="#c73a4a"/>
      <circle cx="15" cy="62" r="4.5" fill="#e8734a"/>
      <path d="M15 72 L13 86 M15 72 L20 84" stroke="#3d5c3a" stroke-width="2"/>`,
  7: `<path d="M13 86 C15 70 11 62 15 48" stroke="#5a3a30" stroke-width="2" fill="none"/>
      <ellipse cx="9" cy="58" rx="5" ry="3" fill="#b3403a" transform="rotate(-25 9 58)"/>
      <ellipse cx="21" cy="52" rx="5" ry="3" fill="#b3403a" transform="rotate(25 21 52)"/>
      <ellipse cx="11" cy="72" rx="4.5" ry="3" fill="#a03832" transform="rotate(-20 11 72)"/>`,
  8: `<path d="M0 86 C14 62 30 60 44 74 L44 90 L0 90Z" fill="#3f5347"/>
      <path d="M8 84 C10 74 12 70 11 64 M18 86 C20 76 21 72 20 66" stroke="#6a8272" stroke-width="1.5" fill="none"/>`,
  9: `<circle cx="15" cy="60" r="9" fill="#e0b544"/>
      <circle cx="15" cy="60" r="3.5" fill="#c08a2a"/>
      <path d="M15 69 L13 86 M15 69 L21 84" stroke="#3d5c3a" stroke-width="2"/>`,
  10: `<path d="M15 52 l-9 9 l4 1 l-4 6 l7 -2 l-1 6 l3 -5 l3 5 l-1 -6 l7 2 l-4 -6 l4 -1Z" fill="#c94a2e"/>
       <path d="M15 72 L14 86" stroke="#5a4632" stroke-width="2"/>`,
  11: `<path d="M14 86 C16 66 10 58 15 42" stroke="#4a3a2c" stroke-width="2.5" fill="none"/>
       <ellipse cx="9" cy="52" rx="6" ry="4.5" fill="#6d5b9e" transform="rotate(-20 9 52)"/>
       <ellipse cx="22" cy="60" rx="6" ry="4.5" fill="#5d4d8c" transform="rotate(20 22 60)"/>`,
  12: `<path d="M16 24 C16 44 10 56 12 86" stroke="#4a3a2c" stroke-width="2.5" fill="none"/>
       <path d="M16 32 C8 40 6 52 9 62 M16 40 C24 48 24 60 20 70" stroke="#4a6b45" stroke-width="1.8" fill="none"/>`,
};

// ── 광 카드의 주역 ──────────────────────────────────────────────
const GWANG_ART = {
  1: `<circle cx="41" cy="24" r="10" fill="#cf3b2c"/>
      <ellipse cx="38" cy="52" rx="11" ry="6" fill="#fbf6ea" stroke="${INK}" stroke-width="1"/>
      <path d="M45 48 C50 44 50 38 47 35" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <circle cx="47" cy="34" r="2" fill="#fbf6ea" stroke="${INK}" stroke-width="1"/>
      <path d="M33 57 L31 63 M41 57 L43 63" stroke="${INK}" stroke-width="1.2"/>`,
  3: `<path d="M30 18 h26 v10 h-26Z" fill="#c0392b"/>
      <path d="M30 28 h26 v5 h-26Z" fill="#8f2a20"/>
      <path d="M34 33 v9 M44 33 v9 M52 33 v9" stroke="#c0392b" stroke-width="3"/>`,
  8: `<circle cx="40" cy="26" r="11" fill="#e8b84b"/>
      <path d="M30 52 l6 -3 l6 3" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <path d="M40 60 l6 -3 l6 3" stroke="${INK}" stroke-width="1.6" fill="none"/>`,
  11: `<path d="M40 30 C50 34 52 46 44 54 C50 50 52 40 46 34Z" fill="#c0392b"/>
       <ellipse cx="38" cy="44" rx="9" ry="7" fill="#d9a63c" stroke="${INK}" stroke-width="1"/>
       <path d="M46 40 C52 34 50 28 46 26" stroke="${INK}" stroke-width="1.5" fill="none"/>
       <path d="M30 50 l-4 10 M34 52 l-2 10" stroke="#c0392b" stroke-width="1.5"/>`,
  12: `<path d="M28 26 C36 18 50 22 52 32 L28 32Z" fill="${INK}"/>
       <path d="M40 32 v18" stroke="${INK}" stroke-width="1.6"/>
       <ellipse cx="40" cy="60" rx="8" ry="10" fill="#3a4a5c"/>
       <circle cx="40" cy="52" r="4" fill="#e8dcc4" stroke="${INK}" stroke-width="1"/>
       <path d="M22 20 l-3 12 M56 18 l3 12" stroke="#8fa8bc" stroke-width="1.5"/>`,
};

// ── 열끗(동물) ─────────────────────────────────────────────────
const YEOL_ART = {
  2: `<ellipse cx="40" cy="44" rx="9" ry="6" fill="#7d8a3c"/>
      <circle cx="49" cy="39" r="4.5" fill="#7d8a3c"/>
      <path d="M53 39 l4 1 l-4 1.5Z" fill="#d9a63c"/>
      <circle cx="50" cy="38" r="1" fill="${INK}"/>
      <path d="M32 46 l-6 4 l7 -1Z" fill="#67752f"/>`,
  4: `<ellipse cx="40" cy="42" rx="8" ry="5.5" fill="#4a5a6c"/>
      <circle cx="48" cy="38" r="4" fill="#4a5a6c"/>
      <path d="M52 38 l4 1 l-4 1.5Z" fill="#d9a63c"/>
      <circle cx="49" cy="37" r="1" fill="${INK}"/>
      <path d="M33 44 l-7 5 l8 -1Z" fill="#3a4a5c"/>`,
  5: `<path d="M26 58 h30 v4 h-30Z" fill="#c0392b"/>
      <path d="M30 62 v10 M52 62 v10" stroke="#c0392b" stroke-width="3"/>
      <path d="M26 56 C34 50 48 50 56 56" stroke="#c0392b" stroke-width="2.5" fill="none"/>`,
  6: `<ellipse cx="40" cy="40" rx="5" ry="4" fill="#2a4a8c" transform="rotate(-25 40 40)"/>
      <ellipse cx="48" cy="44" rx="5" ry="4" fill="#2a4a8c" transform="rotate(25 48 44)"/>
      <path d="M44 40 v6" stroke="${INK}" stroke-width="1.4"/>
      <ellipse cx="36" cy="58" rx="4" ry="3.2" fill="#3a5a9c" transform="rotate(-20 36 58)"/>
      <ellipse cx="43" cy="61" rx="4" ry="3.2" fill="#3a5a9c" transform="rotate(20 43 61)"/>`,
  7: `<ellipse cx="41" cy="52" rx="12" ry="8" fill="#4a4038"/>
      <path d="M52 48 l7 3 l-7 4Z" fill="#4a4038"/>
      <circle cx="54" cy="50" r="1" fill="${PAPER}"/>
      <path d="M34 60 v6 M46 60 v6" stroke="#3a322c" stroke-width="2.5"/>
      <path d="M56 54 l4 -1" stroke="${PAPER}" stroke-width="1.2"/>`,
  8: `<path d="M28 40 l7 -4 l7 4 l-7 3Z" fill="${INK}"/>
      <path d="M40 52 l7 -4 l7 4 l-7 3Z" fill="${INK}"/>
      <path d="M30 60 l6 -3 l6 3 l-6 2.5Z" fill="${INK}"/>`,
  9: `<path d="M32 46 h18 l-3 12 h-12Z" fill="#c0392b"/>
      <ellipse cx="41" cy="46" rx="9" ry="3" fill="#e05a44"/>
      <path d="M38 58 h6 v4 h-6Z" fill="#8f2a20"/>`,
  10: `<ellipse cx="40" cy="52" rx="11" ry="7" fill="#9a7350"/>
       <circle cx="50" cy="45" r="4.5" fill="#9a7350"/>
       <path d="M52 41 l3 -6 M48 41 l-1 -6" stroke="#5a4632" stroke-width="1.6"/>
       <circle cx="51" cy="44" r="1" fill="${INK}"/>
       <path d="M34 59 v6 M46 59 v6" stroke="#7a5a40" stroke-width="2.2"/>
       <circle cx="38" cy="50" r="1.4" fill="#e0cba8"/><circle cx="44" cy="54" r="1.4" fill="#e0cba8"/>`,
  12: `<path d="M40 40 l-12 6 l12 3 l12 -3Z" fill="${INK}"/>
       <path d="M40 49 l-5 8 l5 -3 l5 3Z" fill="${INK}"/>`,
};

// ── 띠 ────────────────────────────────────────────────────────
const TTI_FILL = { hong: '#c4372b', chung: '#2a4a8c', cho: '#a8322a', plain: '#a8322a' };

function ttiArt(card) {
  const fill = TTI_FILL[card.tti] || '#a8322a';
  const glyph = card.tti === 'hong' ? '<path d="M34 32 h14 M34 38 h14 M41 26 v18" stroke="#f3ead7" stroke-width="2"/>'
    : card.tti === 'chung' ? '<path d="M34 30 h14 v10 h-14Z" fill="none" stroke="#f3ead7" stroke-width="2"/>'
    : '';
  return `<path d="M24 22 h34 v24 h-34Z" fill="${fill}"/>${glyph}
          <path d="M24 22 h34 v24 h-34Z" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}

// ── 조립 ──────────────────────────────────────────────────────
function cardArt(card) {
  const layers = [`<rect x="0" y="0" width="60" height="90" rx="4" fill="${PAPER}"/>`];
  layers.push(`<g opacity="${card.kind === 'pi' ? '1' : '.9'}">${PLANT[card.month] || ''}</g>`);

  if (card.kind === 'gwang') {
    layers.push(GWANG_ART[card.month] || '');
    layers.push(`<circle cx="49" cy="79" r="8" fill="#c4372b"/>
                 <text x="49" y="83" text-anchor="middle" font-size="10" font-weight="700" fill="${PAPER}">光</text>`);
  } else if (card.kind === 'yeol') {
    layers.push(YEOL_ART[card.month] || '');
  } else if (card.kind === 'tti') {
    layers.push(ttiArt(card));
  } else if (card.pi === 2) {
    layers.push(`<path d="M30 30 h22 v22 h-22Z" fill="#b9ab8c" opacity=".5"/>
                 <text x="41" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}">雙</text>`);
  }

  layers.push(`<text x="6" y="15" font-size="11" font-weight="700"
                 font-family="ui-monospace,monospace" fill="${INK}">${card.month}</text>`);
  layers.push(`<rect x="1" y="1" width="58" height="88" rx="4" fill="none"
                 stroke="${INK}" stroke-width="2"/>`);

  return `<svg viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg" role="img"
            aria-label="${card.month}월 ${card.name}">${layers.join('')}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { cardArt };
