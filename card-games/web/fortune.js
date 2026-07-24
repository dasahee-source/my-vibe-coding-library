// 카드로 보는 오늘의 운세.
//
// 기술적으로 눈여겨볼 점은 시드입니다. 날짜(YYYYMMDD)를 난수 시드로 쓰기 때문에
// 같은 날 몇 번을 열어도 결과가 같습니다. 저장소도 서버도 없이 "하루 한 번"이 성립합니다.
// 이게 시드 고정 난수의 쓸모입니다 — 무작위인데 재현 가능한 것.

const SUIT_LORE = {
  heart: {
    name: '하트', theme: '마음과 관계',
    caution: '감정이 앞설 수 있습니다.',
    advice: '주변 사람에게 먼저 말을 건네보세요.',
  },
  diamond: {
    name: '다이아', theme: '재물과 실리',
    caution: '작은 지출이 새어나갈 수 있습니다.',
    advice: '숫자를 한 번 더 확인하면 이득이 됩니다.',
  },
  club: {
    name: '클럽', theme: '활동과 성취',
    caution: '일을 벌이다 마무리를 놓칠 수 있습니다.',
    advice: '움직이면 움직인 만큼 결과가 붙습니다.',
  },
  spade: {
    name: '스페이드', theme: '과제와 판단',
    caution: '고민이 길어지면 기회가 지나갑니다.',
    advice: '어려운 쪽을 먼저 처리하면 하루가 가벼워집니다.',
  },
};

const RANK_LORE = {
  A:  { key: '시작',   today: '새로 손대기 좋은 날입니다.',           caution: '욕심내 한꺼번에 벌이지 마세요.', advice: '가장 작은 첫 걸음만 정하세요.' },
  2:  { key: '협력',   today: '혼자보다 둘일 때 잘 풀립니다.',        caution: '기대를 말하지 않으면 어긋납니다.', advice: '필요한 것을 분명히 말하세요.' },
  3:  { key: '확장',   today: '하던 일이 한 뼘 넓어집니다.',          caution: '벌린 만큼 관리가 따라야 합니다.', advice: '하나만 더 늘리는 선에서 멈추세요.' },
  4:  { key: '안정',   today: '무리하지 않아도 되는 흐름입니다.',      caution: '익숙함에 안주하기 쉽습니다.',   advice: '기반을 정리해두기 좋은 날입니다.' },
  5:  { key: '변화',   today: '예정에 없던 방향이 열립니다.',         caution: '흔들리다 중심을 놓칠 수 있습니다.', advice: '바꿀 것 하나만 골라 바꾸세요.' },
  6:  { key: '조정',   today: '어긋났던 것이 제자리를 찾습니다.',      caution: '남 눈치를 너무 보게 됩니다.',   advice: '균형은 양보가 아니라 조율입니다.' },
  7:  { key: '성찰',   today: '속도를 늦출수록 잘 보입니다.',         caution: '생각만 하다 하루가 갑니다.',    advice: '한 가지는 반드시 실행하세요.' },
  8:  { key: '추진',   today: '밀어붙이면 통하는 날입니다.',          caution: '주변 속도를 앞질러 갑니다.',    advice: '한 번쯤 뒤를 돌아보세요.' },
  9:  { key: '결실',   today: '오래 끌던 일이 마무리에 닿습니다.',     caution: '마지막에 마음이 급해집니다.',   advice: '끝맺음에 시간을 더 쓰세요.' },
  10: { key: '완성',   today: '한 매듭이 지어지는 날입니다.',         caution: '다음을 미리 걱정하게 됩니다.',  advice: '끝난 것을 충분히 인정해주세요.' },
  J:  { key: '소식',   today: '뜻밖의 연락이나 정보가 들어옵니다.',    caution: '설익은 소식에 흔들릴 수 있습니다.', advice: '들은 것은 하루 묵혀 판단하세요.' },
  Q:  { key: '통찰',   today: '보이지 않던 사정이 이해됩니다.',       caution: '남의 사정을 떠안기 쉽습니다.',  advice: '조언은 하되 대신 짊어지지 마세요.' },
  K:  { key: '결단',   today: '미뤄둔 결정을 내리기 좋습니다.',       caution: '독단으로 흐를 수 있습니다.',    advice: '정했으면 한 사람에게는 알리세요.' },
};

const SPOTS = [
  { title: '오늘의 기운', field: 'today' },
  { title: '조심할 것', field: 'caution' },
  { title: '오늘의 조언', field: 'advice' },
];

