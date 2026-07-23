"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import "./games.css";

export function GameShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="game-page">
      <header className="game-header">
        <a href="../../" className="back-link">← 프로그램 도서관</a>
        <span>VIBE PLAYGROUND</span>
      </header>
      <section className="game-intro">
        <p>FRONTEND MINI GAME</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </section>
      <section className="game-panel">{children}</section>
    </main>
  );
}

const colors = ["#ff7f73", "#60b99e", "#f3c94e", "#7da6e8", "#c58ce0", "#ffad66", "#6bc8d8", "#93c96f"];

export function DartGame() {
  const [text, setText] = useState("치킨\n피자\n떡볶이\n햄버거");
  const items = text.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

  function spin() {
    if (items.length < 2 || spinning) return;
    const index = Math.floor(Math.random() * items.length);
    const slice = 360 / items.length;
    const target = 360 * 6 + (360 - index * slice - slice / 2);
    setSpinning(true);
    setResult("");
    setRotation((current) => current + target);
    window.setTimeout(() => {
      setResult(items[index]);
      setSpinning(false);
    }, 2800);
  }

  const background = items.length
    ? `conic-gradient(${items.map((_, i) => `${colors[i]} ${i * 100 / items.length}% ${(i + 1) * 100 / items.length}%`).join(",")})`
    : "#eee";

  return (
    <GameShell title="다트 돌리기" subtitle="후보를 적고 원판을 돌려 오늘의 선택을 정해보세요.">
      <div className="two-column">
        <div className="control-card">
          <label>후보 입력 <small>한 줄에 하나, 최대 8개</small></label>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="game-button" onClick={spin} disabled={items.length < 2 || spinning}>
            {spinning ? "돌아가는 중…" : "원판 돌리기"}
          </button>
          {result && <div className="result-box">선택 결과<strong>{result}</strong></div>}
        </div>
        <div className="wheel-area">
          <span className="pointer">▼</span>
          <div className="wheel" style={{ background, transform: `rotate(${rotation}deg)` }}>
            {items.map((item, i) => (
              <span key={`${item}-${i}`} style={{ transform: `rotate(${i * 360 / items.length + 180 / items.length}deg)` }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export function LadderGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["민수", "지영", "수진", "현우"]);
  const [prizes, setPrizes] = useState(["커피", "간식", "설거지", "통과"]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState("");

  function resize(next: number) {
    setCount(next);
    setNames((old) => Array.from({ length: next }, (_, i) => old[i] ?? `참가자 ${i + 1}`));
    setPrizes((old) => Array.from({ length: next }, (_, i) => old[i] ?? `결과 ${i + 1}`));
    setSelected(null);
    setResult("");
  }

  function makeLadder() {
    const rows = 8;
    const generated = Array.from({ length: rows }, () => {
      const row = Array(count - 1).fill(false);
      for (let x = 0; x < count - 1; x += 1) {
        if (Math.random() > 0.55 && !row[x - 1]) row[x] = true;
      }
      return row;
    });
    setPaths(generated);
    setSelected(null);
    setResult("");
  }

  useEffect(() => {
    makeLadder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const gap = width / (count + 1);
    const top = 28;
    const bottom = height - 28;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#c7d7d0";
    for (let i = 0; i < count; i += 1) {
      ctx.beginPath(); ctx.moveTo(gap * (i + 1), top); ctx.lineTo(gap * (i + 1), bottom); ctx.stroke();
    }
    paths.forEach((row, y) => row.forEach((on, x) => {
      if (!on) return;
      const py = top + ((y + 1) * (bottom - top)) / (paths.length + 1);
      ctx.beginPath(); ctx.moveTo(gap * (x + 1), py); ctx.lineTo(gap * (x + 2), py); ctx.stroke();
    }));
    if (selected === null) return;
    let column = selected;
    ctx.strokeStyle = "#ff6659";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(gap * (column + 1), top);
    paths.forEach((row, y) => {
      const py = top + ((y + 1) * (bottom - top)) / (paths.length + 1);
      ctx.lineTo(gap * (column + 1), py);
      if (column > 0 && row[column - 1]) column -= 1;
      else if (column < count - 1 && row[column]) column += 1;
      ctx.lineTo(gap * (column + 1), py);
    });
    ctx.lineTo(gap * (column + 1), bottom);
    ctx.stroke();
    setResult(`${names[selected]} → ${prizes[column]}`);
  }, [count, names, paths, prizes, selected]);

  return (
    <GameShell title="사다리타기" subtitle="2명부터 8명까지 참가자를 정하고 공정하게 결과를 뽑아보세요.">
      <div className="ladder-controls">
        <label>인원수
          <select value={count} onChange={(e) => resize(Number(e.target.value))}>
            {[2,3,4,5,6,7,8].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <button className="game-button compact" onClick={makeLadder}>새 사다리</button>
      </div>
      <div className="name-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(72px, 1fr))` }}>
        {names.map((name, i) => <input key={i} value={name} aria-label={`참가자 ${i + 1}`} onChange={(e) => setNames(names.map((v, x) => x === i ? e.target.value : v))} />)}
      </div>
      <div className="ladder-canvas-wrap"><canvas ref={canvasRef} width={900} height={430} /></div>
      <div className="name-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(72px, 1fr))` }}>
        {prizes.map((prize, i) => <input key={i} value={prize} aria-label={`결과 ${i + 1}`} onChange={(e) => setPrizes(prizes.map((v, x) => x === i ? e.target.value : v))} />)}
      </div>
      <div className="participant-buttons">
        {names.map((name, i) => <button key={i} onClick={() => setSelected(i)}>{name || `${i + 1}번`} 출발</button>)}
      </div>
      {result && <div className="result-box"><strong>{result}</strong></div>}
    </GameShell>
  );
}

export function RpsGame() {
  const choices = [
    { icon: "✊", name: "바위" },
    { icon: "✌️", name: "가위" },
    { icon: "✋", name: "보" },
  ];
  const [score, setScore] = useState({ win: 0, draw: 0, lose: 0 });
  const [preview, setPreview] = useState(0);
  const [mine, setMine] = useState<number | null>(null);
  const [computer, setComputer] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"win" | "draw" | "lose" | null>(null);

  useEffect(() => {
    if (computer !== null) return;
    const interval = window.setInterval(() => setPreview((value) => (value + 1) % choices.length), 170);
    return () => window.clearInterval(interval);
  }, [computer, choices.length]);

  function play(myChoice: number) {
    const computerChoice = Math.floor(Math.random() * 3);
    const result = myChoice === computerChoice ? "draw" : (myChoice - computerChoice + 3) % 3 === 2 ? "win" : "lose";
    setMine(myChoice);
    setComputer(computerChoice);
    setOutcome(result);
    setScore((old) => ({ ...old, [result]: old[result] + 1 }));
  }

  function resetRound() {
    setMine(null);
    setComputer(null);
    setOutcome(null);
  }

  return (
    <GameShell title="가위바위보" subtitle="컴퓨터와 겨루고 나의 승률을 확인해보세요.">
      <div className="scoreboard"><span>승리 <strong>{score.win}</strong></span><span>무승부 <strong>{score.draw}</strong></span><span>패배 <strong>{score.lose}</strong></span></div>
      <div className={`rps-arena ${outcome ?? "waiting"}`}>
        {mine === null ? (
          <div className="computer-pick moving">
            <span className="pick-label">COMPUTER</span>
            <strong key={preview}>{choices[preview].icon}</strong>
            <p>컴퓨터가 선택 중이에요</p>
          </div>
        ) : (
          <>
            <div className={`pick-card mine ${outcome === "win" ? "winner" : ""}`}>
              <span className="pick-label">나의 선택</span>
              <strong>{choices[mine].icon}</strong>
              <b>{choices[mine].name}</b>
            </div>
            <div className="versus">
              <strong>{outcome === "win" ? "승리!" : outcome === "draw" ? "무승부" : "패배"}</strong>
              <span>VS</span>
            </div>
            <div className={`pick-card computer ${outcome === "lose" ? "winner" : ""}`}>
              <span className="pick-label">컴퓨터</span>
              <strong>{choices[computer!].icon}</strong>
              <b>{choices[computer!].name}</b>
            </div>
          </>
        )}
      </div>
      <p className="rps-guide">{mine === null ? "아래에서 나의 선택을 눌러주세요." : "다른 손을 누르면 바로 다음 판이 시작됩니다."}</p>
      <div className="choice-buttons">
        {choices.map((choice, i) => <button className={mine === i ? "selected" : ""} key={choice.name} onClick={() => play(i)}><span>{choice.icon}</span>{choice.name}</button>)}
      </div>
      <div className="rps-tools">
        {mine !== null && <button className="text-button" onClick={resetRound}>선택 화면으로</button>}
        <button className="text-button" onClick={() => { setScore({ win: 0, draw: 0, lose: 0 }); resetRound(); }}>전적 초기화</button>
      </div>
    </GameShell>
  );
}

export function GuessGame() {
  const [max, setMax] = useState(100);
  const [answer, setAnswer] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState("숫자를 입력해 첫 추측을 시작하세요.");
  const [done, setDone] = useState(false);

  function reset(nextMax = max) {
    setMax(nextMax); setAnswer(Math.floor(Math.random() * nextMax) + 1);
    setValue(""); setTries(0); setHint(`1부터 ${nextMax} 사이의 숫자를 맞혀보세요.`); setDone(false);
  }
  function guess() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > max || done) return;
    setTries((old) => old + 1);
    if (n === answer) { setHint(`정답! ${tries + 1}번 만에 맞혔어요 🎉`); setDone(true); }
    else setHint(n < answer ? `${n}보다 높아요 ↑` : `${n}보다 낮아요 ↓`);
    setValue("");
  }

  return (
    <GameShell title="숫자 맞히기" subtitle="힌트를 따라 숨겨진 숫자를 가장 적은 횟수로 찾아보세요.">
      <div className="difficulty">{[50,100,500].map((n) => <button className={max === n ? "active" : ""} key={n} onClick={() => reset(n)}>1–{n}</button>)}</div>
      <div className="big-result">{hint}</div>
      <div className="guess-row">
        <input type="number" min="1" max={max} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guess()} placeholder={`1 ~ ${max}`} />
        <button className="game-button compact" onClick={guess}>확인</button>
      </div>
      <p className="tries">시도 횟수: <strong>{tries}</strong></p>
      {done && <button className="game-button" onClick={() => reset()}>다시 하기</button>}
    </GameShell>
  );
}

const cardIcons = ["🍎","🌙","🚀","🌼","🎈","🐳","🍀","⭐"];

export function MemoryGame() {
  const createDeck = () => [...cardIcons, ...cardIcons].sort(() => Math.random() - .5).map((icon, id) => ({ id, icon }));
  const [deck, setDeck] = useState(createDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  function flip(index: number) {
    if (open.length === 2 || open.includes(index) || matched.includes(index)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length === 2) {
      setMoves((n) => n + 1);
      if (deck[next[0]].icon === deck[next[1]].icon) {
        setMatched((old) => [...old, ...next]); setOpen([]);
      } else window.setTimeout(() => setOpen([]), 650);
    }
  }
  function restart() { setDeck(createDeck()); setOpen([]); setMatched([]); setMoves(0); }

  return (
    <GameShell title="기억력 카드 맞추기" subtitle="같은 그림 두 장의 위치를 기억해 모든 짝을 찾아보세요.">
      <div className="memory-top"><span>이동 <strong>{moves}</strong>회</span><button className="text-button" onClick={restart}>새 게임</button></div>
      <div className="memory-grid">
        {deck.map((card, i) => {
          const visible = open.includes(i) || matched.includes(i);
          return <button key={card.id} className={visible ? "open" : ""} aria-label={visible ? card.icon : "뒤집힌 카드"} onClick={() => flip(i)}>{visible ? card.icon : "?"}</button>;
        })}
      </div>
      {matched.length === deck.length && <div className="result-box">모두 찾았어요!<strong>{moves}회 만에 성공 🎉</strong></div>}
    </GameShell>
  );
}

export function ReactionGame() {
  const [state, setState] = useState<"idle" | "waiting" | "ready" | "done" | "early">("idle");
  const [started, setStarted] = useState(0);
  const [time, setTime] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("reaction-best");
    if (saved) setBest(Number(saved));
  }, []);

  function begin() {
    if (timer.current) window.clearTimeout(timer.current);
    setState("waiting"); setTime(null);
    timer.current = window.setTimeout(() => { setStarted(performance.now()); setState("ready"); }, 1200 + Math.random() * 2800);
  }
  function tap() {
    if (state === "waiting") {
      if (timer.current) window.clearTimeout(timer.current);
      setState("early");
    } else if (state === "ready") {
      const result = Math.round(performance.now() - started);
      setTime(result); setState("done");
      if (best === null || result < best) {
        localStorage.setItem("reaction-best", String(result));
        setBest(result);
      }
    }
  }

  const copy = {
    idle: ["준비됐나요?", "시작 버튼을 누르세요."],
    waiting: ["기다리세요…", "초록색으로 바뀌기 전에 누르면 안 돼요."],
    ready: ["지금 클릭!", "최대한 빠르게 누르세요."],
    done: [`${time} ms`, "좋아요! 한 번 더 도전해보세요."],
    early: ["너무 빨라요!", "초록색이 된 뒤 눌러야 해요."],
  }[state];

  return (
    <GameShell title="반응속도 테스트" subtitle="화면이 초록색으로 바뀌는 순간을 잡아 반응시간을 측정하세요.">
      <button className={`reaction-zone ${state}`} onClick={tap} disabled={state === "idle" || state === "done" || state === "early"}>
        <strong>{copy[0]}</strong><span>{copy[1]}</span>
      </button>
      <div className="reaction-footer">
        <span>최고 기록 <strong>{best ? `${best} ms` : "아직 없음"}</strong></span>
        <button className="game-button compact" onClick={begin}>{state === "idle" ? "시작" : "다시 도전"}</button>
      </div>
    </GameShell>
  );
}
