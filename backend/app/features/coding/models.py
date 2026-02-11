from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum

class Language(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"

class LessonConstraints(BaseModel):
    required: List[str] = Field(default_factory=list)
    forbidden: List[str] = Field(default_factory=list)

class LessonSpec(BaseModel):
    function_name: str
    parameters: List[str]
    return_type: str
    test_cases: List[Dict[str, Any]]  # [{"input": [1,2], "expected": 3}]

class LessonDefinition(BaseModel):
    id: str
    title: str
    language: Language
    notes: str  # Markdown content
    spec: LessonSpec
    constraints: LessonConstraints
    version: str = "1.0"

class SubmissionRequest(BaseModel):
    lesson_id: str
    code: str
    inputs: Optional[List[str]] = Field(default_factory=list)

class ExecutionStatus(str, Enum):
    SUCCESS = "success"
    STATIC_FAILED = "static_failed"
    RUNTIME_FAILED = "runtime_failed"
    TIMEOUT = "timeout"

class GradingResult(BaseModel):
    status: ExecutionStatus
    score: float
    message: str
    stage: str  # "STATIC", "STRUCTURAL", "RUNTIME"
    details: Optional[Dict[str, Any]] = None
