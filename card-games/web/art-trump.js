// 트럼프 52장 렌더러.
// 구조: 무늬 4개(패스) + 핍 배치표 + 궁정패 6종(J/Q/K × 적·흑).
// 궁정패는 실제 카드처럼 상하 대칭이라 위쪽 절반만 그리고 180도 회전 복제한다.

const W = 140, H = 200;          // 카드 캔버스
const RED = '#c8102e', BLACK = '#1b1b1b';
const GOLD = '#d9a441', ROBE_R = '#b5323f', ROBE_B = '#2f4b8f';
const SKIN = '#f0d0b4', PAPER = '#fdfbf5', LINE = '#1b1b1b';

// ── 무늬: 0~100 정사각 좌표계에 그린 뒤 배치할 때 축소한다 ──
const SUIT_PATH = {
  spade: 'M50 5 C50 5 10 39 10 58 C10 72 20 80 32 80 C40 80 46 76 49 70 '
       + 'C47 84 41 92 33 96 L67 96 C59 92 53 84 51 70 C54 76 60 80 68 80 '
       + 'C80 80 90 72 90 58 C90 39 50 5 50 5Z',
  heart: 'M50 95 C18 70 8 52 8 35 C8 19 19 9 32 9 C41 9 47 14 50 21 '
       + 'C53 14 59 9 68 9 C81 9 92 19 92 35 C92 52 82 70 50 95Z',
  diamond: 'M50 3 L91 50 L50 97 L9 50Z',
  club: 'M50 5 C61 5 70 14 70 25 C70 29 69 32 67 35 C70 33 74 32 78 32 '
      + 'C89 32 98 41 98 52 C98 63 89 72 78 72 C70 72 63 68 59 61 '
      + 'C59 76 63 88 70 96 L30 96 C37 88 41 76 41 61 C37 68 30 72 22 72 '
      + 'C11 72 2 63 2 52 C2 41 11 32 22 32 C26 32 30 33 33 35 '
      + 'C31 32 30 29 30 25 C30 14 39 5 50 5Z',
};
const SUIT_COLOR = { spade: BLACK, club: BLACK, heart: RED, diamond: RED };
const SUIT_GLYPH = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' };

function pip(suit, cx, cy, size, flip = false) {
  const s = size / 100;
  const t = `translate(${cx},${cy}) scale(${s}) ${flip ? 'rotate(180)' : ''} translate(-50,-50)`;
  return `<path d="${SUIT_PATH[suit]}" fill="${SUIT_COLOR[suit]}" transform="${t}"/>`;
}

// ── 핍 배치: [x, y] 비율. y<0.5는 정방향, 그 아래는 180도 뒤집는다 ──
const COL_L = 0.32, COL_C = 0.5, COL_R = 0.68;
const LAYOUT = {
  A: [[COL_C, 0.5]],
  2: [[COL_C, 0.22], [COL_C, 0.78]],
  3: [[COL_C, 0.22], [COL_C, 0.5], [COL_C, 0.78]],
  4: [[COL_L, 0.22], [COL_R, 0.22], [COL_L, 0.78], [COL_R, 0.78]],
  5: [[COL_L, 0.22], [COL_R, 0.22], [COL_C, 0.5], [COL_L, 0.78], [COL_R, 0.78]],
  6: [[COL_L, 0.22], [COL_R, 0.22], [COL_L, 0.5], [COL_R, 0.5], [COL_L, 0.78], [COL_R, 0.78]],
  7: [[COL_L, 0.22], [COL_R, 0.22], [COL_C, 0.36], [COL_L, 0.5], [COL_R, 0.5],
      [COL_L, 0.78], [COL_R, 0.78]],
  8: [[COL_L, 0.22], [COL_R, 0.22], [COL_C, 0.36], [COL_L, 0.5], [COL_R, 0.5],
      [COL_C, 0.64], [COL_L, 0.78], [COL_R, 0.78]],
  9: [[COL_L, 0.22], [COL_R, 0.22], [COL_L, 0.41], [COL_R, 0.41], [COL_C, 0.5],
      [COL_L, 0.59], [COL_R, 0.59], [COL_L, 0.78], [COL_R, 0.78]],
  10: [[COL_L, 0.22], [COL_R, 0.22], [COL_C, 0.315], [COL_L, 0.41], [COL_R, 0.41],
       [COL_L, 0.59], [COL_R, 0.59], [COL_C, 0.685], [COL_L, 0.78], [COL_R, 0.78]],
};

