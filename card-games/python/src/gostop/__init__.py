"""고스톱(맞고) 룰 엔진."""

from .ai import GreedyPolicy, Policy, play_auto
from .cards import DECK, Card, Kind, TtiColor, new_deck
from .engine import Choice, Engine, Event, GameOver, Player, TurnResult
from .scoring import Breakdown, Settlement, base_score, settle

__version__ = "0.1.0"

__all__ = [
    "DECK",
    "Breakdown",
    "Card",
    "Choice",
    "Engine",
    "Event",
    "GameOver",
    "GreedyPolicy",
    "Kind",
    "Player",
    "Policy",
    "Settlement",
    "TtiColor",
    "TurnResult",
    "base_score",
    "new_deck",
    "play_auto",
    "settle",
]
