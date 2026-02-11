"""
Calculator Tool
Safe mathematical expression evaluation.
"""
import math
import re
from typing import Dict, Any, Union


class Calculator:
    """Safe calculator for math operations."""
    
    # Allowed functions
    ALLOWED_FUNCTIONS = {
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'sqrt': math.sqrt,
        'log': math.log,
        'log10': math.log10,
        'exp': math.exp,
        'abs': abs,
        'round': round,
        'floor': math.floor,
        'ceil': math.ceil,
        'pow': pow,
        'pi': math.pi,
        'e': math.e,
    }
    
    def evaluate(self, expression: str) -> Dict[str, Any]:
        """
        Safely evaluate a mathematical expression.
        
        Args:
            expression: Math expression as string
        
        Returns:
            Dict with result or error
        """
        try:
            # Clean the expression
            expression = expression.strip()
            
            # Basic safety check - no imports, exec, eval, etc.
            forbidden = ['import', 'exec', 'eval', 'open', 'file', '__', 'os.', 'sys.']
            if any(f in expression.lower() for f in forbidden):
                return {"error": "Expression contains forbidden operations", "result": None}
            
            # Replace common math notations
            expression = expression.replace('^', '**')
            expression = expression.replace('×', '*')
            expression = expression.replace('÷', '/')
            
            # Evaluate safely
            result = eval(expression, {"__builtins__": {}}, self.ALLOWED_FUNCTIONS)
            
            return {
                "expression": expression,
                "result": result,
                "formatted": self._format_result(result),
                "error": None
            }
            
        except ZeroDivisionError:
            return {"error": "Division by zero", "result": None}
        except ValueError as e:
            return {"error": f"Math error: {str(e)}", "result": None}
        except Exception as e:
            return {"error": f"Calculation error: {str(e)}", "result": None}
    
    def _format_result(self, result: Union[int, float]) -> str:
        """Format result for display."""
        if isinstance(result, float):
            if result.is_integer():
                return str(int(result))
            return f"{result:.6g}"
        return str(result)
    
    def convert_units(self, value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
        """
        Convert between common units.
        """
        conversions = {
            # Length
            ('m', 'cm'): 100,
            ('cm', 'm'): 0.01,
            ('m', 'km'): 0.001,
            ('km', 'm'): 1000,
            ('m', 'ft'): 3.28084,
            ('ft', 'm'): 0.3048,
            ('in', 'cm'): 2.54,
            ('cm', 'in'): 0.393701,
            # Weight
            ('kg', 'lb'): 2.20462,
            ('lb', 'kg'): 0.453592,
            ('g', 'kg'): 0.001,
            ('kg', 'g'): 1000,
            # Temperature handled separately
        }
        
        key = (from_unit.lower(), to_unit.lower())
        
        # Handle temperature separately
        if from_unit.lower() in ['c', 'celsius'] and to_unit.lower() in ['f', 'fahrenheit']:
            result = (value * 9/5) + 32
        elif from_unit.lower() in ['f', 'fahrenheit'] and to_unit.lower() in ['c', 'celsius']:
            result = (value - 32) * 5/9
        elif key in conversions:
            result = value * conversions[key]
        else:
            return {"error": f"Unknown conversion: {from_unit} to {to_unit}", "result": None}
        
        return {
            "original": f"{value} {from_unit}",
            "converted": f"{self._format_result(result)} {to_unit}",
            "result": result,
            "error": None
        }


# Singleton instance
calculator = Calculator()
