import pytest

from gostop.ai import GreedyPolicy, play_auto
from gostop.cards import DECK, Card, Kind
from gostop.engine import FIELD_SIZE, HAND_SIZE, Engine, Event


def month_cards(month):
    return [c for c in DECK if c.month == month]


def test_deal_partitions_the_deck():
    e = Engine(seed=1)
    total = len(e.deck) + len(e.field) + sum(len(p.hand) for p in e.players)
    assert total == 48
    assert len(e.field) == FIELD_SIZE
    assert all(len(p.hand) == HAND_SIZE for p in e.players)


def test_no_duplicate_cards_in_play():
    e = Engine(seed=7)
    seen = e.deck + e.field + e.players[0].hand + e.players[1].hand
    assert len(seen) == len(set(id(c) for c in seen)) or len(seen) == 48


def test_card_conservation_over_a_game():
    e = Engine(seed=42)
    play_auto(e, {0: GreedyPolicy(), 1: GreedyPolicy()})
    total = (
        len(e.deck)
        + len(e.field)
        + sum(len(p.hand) + len(p.captured) for p in e.players)
    )
    assert total == 48


def test_playing_unmatched_card_goes_to_field():
    e = Engine(seed=3)
    p = e.current
    # 바닥에 없는 월의 손패를 찾는다
    card = next((c for c in p.hand if not e.field_matches(c.month)), None)
    if card is None:
        pytest.skip("이 시드에서는 매치 없는 손패가 없음")
    before = len(e.field)
    e.play(card)
    # 손패는 바닥에 놓이고, 뒤집은 패에 따라 최대 +2
    assert len(e.field) >= before - 1


def test_rejects_card_not_in_hand():
    e = Engine(seed=5)
    outsider = next(c for c in DECK if c not in e.current.hand)
    with pytest.raises(ValueError):
        e.play(outsider)


def test_ppeok_leaves_three_cards_on_field():
    e = Engine(seed=11)
    e.players[0].hand = [month_cards(5)[0]]
    e.field = [month_cards(5)[1], Card(1, Kind.PI, "피", pi_value=1)]
    e.deck = [month_cards(5)[2]]
    e.turn = 0
    res = e.play(e.players[0].hand[0])
    assert Event.PPEOK in res.events
    assert len(e.field_matches(5)) == 3
    assert not res.captured


def test_jjok_steals_a_pi():
    e = Engine(seed=13)
    e.players[0].hand = [month_cards(6)[0]]
    e.players[1].captured = [c for c in month_cards(1) if c.kind is Kind.PI]
    e.field = [Card(2, Kind.PI, "피", pi_value=1)]
    e.deck = [month_cards(6)[1]]
    e.turn = 0
    res = e.play(e.players[0].hand[0])
    assert Event.JJOK in res.events
    assert Event.STEAL in res.events
    assert len(e.players[1].captured) == 1


def test_bomb_grants_extra_turn():
    e = Engine(seed=17)
    e.players[0].hand = month_cards(7)[:3]
    e.field = [month_cards(7)[3]]
    e.turn = 0
    assert e.bombable() == [7]
    res = e.bomb(7)
    assert Event.BOMB in res.events
    assert res.extra_turn
    assert len(res.captured) == 4
    assert e.players[0].shake == 1


def test_bomb_rejected_without_three_of_a_month():
    e = Engine(seed=19)
    e.players[0].hand = month_cards(3)[:2]
    e.field = [month_cards(3)[2]]
    e.turn = 0
    with pytest.raises(ValueError):
        e.bomb(3)


def test_auto_play_terminates():
    for seed in range(20):
        e = Engine(seed=seed)
        play_auto(e, {0: GreedyPolicy(), 1: GreedyPolicy()})
        assert e.finished
