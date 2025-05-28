from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from ..services.github_service import GitHubService
from ..core.config import settings
import logging
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/compare")
async def compare_repos(
    repos: List[str] = Query(..., description="List of GitHub repository URLs to compare")
) -> Dict[str, Any]:
    """
    Compare multiple GitHub repositories
    """
    if len(repos) < 2 or len(repos) > 5:
        raise HTTPException(
            status_code=400,
            detail="Please provide between 2 and 5 repositories to compare"
        )
    
    try:
        github_service = GitHubService(settings.GITHUB_ACCESS_TOKEN)
        
        # Fetch data for all repositories in parallel
        tasks = [github_service.get_repo_info(repo) for repo in repos]
        repos_data = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check for any errors
        valid_repos = []
        for i, repo_data in enumerate(repos_data):
            if isinstance(repo_data, Exception):
                logger.warning(f"Error fetching data for {repos[i]}: {str(repo_data)}")
                continue
            valid_repos.append(repo_data)
        
        if len(valid_repos) < 2:
            raise HTTPException(
                status_code=400,
                detail="Could not fetch data for enough repositories to compare"
            )
        
        # Calculate scores for each repo
        score_tasks = []
        for repo in valid_repos:
            owner, repo_name = repo["full_name"].split('/')
            score_tasks.append(github_service.calculate_vibe_score(owner, repo_name))
        
        scores = await asyncio.gather(*score_tasks, return_exceptions=True)
        
        # Combine data
        results = []
        for repo, score in zip(valid_repos, scores):
            if isinstance(score, Exception):
                logger.warning(f"Error calculating score for {repo['full_name']}: {str(score)}")
                continue
                
            results.append({
                **repo,
                "vibe_score": score
            })
        
        # Sort by score (descending)
        results.sort(key=lambda x: x["vibe_score"]["score"], reverse=True)
        
        # Add podium positions
        for i, repo in enumerate(results):
            if i == 0:
                repo["position"] = "🥇"
                repo["tagline"] = get_winner_tagline(repo)
            elif i == 1:
                repo["position"] = "🥈"
                repo["tagline"] = get_runner_up_tagline(repo)
            elif i == 2:
                repo["position"] = "🥉"
                repo["tagline"] = get_third_place_tagline(repo)
            else:
                repo["position"] = str(i + 1)
                repo["tagline"] = get_participation_tagline(repo)
        
        return {
            "status": "success",
            "count": len(results),
            "repositories": results
        }
        
    except Exception as e:
        logger.error(f"Error comparing repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def get_winner_tagline(repo: Dict[str, Any]) -> str:
    """Generate a fun tagline for the winner"""
    stars = repo["stargazers_count"]
    issues = repo["open_issues_count"]
    
    if stars > 10000:
        return "👑 Absolute Legend"
    elif stars > 1000:
        return "🌟 Star of the Show"
    elif issues > 100:
        return "💪 Most Dramatic"
    else:
        return "🏆 Winner Winner Chicken Dinner"

def get_runner_up_tagline(repo: Dict[str, Any]) -> str:
    """Generate a fun tagline for the runner-up"""
    commits = repo["vibe_score"]["stats"]["total_commits"]
    
    if commits > 1000:
        return "💻 Most Committed"
    else:
        return "🎯 So Close Yet So Far"

def get_third_place_tagline(repo: Dict[str, Any]) -> str:
    """Generate a fun tagline for third place"""
    return "🔥 Still Lit"

def get_participation_tagline(repo: Dict[str, Any]) -> str:
    """Generate a fun participation tagline"""
    return "🎖️ Worthy Opponent"
