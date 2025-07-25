"""
Agent interface definition for standardized agent implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AgentCapability(BaseModel):
    """Defines a capability that an agent possesses."""
    name: str
    description: str
    parameters: Dict[str, Any] = {}


class AgentStatus(BaseModel):
    """Current status of an agent."""
    agent_id: str
    status: str  # active, idle, busy, error, stopped
    current_task: Optional[str] = None
    last_update: str
    metrics: Dict[str, Any] = {}


class IAgent(ABC):
    """
    Standard interface for all agents in the system.
    
    All agents must implement this interface to ensure consistent
    interaction patterns and lifecycle management.
    """
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        self.agent_id = agent_id
        self.config = config
        self._status = "idle"
    
    @property
    @abstractmethod
    def capabilities(self) -> List[AgentCapability]:
        """Return list of capabilities this agent provides."""
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the agent and prepare it for task execution.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task assigned to this agent.
        
        Args:
            task: Task definition with type, parameters, and context
            
        Returns:
            Dict containing task result, status, and any artifacts
        """
        pass
    
    @abstractmethod
    async def get_status(self) -> AgentStatus:
        """Get current agent status and metrics."""
        pass
    
    @abstractmethod
    async def stop(self) -> bool:
        """
        Stop the agent and clean up resources.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        pass
    
    async def health_check(self) -> bool:
        """
        Perform health check on the agent.
        
        Returns:
            bool: True if agent is healthy, False otherwise
        """
        try:
            status = await self.get_status()
            return status.status not in ["error", "stopped"]
        except Exception:
            return False
    
    def can_handle_task(self, task_type: str) -> bool:
        """
        Check if this agent can handle a specific task type.
        
        Args:
            task_type: Type of task to check
            
        Returns:
            bool: True if agent can handle the task, False otherwise
        """
        return any(cap.name == task_type for cap in self.capabilities)