from gostop.cards import DECK, Kind, TtiColor
from gostop.scoring import base_score, go_adjust, settle


def by_kind(kind):
    return [c for c in DECK if c.kind is kind]


def test_deck_composition():
    assert len(DECK) == 48
    assert len(by_kind(Kind.GWANG)) == 5
    assert len(by_kind(Kind.YEOL)) == 9
    assert len(by_kind(Kind.TTI)) == 10
    assert len(by_kind(Kind.PI)) == 24


def test_three_gwang_without_rain():
    gwang = [c for c in by_kind(Kind.GWANG) if not c.is_rain][:3]
    assert base_score(gwang).gwang == 3


def test_three_gwang_with_rain_is_two():
    non_rain = [c for c in by_kind(Kind.GWANG) if not c.is_rain][:2]
    rain = [c for c in by_kind(Kind.GWANG) if c.is_rain]
    assert base_score(non_rain + rain).gwang == 2


def test_five_gwang():
    assert base_score(by_kind(Kind.GWANG)).gwang == 15


def test_godori():
    godori = [c for c in DECK if c.godori]
    assert len(godori) == 3
    assert base_score(godori).godori == 5


def test_dan():
    hong = [c for c in DECK if c.tti_color is TtiColor.HONG]
    b = base_score(hong)
    assert b.hongdan == 3
    assert b.tti == 0  # 3장이라 띠 점수는 아직 없음


def test_pi_threshold():
    pi = [c for c in by_kind(Kind.PI) if c.pi_value == 1]
    assert base_score(pi[:9]).pi == 0
    assert base_score(pi[:10]).pi == 1
    assert base_score(pi[:12]).pi == 3


def test_ssangpi_counts_double():
    ssangpi = [c for c in DECK if c.pi_value == 2]
    ones = [c for c in by_kind(Kind.PI) if c.pi_value == 1][:8]
    assert base_score(ssangpi + ones).detail["pi_points"] == 12


def test_go_adjust():
    assert go_adjust(7, 0) == (0, 1)
    assert go_adjust(7, 1) == (1, 1)
    assert go_adjust(7, 2) == (2, 1)
    assert go_adjust(7, 3) == (2, 2)
    assert go_adjust(7, 4) == (2, 4)


def test_gwangbak_doubles():
    winner = by_kind(Kind.GWANG)[:3]
    loser = [c for c in by_kind(Kind.PI)][:2]
    s = settle(winner, loser)
    assert s.gwangbak
    assert s.total == s.base * 2


def test_gobak_when_loser_declared_go():
    winner = by_kind(Kind.GWANG)[:4]
    loser = by_kind(Kind.YEOL)[:1]
    s = settle(winner, loser, loser_went_go=True)
    assert s.gobak
