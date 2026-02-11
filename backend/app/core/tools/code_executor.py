"""
Code Executor Tool
Safe Python code execution in sandbox.
"""
import sys
import io
import traceback
from typing import Dict, Any
from contextlib import redirect_stdout, redirect_stderr


class CodeExecutor:
    """Safe code execution sandbox."""
    
    # Maximum execution time in seconds
    MAX_EXECUTION_TIME = 5
    
    # Maximum output length
    MAX_OUTPUT_LENGTH = 5000
    
    # Allowed builtins
    SAFE_BUILTINS = {
        'abs': abs,
        'all': all,
        'any': any,
        'bool': bool,
        'dict': dict,
        'enumerate': enumerate,
        'filter': filter,
        'float': float,
        'int': int,
        'len': len,
        'list': list,
        'map': map,
        'max': max,
        'min': min,
        'print': print,
        'range': range,
        'reversed': reversed,
        'round': round,
        'set': set,
        'sorted': sorted,
        'str': str,
        'sum': sum,
        'tuple': tuple,
        'type': type,
        'zip': zip,
    }
    
    def execute(self, code: str) -> Dict[str, Any]:
        """
        Execute Python code safely.
        
        Args:
            code: Python code to execute
        
        Returns:
            Dict with output, error, and execution info
        """
        # Safety checks
        forbidden = [
            'import', 'exec', 'eval', 'open', 'file', '__', 
            'os.', 'sys.', 'subprocess', 'socket', 'requests',
            'urllib', 'shutil', 'glob', 'pathlib'
        ]
        
        code_lower = code.lower()
        for f in forbidden:
            if f in code_lower:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Forbidden operation detected: {f}",
                    "code": code
                }
        
        # Capture output
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        try:
            # Create restricted globals
            restricted_globals = {
                '__builtins__': self.SAFE_BUILTINS,
                '__name__': '__sandbox__',
            }
            
            # Execute with output capture
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec(code, restricted_globals)
            
            output = stdout_capture.getvalue()
            error = stderr_capture.getvalue()
            
            # Truncate if too long
            if len(output) > self.MAX_OUTPUT_LENGTH:
                output = output[:self.MAX_OUTPUT_LENGTH] + "\n... (output truncated)"
            
            return {
                "success": True,
                "output": output,
                "error": error if error else None,
                "code": code
            }
            
        except Exception as e:
            return {
                "success": False,
                "output": stdout_capture.getvalue(),
                "error": f"{type(e).__name__}: {str(e)}",
                "traceback": traceback.format_exc(),
                "code": code
            }
    
    def execute_with_input(self, code: str, input_data: str) -> Dict[str, Any]:
        """
        Execute code with simulated input.
        
        Args:
            code: Python code to execute
            input_data: Input string (newline separated for multiple inputs)
        
        Returns:
            Execution result
        """
        # Replace input() calls with data from input_data
        inputs = input_data.strip().split('\n')
        input_index = 0
        
        def mock_input(prompt=''):
            nonlocal input_index
            if input_index < len(inputs):
                value = inputs[input_index]
                input_index += 1
                print(f"{prompt}{value}")  # Echo input
                return value
            raise EOFError("No more input available")
        
        # Add mock input to safe builtins
        builtins_with_input = dict(self.SAFE_BUILTINS)
        builtins_with_input['input'] = mock_input
        
        # Execute with modified builtins
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        try:
            restricted_globals = {
                '__builtins__': builtins_with_input,
                '__name__': '__sandbox__',
            }
            
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec(code, restricted_globals)
            
            return {
                "success": True,
                "output": stdout_capture.getvalue(),
                "error": stderr_capture.getvalue() if stderr_capture.getvalue() else None,
                "inputs_used": input_index,
                "code": code
            }
            
        except Exception as e:
            return {
                "success": False,
                "output": stdout_capture.getvalue(),
                "error": f"{type(e).__name__}: {str(e)}",
                "code": code
            }


# Singleton instance
code_executor = CodeExecutor()
