from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional
import openai
from ..core.config import settings
import logging
import json
import openai
from functools import lru_cache
import time

router = APIRouter()
logger = logging.getLogger(__name__)

# Roast API client
if settings.OPENAI_API_KEY:
    client = openai.OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url="https://api.nexus.navigatelabsai.com"
    )

# Predefined roast templates for different scenarios
ROAST_TEMPLATES = {
    "inactive": [
        "This repo is so inactive, even the README is collecting dust. {repo_name}? More like {repo_name}...'s been a while, huh?",
        "The last commit here is older than my grandma's fruitcake. {repo_name} needs some serious CPR.",
        "Is this repo a ghost town? Because I'm getting major abandoned amusement park vibes from {repo_name}."
    ],
    "active": [
        "Dang, {repo_name} is popping off! The devs are putting in work like it's a hackathon every day.",
        "Is this repository powered by coffee and existential dread? The commit history suggests yes.",
        "Someone's been busy! {repo_name} has more activity than a beehive in spring."
    ],
    "many_issues": [
        "{repo_name} has more open issues than my ex has problems. Time to close some tabs, buddy.",
        "With {issues_count} open issues, {repo_name} is the drama llama of GitHub repos.",
        "Is this a repository or a support group? {issues_count} open issues is a cry for help."
    ],
    "few_stars": [
        "{repo_name} has {stars_count} stars? Oof, that's rough. Even my cat's Instagram has more followers.",
        "With {stars_count} stars, this repo is like that one kid in group projects who doesn't get any credit.",
        "{repo_name} is the underdog we didn't know we needed. Keep shining, you beautiful, underappreciated codebase."
    ]
}


@router.get("/generate")
async def generate_roast(
    repo_name: str = Query(..., description="Repository name"),
    owner: str = Query(..., description="Repository owner"),
    vibe: str = Query(..., description="The vibe of the repository"),
    score: float = Query(..., description="The vibe score"),
    stars: int = Query(0, description="Number of stars"),
    issues: int = Query(0, description="Number of open issues"),
    last_commit_days: int = Query(0, description="Days since last commit")
) -> Dict[str, Any]:
    """
    Generate a roast or hype message for the repository
    """
    try:
        # Select template based on repo stats
        template_key = "inactive" if last_commit_days > 90 else "active"
        if issues > 100:
            template_key = "many_issues"
        elif stars < 10 and stars > 0:
            template_key = "few_stars"

        # Get a random template for the selected key
        import random
        template = random.choice(ROAST_TEMPLATES[template_key])

        # Format the template with repo data
        roast = template.format(
            repo_name=repo_name,
            owner=owner,
            stars_count=stars,
            issues_count=issues,
            days_since_commit=last_commit_days
        )

        # If we have OpenAI API key, enhance the roast with AI
        if settings.OPENAI_API_KEY:
            try:
                enhanced_roast = await enhance_roast_with_ai(roast, repo_name, owner, vibe, score)
                return {
                    "status": "success",
                    "roast": enhanced_roast,
                    "ai_enhanced": True
                }
            except Exception as e:
                logger.warning(f"Failed to enhance roast with AI: {str(e)}")
                # Fall back to the template-based roast

        return {
            "status": "success",
            "roast": roast,
            "ai_enhanced": False
        }

    except Exception as e:
        logger.error(f"Error generating roast: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate roast")


async def enhance_roast_with_ai(roast: str, repo_name: str, owner: str, vibe: str, score: float) -> str:
    """Enhance the roast using OpenAI's API with timeout handling"""
    import asyncio
    from concurrent.futures import TimeoutError

    # Shorter, more focused prompt for faster responses
    prompt = f"""Roast the GitHub repo {owner}/{repo_name} (Score: {score}/100) with this starter: "{roast}"
    Be witty and brief (max 2 sentences). No meanness."""

    try:
        # Set a timeout for the API call (5 seconds)
        async def call_api_with_timeout():
            return client.chat.completions.create(
                model="llama-4-scout-17b-16e-instruct",  # Using a smaller, faster model
                messages=[
                    {"role": "system", "content": "You are a witty AI that roasts GitHub repos briefly and humorously."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=60,  # Reducing token count for faster response
                temperature=0.4,  # Lower temperature for more predictable responses
            )

        # Execute with timeout
        response = await asyncio.wait_for(call_api_with_timeout(), timeout=5.0)
        return response.choices[0].message.content.strip()

    except (TimeoutError, asyncio.TimeoutError):
        logger.warning(f"OpenAI API call timed out for {owner}/{repo_name}")
        return f"{roast} (But our AI writer got distracted by a squirrel...)"

    except Exception as e:
        logger.error(f"Error in OpenAI API call: {str(e)}")
        return roast  # Return original roast on error
