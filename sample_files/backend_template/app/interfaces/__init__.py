"""
Interface definitions for [PROJECT_NAME] agentic system.

Defines standard interfaces for agents, tools, workflows, and other components
to ensure extensibility and consistency across the system.
"""

from .agent import IAgent
from .tool import ITool
from .workflow import IWorkflow

__all__ = ["IAgent", "ITool", "IWorkflow"]