// ── 궁정패: 위쪽 절반만 그린다 (y 20~100 영역) ──
function courtHalf(rank, suit) {
  const red = SUIT_COLOR[suit] === RED;
  const robe = red ? ROBE_R : ROBE_B;
  const trim = red ? ROBE_B : ROBE_R;
  const s = [];

  // 어깨와 옷
  s.push(`<path d="M30 100 L30 84 C30 74 38 68 48 66 L92 66 C102 68 110 74 110 84 L110 100Z"
           fill="${robe}" stroke="${LINE}" stroke-width="1.4"/>`);
  // 옷 무늬: 사선 격자
  s.push(`<path d="M34 100 L58 70 M46 100 L70 70 M58 100 L82 70 M70 100 L94 70 M82 100 L106 70"
           stroke="${trim}" stroke-width="1.6" opacity=".55" fill="none"/>`);
  // 깃
  s.push(`<path d="M52 68 C58 78 66 82 70 82 C74 82 82 78 88 68 L82 66 L70 74 L58 66Z"
           fill="${PAPER}" stroke="${LINE}" stroke-width="1.2"/>`);

  // 머리카락
  s.push(`<path d="M54 46 C54 34 62 28 70 28 C78 28 86 34 86 46 L86 58 C86 64 80 68 70 68
           C60 68 54 64 54 58Z" fill="${red ? '#8a5a2b' : '#4a3a2c'}" stroke="${LINE}" stroke-width="1.3"/>`);
  // 얼굴
  s.push(`<path d="M59 44 C59 36 64 32 70 32 C76 32 81 36 81 44 L81 54
           C81 61 76 65 70 65 C64 65 59 61 59 54Z" fill="${SKIN}" stroke="${LINE}" stroke-width="1.3"/>`);
  // 눈·코·입
  s.push(`<circle cx="65.5" cy="46" r="1.5" fill="${LINE}"/><circle cx="74.5" cy="46" r="1.5" fill="${LINE}"/>
          <path d="M70 48 L70 53 M67 57 C68.5 58.5 71.5 58.5 73 57" stroke="${LINE}" stroke-width="1.1" fill="none"/>`);
  // 수염 (K만)
  if (rank === 'K') {
    s.push(`<path d="M60 56 C60 68 64 76 70 76 C76 76 80 68 80 56
             C78 62 74 64 70 64 C66 64 62 62 60 56Z" fill="#e8e2d6" stroke="${LINE}" stroke-width="1.2"/>`);
  }

  // 머리 장식
  if (rank === 'K') {
    s.push(`<path d="M52 32 L56 16 L63 26 L70 12 L77 26 L84 16 L88 32Z"
             fill="${GOLD}" stroke="${LINE}" stroke-width="1.4"/>
            <path d="M52 32 L88 32 L88 38 L52 38Z" fill="${GOLD}" stroke="${LINE}" stroke-width="1.4"/>
            <circle cx="70" cy="35" r="2.4" fill="${RED}" stroke="${LINE}" stroke-width=".8"/>`);
  } else if (rank === 'Q') {
    s.push(`<path d="M56 34 C56 22 62 16 70 16 C78 16 84 22 84 34Z"
             fill="${GOLD}" stroke="${LINE}" stroke-width="1.4"/>
            <circle cx="70" cy="13" r="4" fill="${GOLD}" stroke="${LINE}" stroke-width="1.2"/>
            <circle cx="60" cy="24" r="2" fill="${PAPER}"/><circle cx="80" cy="24" r="2" fill="${PAPER}"/>`);
  } else {
    s.push(`<path d="M52 40 C52 26 60 20 70 20 C80 20 88 26 88 40 L84 40
             C84 30 78 25 70 25 C62 25 56 30 56 40Z" fill="${trim}" stroke="${LINE}" stroke-width="1.3"/>
            <path d="M88 30 C96 22 100 14 98 8 C94 14 90 20 86 24Z" fill="${GOLD}" stroke="${LINE}" stroke-width="1.1"/>`);
  }

  // 손에 든 물건: K 검, Q 꽃, J 창
  if (rank === 'K') {
    s.push(`<path d="M38 100 L38 44 L41 38 L44 44 L44 100Z" fill="#cfd4da" stroke="${LINE}" stroke-width="1.2"/>
            <path d="M32 52 L50 52 L50 56 L32 56Z" fill="${GOLD}" stroke="${LINE}" stroke-width="1.1"/>`);
  } else if (rank === 'Q') {
    s.push(`<path d="M40 100 L40 58" stroke="#3f6b3a" stroke-width="2.2"/>
            <circle cx="40" cy="50" r="6" fill="${GOLD}" stroke="${LINE}" stroke-width="1.1"/>
            <circle cx="40" cy="50" r="2.2" fill="${RED}"/>
            <path d="M40 62 C34 60 32 56 33 52 C36 54 39 57 40 62Z" fill="#3f6b3a"/>`);
  } else {
    s.push(`<path d="M40 100 L40 40" stroke="#7a5a3a" stroke-width="2.4"/>
            <path d="M40 40 L36 30 L40 20 L44 30Z" fill="#cfd4da" stroke="${LINE}" stroke-width="1.1"/>`);
  }

  // 어깨 옆 작은 무늬 표식
  s.push(pip(suit, 100, 50, 20));
  return s.join('');
}

