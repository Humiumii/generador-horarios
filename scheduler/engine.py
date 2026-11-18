from dataclasses import dataclass
from typing import Literal
from itertools import combinations

from ortools.sat.python import cp_model

from .domain import Block, Course


def build_model(courses: tuple[Course, ...], unavailable: tuple[Block, ...]):
    model = cp_model.CpModel()
    choices = {}
    for course in courses:
        group = []
        for section in course.sections:
            chosen = model.new_bool_var(f"{course.id}/{section.id}")
            choices[course.id, section.id] = chosen
            group.append(chosen)
            if any(block.overlaps(busy) for block in section.blocks for busy in unavailable):
                model.add(chosen == 0)
        model.add_exactly_one(group)

    for first, second in combinations(courses, 2):
        for a in first.sections:
            for b in second.sections:
                if any(x.overlaps(y) for x in a.blocks for y in b.blocks):
                    model.add_at_most_one(choices[first.id, a.id], choices[second.id, b.id])
    return model, choices

Preference = Literal["gaps", "days"]
MINUTES_PER_DAY = 1440
WEEKDAYS = 5


@dataclass(frozen=True)
class Schedule:
    sections: dict[str, str]
    gap_minutes: int
    class_days: int


def add_metrics(model, courses, choices):
    """Derive daily span, subtracting every selected class minute."""
    gaps, active_days = [], []
    for day in range(WEEKDAYS):
        blocks = [
            (block, choices[course.id, section.id])
            for course in courses
            for section in course.sections
            for block in section.blocks
            if block.day == day
        ]
        if not blocks:
            continue
        flags = list({flag.index: flag for _, flag in blocks}.values())
        active = model.new_bool_var(f"active_{day}")
        model.add_max_equality(active, flags)
        first = model.new_int_var(0, MINUTES_PER_DAY, f"first_{day}")
        last = model.new_int_var(0, MINUTES_PER_DAY, f"last_{day}")
        model.add_min_equality(first, [
            MINUTES_PER_DAY - (MINUTES_PER_DAY - block.start) * flag
            for block, flag in blocks
        ])
        model.add_max_equality(last, [block.end * flag for block, flag in blocks])
        taught = sum((block.end - block.start) * flag for block, flag in blocks)
        gaps.append(last - first + MINUTES_PER_DAY * (1 - active) - taught)
        active_days.append(active)
    return sum(gaps), sum(active_days)


def generate_schedules(
    courses: tuple[Course, ...],
    unavailable: tuple[Block, ...] = (),
    preference: Preference = "gaps",
) -> list[Schedule]:
    if preference not in ("gaps", "days"):
        raise ValueError("Preferencia desconocida")
    if len({course.id for course in courses}) != len(courses):
        raise ValueError("Los identificadores de ramo deben ser únicos")
    if not courses:
        return []

    model, choices = build_model(courses, unavailable)
    gaps, days = add_metrics(model, courses, choices)
    # Each weight exceeds the maximum possible secondary metric.
    model.minimize((WEEKDAYS + 1) * gaps + days if preference == "gaps"
                   else (WEEKDAYS * MINUTES_PER_DAY + 1) * days + gaps)
    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = 1
    schedules = []
    for _ in range(5):
        status = solver.solve(model)
        if status == cp_model.INFEASIBLE:
            break
        if status != cp_model.OPTIMAL:
            raise RuntimeError(f"CP-SAT no pudo optimizar: {solver.status_name(status)}")
        selected = {key: flag for key, flag in choices.items() if solver.value(flag)}
        schedules.append(Schedule({course: section for course, section in selected}, solver.value(gaps), solver.value(days)))
        model.add(sum(selected.values()) <= len(courses) - 1)
    return schedules

