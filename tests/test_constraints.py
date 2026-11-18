from ortools.sat.python import cp_model

from scheduler.catalog import load_catalog
from scheduler.domain import Block, Course, Section
from scheduler.engine import build_model


def solve(*courses, unavailable=()):
    model, choices = build_model(courses, unavailable)
    solver = cp_model.CpSolver()
    if solver.solve(model) == cp_model.INFEASIBLE:
        return None
    return {key for key, flag in choices.items() if solver.value(flag)}


def test_catalog():
    courses = load_catalog()
    assert len(courses) == 6
    assert all(len(course.sections) >= 2 for course in courses)
    assert any(len(s.blocks) > 1 for c in courses for s in c.sections)


def test_selects_one_section_and_allows_contiguous_classes():
    a = Course("a", "A", (Section("1", (Block(0, 540, 600),)),))
    b = Course("b", "B", (
        Section("1", (Block(0, 570, 630),)),
        Section("2", (Block(0, 600, 660),)),
    ))
    assert solve(a, b) == {("a", "1"), ("b", "2")}


def test_unavailability_in_second_block_rules_out_whole_section():
    a = Course("a", "A", (
        Section("1", (Block(0, 540, 600), Block(2, 540, 600))),
        Section("2", (Block(1, 540, 600),)),
    ))
    assert solve(a, unavailable=(Block(2, 570, 600),)) == {("a", "2")}
    assert solve(a, unavailable=(Block(2, 570, 600), Block(1, 540, 600))) is None


def test_conflict_on_one_of_multiple_blocks_makes_schedule_infeasible():
    a = Course("a", "A", (Section("1", (Block(0, 540, 600), Block(2, 540, 600))),))
    b = Course("b", "B", (Section("1", (Block(2, 590, 650),)),))
    assert solve(a, b) is None

