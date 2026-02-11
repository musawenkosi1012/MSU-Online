"""
Analytics Collector
Tracks accuracy, mastery gains, and continuous improvement metrics.
"""
import os
import json
import datetime
from typing import Dict, Any, List, Optional
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data")
ANALYTICS_FILE = os.path.join(DATA_DIR, "analytics.json")


class AnalyticsCollector:
    """Collects and analyzes AI and learning metrics."""
    
    def __init__(self):
        self.metrics = self._load_metrics()
    
    def _load_metrics(self) -> Dict[str, Any]:
        """Load metrics from disk."""
        if os.path.exists(ANALYTICS_FILE):
            try:
                with open(ANALYTICS_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            "queries": [],
            "rag_retrievals": [],
            "tool_invocations": [],
            "mastery_updates": [],
            "grading_results": [],
            "response_times": [],
            "daily_stats": {}
        }
    
    def _save_metrics(self):
        """Save metrics to disk."""
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(ANALYTICS_FILE, 'w') as f:
            json.dump(self.metrics, f, indent=2, default=str)
    
    def _get_today(self) -> str:
        """Get today's date string."""
        return datetime.date.today().isoformat()
    
    # ============================================
    # QUERY TRACKING
    # ============================================
    
    def log_activity(self, activity_type: str = "access"):
        """Log general user activity for streak tracking."""
        today = self._get_today()
        if today not in self.metrics["daily_stats"]:
            self.metrics["daily_stats"][today] = {
                "total_queries": 0,
                "rag_queries": 0,
                "avg_confidence": 0,
                "avg_response_time": 0,
                "activities": []
            }
        
        if "activities" not in self.metrics["daily_stats"][today]:
            self.metrics["daily_stats"][today]["activities"] = []
            
        self.metrics["daily_stats"][today]["activities"].append({
            "type": activity_type,
            "timestamp": datetime.datetime.now().isoformat()
        })
        self._save_metrics()

    def log_query(self, query: str, response: str, 
                  rag_used: bool, confidence: float,
                  response_time_ms: int):
        """Log an AI query and response."""
        # Ensure daily stats initialized
        self.log_activity("query")
        
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "query_length": len(query),
            "response_length": len(response),
            "rag_used": rag_used,
            "confidence": confidence,
            "response_time_ms": response_time_ms
        }
        
        self.metrics["queries"].append(entry)
        self.metrics["response_times"].append(response_time_ms)
        
        # Update daily stats
        today = self._get_today()
        stats = self.metrics["daily_stats"][today]
        stats["total_queries"] += 1
        if rag_used:
            stats["rag_queries"] += 1
        
        # Rolling average
        n = stats["total_queries"]
        stats["avg_confidence"] = ((stats["avg_confidence"] * (n-1)) + confidence) / n
        stats["avg_response_time"] = ((stats["avg_response_time"] * (n-1)) + response_time_ms) / n
        
        # Keep only last 1000 entries
        if len(self.metrics["queries"]) > 1000:
            self.metrics["queries"] = self.metrics["queries"][-1000:]
        
        self._save_metrics()
    
    def log_rag_retrieval(self, query: str, chunks_retrieved: int,
                          avg_score: float, course_id: str = None):
        """Log RAG retrieval performance."""
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "query_snippet": query[:100],
            "chunks_retrieved": chunks_retrieved,
            "avg_score": avg_score,
            "course_id": course_id
        }
        self.metrics["rag_retrievals"].append(entry)
        
        if len(self.metrics["rag_retrievals"]) > 500:
            self.metrics["rag_retrievals"] = self.metrics["rag_retrievals"][-500:]
        
        self._save_metrics()
    
    def log_tool_invocation(self, tool_name: str, success: bool,
                            execution_time_ms: int):
        """Log tool invocation."""
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "tool": tool_name,
            "success": success,
            "execution_time_ms": execution_time_ms
        }
        self.metrics["tool_invocations"].append(entry)
        
        if len(self.metrics["tool_invocations"]) > 500:
            self.metrics["tool_invocations"] = self.metrics["tool_invocations"][-500:]
        
        self._save_metrics()
    
    # ============================================
    # MASTERY TRACKING
    # ============================================
    
    def log_mastery_update(self, user_id: str, topic_id: str,
                           old_mastery: float, new_mastery: float):
        """Log mastery update."""
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "user_id": user_id,
            "topic_id": topic_id,
            "old_mastery": old_mastery,
            "new_mastery": new_mastery,
            "delta": round(new_mastery - old_mastery, 3)
        }
        self.metrics["mastery_updates"].append(entry)
        
        if len(self.metrics["mastery_updates"]) > 1000:
            self.metrics["mastery_updates"] = self.metrics["mastery_updates"][-1000:]
        
        self._save_metrics()
    
    def log_grading_result(self, user_id: str, topic_id: str,
                           score: float, grading_type: str):
        """Log grading result."""
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "user_id": user_id,
            "topic_id": topic_id,
            "score": score,
            "grading_type": grading_type
        }
        self.metrics["grading_results"].append(entry)
        
        if len(self.metrics["grading_results"]) > 1000:
            self.metrics["grading_results"] = self.metrics["grading_results"][-1000:]
        
        self._save_metrics()
    
    # ============================================
    # ANALYTICS QUERIES
    # ============================================
    
    def get_summary(self) -> Dict[str, Any]:
        """Get overall analytics summary."""
        return {
            "total_queries": len(self.metrics["queries"]),
            "total_rag_retrievals": len(self.metrics["rag_retrievals"]),
            "total_tool_invocations": len(self.metrics["tool_invocations"]),
            "total_mastery_updates": len(self.metrics["mastery_updates"]),
            "avg_confidence": self._avg([q.get("confidence", 0) for q in self.metrics["queries"][-100:]]),
            "avg_response_time_ms": self._avg(self.metrics["response_times"][-100:]),
            "rag_hit_rate": self._rag_hit_rate(),
            "daily_stats": self.metrics.get("daily_stats", {})
        }
    
    def get_rag_performance(self) -> Dict[str, Any]:
        """Get RAG retrieval performance metrics."""
        recent = self.metrics["rag_retrievals"][-100:]
        
        return {
            "total_retrievals": len(self.metrics["rag_retrievals"]),
            "avg_chunks_retrieved": self._avg([r.get("chunks_retrieved", 0) for r in recent]),
            "avg_relevance_score": self._avg([r.get("avg_score", 0) for r in recent]),
            "by_course": self._group_by_course(recent)
        }
    
    def get_mastery_trends(self, user_id: str = None) -> Dict[str, Any]:
        """Get mastery improvement trends."""
        updates = self.metrics["mastery_updates"]
        
        if user_id:
            updates = [u for u in updates if u.get("user_id") == user_id]
        
        if not updates:
            return {"updates": 0, "avg_delta": 0, "positive_rate": 0}
        
        deltas = [u.get("delta", 0) for u in updates]
        positive = [d for d in deltas if d > 0]
        
        return {
            "updates": len(updates),
            "avg_delta": self._avg(deltas),
            "positive_rate": len(positive) / len(updates) if updates else 0,
            "recent_updates": updates[-10:]
        }
    
    def get_optimization_suggestions(self) -> List[str]:
        """Get suggestions for improving AI performance."""
        suggestions = []
        
        summary = self.get_summary()
        rag_perf = self.get_rag_performance()
        
        # Check confidence
        if summary.get("avg_confidence", 0) < 0.6:
            suggestions.append("Low confidence scores detected. Consider indexing more course content.")
        
        # Check response time
        if summary.get("avg_response_time_ms", 0) > 5000:
            suggestions.append("High response times. Consider reducing context window or optimizing retrieval.")
        
        # Check RAG relevance
        if rag_perf.get("avg_relevance_score", 0) < 0.5:
            suggestions.append("Low RAG relevance. Consider improving chunk boundaries or adding more content.")
        
        # Check tool success rate
        tool_invocations = self.metrics["tool_invocations"][-50:]
        if tool_invocations:
            success_rate = sum(1 for t in tool_invocations if t.get("success")) / len(tool_invocations)
            if success_rate < 0.8:
                suggestions.append(f"Tool success rate is {success_rate:.0%}. Review tool implementations.")
        
        if not suggestions:
            suggestions.append("All metrics look healthy. Continue monitoring.")
        
        return suggestions
    
    def _avg(self, values: List[float]) -> float:
        """Calculate average of a list."""
        if not values:
            return 0
        return round(sum(values) / len(values), 2)
    
    def _rag_hit_rate(self) -> float:
        """Calculate RAG usage rate."""
        recent = self.metrics["queries"][-100:]
        if not recent:
            return 0
        return sum(1 for q in recent if q.get("rag_used")) / len(recent)
    
    def get_streak_stats(self) -> Dict[str, Any]:
        """Calculate current streak and get daily activity for calendar."""
        daily_stats = self.metrics.get("daily_stats", {})
        if not daily_stats:
            return {"current_streak": 0, "daily_activity": {}}
        
        # Sort dates
        sorted_dates = sorted(daily_stats.keys())
        today = self._get_today()
        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        
        streak = 0
        
        # Check if active today
        if today in daily_stats:
            streak = 1
            current_date = datetime.date.today() - datetime.timedelta(days=1)
        elif yesterday in daily_stats:
             # Allowed to skip today if checking early, or maybe streak persists until end of day
             # But strictly, if not active today yet, streak is from yesterday?
             # Let's say streak counts if active yesterday.
             streak = 0 # Will count from loop
             current_date = datetime.date.today() - datetime.timedelta(days=1)
        else:
             return {"current_streak": 0, "daily_activity": daily_stats}

        # Count backwards
        while True:
            date_str = current_date.isoformat()
            if date_str in daily_stats:
                streak += 1
                current_date -= datetime.timedelta(days=1)
            else:
                break
                
        return {
            "current_streak": streak,
            "daily_activity": daily_stats # { "YYYY-MM-DD": { ...stats } }
        }

    def _group_by_course(self, retrievals: List[Dict]) -> Dict[str, int]:
        """Group retrievals by course."""
        by_course = defaultdict(int)
        for r in retrievals:
            course = r.get("course_id", "unknown")
            by_course[course] += 1
        return dict(by_course)


# Singleton instance
analytics_collector = AnalyticsCollector()
