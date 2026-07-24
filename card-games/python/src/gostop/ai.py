"""규칙 기반 상대.

`Policy` 프로토콜만 지키면 MCTS든 학습 모델이든 그대로 갈아끼울 수 있다.
"""

from __future__ import annotations

from typing import Protocol

from .cards import Card, Kind
from .engine import Choice, Engine
from .scoring import base_score

# 패 종류별 가중치. 휴리스틱 튜닝 지점.
KIND_WEIGHT = {
    Kind.GWANG: 8.0,
    Kind.YEOL: 3.0,
    Kind.TTI: 3.0,
    Kind.PI: 1.0,
}


class Policy(Protocol):
    def choose_card(self, engine: Engine) -> tuple[Card, Choice]: ...
    def choose_go(self, engine: Engine) -> bool: ...


def card_value(card: Card) -> float:
    v = KIND_WEIGHT[card.kind]
    if card.kind is Kind.PI:
        v *= card.pi_value
    if card.godori:
        v += 2.0
    if card.tti_color is not None and card.tti_color.value in ("hong", "cho", "chung"):
        v += 1.5
    return v


class GreedyPolicy:
    """한 수 앞만 보는 탐욕적 정책. 기준선(baseline)용."""

    def __init__(self, go_threshold: int = 10) -> None:
        self.go_threshold = go_threshold

    def choose_card(self, engine: Engine) -> tuple[Card, Choice]:
        hand = engine.current.hand
        best: tuple[float, Card, Choice] | None = None
        for card in hand:
            matches = engine.field_matches(card.month)
            if not matches:
                # 못 먹는 수는 상대에게 넘겨주는 값이 작을수록 좋다
                gain = -card_value(card) * 0.3
                cand = (gain, card, Choice.FIRST)
            elif len(matches) == 1:
                cand = (card_value(matches[0]) + card_value(card) * 0.1, card, Choice.FIRST)
            elif len(matches) == 2:
                ranked = sorted(range(2), key=lambda i: -card_value(matches[i]))
                pick = ranked[0]
                cand = (card_value(matches[pick]), card, Choice(pick))
            else:
                cand = (sum(card_value(c) for c in matches), card, Choice.FIRST)
            if best is None or cand[0] > best[0]:
                best = cand
        assert best is not None
        return best[1], best[2]

    def choose_go(self, engine: Engine) -> bool:
        me = engine.current
        opp = engine.opponent
        # 상대가 곧 점수를 낼 것 같으면 스톱
        if base_score(opp.captured).total >= 5:
            return False
        if me.score >= self.go_threshold:
            return False
        # 남은 패가 충분할 때만 고
        return len(me.hand) >= 3


def play_auto(engine: Engine, policies: dict[int, Policy], max_turns: int = 200) -> Engine:
    """정책끼리 자동 대국. 시뮬레이션/평가용."""
    turns = 0
    while not engine.finished and turns < max_turns:
        turns += 1
        p = engine.current
        if not p.hand:
            engine.turn = 1 - engine.turn
            if not engine.players[engine.turn].hand:
                engine._finish_draw()
            continue
        policy = policies[p.index]
        card, choice = policy.choose_card(engine)
        res = engine.play(card, choice=choice)
        while res.pending_go:
            res = engine.declare(policy.choose_go(engine))
    return engine
