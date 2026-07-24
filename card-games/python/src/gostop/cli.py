"""터미널에서 AI와 한 판."""

from __future__ import annotations

import argparse

from .ai import GreedyPolicy
from .engine import Choice, Engine, Event
from .scoring import base_score

EVENT_LABEL = {
    Event.PPEOK: "뻑!",
    Event.TTADAK: "따닥!",
    Event.JJOK: "쪽!",
    Event.SSAKSSULI: "싹쓸이!",
    Event.BOMB: "폭탄!",
    Event.SHAKE: "흔들기!",
    Event.STEAL: "피 한 장 가져옴",
    Event.GO: "고!",
    Event.STOP: "스톱!",
}


def show(engine: Engine) -> None:
    me, ai = engine.players[0], engine.players[1]
    print("\n" + "─" * 52)
    print(f"바닥: {' | '.join(str(c) for c in engine.field) or '(비어 있음)'}")
    print(f"남은 더미: {len(engine.deck)}장")
    b_me, b_ai = base_score(me.captured), base_score(ai.captured)
    print(f"나  {b_me.total}점  (광{b_me.detail['n_gwang']} 열{b_me.detail['n_yeol']} "
          f"띠{b_me.detail['n_tti']} 피{b_me.detail['pi_points']})")
    print(f"AI  {b_ai.total}점  (광{b_ai.detail['n_gwang']} 열{b_ai.detail['n_yeol']} "
          f"띠{b_ai.detail['n_tti']} 피{b_ai.detail['pi_points']})")
    print("손패:")
    for i, c in enumerate(me.hand):
        n = len(engine.field_matches(c.month))
        mark = f"  <- 바닥 {n}장" if n else ""
        print(f"  [{i}] {c}{mark}")


def report(res, who: str) -> None:
    parts = []
    if res.played:
        parts.append(f"냄 {res.played}")
    if res.flipped:
        parts.append(f"뒤집기 {res.flipped}")
    if res.captured:
        parts.append(f"먹음 {len(res.captured)}장")
    line = f"[{who}] " + ", ".join(parts) if parts else f"[{who}]"
    tags = " ".join(EVENT_LABEL[e] for e in res.events if e in EVENT_LABEL)
    print(line + (f"  {tags}" if tags else ""))


def ask_int(prompt: str, lo: int, hi: int) -> int:
    while True:
        raw = input(prompt).strip()
        if raw.isdigit() and lo <= int(raw) <= hi:
            return int(raw)
        print(f"{lo}~{hi} 사이 숫자를 입력하세요.")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="고스톱(맞고) CLI")
    ap.add_argument("--seed", type=int, default=None, help="셔플 시드")
    args = ap.parse_args(argv)

    engine = Engine(seed=args.seed)
    ai = GreedyPolicy()

    while not engine.finished:
        if engine.turn == 0:
            show(engine)
            bombs = engine.bombable()
            if bombs:
                print(f"폭탄 가능: {bombs}월  (b<월> 입력)")
            raw = input("낼 패 번호> ").strip()
            if raw.startswith("b") and raw[1:].isdigit() and int(raw[1:]) in bombs:
                res = engine.bomb(int(raw[1:]))
            else:
                if not (raw.isdigit() and int(raw) < len(engine.current.hand)):
                    print("잘못된 입력")
                    continue
                card = engine.current.hand[int(raw)]
                choice = Choice.FIRST
                if len(engine.field_matches(card.month)) == 2:
                    m = engine.field_matches(card.month)
                    print(f"  0) {m[0]}   1) {m[1]}")
                    choice = Choice(ask_int("먹을 패> ", 0, 1))
                res = engine.play(card, choice=choice)
            report(res, "나")
            while res.pending_go:
                print(f"현재 {engine.current.score}점.")
                res = engine.declare(ask_int("0=스톱 1=고> ", 0, 1) == 1)
                report(res, "나")
        else:
            p = engine.current
            if not p.hand:
                engine.turn = 0
                continue
            card, choice = ai.choose_card(engine)
            res = engine.play(card, choice=choice)
            report(res, "AI")
            while res.pending_go:
                res = engine.declare(ai.choose_go(engine))
                report(res, "AI")

    print("\n" + "═" * 52)
    if engine.winner is None:
        print("나가리")
    else:
        who = "나" if engine.winner == 0 else "AI"
        print(f"{who} 승 — {engine.settlement.describe()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
