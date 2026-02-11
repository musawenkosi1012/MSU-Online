import ast
import traceback
from typing import Dict, Any, List
from .models import GradingResult, ExecutionStatus, LessonDefinition, LessonSpec

class PythonGrader:
    @staticmethod
    def validate_static(code: str, spec: LessonSpec, constraints: Any) -> GradingResult:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return GradingResult(
                status=ExecutionStatus.STATIC_FAILED,
                score=0,
                stage="STATIC",
                message=f"Syntax Error: {str(e)}"
            )

        # Check for function definition
        functions = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        if spec.function_name not in functions:
            return GradingResult(
                status=ExecutionStatus.STATIC_FAILED,
                score=0,
                stage="STRUCTURAL",
                message=f"Missing required function: {spec.function_name}"
            )

        # Constraint check: Required keywords
        code_str = code.lower()
        for req in constraints.required:
            if req not in code_str:
                return GradingResult(
                    status=ExecutionStatus.STATIC_FAILED,
                    score=0,
                    stage="STRUCTURAL",
                    message=f"Constraints violated: Must use '{req}' in your solution."
                )

        # Constraint check: Forbidden keywords
        for forbidden in constraints.forbidden:
            if forbidden in code_str:
                return GradingResult(
                    status=ExecutionStatus.STATIC_FAILED,
                    score=0,
                    stage="STRUCTURAL",
                    message=f"Constraints violated: Use of '{forbidden}' is restricted."
                )

        return GradingResult(
            status=ExecutionStatus.SUCCESS,
            score=30, # Base structural score
            stage="STATIC",
            message="Structural validation passed."
        )

    @staticmethod
    def run_tests(code: str, spec: LessonSpec, inputs: List[str] = None) -> GradingResult:
        """
        Executes code with optional stdin mocking.
        """
        inputs = inputs or []
        input_ptr = 0
        
        def mocked_input(prompt=""):
            nonlocal input_ptr
            if input_ptr < len(inputs):
                val = inputs[input_ptr]
                input_ptr += 1
                return val
            return ""

        import builtins
        original_input = builtins.input
        builtins.input = mocked_input
        
        namespace = {}
        try:
            # First execute the submission to load functions into namespace
            exec(code, namespace)
            
            func = namespace.get(spec.function_name)
            if not func:
                return GradingResult(status=ExecutionStatus.RUNTIME_FAILED, score=0, stage="RUNTIME", message="Function not loaded.")

            passed = 0
            total = len(spec.test_cases)
            details = []

            for i, case in enumerate(spec.test_cases):
                inputs = case.get("input", [])
                expected = case.get("expected")
                
                try:
                    # Capture result
                    actual = func(*inputs)
                    if actual == expected:
                        passed += 1
                        details.append(f"Test {i+1}: Pass")
                    else:
                        details.append(f"Test {i+1}: Fail (Expected {expected}, got {actual})")
                except Exception as e:
                    details.append(f"Test {i+1}: Error ({str(e)})")

            runtime_score = (passed / total) * 70
            final_status = ExecutionStatus.SUCCESS if passed == total else ExecutionStatus.RUNTIME_FAILED
            
            return GradingResult(
                status=final_status,
                score=30 + runtime_score,
                stage="RUNTIME",
                message=f"Passed {passed}/{total} tests.",
                details={"results": details}
            )

        except Exception:
            return GradingResult(
                status=ExecutionStatus.RUNTIME_FAILED,
                score=0,
                stage="RUNTIME",
                message=f"Runtime error during execution: {traceback.format_exc().splitlines()[-1]}"
            )
        finally:
            builtins.input = original_input

def grade_submission(lesson: LessonDefinition, code: str, inputs: List[str] = None) -> GradingResult:
    # 1. Static Validation
    static_res = PythonGrader.validate_static(code, lesson.spec, lesson.constraints)
    if static_res.status != ExecutionStatus.SUCCESS:
        return static_res
    
    # 2. Runtime Validation
    return PythonGrader.run_tests(code, lesson.spec, inputs)
