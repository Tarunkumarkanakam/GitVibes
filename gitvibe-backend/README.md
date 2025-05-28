# GitVibe Backend

A FastAPI-based backend service that analyzes GitHub repositories and provides fun, insightful metrics with a humorous twist.

## Features

- 📊 GitHub repository analysis
- 🔥 Vibe scoring system
- 🤖 AI-powered roasts (with OpenAI integration)
- 🏆 Repository comparison and leaderboards
- 🚀 Fast and scalable with async support
- 🐳 Docker and Docker Compose ready

## Prerequisites

- Python 3.9+
- Docker and Docker Compose (recommended)
- GitHub Personal Access Token (with `public_repo` scope)
- OpenAI API Key (optional, for enhanced roasts)

## Quick Start

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your credentials
4. Start the services:
   ```bash
   docker-compose up --build
   ```
5. The API will be available at `http://localhost:8000`

## API Endpoints

### Get Repository Info
```
GET /api/v1/github/repo-info?repo_url={github_repo_url}
```

### Get Repository Stats
```
GET /api/v1/github/repo-stats?owner={owner}&repo={repo}&days={days}
```

### Get Vibe Score
```
GET /api/v1/github/vibe-score?owner={owner}&repo={repo}&days={days}
```

### Generate Roast
```
GET /api/v1/roast/generate?repo_name={repo}&owner={owner}&vibe={vibe}&score={score}&stars={stars}&issues={issues}&last_commit_days={days}
```

### Compare Repositories
```
GET /api/v1/analyze/compare?repos={repo1_url}&repos={repo2_url}&repos={repo3_url}
```

## Development

### Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start Redis:
   ```bash
   docker-compose up -d redis
   ```

4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Testing

Run tests with pytest:
```bash
pytest
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_ACCESS_TOKEN` | GitHub Personal Access Token | - |
| `OPENAI_API_KEY` | OpenAI API Key (for enhanced roasts) | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_DB` | Redis database number | `0` |
| `DEBUG` | Enable debug mode | `False` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `60` |

## License

MIT
