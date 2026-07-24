"""화투 48장 정의와 카드 모델.

용어
----
gwang   광 (bright)
yeol    열끗 / 동물 (animal, 10점)
tti     띠 (ribbon, 5점)
pi      피 (junk, 1점)
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import Enum


class Kind(Enum):
    GWANG = "gwang"
    YEOL = "yeol"
    TTI = "tti"
    PI = "pi"


class TtiColor(Enum):
    HONG = "hong"  # 홍단
    CHO = "cho"  # 초단
    CHUNG = "chung"  # 청단
    PLAIN = "plain"  # 비띠 등 단 구성에 들어가지 않는 띠


@dataclass(frozen=True, slots=True)
class Card:
    """화투 한 장.

    `uid`는 장별 고유 번호다. 같은 월의 피처럼 속성이 완전히 같은 카드가
    존재하기 때문에, uid 없이 동등 비교하면 `list.remove()`가 엉뚱한 장을
    지워 카드가 유실된다. 덱 생성 시 1부터 순서대로 부여한다.
    """

    month: int  # 1..12
    kind: Kind
    name: str
    pi_value: int = 0  # 피 환산 점수 (쌍피 = 2)
    tti_color: TtiColor | None = None
    is_rain: bool = False  # 비(12월) 계열
    godori: bool = False  # 고도리 구성패
    uid: int = 0

    def __str__(self) -> str:
        return f"{self.month}월 {self.name}"


def _pi(month: int, name: str, value: int = 1, rain: bool = False) -> Card:
    return Card(month, Kind.PI, name, pi_value=value, is_rain=rain)


# 국진(9월 열끗)은 쌍피로 쓸 수 있으나, 기본 규칙에서는 열끗으로 고정한다.
# 옵션은 rules.Options.gukjin_as_ssangpi 로 제어.
_RAW_DECK: tuple[Card, ...] = (
    # 1월 송학
    Card(1, Kind.GWANG, "송학 광"),
    Card(1, Kind.TTI, "홍단", tti_color=TtiColor.HONG),
    _pi(1, "피"),
    _pi(1, "피"),
    # 2월 매조
    Card(2, Kind.YEOL, "꾀꼬리", godori=True),
    Card(2, Kind.TTI, "홍단", tti_color=TtiColor.HONG),
    _pi(2, "피"),
    _pi(2, "피"),
    # 3월 벚꽃
    Card(3, Kind.GWANG, "벚꽃 광"),
    Card(3, Kind.TTI, "홍단", tti_color=TtiColor.HONG),
    _pi(3, "피"),
    _pi(3, "피"),
    # 4월 흑싸리
    Card(4, Kind.YEOL, "두견새", godori=True),
    Card(4, Kind.TTI, "초단", tti_color=TtiColor.CHO),
    _pi(4, "피"),
    _pi(4, "피"),
    # 5월 난초
    Card(5, Kind.YEOL, "다리"),
    Card(5, Kind.TTI, "초단", tti_color=TtiColor.CHO),
    _pi(5, "피"),
    _pi(5, "피"),
    # 6월 모란
    Card(6, Kind.YEOL, "나비"),
    Card(6, Kind.TTI, "청단", tti_color=TtiColor.CHUNG),
    _pi(6, "피"),
    _pi(6, "피"),
    # 7월 홍싸리
    Card(7, Kind.YEOL, "멧돼지"),
    Card(7, Kind.TTI, "초단", tti_color=TtiColor.CHO),
    _pi(7, "피"),
    _pi(7, "피"),
    # 8월 공산
    Card(8, Kind.GWANG, "공산 광"),
    Card(8, Kind.YEOL, "기러기", godori=True),
    _pi(8, "피"),
    _pi(8, "피"),
    # 9월 국진
    Card(9, Kind.YEOL, "국진"),
    Card(9, Kind.TTI, "청단", tti_color=TtiColor.CHUNG),
    _pi(9, "피"),
    _pi(9, "피"),
    # 10월 단풍
    Card(10, Kind.YEOL, "사슴"),
    Card(10, Kind.TTI, "청단", tti_color=TtiColor.CHUNG),
    _pi(10, "피"),
    _pi(10, "피"),
    # 11월 오동
    Card(11, Kind.GWANG, "오동 광"),
    _pi(11, "쌍피", 2),
    _pi(11, "피"),
    _pi(11, "피"),
    # 12월 비
    Card(12, Kind.GWANG, "비광", is_rain=True),
    Card(12, Kind.YEOL, "제비", is_rain=True),
    Card(12, Kind.TTI, "비띠", tti_color=TtiColor.PLAIN, is_rain=True),
    _pi(12, "쌍피", 2, rain=True),
)

DECK: tuple[Card, ...] = tuple(
    replace(card, uid=i + 1) for i, card in enumerate(_RAW_DECK)
)

GUKJIN = next(c for c in DECK if c.month == 9 and c.kind is Kind.YEOL)
"""9월 국진. 쌍피 옵션 사용 시 열끗 대신 피 2점으로 계산한다."""


def new_deck() -> list[Card]:
    """섞지 않은 48장 덱 사본."""
    return list(DECK)


def validate_deck() -> None:
    """덱 구성이 규칙과 맞는지 검사한다 (import 시점 sanity check용)."""
    assert len(DECK) == 48, len(DECK)
    counts = {k: sum(1 for c in DECK if c.kind is k) for k in Kind}
    assert counts[Kind.GWANG] == 5, counts
    assert counts[Kind.YEOL] == 9, counts
    assert counts[Kind.TTI] == 10, counts
    assert counts[Kind.PI] == 24, counts
    assert sum(c.pi_value for c in DECK) == 26, "쌍피 2장 포함 26점"
    for month in range(1, 13):
        assert sum(1 for c in DECK if c.month == month) == 4, month


validate_deck()
