import re
import aiohttp
import asyncio
import ssl
import certifi
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

# Create SSL context that uses the system's CA certificates
ssl_context = ssl.create_default_context(cafile=certifi.where())

class GitHubService:
    def __init__(self, access_token: str = ""):
        self.base_url = settings.GITHUB_API_URL
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitVibe/1.0"
        }
        if access_token:
            self.headers["Authorization"] = f"token {access_token}"
    
    async def _make_request(self, url: str) -> Dict[str, Any]:
        """Make an HTTP request to the GitHub API with proper SSL verification"""
        try:
            # Create a connector with our SSL context
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, headers=self.headers, ssl=ssl_context) as response:
                    if response.status == 403:
                        error_data = await response.json()
                        rate_limit = response.headers.get('X-RateLimit-Remaining', 'unknown')
                        logger.error(f"GitHub API rate limit exceeded. Remaining: {rate_limit}")
                        raise Exception(f"GitHub API rate limit exceeded. Remaining: {rate_limit}")
                        
                    if response.status != 200:
                        try:
                            error = await response.json()
                            error_msg = error.get("message", "Failed to fetch data from GitHub")
                            logger.error(f"GitHub API error ({response.status}): {error_msg}")
                        except:
                            error_msg = await response.text()
                            logger.error(f"GitHub API error ({response.status}): {error_msg}")
                        
                        raise Exception(f"GitHub API error: {error_msg} (Status: {response.status})")
                        
                    return await response.json()
                    
        except aiohttp.ClientSSLError as e:
            logger.error(f"SSL Certificate error: {str(e)}")
            raise Exception(f"SSL Certificate verification failed: {str(e)}")
        except aiohttp.ClientError as e:
            logger.error(f"HTTP Client error: {str(e)}")
            raise Exception(f"Failed to connect to GitHub API: {str(e)}")
    
    async def get_repo_info(self, repo_url: str) -> Dict[str, Any]:
        """Extract owner and repo from URL and fetch repository info"""
        try:
            # Extract owner and repo from URL
            match = re.search(r'github\.com/([^/]+)/([^/]+)', repo_url)
            if not match:
                raise ValueError("Invalid GitHub repository URL")
            
            owner, repo = match.groups()
            repo = repo.replace('.git', '')  # Remove .git if present
            
            # Fetch repository data
            url = f"{self.base_url}/repos/{owner}/{repo}"
            repo_data = await self._make_request(url)
            
            # Fetch contributors count
            contributors_url = f"{self.base_url}/repos/{owner}/{repo}/contributors?per_page=1"
            contributors_data = await self._make_request(contributors_url)
            
            # Basic repository info
            return {
                "name": repo_data["name"],
                "full_name": repo_data["full_name"],
                "description": repo_data["description"],
                "html_url": repo_data["html_url"],
                "language": repo_data["language"],
                "stargazers_count": repo_data["stargazers_count"],
                "forks_count": repo_data["forks_count"],
                "open_issues_count": repo_data["open_issues_count"],
                "subscribers_count": repo_data["subscribers_count"],
                "created_at": repo_data["created_at"],
                "updated_at": repo_data["updated_at"],
                "pushed_at": repo_data["pushed_at"],
                "license": repo_data.get("license", {}).get("name") if repo_data.get("license") else None,
                "contributors_count": len(contributors_data) if isinstance(contributors_data, list) else 0
            }
            
        except Exception as e:
            logger.error(f"Error in get_repo_info: {str(e)}")
            raise
    
    async def get_repo_stats(self, owner: str, repo: str, days: int = 30) -> Dict[str, Any]:
        """Get repository statistics"""
        try:
            # Get commit activity
            commits_url = f"{self.base_url}/repos/{owner}/{repo}/stats/commit_activity"
            commit_activity = await self._make_request(commits_url)
            
            # Get issue and PR counts
            issues_url = f"{self.base_url}/search/issues?q=repo:{owner}/{repo}+type:issue+state:open"
            prs_url = f"{self.base_url}/search/issues?q=repo:{owner}/{repo}+type:pr+state:open"
            
            # Make requests in parallel
            issues_data, prs_data = await asyncio.gather(
                self._make_request(issues_url),
                self._make_request(prs_url)
            )
            
            # Calculate activity metrics
            now = datetime.utcnow()
            start_date = now - timedelta(days=days)
            
            # Process commit activity
            recent_commits = [
                week for week in commit_activity 
                if datetime.utcfromtimestamp(week["week"]) >= start_date
            ]
            
            total_commits = sum(week["total"] for week in recent_commits)
            daily_commits = [week["days"] for week in recent_commits]
            
            return {
                "commit_activity": {
                    "total_commits": total_commits,
                    "daily_commits": daily_commits,
                    "weeks": [{
                        "week": week["week"],
                        "days": week["days"],
                        "total": week["total"]
                    } for week in recent_commits]
                },
                "issues": {
                    "open": issues_data.get("total_count", 0),
                },
                "pull_requests": {
                    "open": prs_data.get("total_count", 0),
                },
                "analysis_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": now.isoformat(),
                    "days": days
                }
            }
            
        except Exception as e:
            logger.error(f"Error in get_repo_stats: {str(e)}")
            raise
    
    async def search_repositories(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for GitHub repositories based on a query string"""
        try:
            # URL encode the query and create the search URL
            url = f"{self.base_url}/search/repositories?q={query}&sort=stars&order=desc&per_page={limit}"
            logger.info(f"Searching GitHub repositories with URL: {url}")
            
            # Make the API request
            response = await self._make_request(url)
            
            # Process the results
            items = response.get("items", [])
            
            # Extract just the fields we need to return
            search_results = []
            for item in items:
                search_results.append({
                    "id": item["id"],
                    "name": item["name"],
                    "full_name": item["full_name"],
                    "description": item["description"],
                    "html_url": item["html_url"],
                    "stargazers_count": item["stargazers_count"],
                    "forks_count": item["forks_count"],
                    "language": item["language"],
                    "owner": {
                        "login": item["owner"]["login"],
                        "avatar_url": item["owner"]["avatar_url"],
                    }
                })
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error in search_repositories: {str(e)}")
            raise

    async def calculate_vibe_score(self, owner: str, repo: str, days: int = 30) -> Dict[str, Any]:
        """Calculate a 'vibe score' for the repository"""
        try:
            # Get repository data and stats
            repo_info = await self.get_repo_info(f"https://github.com/{owner}/{repo}")
            stats = await self.get_repo_stats(owner, repo, days)
            
            # Calculate activity score (0-100)
            commit_activity = stats["commit_activity"]["total_commits"]
            days_since_last_update = (datetime.utcnow() - datetime.strptime(
                repo_info["pushed_at"], "%Y-%m-%dT%H:%M:%SZ"
            )).days
            
            # Calculate scores for different metrics
            activity_score = min(100, commit_activity * 2)  # Cap at 100
            recency_score = max(0, 100 - (days_since_last_update * 5))  # -5 points per day
            popularity_score = min(100, repo_info["stargazers_count"] / 10)  # 1000 stars = 100 points
            
            # Calculate overall score (weighted average)
            total_score = (
                activity_score * 0.4 +
                recency_score * 0.3 +
                popularity_score * 0.3
            )
            
            # Determine vibe
            if total_score >= 80:
                vibe = "🔥 Active AF"
            elif total_score >= 60:
                vibe = "🧘‍♂️ Peacefully Maintained"
            elif total_score >= 40:
                vibe = "😴 Mid"
            elif total_score >= 20:
                vibe = "⚠️ High Drama Zone"
            else:
                vibe = "💀 Dead on Arrival"
            
            # Easter eggs
            if owner == "torvalds" and repo == "linux":
                vibe = "👑 King of Kernels"
            elif repo_info["stargazers_count"] < 10 and repo_info["open_issues_count"] > 200:
                vibe = "😿 Crying Cat Memorial"
            
            return {
                "vibe": vibe,
                "score": round(total_score, 1),
                "metrics": {
                    "activity_score": round(activity_score, 1),
                    "recency_score": round(recency_score, 1),
                    "popularity_score": round(popularity_score, 1),
                },
                "stats": {
                    "days_since_last_update": days_since_last_update,
                    "total_commits": commit_activity,
                    "stargazers": repo_info["stargazers_count"],
                    "open_issues": repo_info["open_issues_count"],
                }
            }
            
        except Exception as e:
            logger.error(f"Error in calculate_vibe_score: {str(e)}")
            raise
