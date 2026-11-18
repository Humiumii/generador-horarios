from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

from .catalog import load_catalog
from .domain import Block
from .engine import Preference, Schedule, generate_schedules

app = FastAPI(title="Generador de horarios", version="0.1.0")
CATALOG = {course.id: course for course in load_catalog()}


class BusyBlock(BaseModel):
    day: int = Field(ge=0, le=4, strict=True)
    start: int = Field(ge=0, lt=1440, strict=True)
    end: int = Field(gt=0, le=1440, strict=True)

    @model_validator(mode="after")
    def check_interval(self):
        if self.start >= self.end:
            raise ValueError("El inicio debe ser anterior al término")
        return self


class ScheduleRequest(BaseModel):
    courses: list[str] = Field(min_length=1, max_length=len(CATALOG))
    unavailable: list[BusyBlock] = Field(default_factory=list, max_length=100)
    preference: Preference = "gaps"


@app.get("/api/catalog")
def catalog():
    return list(CATALOG.values())


@app.post("/api/schedules")
def schedules(request: ScheduleRequest) -> list[Schedule]:
    if len(set(request.courses)) != len(request.courses):
        raise HTTPException(422, "Selecciona cada ramo una sola vez")
    unknown = set(request.courses) - CATALOG.keys()
    if unknown:
        raise HTTPException(422, f"Ramos desconocidos: {', '.join(sorted(unknown))}")
    selected = tuple(CATALOG[code] for code in request.courses)
    busy = tuple(Block(**block.model_dump()) for block in request.unavailable)
    return generate_schedules(selected, busy, request.preference)


DIST = Path(__file__).resolve().parents[1] / "web" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
