
import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import SessionLocal, GeneratedContent

def seed_coding_lesson():
    db = SessionLocal()
    topic = "py_loops_01"
    
    # Check if exists
    existing = db.query(GeneratedContent).filter(
        GeneratedContent.type == 'coding_lesson',
        GeneratedContent.title == topic
    ).first()
    
    if existing:
        print(f"Lesson {topic} already exists in DB.")
        return

    lesson_data = {
        "id": topic,
        "title": "Introduction to Python For Loops",
        "language": "python",
        "notes": "## Python For Loops\n\nFor loops are used for iterating over a sequence (that is either a list, a tuple, a dictionary, a set, or a string).\n\n### Syntax\n```python\nfor x in sequence:\n    print(x)\n```\n\n## The Exercise\nWrite a function `sum_even(nums)` that takes a list of numbers and returns the sum of all even numbers in that list.\n\n### Examples\n- `sum_even([1, 2, 3, 4])` -> 6\n- `sum_even([1, 3, 5])` -> 0",
        "spec": {
            "function_name": "sum_even",
            "parameters": ["nums"],
            "return_type": "int",
            "test_cases": [
                {"input": [[1, 2, 3, 4]], "expected": 6},
                {"input": [[1, 3, 5]], "expected": 0},
                {"input": [[2, 4, 6, 8]], "expected": 20},
                {"input": [[]], "expected": 0}
            ]
        },
        "constraints": {
            "required": ["for"],
            "forbidden": ["sum"]
        }
    }
    
    new_content = GeneratedContent(
        type='coding_lesson',
        title=topic,
        content=json.dumps(lesson_data),
        user_id=None
    )
    
    db.add(new_content)
    db.commit()
    print(f"Successfully seeded {topic}")
    db.close()

if __name__ == "__main__":
    seed_coding_lesson()
