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

