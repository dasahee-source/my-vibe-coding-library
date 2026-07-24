#!/usr/bin/env python3
"""모듈 소스를 하나의 HTML로 조립한다.

배포물은 외부 리소스가 전혀 없는 단일 파일이어야 한다 —
GitHub Pages에 그대로 올라가고, 내려받아 더블클릭해도 열리며, 오프라인에서도 돈다.
그래서 개발은 모듈로 하고, 배포 직전에 이 스크립트로 합친다.

    python3 build.py            docs/ 를 다시 만든다
    python3 build.py --check    빌드 결과가 docs/ 와 같은지만 검사한다 (CI용)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).parent
WEB = ROOT / "web"
DOCS = ROOT / "docs"

# 브라우저에서는 module.exports가 없으므로 잘라낸다.
EXPORT_MARK = "if (typeof module !== 'undefined')"

# 도안 모듈이 RANKS / SUITS 를 이미 선언하므로 엔진 쪽 중복 선언을 뺀다.
DEDUPE = [(
    "const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];\n"
    "const SUITS = ['spade', 'heart', 'diamond', 'club'];\n",
    "// RANKS / SUITS 는 도안 모듈에서 선언한 것을 그대로 쓴다\n",
)]

TARGETS = {
    "index.html": {
        "shell": "shell.html",
        "modules": {
            "ART_TRUMP": "art-trump.js",
            "BLACKJACK_ENGINE": "blackjack-engine.js",
            "POKER_ENGINE": "poker-engine.js",
            "BLACKJACK_VIEW": "blackjack-view.js",
            "POKER_VIEW": "poker-view.js",
            "GAMES_BASIC": "games-basic.js",
            "DRAW7": "draw7.js",
            "FORTUNE": "fortune.js",
        },
        "dedupe": ["blackjack-engine.js"],
    },
    "gostop.html": {
        "shell": "gostop-shell.html",
        "modules": {
            "ART": "gostop-art.js",
            "ENGINE": "gostop-engine.js",
        },
        "dedupe": [],
    },
}


def read_module(name: str, dedupe: bool) -> str:
    src = (WEB / name).read_text(encoding="utf-8")
    src = src.split(EXPORT_MARK)[0].rstrip()
    if dedupe:
        for old, new in DEDUPE:
            src = src.replace(old, new)
    return src


def build(target: str) -> str:
    spec = TARGETS[target]
    html = (WEB / spec["shell"]).read_text(encoding="utf-8")
    for marker, fname in spec["modules"].items():
        token = f"/*__{marker}__*/"
        if token not in html:
            raise SystemExit(f"{spec['shell']}에 {token} 마커가 없습니다")
        html = html.replace(token, read_module(fname, fname in spec["dedupe"]))
    if "/*__" in html:
        leftover = html[html.index("/*__"):][:40]
        raise SystemExit(f"치환되지 않은 마커가 남았습니다: {leftover}")
    return html


def main() -> int:
    ap = argparse.ArgumentParser(description="단일 파일 HTML 빌드")
    ap.add_argument("--check", action="store_true",
                    help="파일을 쓰지 않고 docs/ 와 일치하는지만 검사")
    args = ap.parse_args()

    stale = []
    for target in TARGETS:
        built = build(target)
        out = DOCS / target
        if args.check:
            current = out.read_text(encoding="utf-8") if out.exists() else ""
            status = "일치" if current == built else "불일치"
            if current != built:
                stale.append(target)
            print(f"{target:<14} {len(built)/1024:6.1f} KB  {status}")
        else:
            DOCS.mkdir(exist_ok=True)
            out.write_text(built, encoding="utf-8")
            print(f"{target:<14} {len(built)/1024:6.1f} KB  생성")

    if stale:
        print("\ndocs/ 가 web/ 소스와 어긋납니다. `python3 build.py` 를 실행하고 커밋하세요:",
              ", ".join(stale), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
