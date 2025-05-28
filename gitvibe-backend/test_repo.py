import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8000"

async def test_repo_analysis(repo_url: str):
    """Test the repository analysis endpoint"""
    async with httpx.AsyncClient() as client:
        # Test repo info endpoint
        print(f"\n📊 Testing repository info for: {repo_url}")
        response = await client.get(
            f"{BASE_URL}/api/v1/github/repo-info",
            params={"repo_url": repo_url}
        )
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return
            
        repo_info = response.json()
        print("✅ Repository Info:")
        print(f"   Name: {repo_info['data'].get('name')}")
        print(f"   Description: {repo_info['data'].get('description')}")
        print(f"   🌟 Stars: {repo_info['data'].get('stargazers_count')}")
        print(f"   🍴 Forks: {repo_info['data'].get('forks_count')}")
        
        # Extract owner and repo name for subsequent requests
        owner = repo_info['data']['full_name'].split('/')[0]
        repo_name = repo_info['data']['name']
        
        # Test vibe score endpoint
        print("\n🎯 Testing vibe score...")
        response = await client.get(
            f"{BASE_URL}/api/v1/github/vibe-score",
            params={"owner": owner, "repo": repo_name, "days": 30}
        )
        
        if response.status_code == 200:
            vibe_score = response.json()
            print(f"✅ Vibe Score: {vibe_score['data']['vibe']} ({vibe_score['data']['score']}/100)")
            print(f"   📅 Days since last update: {vibe_score['data']['stats']['days_since_last_update']}")
            print(f"   💾 Total commits: {vibe_score['data']['stats']['total_commits']}")
            print(f"   ⚠️  Open issues: {vibe_score['data']['stats']['open_issues']}")
            
            # Test roast endpoint if we have the required data
            if 'vibe' in vibe_score['data'] and 'score' in vibe_score['data']:
                print("\n🔥 Testing roast...")
                response = await client.get(
                    f"{BASE_URL}/api/v1/roast/generate",
                    params={
                        "repo_name": repo_name,
                        "owner": owner,
                        "vibe": vibe_score['data']['vibe'],
                        "score": vibe_score['data']['score'],
                        "stars": repo_info['data'].get('stargazers_count', 0),
                        "issues": repo_info['data'].get('open_issues_count', 0),
                        "last_commit_days": vibe_score['data']['stats'].get('days_since_last_update', 0)
                    }
                )
                
                if response.status_code == 200:
                    roast = response.json()
                    print(f"🎤 Roast: {roast['roast']}")
                    if roast.get('ai_enhanced'):
                        print("   (AI Enhanced! 🤖)")
        
        # Test repository comparison
        print("\n🏆 Testing repository comparison...")
        response = await client.get(
            f"{BASE_URL}/api/v1/analyze/compare",
            params={
                "repos": [
                    "https://github.com/facebook/react",
                    "https://github.com/vuejs/vue",
                    "https://github.com/angular/angular"
                ]
            }
        )
        
        if response.status_code == 200:
            comparison = response.json()
            print(f"✅ Compared {comparison['count']} repositories:")
            for repo in comparison['repositories']:
                print(f"   {repo['position']} {repo['full_name']} - {repo['vibe_score']['vibe']} ({repo['vibe_score']['score']}/100)")
                print(f"      {repo['tagline']}")

if __name__ == "__main__":
    # Test with a popular repository
    test_repo = "https://github.com/facebook/react"
    print(f"🚀 Analyzing {test_repo}...")
    asyncio.run(test_repo_analysis(test_repo))
