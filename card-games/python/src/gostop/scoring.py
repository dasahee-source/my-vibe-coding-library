"""점수 계산.

기본 점수와 배수(박/고/흔들기)를 분리해서 계산한다.
기본 점수는 `base_score()`, 최종 점수는 `settle()`.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

from .cards import Card, Kind, TtiColor


@dataclass(slots=True)
class Breakdown:
    """점수 항목별 내역. UI/로그/AI 평가 함수에서 그대로 재사용한다."""

    gwang: int = 0
    godori: int = 0
    hongdan: int = 0
    chodan: int = 0
    chungdan: int = 0
    tti: int = 0
    yeol: int = 0
    pi: int = 0
    detail: dict[str, int] = field(default_factory=dict)

    @property
    def total(self) -> int:
        return (
            self.gwang
            + self.godori
            + self.hongdan
            + self.chodan
            + self.chungdan
            + self.tti
            + self.yeol
            + self.pi
        )


def count_pi(cards: Iterable[Card]) -> int:
    """피 점수 합. 쌍피는 2점."""
    return sum(c.pi_value for c in cards)


def base_score(captured: Iterable[Card]) -> Breakdown:
    """먹은 패로부터 기본 점수를 계산한다."""
    cards = list(captured)
    b = Breakdown()

    gwangs = [c for c in cards if c.kind is Kind.GWANG]
    n_gwang = len(gwangs)
    has_rain_gwang = any(c.is_rain for c in gwangs)
    if n_gwang == 5:
        b.gwang = 15
    elif n_gwang == 4:
        b.gwang = 4
    elif n_gwang == 3:
        b.gwang = 2 if has_rain_gwang else 3  # 비광 낀 삼광은 2점

    yeols = [c for c in cards if c.kind is Kind.YEOL]
    if len(yeols) >= 5:
        b.yeol = len(yeols) - 4
    if sum(1 for c in yeols if c.godori) == 3:
        b.godori = 5

    ttis = [c for c in cards if c.kind is Kind.TTI]
    if len(ttis) >= 5:
        b.tti = len(ttis) - 4
    by_color = {
        TtiColor.HONG: sum(1 for c in ttis if c.tti_color is TtiColor.HONG),
        TtiColor.CHO: sum(1 for c in ttis if c.tti_color is TtiColor.CHO),
        TtiColor.CHUNG: sum(1 for c in ttis if c.tti_color is TtiColor.CHUNG),
    }
    if by_color[TtiColor.HONG] == 3:
        b.hongdan = 3
    if by_color[TtiColor.CHO] == 3:
        b.chodan = 3
    if by_color[TtiColor.CHUNG] == 3:
        b.chungdan = 3

    pi_points = count_pi(cards)
    if pi_points >= 10:
        b.pi = pi_points - 9

    b.detail = {
        "n_gwang": n_gwang,
        "n_yeol": len(yeols),
        "n_tti": len(ttis),
        "pi_points": pi_points,
    }
    return b


@dataclass(slots=True)
class Settlement:
    """최종 정산 결과."""

    base: int
    multiplier: int
    total: int
    gwangbak: bool = False
    pibak: bool = False
    meongbak: bool = False
    gobak: bool = False
    go_bonus: int = 0
    go_count: int = 0
    shake: int = 0

    def describe(self) -> str:
        tags = []
        if self.go_count:
            tags.append(f"{self.go_count}고")
        if self.gwangbak:
            tags.append("광박")
        if self.pibak:
            tags.append("피박")
        if self.meongbak:
            tags.append("멍박")
        if self.gobak:
            tags.append("고박")
        if self.shake:
            tags.append(f"흔들기 x{2 ** self.shake}")
        suffix = f" ({', '.join(tags)})" if tags else ""
        return f"{self.total}점{suffix}"


def go_adjust(base: int, go_count: int) -> tuple[int, int]:
    """고 횟수에 따른 (보너스 점수, 배수)를 돌려준다.

    1고 +1점, 2고 +2점, 3고부터는 추가로 2배씩.
    """
    if go_count <= 0:
        return 0, 1
    bonus = 1 if go_count == 1 else 2
    multiplier = 2 ** max(0, go_count - 2)
    return bonus, multiplier


def settle(
    winner_cards: Iterable[Card],
    loser_cards: Iterable[Card],
    *,
    go_count: int = 0,
    shake: int = 0,
    loser_went_go: bool = False,
) -> Settlement:
    """승자 기준 최종 점수.

    Parameters
    ----------
    shake
        흔들기/폭탄 횟수. 1회당 2배.
    loser_went_go
        패자가 고를 외친 상태로 졌으면 고박 (2배).
    """
    winner = list(winner_cards)
    loser = list(loser_cards)
    b = base_score(winner)
    lb = base_score(loser)

    bonus, go_mult = go_adjust(b.total, go_count)
    score = b.total + bonus
    multiplier = go_mult

    gwangbak = b.detail["n_gwang"] >= 3 and lb.detail["n_gwang"] == 0
    pibak = b.pi > 0 and lb.detail["pi_points"] < 7
    meongbak = b.detail["n_yeol"] >= 7 and lb.detail["n_yeol"] == 0

    for flag in (gwangbak, pibak, meongbak, loser_went_go):
        if flag:
            multiplier *= 2
    multiplier *= 2**shake

    return Settlement(
        base=b.total,
        multiplier=multiplier,
        total=score * multiplier,
        gwangbak=gwangbak,
        pibak=pibak,
        meongbak=meongbak,
        gobak=loser_went_go,
        go_bonus=bonus,
        go_count=go_count,
        shake=shake,
    )