function courtPanel(rank, suit, cid) {
  const half = courtHalf(rank, suit);
  return `<g clip-path="url(#${cid})">
            <rect x="20" y="20" width="100" height="160" fill="${PAPER}"/>
            ${half}
            <g transform="rotate(180 70 100)">${half}</g>
            <path d="M20 100 L120 100" stroke="${LINE}" stroke-width="1" opacity=".35"/>
          </g>
          <rect x="20" y="20" width="100" height="160" fill="none"
                stroke="${LINE}" stroke-width="1.6"/>`;
}

// ── 카드 한 장 ────────────────────────────────────────────────
function cardSVG(rank, suit) {
  const color = SUIT_COLOR[suit];
  const cid = `clip-${rank}-${suit}`;  // 한 문서에 52장을 넣어도 id가 겹치지 않게
  const body = [];

  if (['J', 'Q', 'K'].includes(rank)) {
    body.push(courtPanel(rank, suit, cid));
  } else if (rank === 'A') {
    body.push(pip(suit, W / 2, H / 2, 56));
  } else {
    const size = rank === '10' || rank === '9' ? 21 : 24;
    for (const [rx, ry] of LAYOUT[rank]) {
      body.push(pip(suit, rx * W, ry * H, size, ry > 0.5));
    }
  }

  // 모서리 표기: 좌상단 정방향, 우하단 180도
  const corner = (x, y, rot) =>
    `<g transform="translate(${x},${y}) rotate(${rot})">
       <text x="0" y="0" text-anchor="middle" font-family="Georgia,serif"
             font-size="19" font-weight="700" fill="${color}">${rank}</text>
       <g transform="translate(-6,3) scale(.13)">
         <path d="${SUIT_PATH[suit]}" fill="${color}"/>
       </g>
     </g>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"
            aria-label="${rank} of ${suit}">
    <defs><clipPath id="${cid}"><rect x="20" y="20" width="100" height="160" rx="2"/></clipPath></defs>
    <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="10"
          fill="${PAPER}" stroke="#c9c2b4" stroke-width="1.5"/>
    ${body.join('')}
    ${corner(15, 24, 0)}
    ${corner(W - 15, H - 24, 180)}
  </svg>`;
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['spade', 'heart', 'diamond', 'club'];

if (typeof module !== 'undefined') {
  module.exports = { cardSVG, RANKS, SUITS, SUIT_GLYPH, SUIT_PATH };
}
