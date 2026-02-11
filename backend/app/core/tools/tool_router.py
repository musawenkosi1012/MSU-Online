"""
Tool Router
Decides which tool to invoke based on query analysis.
"""
import re
from typing import Dict, Any, Optional, List

from .calculator import calculator
from .code_executor import code_executor


class ToolRouter:
    """Routes queries to appropriate tools."""
    
    # Patterns for tool detection
    CALC_PATTERNS = [
        r'\d+\s*[\+\-\*/\^]\s*\d+',  # Basic math
        r'calculate\s+', 
        r'compute\s+',
        r'what\s+is\s+\d+',
        r'how\s+much\s+is',
        r'convert\s+\d+',
        r'sqrt|sin|cos|tan|log',
    ]
    
    CODE_PATTERNS = [
        r'run\s+(this\s+)?code',
        r'execute\s+(this\s+)?code',
        r'python\s+code',
        r'```python',
        r'def\s+\w+\s*\(',
        r'for\s+\w+\s+in\s+',
        r'print\s*\(',
    ]
    
    WEB_PATTERNS = [
        r'search\s+(for|the\s+web)',
        r'look\s+up',
        r'find\s+online',
        r'latest\s+news',
        r'current\s+\w+\s+price',
        r'what\s+happened\s+today',
    ]
    
    def __init__(self):
        self.tool_history = []
    
    def detect_tool(self, query: str) -> Optional[str]:
        """
        Detect which tool is needed for a query.
        
        Args:
            query: User query
        
        Returns:
            Tool name or None if no tool needed
        """
        query_lower = query.lower()
        
        # Check for calculator patterns
        for pattern in self.CALC_PATTERNS:
            if re.search(pattern, query_lower):
                return "calculator"
        
        # Check for code execution patterns
        for pattern in self.CODE_PATTERNS:
            if re.search(pattern, query_lower):
                return "code_executor"
        
        # Check for web search patterns
        for pattern in self.WEB_PATTERNS:
            if re.search(pattern, query_lower):
                return "web_scraper"
        
        return None
    
    def extract_expression(self, query: str) -> str:
        """Extract mathematical expression from query."""
        # Remove common phrases
        query = re.sub(r'(calculate|compute|what\s+is|how\s+much\s+is|evaluate)', '', query, flags=re.IGNORECASE)
        query = query.strip().strip('?').strip()
        return query
    
    def extract_code(self, query: str) -> str:
        """Extract code block from query."""
        # Try to find code block
        code_match = re.search(r'```python\s*(.*?)```', query, re.DOTALL)
        if code_match:
            return code_match.group(1).strip()
        
        code_match = re.search(r'```\s*(.*?)```', query, re.DOTALL)
        if code_match:
            return code_match.group(1).strip()
        
        # Try to find after "run this code:" or similar
        code_match = re.search(r'(?:run|execute)\s+(?:this\s+)?code[:\s]*(.*)', query, re.DOTALL | re.IGNORECASE)
        if code_match:
            return code_match.group(1).strip()
        
        return query
    
    def route(self, query: str) -> Dict[str, Any]:
        """
        Route query to appropriate tool and execute.
        
        Args:
            query: User query
        
        Returns:
            Tool result or indication to use LLM
        """
        tool = self.detect_tool(query)
        
        result = {
            "tool_used": tool,
            "tool_output": None,
            "needs_llm": True,
            "inject_context": None
        }
        
        if tool == "calculator":
            expression = self.extract_expression(query)
            calc_result = calculator.evaluate(expression)
            
            result["tool_output"] = calc_result
            
            if calc_result.get("result") is not None:
                result["inject_context"] = f"[CALCULATOR RESULT]\nExpression: {expression}\nResult: {calc_result['formatted']}"
                result["needs_llm"] = True  # LLM can explain the result
            
            self._log_tool_use("calculator", query, calc_result)
            
        elif tool == "code_executor":
            code = self.extract_code(query)
            exec_result = code_executor.execute(code)
            
            result["tool_output"] = exec_result
            
            if exec_result.get("success"):
                result["inject_context"] = f"[CODE EXECUTION RESULT]\nOutput:\n{exec_result['output']}"
            else:
                result["inject_context"] = f"[CODE EXECUTION ERROR]\nError: {exec_result['error']}"
            
            result["needs_llm"] = True  # LLM can explain or help debug
            self._log_tool_use("code_executor", query, exec_result)
            
        elif tool == "web_scraper":
            # Web scraper handled by research module
            result["tool_output"] = {"redirect": "research_module"}
            result["inject_context"] = "[WEB SEARCH REQUESTED - Routing to research module]"
            self._log_tool_use("web_scraper", query, {"redirected": True})
        
        return result
    
    def _log_tool_use(self, tool: str, query: str, result: Dict[str, Any]):
        """Log tool usage for auditing."""
        import datetime
        self.tool_history.append({
            "tool": tool,
            "query": query[:100],
            "success": result.get("success") or result.get("result") is not None,
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        # Keep only last 100 entries
        if len(self.tool_history) > 100:
            self.tool_history = self.tool_history[-100:]
    
    def get_tool_history(self) -> List[Dict[str, Any]]:
        """Get recent tool usage history."""
        return self.tool_history


# Singleton instance
tool_router = ToolRouter()
