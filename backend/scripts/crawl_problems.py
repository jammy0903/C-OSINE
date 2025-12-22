#!/usr/bin/env python3
"""
백준 문제 크롤러 (solved.ac API 사용)

Usage:
    python crawl_problems.py                    # 기본: Bronze 5 ~ Silver 3
    python crawl_problems.py --tiers b5,b4,b3   # 특정 티어만
    python crawl_problems.py --count 10         # 티어당 문제 수
    python crawl_problems.py --with-testcases   # 테스트케이스도 생성 (Claude 필요)

Rate Limit: 15분당 256회 (solved.ac)
"""

import json
import time
import argparse
import requests
from pathlib import Path
from typing import Optional

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
PROBLEMS_JSON = DATA_DIR / "problems.json"
FRONTEND_PUBLIC = SCRIPT_DIR.parent.parent / "frontend" / "public" / "data" / "problems.json"

# solved.ac API
SOLVEDAC_BASE = "https://solved.ac/api/v3"
RATE_LIMIT_DELAY = 0.5  # 초 (안전하게)


def level_to_tier(level: int) -> str:
    """solved.ac level(1-30) → tier 문자열 변환"""
    if level == 0:
        return "unrated"

    tiers = ["bronze", "silver", "gold", "platinum", "diamond", "ruby"]
    tier_index = (level - 1) // 5
    sub_level = 5 - ((level - 1) % 5)

    return f"{tiers[tier_index]}_{sub_level}"


def tier_to_query(tier: str) -> str:
    """tier 문자열 → solved.ac 쿼리 변환
    예: 'b5' → 'tier:b5', 'bronze_5' → 'tier:b5'
    """
    if "_" in tier:
        # bronze_5 → b5
        name, level = tier.split("_")
        tier = name[0] + level
    return tier


def fetch_problems_by_tier(tier: str, page: int = 1) -> dict:
    """solved.ac API로 특정 티어 문제 검색"""
    query = f"tier:{tier_to_query(tier)}"
    url = f"{SOLVEDAC_BASE}/search/problem"

    response = requests.get(url, params={"query": query, "page": page})
    response.raise_for_status()

    return response.json()


def fetch_problem_detail(problem_id: int) -> dict:
    """solved.ac API로 문제 상세 정보 조회"""
    url = f"{SOLVEDAC_BASE}/problem/show"

    response = requests.get(url, params={"problemId": problem_id})
    response.raise_for_status()

    return response.json()


def load_existing_problems() -> dict:
    """기존 problems.json 로드"""
    if PROBLEMS_JSON.exists():
        with open(PROBLEMS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)

    return {
        "_schema": {
            "version": "1.0",
            "description": "C-OSINE 문제 DB",
            "generatedBy": "crawl_problems.py"
        },
        "problems": []
    }


def save_problems(data: dict):
    """problems.json 저장 (backend + frontend)"""
    # backend/data/
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROBLEMS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # frontend/public/data/
    FRONTEND_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_PUBLIC, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved to {PROBLEMS_JSON}")
    print(f"✅ Saved to {FRONTEND_PUBLIC}")


def problem_exists(problems: list, problem_id: int) -> bool:
    """문제 중복 체크"""
    return any(p.get("number") == problem_id or p.get("id") == str(problem_id) for p in problems)


def convert_to_our_format(detail: dict) -> dict:
    """solved.ac 응답 → 우리 JSON 포맷 변환"""
    problem_id = detail["problemId"]

    # 태그 추출
    tags = [tag.get("displayNames", [{}])[0].get("name", tag["key"])
            for tag in detail.get("tags", [])]
    if not tags:
        tags = [tag["key"] for tag in detail.get("tags", [])]

    return {
        "id": str(problem_id),
        "number": problem_id,
        "title": detail.get("titleKo") or f"Problem {problem_id}",
        "description": f"이 문제는 백준 온라인 저지에서 확인하세요.\n\nhttps://www.acmicpc.net/problem/{problem_id}\n\n난이도: {level_to_tier(detail['level'])}\n평균 시도: {detail.get('averageTries', 0):.1f}회",
        "difficulty": level_to_tier(detail["level"]),
        "tags": tags[:5],  # 최대 5개
        "source": "BOJ",
        "solution": None,  # Claude Code가 나중에 생성
        "testCases": [],   # Claude Code가 나중에 생성
        "baekjoonUrl": f"https://www.acmicpc.net/problem/{problem_id}",
        "acceptedCount": detail.get("acceptedUserCount", 0),
    }


def crawl_problems(tiers: list[str], problems_per_tier: int = 20, verbose: bool = True):
    """메인 크롤링 함수"""
    data = load_existing_problems()
    problems = data["problems"]

    total_added = 0
    total_skipped = 0
    total_errors = 0

    print(f"🚀 Starting crawl: {tiers}")
    print(f"📊 Current problems: {len(problems)}")
    print("=" * 50)

    for tier in tiers:
        print(f"\n📥 Tier: {tier.upper()}")
        print("-" * 40)

        tier_added = 0
        page = 1

        while tier_added < problems_per_tier:
            try:
                time.sleep(RATE_LIMIT_DELAY)
                search_result = fetch_problems_by_tier(tier, page)

                if not search_result.get("items"):
                    print(f"  ⚠️  No more problems for tier {tier}")
                    break

                for item in search_result["items"]:
                    if tier_added >= problems_per_tier:
                        break

                    problem_id = item["problemId"]

                    # 중복 체크
                    if problem_exists(problems, problem_id):
                        if verbose:
                            print(f"  ⏭️  #{problem_id} already exists")
                        total_skipped += 1
                        continue

                    try:
                        time.sleep(RATE_LIMIT_DELAY)
                        detail = fetch_problem_detail(problem_id)

                        problem_data = convert_to_our_format(detail)
                        problems.append(problem_data)

                        tier_added += 1
                        total_added += 1

                        print(f"  ✅ #{problem_id}: {problem_data['title']}")

                    except Exception as e:
                        print(f"  ❌ Error fetching #{problem_id}: {e}")
                        total_errors += 1

                page += 1

            except Exception as e:
                print(f"  ❌ Error on page {page}: {e}")
                total_errors += 1
                break

        print(f"  ✨ Added {tier_added} problems from {tier.upper()}")

    # 저장
    data["problems"] = problems
    save_problems(data)

    # 통계
    print("\n" + "=" * 50)
    print("🎉 Crawling completed!")
    print(f"  ✅ Added: {total_added}")
    print(f"  ⏭️  Skipped: {total_skipped}")
    print(f"  ❌ Errors: {total_errors}")
    print(f"  📊 Total problems: {len(problems)}")


def main():
    parser = argparse.ArgumentParser(description="백준 문제 크롤러")
    parser.add_argument(
        "--tiers",
        type=str,
        default="b5,b4,b3,b2,b1,s5,s4,s3",
        help="크롤링할 티어 (콤마로 구분)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="티어당 문제 수 (기본: 10)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="상세 출력 끄기"
    )

    args = parser.parse_args()

    tiers = [t.strip() for t in args.tiers.split(",")]

    crawl_problems(
        tiers=tiers,
        problems_per_tier=args.count,
        verbose=not args.quiet
    )


if __name__ == "__main__":
    main()
