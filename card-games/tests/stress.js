// 게임 사이를 계속 오가면서 오류가 누적되는지 확인
const fs = require('fs'); const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync(require('path').join(__dirname,'..','docs','index.html'),'utf8'), { runScripts:'dangerously', pretendToBeVisual:true });
const { window } = dom; const doc = window.document;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const errs = []; window.addEventListener('error', e => errs.push(e.message));

(async () => {
  for (let round = 0; round < 5; round++) {
    for (let g = 0; g < 8; g++) {
      doc.querySelectorAll('.tile')[g].click();
      await wait(15);
      // 눈에 보이는 버튼 아무거나 몇 번 누르고 즉시 이탈
      for (let k = 0; k < 4; k++) {
        const bs = [...doc.querySelectorAll('#stage button:not([disabled])')];
        if (bs.length) bs[Math.floor(Math.random()*bs.length)].click();
        const cs = [...doc.querySelectorAll('#stage .card.playable, #stage .tilecard')];
        if (cs.length) cs[Math.floor(Math.random()*cs.length)].click();
        await wait(12);
      }
      const b = doc.getElementById('back'); if (b) b.click();
      await wait(15);
    }
  }
  await wait(1200);
  console.log('30회 진입/이탈 · 오류', errs.length, '건');
  errs.slice(0,5).forEach(e => console.log('  -', e));
  console.log('메뉴 복귀 정상:', doc.querySelectorAll(".tile").length === 8);
})();
