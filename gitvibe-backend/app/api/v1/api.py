from fastapi import APIRouter
from app.endpoints import github, analyze, roast, search

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(github.router, prefix="/github", tags=["GitHub"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])
api_router.include_router(roast.router, prefix="/roast", tags=["Roast"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
