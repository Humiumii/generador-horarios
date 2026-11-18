from fastapi.testclient import TestClient

from scheduler.api import app
from scheduler.domain import Block, Course, Section
from scheduler.engine import generate_schedules

COURSES = (
    Course("a", "A", (Section("1", (Block(0, 540, 600),)),)),
    Course("b", "B", (
        Section("1", (Block(1, 540, 600),)),
        Section("2", (Block(0, 660, 720),)),
        Section("3", (Block(0, 720, 780),)),
    )),
)


def test_gaps_first_does_not_count_time_between_days():
    results = generate_schedules(COURSES, preference="gaps")
    assert [(r.sections["b"], r.gap_minutes, r.class_days) for r in results] == [
        ("1", 0, 2), ("2", 60, 1), ("3", 120, 1),
    ]


def test_days_first_breaks_ties_by_gaps():
    results = generate_schedules(COURSES, preference="days")
    assert [r.sections["b"] for r in results] == ["2", "3", "1"]


def test_gap_minutes_include_all_blocks_per_day():
    course = Course("a", "A", (Section("1", (
        Block(0, 540, 600), Block(0, 615, 660), Block(0, 690, 720),
        Block(3, 540, 600),
    )),))
    result, = generate_schedules((course,))
    assert (result.gap_minutes, result.class_days) == (45, 2)


def test_api_limits_alternatives_and_reacts_to_preference():
    client = TestClient(app)
    request = {"courses": ["MAT101", "INF110", "FIS120", "EST200"]}
    gaps = client.post("/api/schedules", json=request)
    days = client.post("/api/schedules", json={**request, "preference": "days"})
    assert gaps.status_code == days.status_code == 200
    alternatives = gaps.json()
    assert len(alternatives) == len({tuple(r["sections"].items()) for r in alternatives}) == 5
    assert alternatives[0]["sections"] != days.json()[0]["sections"]


def test_api_reports_infeasibility_and_rejects_invalid_requests():
    client = TestClient(app)
    busy = [{"day": day, "start": 540, "end": 630} for day in (0, 1)]
    assert client.post("/api/schedules", json={"courses": ["MAT101"], "unavailable": busy}).json() == []
    for request in [
        {"courses": ["unknown"]},
        {"courses": ["MAT101", "MAT101"]},
        {"courses": ["MAT101"], "unavailable": [{"day": 0, "start": 600, "end": 540}]},
    ]:
        assert client.post("/api/schedules", json=request).status_code == 422

