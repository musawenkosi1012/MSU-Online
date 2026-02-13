import sys
import os
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from app.features.coding.router import LESSONS
from app.features.coding.grading import grade_submission

def test_grading():
    lesson = LESSONS["py_loops_01"]
    
    # Correct solution
    good_code = """
def sum_even(nums):
    total = 0
    for n in nums:
        if n % 2 == 0:
            total += n
    return total
"""
    res = grade_submission(lesson, good_code)
    print(f"Good Code Status: {res.status}, Score: {res.score}")
    assert res.score == 100
    
    # Missing 'for' loop (Structural failure)
    bad_code_1 = """
def sum_even(nums):
    return sum([n for n in nums if n % 2 == 0])
"""
    res = grade_submission(lesson, bad_code_1)
    print(f"Missing Loop Status: {res.status}, Message: {res.message}")
    assert "Must use 'for'" in res.message
    
    # Using 'sum' (Forbidden item)
    bad_code_2 = """
def sum_even(nums):
    for n in nums: pass
    return sum(nums)
"""
    res = grade_submission(lesson, bad_code_2)
    print(f"Forbidden Item Status: {res.status}, Message: {res.message}")
    assert "Use of 'sum' is restricted" in res.message

    print("\n✅ All backend grading logic tests passed!")

if __name__ == "__main__":
    test_grading()
