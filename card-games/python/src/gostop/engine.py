"""맞고(2인) 진행 엔진.

설계 원칙
--------
* 상태 전이는 순수 함수에 가깝게 유지한다. I/O 없음, 랜덤은 주입한 `Random`만 사용.
* 한 턴은 `Engine.play()` 한 번으로 끝나고, 결과는 `TurnResult`로 반환한다.
* 고/스톱 결정은 엔진이 묻지 않는다. `pending_go`가 True면 호출자가
  `Engine.declare(go=True/False)`를 부른다.
"""

from __future__ import annotations

import random as _random
from dataclasses import dataclass, field
from enum import Enum, auto

from .cards import Card, Kind, new_deck
from .scoring import Settlement, base_score, settle

HAND_SIZE = 10
FIELD_SIZE = 8
GO_THRESHOLD = 7


class Event(Enum):
    PPEOK = auto()  # 뻑
    TTADAK = auto()  # 따닥
    JJOK = auto()  # 쪽
    SSAKSSULI = auto()  # 싹쓸이
    BOMB = auto()  # 폭탄
    SHAKE = auto()  # 흔들기
    STEAL = auto()  # 상대 피 1장 획득
    GO = auto()
    STOP = auto()


@dataclass(slots=True)
class Player:
    index: int
    hand: list[Card] = field(default_factory=list)
    captured: list[Card] = field(default_factory=list)
    go_count: int = 0
    shake: int = 0
    last_go_score: int = 0

    @property
    def score(self) -> int:
        return base_score(self.captured).total


@dataclass(slots=True)
class TurnResult:
    player: int
    played: Card | None
    flipped: Card | None
    captured: list[Card] = field(default_factory=list)
    events: list[Event] = field(default_factory=list)
    pending_go: bool = False
    extra_turn: bool = False
    log: list[str] = field(default_factory=list)


class Choice(Enum):
    """바닥에 같은 월 2장이 있을 때 어느 쪽을 먹을지 호출자가 고른다."""

    FIRST = 0
    SECOND = 1


class GameOver(Exception):
    def __init__(self, settlement: Settlement | None, winner: int | None):
        super().__init__("game over")
        self.settlement = settlement
        self.winner = winner


