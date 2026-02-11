from pydantic import BaseModel
from typing import Optional

class TopicIdentifier(BaseModel):
    course_id: str
    chapter_index: int
    section_index: int
    
    @property
    def string_id(self) -> str:
        return f"{self.course_id}-{self.chapter_index}-{self.section_index}"

    @classmethod
    def from_string(cls, sid: str):
        parts = sid.split('-')
        if len(parts) >= 3:
            return cls(
                course_id=parts[0],
                chapter_index=int(parts[1]),
                section_index=int(parts[2])
            )
        # Fallback for legacy or malformed IDs
        return cls(course_id=sid, chapter_index=0, section_index=0)
