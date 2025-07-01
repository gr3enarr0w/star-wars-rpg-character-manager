#!/usr/bin/env python3
"""
Extended GitHub MCP Server with Full API Support
Supports all GitHub API endpoints including Actions, Workflows, and advanced operations
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urljoin, urlparse

import httpx
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequestParams,
    ListToolsRequestParams,
    Tool,
    TextContent,
    GetPromptRequestParams,
    ListPromptsRequestParams,
    Prompt,
    PromptArgument,
    PromptMessage,
    UserMessage,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GitHubExtendedMCPServer:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = os.getenv("GITHUB_TOKEN")
        self.server = Server("github-extended-mcp")
        
        if not self.token:
            logger.warning("GITHUB_TOKEN environment variable not set")
        
        self._setup_tools()
        self._setup_prompts()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for GitHub API requests"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Extended-MCP-Server/1.0",
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to GitHub API"""
        url = urljoin(self.base_url, endpoint)
        headers = self._get_headers()
        
        async with httpx.AsyncClient() as client:
            try:
                if method.upper() == "GET":
                    response = await client.get(url, headers=headers, params=params)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=headers, json=data, params=params)
                elif method.upper() == "PUT":
                    response = await client.put(url, headers=headers, json=data)
                elif method.upper() == "DELETE":
                    response = await client.delete(url, headers=headers)
                elif method.upper() == "PATCH":
                    response = await client.patch(url, headers=headers, json=data)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                # Handle empty responses
                if response.status_code == 204:
                    return {"status": "success", "status_code": 204}
                
                return response.json()
                
            except httpx.HTTPStatusError as e:
                error_detail = {}
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = {"message": e.response.text}
                
                return {
                    "error": True,
                    "status_code": e.response.status_code,
                    "message": error_detail.get("message", str(e)),
                    "details": error_detail
                }
            except Exception as e:
                return {
                    "error": True,
                    "message": str(e)
                }
    
    def _setup_tools(self):
        """Setup all GitHub API tools"""
        
        # Repository Operations
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                # Repository Management
                Tool(
                    name="github_get_repository",
                    description="Get repository information",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_list_repositories",
                    description="List repositories for a user or organization",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "description": "GitHub username or organization"},
                            "type": {"type": "string", "enum": ["all", "owner", "member"], "default": "all"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["username"]
                    }
                ),
                Tool(
                    name="github_create_repository",
                    description="Create a new repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Repository name"},
                            "description": {"type": "string", "description": "Repository description"},
                            "private": {"type": "boolean", "default": False},
                            "auto_init": {"type": "boolean", "default": False}
                        },
                        "required": ["name"]
                    }
                ),
                
                # GitHub Actions & Workflows
                Tool(
                    name="github_list_workflows",
                    description="List workflows in a repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_get_workflow",
                    description="Get a specific workflow",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "workflow_id": {"type": "string", "description": "Workflow ID or filename"}
                        },
                        "required": ["owner", "repo", "workflow_id"]
                    }
                ),
                Tool(
                    name="github_trigger_workflow",
                    description="Trigger a workflow dispatch event",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "workflow_id": {"type": "string", "description": "Workflow ID or filename"},
                            "ref": {"type": "string", "description": "Git reference (branch/tag)", "default": "main"},
                            "inputs": {"type": "object", "description": "Workflow input parameters"}
                        },
                        "required": ["owner", "repo", "workflow_id"]
                    }
                ),
                Tool(
                    name="github_list_workflow_runs",
                    description="List workflow runs for a repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "workflow_id": {"type": "string", "description": "Workflow ID (optional)"},
                            "status": {"type": "string", "enum": ["completed", "action_required", "cancelled", "failure", "neutral", "skipped", "stale", "success", "timed_out", "in_progress", "queued", "requested", "waiting"]},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_get_workflow_run",
                    description="Get a specific workflow run",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "run_id": {"type": "integer", "description": "Workflow run ID"}
                        },
                        "required": ["owner", "repo", "run_id"]
                    }
                ),
                Tool(
                    name="github_download_workflow_artifact",
                    description="Download workflow run artifacts",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "artifact_id": {"type": "integer", "description": "Artifact ID"}
                        },
                        "required": ["owner", "repo", "artifact_id"]
                    }
                ),
                Tool(
                    name="github_list_workflow_artifacts",
                    description="List artifacts for a workflow run",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "run_id": {"type": "integer", "description": "Workflow run ID"}
                        },
                        "required": ["owner", "repo", "run_id"]
                    }
                ),
                
                # Issues and Pull Requests
                Tool(
                    name="github_create_issue",
                    description="Create a new issue",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "title": {"type": "string", "description": "Issue title"},
                            "body": {"type": "string", "description": "Issue body"},
                            "labels": {"type": "array", "items": {"type": "string"}, "description": "Issue labels"},
                            "assignees": {"type": "array", "items": {"type": "string"}, "description": "Issue assignees"}
                        },
                        "required": ["owner", "repo", "title"]
                    }
                ),
                Tool(
                    name="github_list_issues",
                    description="List repository issues",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                            "labels": {"type": "string", "description": "Comma-separated list of labels"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_get_issue",
                    description="Get a specific issue",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "issue_number": {"type": "integer", "description": "Issue number"}
                        },
                        "required": ["owner", "repo", "issue_number"]
                    }
                ),
                Tool(
                    name="github_update_issue",
                    description="Update an existing issue",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "issue_number": {"type": "integer", "description": "Issue number"},
                            "title": {"type": "string", "description": "Issue title"},
                            "body": {"type": "string", "description": "Issue body"},
                            "state": {"type": "string", "enum": ["open", "closed"]},
                            "labels": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["owner", "repo", "issue_number"]
                    }
                ),
                
                # Branch and Tag Management
                Tool(
                    name="github_list_branches",
                    description="List repository branches",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_create_branch",
                    description="Create a new branch",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "branch": {"type": "string", "description": "New branch name"},
                            "from_branch": {"type": "string", "description": "Source branch", "default": "main"}
                        },
                        "required": ["owner", "repo", "branch"]
                    }
                ),
                Tool(
                    name="github_delete_branch",
                    description="Delete a branch",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "branch": {"type": "string", "description": "Branch name to delete"}
                        },
                        "required": ["owner", "repo", "branch"]
                    }
                ),
                
                # File Operations
                Tool(
                    name="github_get_file_content",
                    description="Get file content from repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "path": {"type": "string", "description": "File path"},
                            "ref": {"type": "string", "description": "Git reference (branch/tag/commit)"}
                        },
                        "required": ["owner", "repo", "path"]
                    }
                ),
                Tool(
                    name="github_create_or_update_file",
                    description="Create or update a file in repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "path": {"type": "string", "description": "File path"},
                            "content": {"type": "string", "description": "File content (base64 encoded)"},
                            "message": {"type": "string", "description": "Commit message"},
                            "branch": {"type": "string", "description": "Branch name", "default": "main"},
                            "sha": {"type": "string", "description": "SHA of file being replaced (for updates)"}
                        },
                        "required": ["owner", "repo", "path", "content", "message"]
                    }
                ),
                Tool(
                    name="github_delete_file",
                    description="Delete a file from repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "path": {"type": "string", "description": "File path"},
                            "message": {"type": "string", "description": "Commit message"},
                            "sha": {"type": "string", "description": "SHA of file being deleted"},
                            "branch": {"type": "string", "description": "Branch name", "default": "main"}
                        },
                        "required": ["owner", "repo", "path", "message", "sha"]
                    }
                ),
                
                # Advanced Repository Operations
                Tool(
                    name="github_fork_repository",
                    description="Fork a repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "organization": {"type": "string", "description": "Organization to fork to (optional)"}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_list_commits",
                    description="List commits in repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "sha": {"type": "string", "description": "SHA or branch to start listing commits from"},
                            "path": {"type": "string", "description": "Only commits containing this file path"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_get_commit",
                    description="Get a specific commit",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "ref": {"type": "string", "description": "Commit SHA"}
                        },
                        "required": ["owner", "repo", "ref"]
                    }
                ),
                
                # Organization and User Operations
                Tool(
                    name="github_get_user",
                    description="Get user information",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "description": "GitHub username"}
                        },
                        "required": ["username"]
                    }
                ),
                Tool(
                    name="github_get_organization",
                    description="Get organization information",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "org": {"type": "string", "description": "Organization name"}
                        },
                        "required": ["org"]
                    }
                ),
                
                # Search Operations
                Tool(
                    name="github_search_repositories",
                    description="Search for repositories",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "q": {"type": "string", "description": "Search query"},
                            "sort": {"type": "string", "enum": ["stars", "forks", "help-wanted-issues", "updated"]},
                            "order": {"type": "string", "enum": ["desc", "asc"], "default": "desc"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["q"]
                    }
                ),
                Tool(
                    name="github_search_code",
                    description="Search code in repositories",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "q": {"type": "string", "description": "Search query"},
                            "sort": {"type": "string", "enum": ["indexed"]},
                            "order": {"type": "string", "enum": ["desc", "asc"], "default": "desc"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["q"]
                    }
                ),
                Tool(
                    name="github_search_issues",
                    description="Search issues and pull requests",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "q": {"type": "string", "description": "Search query"},
                            "sort": {"type": "string", "enum": ["comments", "reactions", "reactions-+1", "reactions--1", "reactions-smile", "reactions-thinking_face", "reactions-heart", "reactions-tada", "interactions", "created", "updated"]},
                            "order": {"type": "string", "enum": ["desc", "asc"], "default": "desc"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["q"]
                    }
                ),
                
                # Release Management
                Tool(
                    name="github_list_releases",
                    description="List repository releases",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_create_release",
                    description="Create a new release",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "tag_name": {"type": "string", "description": "Tag name for release"},
                            "name": {"type": "string", "description": "Release name"},
                            "body": {"type": "string", "description": "Release description"},
                            "draft": {"type": "boolean", "default": False},
                            "prerelease": {"type": "boolean", "default": False}
                        },
                        "required": ["owner", "repo", "tag_name"]
                    }
                ),
                
                # Webhooks
                Tool(
                    name="github_list_webhooks",
                    description="List repository webhooks",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"}
                        },
                        "required": ["owner", "repo"]
                    }
                ),
                Tool(
                    name="github_create_webhook",
                    description="Create a repository webhook",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "owner": {"type": "string", "description": "Repository owner"},
                            "repo": {"type": "string", "description": "Repository name"},
                            "url": {"type": "string", "description": "Webhook URL"},
                            "events": {"type": "array", "items": {"type": "string"}, "description": "Webhook events"},
                            "secret": {"type": "string", "description": "Webhook secret"}
                        },
                        "required": ["owner", "repo", "url"]
                    }
                ),
                
                # Generic API Call
                Tool(
                    name="github_api_call",
                    description="Make a generic GitHub API call",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"], "default": "GET"},
                            "endpoint": {"type": "string", "description": "API endpoint (e.g., /repos/owner/repo)"},
                            "data": {"type": "object", "description": "Request body data"},
                            "params": {"type": "object", "description": "Query parameters"}
                        },
                        "required": ["endpoint"]
                    }
                )
            ]
        
        # Tool handlers
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            try:
                if name == "github_get_repository":
                    result = await self._make_request("GET", f"/repos/{arguments['owner']}/{arguments['repo']}")
                    
                elif name == "github_list_repositories":
                    endpoint = f"/users/{arguments['username']}/repos"
                    params = {
                        "type": arguments.get("type", "all"),
                        "per_page": arguments.get("per_page", 30)
                    }
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_create_repository":
                    data = {
                        "name": arguments["name"],
                        "description": arguments.get("description", ""),
                        "private": arguments.get("private", False),
                        "auto_init": arguments.get("auto_init", False)
                    }
                    result = await self._make_request("POST", "/user/repos", data=data)
                    
                elif name == "github_list_workflows":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/workflows"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_get_workflow":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/workflows/{arguments['workflow_id']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_trigger_workflow":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/workflows/{arguments['workflow_id']}/dispatches"
                    data = {
                        "ref": arguments.get("ref", "main"),
                        "inputs": arguments.get("inputs", {})
                    }
                    result = await self._make_request("POST", endpoint, data=data)
                    
                elif name == "github_list_workflow_runs":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/runs"
                    params = {}
                    if "workflow_id" in arguments:
                        endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/workflows/{arguments['workflow_id']}/runs"
                    if "status" in arguments:
                        params["status"] = arguments["status"]
                    params["per_page"] = arguments.get("per_page", 30)
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_get_workflow_run":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/runs/{arguments['run_id']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_list_workflow_artifacts":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/runs/{arguments['run_id']}/artifacts"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_download_workflow_artifact":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/actions/artifacts/{arguments['artifact_id']}/zip"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_create_issue":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/issues"
                    data = {
                        "title": arguments["title"],
                        "body": arguments.get("body", ""),
                        "labels": arguments.get("labels", []),
                        "assignees": arguments.get("assignees", [])
                    }
                    result = await self._make_request("POST", endpoint, data=data)
                    
                elif name == "github_list_issues":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/issues"
                    params = {
                        "state": arguments.get("state", "open"),
                        "per_page": arguments.get("per_page", 30)
                    }
                    if "labels" in arguments:
                        params["labels"] = arguments["labels"]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_get_issue":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/issues/{arguments['issue_number']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_update_issue":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/issues/{arguments['issue_number']}"
                    data = {}
                    for key in ["title", "body", "state", "labels"]:
                        if key in arguments:
                            data[key] = arguments[key]
                    result = await self._make_request("PATCH", endpoint, data=data)
                    
                elif name == "github_list_branches":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/branches"
                    params = {"per_page": arguments.get("per_page", 30)}
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_create_branch":
                    # First get the SHA of the source branch
                    ref_endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/git/ref/heads/{arguments.get('from_branch', 'main')}"
                    ref_result = await self._make_request("GET", ref_endpoint)
                    
                    if ref_result.get("error"):
                        result = ref_result
                    else:
                        # Create new branch
                        endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/git/refs"
                        data = {
                            "ref": f"refs/heads/{arguments['branch']}",
                            "sha": ref_result["object"]["sha"]
                        }
                        result = await self._make_request("POST", endpoint, data=data)
                        
                elif name == "github_delete_branch":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/git/refs/heads/{arguments['branch']}"
                    result = await self._make_request("DELETE", endpoint)
                    
                elif name == "github_get_file_content":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/contents/{arguments['path']}"
                    params = {}
                    if "ref" in arguments:
                        params["ref"] = arguments["ref"]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_create_or_update_file":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/contents/{arguments['path']}"
                    data = {
                        "message": arguments["message"],
                        "content": arguments["content"],
                        "branch": arguments.get("branch", "main")
                    }
                    if "sha" in arguments:
                        data["sha"] = arguments["sha"]
                    result = await self._make_request("PUT", endpoint, data=data)
                    
                elif name == "github_delete_file":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/contents/{arguments['path']}"
                    data = {
                        "message": arguments["message"],
                        "sha": arguments["sha"],
                        "branch": arguments.get("branch", "main")
                    }
                    result = await self._make_request("DELETE", endpoint, data=data)
                    
                elif name == "github_fork_repository":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/forks"
                    data = {}
                    if "organization" in arguments:
                        data["organization"] = arguments["organization"]
                    result = await self._make_request("POST", endpoint, data=data)
                    
                elif name == "github_list_commits":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/commits"
                    params = {"per_page": arguments.get("per_page", 30)}
                    for key in ["sha", "path"]:
                        if key in arguments:
                            params[key] = arguments[key]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_get_commit":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/commits/{arguments['ref']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_get_user":
                    endpoint = f"/users/{arguments['username']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_get_organization":
                    endpoint = f"/orgs/{arguments['org']}"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_search_repositories":
                    endpoint = "/search/repositories"
                    params = {
                        "q": arguments["q"],
                        "per_page": arguments.get("per_page", 30)
                    }
                    for key in ["sort", "order"]:
                        if key in arguments:
                            params[key] = arguments[key]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_search_code":
                    endpoint = "/search/code"
                    params = {
                        "q": arguments["q"],
                        "per_page": arguments.get("per_page", 30)
                    }
                    for key in ["sort", "order"]:
                        if key in arguments:
                            params[key] = arguments[key]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_search_issues":
                    endpoint = "/search/issues"
                    params = {
                        "q": arguments["q"],
                        "per_page": arguments.get("per_page", 30)
                    }
                    for key in ["sort", "order"]:
                        if key in arguments:
                            params[key] = arguments[key]
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_list_releases":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/releases"
                    params = {"per_page": arguments.get("per_page", 30)}
                    result = await self._make_request("GET", endpoint, params=params)
                    
                elif name == "github_create_release":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/releases"
                    data = {
                        "tag_name": arguments["tag_name"],
                        "name": arguments.get("name", arguments["tag_name"]),
                        "body": arguments.get("body", ""),
                        "draft": arguments.get("draft", False),
                        "prerelease": arguments.get("prerelease", False)
                    }
                    result = await self._make_request("POST", endpoint, data=data)
                    
                elif name == "github_list_webhooks":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/hooks"
                    result = await self._make_request("GET", endpoint)
                    
                elif name == "github_create_webhook":
                    endpoint = f"/repos/{arguments['owner']}/{arguments['repo']}/hooks"
                    data = {
                        "config": {
                            "url": arguments["url"],
                            "content_type": "json"
                        },
                        "events": arguments.get("events", ["push"])
                    }
                    if "secret" in arguments:
                        data["config"]["secret"] = arguments["secret"]
                    result = await self._make_request("POST", endpoint, data=data)
                    
                elif name == "github_api_call":
                    method = arguments.get("method", "GET")
                    endpoint = arguments["endpoint"]
                    data = arguments.get("data")
                    params = arguments.get("params")
                    result = await self._make_request(method, endpoint, data=data, params=params)
                    
                else:
                    result = {"error": f"Unknown tool: {name}"}
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error in tool {name}: {e}")
                return [TextContent(type="text", text=json.dumps({"error": str(e)}))]
    
    def _setup_prompts(self):
        """Setup GitHub-related prompts"""
        
        @self.server.list_prompts()
        async def list_prompts() -> List[Prompt]:
            return [
                Prompt(
                    name="github_workflow_trigger",
                    description="Template for triggering GitHub Actions workflows",
                    arguments=[
                        PromptArgument(name="owner", description="Repository owner", required=True),
                        PromptArgument(name="repo", description="Repository name", required=True),
                        PromptArgument(name="workflow", description="Workflow name or ID", required=True),
                        PromptArgument(name="inputs", description="Workflow inputs (JSON)", required=False)
                    ]
                ),
                Prompt(
                    name="github_comprehensive_testing",
                    description="Template for comprehensive GitHub repository testing",
                    arguments=[
                        PromptArgument(name="owner", description="Repository owner", required=True),
                        PromptArgument(name="repo", description="Repository name", required=True),
                        PromptArgument(name="test_type", description="Type of testing", required=False)
                    ]
                )
            ]
        
        @self.server.get_prompt()
        async def get_prompt(name: str, arguments: Dict[str, str]) -> GetPromptRequestParams:
            if name == "github_workflow_trigger":
                return GetPromptRequestParams(
                    messages=[
                        PromptMessage(
                            role="user",
                            content=UserMessage(
                                type="text",
                                text=f"""Trigger GitHub Actions workflow for {arguments['owner']}/{arguments['repo']}:

Workflow: {arguments['workflow']}
Inputs: {arguments.get('inputs', 'None')}

Use the github_trigger_workflow tool to execute this workflow."""
                            )
                        )
                    ]
                )
            elif name == "github_comprehensive_testing":
                return GetPromptRequestParams(
                    messages=[
                        PromptMessage(
                            role="user", 
                            content=UserMessage(
                                type="text",
                                text=f"""Run comprehensive testing for {arguments['owner']}/{arguments['repo']}:

Test Type: {arguments.get('test_type', 'all')}

Steps:
1. List available workflows
2. Trigger testing workflow
3. Monitor workflow run status
4. Download test artifacts when complete
5. Analyze results"""
                            )
                        )
                    ]
                )

async def main():
    # Get GitHub token from environment or command line
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("Please set GITHUB_TOKEN environment variable")
        return
    
    server_instance = GitHubExtendedMCPServer()
    
    async with stdio_server() as (read_stream, write_stream):
        await server_instance.server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="github-extended-mcp",
                server_version="1.0.0",
                capabilities=server_instance.server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None,
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())