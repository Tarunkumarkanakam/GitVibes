from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from ..services.github_service import GitHubService
from ..core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/repositories")
async def search_repositories(
    query: str = Query(..., description="Search query for repositories"),
    limit: int = Query(5, description="Maximum number of results to return")
) -> Dict[str, Any]:
    """
    Search for GitHub repositories based on a query string
    """
    try:
        logger.info(f"Searching repositories with query: {query}")
        github_service = GitHubService(settings.GITHUB_ACCESS_TOKEN)
        
        # Use the GitHub service to search for repositories
        search_results = await github_service.search_repositories(query, limit)
        
        return {
            "status": "success",
            "count": len(search_results),
            "items": search_results
        }
    except Exception as e:
        logger.error(f"Error searching repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
