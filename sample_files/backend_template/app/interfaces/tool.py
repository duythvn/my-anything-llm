"""
Tool interface definition for standardized tool implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class ToolCategory(str, Enum):
    """Categories for organizing tools."""
    ANALYTICS = "analytics"
    AUTOMATION = "automation"
    CONTENT = "content"
    ECOMMERCE = "ecommerce"
    SOCIAL_MEDIA = "social_media"
    COMMUNICATION = "communication"
    UTILITY = "utility"


class ToolParameter(BaseModel):
    """Definition of a tool parameter."""
    name: str
    type: str  # str, int, float, bool, list, dict
    description: str
    required: bool = True
    default: Optional[Any] = None


class ToolResult(BaseModel):
    """Result from tool execution."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    metadata: Dict[str, Any] = {}


class ITool(ABC):
    """
    Standard interface for all tools in the system.
    
    Tools are reusable components that perform specific actions
    and can be used by agents or workflows.
    """
    
    def __init__(self, tool_id: str, config: Dict[str, Any] = None):
        self.tool_id = tool_id
        self.config = config or {}
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of the tool."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the tool does."""
        pass
    
    @property
    @abstractmethod
    def category(self) -> ToolCategory:
        """Category this tool belongs to."""
        pass
    
    @property
    @abstractmethod
    def parameters(self) -> List[ToolParameter]:
        """List of parameters this tool accepts."""
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with given parameters.
        
        Args:
            **kwargs: Tool parameters
            
        Returns:
            ToolResult: Result of tool execution
        """
        pass
    
    async def validate_parameters(self, **kwargs) -> bool:
        """
        Validate parameters before execution.
        
        Args:
            **kwargs: Parameters to validate
            
        Returns:
            bool: True if parameters are valid, False otherwise
        """
        required_params = [p.name for p in self.parameters if p.required]
        
        # Check required parameters
        for param in required_params:
            if param not in kwargs:
                return False
        
        # Additional validation can be implemented in subclasses
        return True
    
    async def health_check(self) -> bool:
        """
        Perform health check on the tool.
        
        Returns:
            bool: True if tool is healthy, False otherwise
        """
        try:
            # Basic health check - can be overridden by specific tools
            return True
        except Exception:
            return False
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for this tool.
        
        Returns:
            Dict: JSON schema describing the tool and its parameters
        """
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "parameters": [
                {
                    "name": p.name,
                    "type": p.type,
                    "description": p.description,
                    "required": p.required,
                    "default": p.default
                }
                for p in self.parameters
            ]
        }