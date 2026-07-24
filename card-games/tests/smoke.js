const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(require('path').join(__dirname,'..','docs','index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function tiles() { return [...doc.querySelectorAll('.tile')]; }
function buttons() { return [...doc.querySelectorAll('#stage button, .meters button')]; }
function byText(t) { return buttons().find((b) => b.textContent.includes(t)); }
function back() { const b = doc.getElementById('back'); if (b) b.click(); }

const errs = [];
window.addEventListener('error', (e) => errs.push('window: ' + e.message));

(async () => {
  console.log('타일 수:', tiles().length);
  console.log('타일 제목:', tiles().map((t) => t.querySelector('h3').textContent.replace(/^\d+/, '')).join(' / '));

  const run = async (idx, name, steps) => {
    try {
      tiles()[idx].click();
      await wait(20);
      await steps();
      console.log('✓', name);
    } catch (e) { errs.push(name + ': ' + e.message); console.log('✗', name, '—', e.message); }
    back(); await wait(20);
  };

  // 1 워: 20번 뒤집기
  await run(0, '워', async () => {
    for (let i = 0; i < 20; i++) { const b = byText('뒤집기'); if (!b) break; b.click(); await wait(5); }
    if (!doc.getElementById('wMeN').textContent.includes('장')) throw new Error('카운터 없음');
  });

  // 2 하이로우: 30번 추측
  await run(1, '하이로우', async () => {
    for (let i = 0; i < 30; i++) {
      const b = i % 2 ? byText('낮다') : byText('높다');
      if (!b || b.disabled) break; b.click(); await wait(3);
    }
    const p = doc.querySelectorAll('.pbar').length;
    if (p !== 3) throw new Error('확률 막대 ' + p + '개');
  });

  // 3 메모리: 모든 카드 순회 클릭
  await run(2, '메모리', async () => {
    if (doc.querySelectorAll('.tilecard').length !== 16) throw new Error('타일 16개 아님');
    for (let round = 0; round < 3; round++) {
      const cards = [...doc.querySelectorAll('.tilecard')];
      for (let i = 0; i < cards.length; i++) { cards[i].click(); await wait(4); }
      await wait(900);
    }
  });

  // 4 원카드: 낼 수 있으면 내고 아니면 가져오기, 40턴
  await run(3, '원카드', async () => {
    for (let t = 0; t < 40; t++) {
      const play = doc.querySelector('#oHand .card.playable');
      if (play) play.click();
      else { const d = byText('가져'); if (d) d.click(); else break; }
      await wait(60);
    }
    if (!doc.getElementById('oState').textContent) throw new Error('상태 표시 없음');
  });

  // 5 블랙잭: 딜 후 스탠드 반복
  await run(4, '블랙잭', async () => {
    for (let i = 0; i < 12; i++) {
      const d = byText('딜'); if (d) { d.click(); await wait(10); }
      const ins = byText('사지 않음'); if (ins) { ins.click(); await wait(10); }
      const s = byText('스탠드'); if (s) { s.click(); await wait(10); }
      const n = byText('다음 판'); if (n) n.click();
      await wait(10);
    }
    if (!doc.getElementById('bank')) throw new Error('자금 표시 없음');
  });

  // 6 포커: 딜 후 콜 반복
  await run(5, '포커', async () => {
    for (let i = 0; i < 12; i++) {
      const d = byText('딜'); if (d) { d.click(); await wait(10); }
      const c = byText('콜'); if (c) { c.click(); await wait(10); }
      if (!doc.querySelector('.card.best')) throw new Error('최선의 5장 강조 없음');
      const n = byText('다음 판'); if (n) n.click();
      await wait(10);
    }
  });

  // 7 족보 뽑기: 50회 뽑아 카테고리 분포 확인
  await run(6, '카드운세', async () => {
    const seen = {};
    for (let i = 0; i < 50; i++) {
      const r = byText('무작위로 채우기'); if (!r) throw new Error('버튼 없음');
      r.click(); await wait(8);
      const name = doc.querySelector('.vname');
      if (!name) throw new Error('결과 없음');
      seen[name.textContent.split(' ').pop()] = (seen[name.textContent.split(' ').pop()] || 0) + 1;
      if (doc.querySelectorAll('#dPicked .card').length !== 7) throw new Error('7장 아님');
      if (doc.querySelectorAll('#dPicked .card.best').length !== 5) throw new Error('최선 5장 아님');
      const again = byText('다시 뽑기'); if (again) again.click(); await wait(8);
    }
    console.log('   50회 분포:', Object.entries(seen).map(([k,v])=>k+' '+v).join(', '));
  });

  console.log('\n오류', errs.length, '건');
  errs.forEach((e) => console.log('  -', e));
  process.exit(errs.length ? 1 : 0);
})();