function mountFortune(root) {
  root.innerHTML = `
    <div class="zone">
      <h2 id="fHead">카드 세 장을 고르세요</h2>
      <div class="deckgrid" id="fGrid"></div>
    </div>
    <div id="fResult" style="display:none">
      <div class="spots" id="fSpots"></div>
      <div class="zone">
        <div class="odds">
          <div><span>오늘의 무늬</span><b id="fSuit">—</b><em id="fSuitWhy"></em></div>
          <div><span>오늘의 숫자</span><b id="fNum">—</b><em>세 장의 합에서</em></div>
        </div>
      </div>
    </div>
    <div class="row" id="fCtl"></div>
    <p class="msg" id="fMsg"></p>
    <div class="rules">
      날짜를 난수 시드로 쓰기 때문에 <b>같은 날에는 몇 번을 열어도 같은 카드</b>가 나옵니다.
      저장소도 서버도 없이 "하루 한 번"이 성립하는 거죠 —
      무작위인데 재현 가능하다는 시드 고정 난수의 성질을 그대로 쓴 예입니다.
      재미로 보는 것이니 결과에 너무 마음 쓰지는 마세요.
      <span id="fMode"></span>
    </div>`;

  const $ = (id) => document.getElementById(id);
  let deck = [], picked = [], done = false, daily = true;

  function dateKey() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function shuffled(seed) {
    const rand = mulberry32(seed);
    const d = [];
    for (const s of G_SUITS) for (const r of G_RANKS) d.push({ rank: r, suit: s });
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function start(useDaily = true) {
    daily = useDaily;
    deck = shuffled(useDaily ? dateKey() : Math.floor(Math.random() * 1e9));
    picked = []; done = false;
    $('fResult').style.display = 'none';
    $('fHead').textContent = '카드 세 장을 고르세요';
    const d = new Date();
    say(daily
      ? `${d.getMonth() + 1}월 ${d.getDate()}일의 배열입니다. 세 장을 고르세요.`
      : '재미로 한 번 더 — 이번엔 무작위 배열입니다.');
    render();
  }

  function say(html) { $('fMsg').innerHTML = html; }

  function render() {
    const g = $('fGrid');
    g.innerHTML = '';
    deck.forEach((c, i) => {
      const el = document.createElement('button');
      const chosen = picked.includes(i);
      el.className = 'slot' + (chosen ? ' chosen' : '');
      el.innerHTML = chosen ? cardSVG(c.rank, c.suit) : BACK_SVG;
      el.disabled = done || chosen;
      el.setAttribute('aria-label', chosen ? `${c.rank} 선택됨` : `${i + 1}번 자리`);
      el.onclick = () => pick(i);
      g.appendChild(el);
    });

    const c = $('fCtl'); c.innerHTML = '';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.textContent = label; if (cls) b.className = cls; b.onclick = fn; c.appendChild(b);
    };
    if (!done) {
      mk('아무 데나 세 장', '', () => {
        while (picked.length < 3) {
          const i = Math.floor(Math.random() * 52);
          if (!picked.includes(i)) picked.push(i);
        }
        render(); reveal();
      });
      if (picked.length) mk('다시 고르기', '', () => { picked = []; render(); });
    } else {
      mk('오늘의 운세 다시 보기', 'go', () => start(true));
      mk('재미로 한 번 더', '', () => start(false));
    }
    $('fMode').innerHTML = done && !daily
      ? ' 지금 보고 계신 것은 <b>무작위 배열</b>입니다.' : '';
  }

  function pick(i) {
    if (done || picked.includes(i)) return;
    picked.push(i);
    if (picked.length < 3) {
      say(`${picked.length}장 — ${3 - picked.length}장 더 고르세요.`);
      render();
      return;
    }
    render();
    reveal();
  }

  function reveal() {
    done = true;
    const cards = picked.map((i) => deck[i]);
    $('fHead').textContent = '고른 세 장';
    $('fResult').style.display = '';

    const wrap = $('fSpots');
    wrap.innerHTML = '';
    cards.forEach((c, i) => {
      const spot = SPOTS[i];
      const suit = SUIT_LORE[c.suit];
      const rank = RANK_LORE[c.rank];
      const body = spot.field === 'today'
        ? `${suit.theme}에 <b>${rank.key}</b>의 기운이 돕니다. ${rank.today}`
        : spot.field === 'caution'
          ? `${suit.caution} ${rank.caution}`
          : `${rank.advice} ${suit.advice}`;

      const el = document.createElement('div');
      el.className = 'spot';
      el.innerHTML =
        `<div class="spotcard">${cardSVG(c.rank, c.suit)}</div>` +
        `<div class="spottext"><h3>${spot.title}</h3>` +
        `<div class="spotcaption">${c.rank} ${suit.name} · ${rank.key}</div>` +
        `<p>${body}</p></div>`;
      wrap.appendChild(el);
    });

    // 오늘의 무늬: 세 장 중 가장 많이 나온 무늬 (동수면 첫 장)
    const tally = {};
    for (const c of cards) tally[c.suit] = (tally[c.suit] || 0) + 1;
    const topSuit = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    $('fSuit').textContent = SUIT_LORE[topSuit].name;
    $('fSuitWhy').textContent = tally[topSuit] > 1
      ? `${tally[topSuit]}장이 몰렸습니다` : SUIT_LORE[topSuit].theme;

    const sum = cards.reduce((s, c) => s + G_VALUE[c.rank], 0);
    $('fNum').textContent = (sum % 9) + 1;

    say(`${SUIT_LORE[topSuit].theme}이(가) 오늘의 축입니다.`);
    render();
  }

  start(true);
}