class Engine:
    def __init__(self, seed: int | None = None) -> None:
        self.rng = _random.Random(seed)
        self.players: list[Player] = [Player(0), Player(1)]
        self.field: list[Card] = []
        self.deck: list[Card] = []
        self.turn = 0
        self.finished = False
        self.settlement: Settlement | None = None
        self.winner: int | None = None
        # 뻑으로 묶인 월 -> 그 월을 마지막에 뻑낸 플레이어 (쓸어담을 권리)
        self.ppeok_owner: dict[int, int] = {}
        self.deal()

    # ------------------------------------------------------------------ setup
    def deal(self) -> None:
        deck = new_deck()
        self.rng.shuffle(deck)
        for p in self.players:
            p.hand = [deck.pop() for _ in range(HAND_SIZE)]
            p.hand.sort(key=lambda c: (c.month, c.kind.value))
        self.field = [deck.pop() for _ in range(FIELD_SIZE)]
        self.deck = deck

    # ------------------------------------------------------------------ query
    @property
    def current(self) -> Player:
        return self.players[self.turn]

    @property
    def opponent(self) -> Player:
        return self.players[1 - self.turn]

    def field_matches(self, month: int) -> list[Card]:
        return [c for c in self.field if c.month == month]

    def shakeable(self, player: int | None = None) -> list[int]:
        """흔들기 가능한 월 목록 (손에 같은 월 3장)."""
        hand = self.players[player if player is not None else self.turn].hand
        return sorted({m for m in range(1, 13) if sum(1 for c in hand if c.month == m) == 3})

    def bombable(self, player: int | None = None) -> list[int]:
        """폭탄 가능한 월 (손 3장 + 바닥 1장)."""
        hand = self.players[player if player is not None else self.turn].hand
        return sorted(
            {
                m
                for m in range(1, 13)
                if sum(1 for c in hand if c.month == m) == 3
                and len(self.field_matches(m)) == 1
            }
        )

    # ------------------------------------------------------------- mechanics
    def _take(self, player: Player, cards: list[Card], res: TurnResult) -> None:
        for c in cards:
            if c in self.field:
                self.field.remove(c)
        player.captured.extend(cards)
        res.captured.extend(cards)

    def _steal_pi(self, res: TurnResult) -> None:
        """상대에게서 피 1점짜리를 한 장 뺏는다 (없으면 무시)."""
        victim = self.opponent
        pool = [c for c in victim.captured if c.kind is Kind.PI]
        if not pool:
            return
        pool.sort(key=lambda c: c.pi_value)  # 1점짜리부터 준다
        card = pool[0]
        victim.captured.remove(card)
        self.current.captured.append(card)
        res.events.append(Event.STEAL)
        res.log.append(f"상대 피 획득: {card}")

    def _claim_ppeok(self, month: int, res: TurnResult) -> None:
        owner = self.ppeok_owner.pop(month, None)
        if owner is not None:
            res.log.append(f"{month}월 뻑 회수")

    # ------------------------------------------------------------------ moves
    def bomb(self, month: int) -> TurnResult:
        """폭탄: 같은 월 3장을 한 번에 내고 바닥 1장까지 전부 먹는다."""
        if month not in self.bombable():
            raise ValueError(f"{month}월은 폭탄 불가")
        p = self.current
        res = TurnResult(player=p.index, played=None, flipped=None)
        bomb_cards = [c for c in p.hand if c.month == month]
        for c in bomb_cards:
            p.hand.remove(c)
        self._take(p, self.field_matches(month) + bomb_cards, res)
        p.shake += 1
        res.events.extend([Event.BOMB, Event.SHAKE])
        self._steal_pi(res)
        res.extra_turn = True
        res.log.append(f"{month}월 폭탄")
        self._maybe_go(res)
        return res

    def play(
        self,
        card: Card,
        *,
        choice: Choice = Choice.FIRST,
        flip_choice: Choice = Choice.FIRST,
        shake: bool = False,
    ) -> TurnResult:
        """손패 한 장을 내고 더미 한 장을 뒤집는 한 턴."""
        if self.finished:
            raise GameOver(self.settlement, self.winner)
        p = self.current
        if card not in p.hand:
            raise ValueError(f"손패에 없음: {card}")
        if shake:
            if card.month not in self.shakeable():
                raise ValueError("흔들기 조건 미충족")
            p.shake += 1

        res = TurnResult(player=p.index, played=card, flipped=None)
        if shake:
            res.events.append(Event.SHAKE)
        p.hand.remove(card)

        # 1) 손패 처리
        matches = self.field_matches(card.month)
        hand_landed = False  # 못 먹고 바닥에 놓였는가 (쪽 판정용)
        pending: list[Card] = []  # 이번 턴에 확정되지 않은 같은 월 카드

        if not matches:
            self.field.append(card)
            hand_landed = True
        elif len(matches) <= 2:
            picked = matches[choice.value] if len(matches) == 2 else matches[0]
            # 확정 전까지 바닥에서 빼두어야 뻑 판정이 정확해진다
            self.field.remove(picked)
            pending = [card, picked]
        else:  # 3장 -> 전부 먹음
            self._take(p, matches + [card], res)
            self._claim_ppeok(card.month, res)

        # 2) 더미 뒤집기
        flipped = self.deck.pop() if self.deck else None
        res.flipped = flipped

        if flipped is None:
            self._resolve_pending(p, pending, res)
            return self._end_turn(res)

        f_matches = self.field_matches(flipped.month)

        # 손패와 뒤집은 패가 같은 월인 경우
        if flipped.month == card.month:
            if hand_landed:
                # 쪽: 방금 놓은 내 패를 뒤집은 패로 회수
                self.field.remove(card)
                self._take(p, [flipped, card], res)
                res.events.append(Event.JJOK)
                self._steal_pi(res)
            elif pending:
                remaining = self.field_matches(card.month)
                if remaining:
                    # 바닥에 아직 같은 월이 남아 있으면 전부 회수
                    self._take(p, remaining + pending + [flipped], res)
                    pending = []
                else:
                    # 뻑: 손패 + 뒤집은 패 + 바닥패가 묶여 아무도 못 먹음
                    self.field.extend(pending + [flipped])
                    self.ppeok_owner[card.month] = p.index
                    res.events.append(Event.PPEOK)
                    pending = []
            else:
                self._take(p, [flipped], res)
        else:
            hand_pair = len(pending) == 2
            self._resolve_pending(p, pending, res)
            pending = []
            if not f_matches:
                self.field.append(flipped)
            elif len(f_matches) == 1:
                self._take(p, [flipped, f_matches[0]], res)
                if hand_pair:
                    # 따닥: 손패로 한 쌍, 뒤집은 패로 또 한 쌍
                    res.events.append(Event.TTADAK)
                    self._steal_pi(res)
            elif len(f_matches) == 2:
                self._take(p, [flipped, f_matches[flip_choice.value]], res)
            else:
                self._take(p, f_matches + [flipped], res)
                self._claim_ppeok(flipped.month, res)

        self._resolve_pending(p, pending, res)

        # 3) 싹쓸이
        if not self.field and res.captured:
            res.events.append(Event.SSAKSSULI)
            self._steal_pi(res)

        return self._end_turn(res)

    def _resolve_pending(self, p: Player, pending: list[Card], res: TurnResult) -> None:
        if pending:
            self._take(p, pending, res)
            self._claim_ppeok(pending[0].month, res)

    # ------------------------------------------------------------------- flow
    def _maybe_go(self, res: TurnResult) -> TurnResult:
        p = self.current
        if p.score >= GO_THRESHOLD and p.score > p.last_go_score:
            res.pending_go = True
        return res

    def _end_turn(self, res: TurnResult) -> TurnResult:
        p = self.current
        self._maybe_go(res)
        if res.pending_go:
            return res
        if not p.hand and not self.deck:
            self._finish_draw()
        else:
            self.turn = 1 - self.turn
        return res

    def declare(self, go: bool) -> TurnResult:
        """고/스톱 선언. `TurnResult.pending_go`가 True일 때만 호출한다."""
        p = self.current
        res = TurnResult(player=p.index, played=None, flipped=None)
        if go:
            p.go_count += 1
            p.last_go_score = p.score
            res.events.append(Event.GO)
            if not p.hand and not self.deck:
                self._finish_draw()
            else:
                self.turn = 1 - self.turn
        else:
            res.events.append(Event.STOP)
            self._finish(p.index)
        return res

    def _finish(self, winner: int) -> None:
        w = self.players[winner]
        loser = self.players[1 - winner]
        self.settlement = settle(
            w.captured,
            loser.captured,
            go_count=w.go_count,
            shake=w.shake + loser.shake,
            loser_went_go=loser.go_count > 0,
        )
        self.winner = winner
        self.finished = True

    def _finish_draw(self) -> None:
        """양쪽 다 패가 떨어지면 나가리."""
        self.settlement = None
        self.winner = None
        self.finished = True
