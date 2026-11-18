import json
from pathlib import Path

from .domain import Block, Course, Section


def load_catalog() -> tuple[Course, ...]:
    data = json.loads((Path(__file__).resolve().parents[1] / "catalog.json").read_text(encoding="utf-8"))
    return tuple(
        Course(course["id"], course["name"], tuple(
            Section(section["id"], tuple(Block(**block) for block in section["blocks"]))
            for section in course["sections"]
        ))
        for course in data
    )

