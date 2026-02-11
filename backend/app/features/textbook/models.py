"""
Textbook Data Models
Defines the structure for the Comprehensive AI Electronic Textbook.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TextbookSection(BaseModel):
    title: str
    content: str = ""
    order: int = 0
    learning_objectives: List[str] = []
    key_terms: List[str] = []
    figures: List[dict] = []  # {url, caption}
    audio_url: Optional[str] = None
    read_time_minutes: int = 0

class TextbookChapter(BaseModel):
    chapter_id: str
    title: str
    intro: str = ""
    sections: List[TextbookSection] = []
    summary: str = ""
    order: int = 0

class TextbookStructure(BaseModel):
    course_id: str
    title: str
    description: str = ""
    authors: List[str] = ["Musa AI"]
    chapters: List[TextbookChapter] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_published: bool = False

class UpdateStructureRequest(BaseModel):
    chapters: List[TextbookChapter]

class GenerateQuizRequest(BaseModel):
    section_content: str
