#!/usr/bin/env python3
"""Validate actors/actors.json against the production shows.json catalog."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path.cwd()
ACTORS_PATH = ROOT / "actors" / "actors.json"
SHOWS_PATH = ROOT / "shows.json"
ALLOWED_ASSOCIATIONS = {
    "program_catalog",
    "actor_exact",
    "guest_cast_exact",
    "manual_episode_ids",
}


def load(path: Path):
    if not path.is_file():
        raise SystemExit(f"Missing required file: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


actors = load(ACTORS_PATH)
episodes = load(SHOWS_PATH)

if actors.get("schemaVersion") != 1:
    raise SystemExit("Unsupported or missing actors schemaVersion.")

profiles = actors.get("profiles")
if not isinstance(profiles, list) or not profiles:
    raise SystemExit("actors.json must contain a non-empty profiles list.")

shows = {
    str(item.get("showTitle") or item.get("show") or "").strip()
    for item in episodes
    if isinstance(item, dict)
}

ids = set()
ranks = set()
errors = []

for profile in profiles:
    actor_id = str(profile.get("id", "")).strip()
    name = str(profile.get("name", "")).strip()
    rank = profile.get("featuredRank")

    if not actor_id or actor_id in ids:
        errors.append(f"Invalid or duplicate actor id: {actor_id!r}")
    ids.add(actor_id)

    if not name:
        errors.append(f"{actor_id}: missing name")

    if profile.get("featured") is True:
        if not isinstance(rank, int) or rank < 1 or rank in ranks:
            errors.append(f"{actor_id}: invalid or duplicate featuredRank {rank!r}")
        ranks.add(rank)

    credits = profile.get("credits")
    if not isinstance(credits, list) or not credits:
        errors.append(f"{actor_id}: must have at least one credit")
        continue

    for credit in credits:
        program = str(credit.get("program", "")).strip()
        mode = str(credit.get("associationMode", "")).strip()
        match_value = str(credit.get("matchValue", "")).strip()

        if program not in shows:
            errors.append(f"{actor_id}: program not found exactly: {program!r}")
        if mode not in ALLOWED_ASSOCIATIONS:
            errors.append(f"{actor_id}: unsupported associationMode {mode!r}")
        if mode in {"actor_exact", "guest_cast_exact"} and not match_value:
            errors.append(f"{actor_id}: {mode} requires matchValue")

if errors:
    print("Actor catalog validation FAILED:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)

print("Actor catalog validation passed.")
print(f"Profiles: {len(profiles)}")
print(f"Featured ranks: {min(ranks)}-{max(ranks)}")
print(f"Production programs checked: {len(shows)}")
