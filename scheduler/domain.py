from dataclasses import dataclass
from itertools import combinations


@dataclass(frozen=True)
class Block:
    day: int
    start: int
    end: int

    def __post_init__(self):
        if not (0 <= self.day < 5 and 0 <= self.start < self.end <= 1440):
            raise ValueError("Bloque semanal inválido")

    def overlaps(self, other: "Block") -> bool:
        return (
            self.day == other.day
            and self.start < other.end
            and other.start < self.end
        )


@dataclass(frozen=True)
class Section:
    id: str
    blocks: tuple[Block, ...]

    def __post_init__(self):
        if not self.blocks or any(a.overlaps(b) for a, b in combinations(self.blocks, 2)):
            raise ValueError("Una sección requiere bloques sin cruces")


@dataclass(frozen=True)
class Course:
    id: str
    name: str
    sections: tuple[Section, ...]

    def __post_init__(self):
        if len({section.id for section in self.sections}) != len(self.sections):
            raise ValueError("Los identificadores de sección deben ser únicos")

