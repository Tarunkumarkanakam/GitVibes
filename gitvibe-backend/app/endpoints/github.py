from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any
from ..services.github_service import GitHubService
from ..core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/repo-info")
async def get_repo_info(
    repo_url: str = Query(..., description="GitHub repository URL (e.g., https://github.com/username/repo)")
) -> Dict[str, Any]:
    """
    Get basic information about a GitHub repository
    """
    try:
        github_service = GitHubService(settings.GITHUB_ACCESS_TOKEN)
        repo_info = await github_service.get_repo_info(repo_url)
        return {"status": "success", "data": repo_info}
    except Exception as e:
        logger.error(f"Error fetching repo info: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/repo-stats")
async def get_repo_stats(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    days: int = Query(30, description="Number of days to analyze")
) -> Dict[str, Any]:
    """
    Get repository statistics including commits, issues, and PRs
    """
    try:
        github_service = GitHubService(settings.GITHUB_ACCESS_TOKEN)
        stats = await github_service.get_repo_stats(owner, repo, days)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error fetching repo stats: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vibe-score")
async def get_vibe_score(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    days: int = Query(30, description="Days to analyze for activity")
) -> Dict[str, Any]:
    """
    Calculate a 'vibe score' for the repository
    """
    try:
        github_service = GitHubService(settings.GITHUB_ACCESS_TOKEN)
        vibe_score = await github_service.calculate_vibe_score(owner, repo, days)
        return {"status": "success", "data": vibe_score}
    except Exception as e:
        logger.error(f"Error calculating vibe score: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
