"""
Workflow interface definition for LangGraph workflow implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class WorkflowStatus(str, Enum):
    """Status of workflow execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class WorkflowNode(BaseModel):
    """Definition of a workflow node."""
    node_id: str
    name: str
    type: str
    config: Dict[str, Any] = {}


class WorkflowExecution(BaseModel):
    """Current execution state of a workflow."""
    workflow_id: str
    execution_id: str
    status: WorkflowStatus
    current_node: Optional[str] = None
    progress: float = 0.0  # 0.0 to 1.0
    start_time: str
    end_time: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class IWorkflow(ABC):
    """
    Standard interface for LangGraph workflows.
    
    Workflows define complex multi-step processes that can involve
    multiple agents, tools, and decision points.
    """
    
    def __init__(self, workflow_id: str, config: Dict[str, Any] = None):
        self.workflow_id = workflow_id
        self.config = config or {}
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of the workflow."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the workflow does."""
        pass
    
    @property
    @abstractmethod
    def nodes(self) -> List[WorkflowNode]:
        """List of nodes in this workflow."""
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the workflow and prepare for execution.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> WorkflowExecution:
        """
        Execute the workflow with given input data.
        
        Args:
            input_data: Initial data for workflow execution
            
        Returns:
            WorkflowExecution: Execution result and state
        """
        pass
    
    @abstractmethod
    async def pause(self, execution_id: str) -> bool:
        """
        Pause a running workflow execution.
        
        Args:
            execution_id: ID of execution to pause
            
        Returns:
            bool: True if paused successfully, False otherwise
        """
        pass
    
    @abstractmethod
    async def resume(self, execution_id: str) -> bool:
        """
        Resume a paused workflow execution.
        
        Args:
            execution_id: ID of execution to resume
            
        Returns:
            bool: True if resumed successfully, False otherwise
        """
        pass
    
    @abstractmethod
    async def cancel(self, execution_id: str) -> bool:
        """
        Cancel a running workflow execution.
        
        Args:
            execution_id: ID of execution to cancel
            
        Returns:
            bool: True if cancelled successfully, False otherwise
        """
        pass
    
    @abstractmethod
    async def get_status(self, execution_id: str) -> WorkflowExecution:
        """
        Get current status of a workflow execution.
        
        Args:
            execution_id: ID of execution to check
            
        Returns:
            WorkflowExecution: Current execution state
        """
        pass
    
    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validate input data before workflow execution.
        
        Args:
            input_data: Input data to validate
            
        Returns:
            bool: True if input is valid, False otherwise
        """
        # Basic validation - can be overridden by specific workflows
        return isinstance(input_data, dict)
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for this workflow.
        
        Returns:
            Dict: JSON schema describing the workflow
        """
        return {
            "workflow_id": self.workflow_id,
            "name": self.name,
            "description": self.description,
            "nodes": [
                {
                    "node_id": node.node_id,
                    "name": node.name,
                    "type": node.type,
                    "config": node.config
                }
                for node in self.nodes
            ]
        }