# GitVibe - GitHub Repository Analysis Tool

GitVibe is a web application that provides insights and analysis for GitHub repositories, including automated "roasts" and repository metrics.

## Features

- 🔍 Search for GitHub repositories with autocomplete
- 📊 View detailed repository metrics
- 😂 Get AI-generated roasts for repositories
- 🎨 Dark/Light mode support
- 🐳 Containerized with Docker for easy deployment

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local development)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gitvibe.git
   cd gitvibe
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your API keys:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `GITHUB_TOKEN` - Your GitHub Personal Access Token with `repo` scope

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Development

### Frontend Development

```bash
cd gitvibe-frontend
pnpm install
pnpm dev
```

### Backend Development

```bash
cd gitvibe-backend
# Set up Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_API_URL` | URL of the backend API | `http://localhost:8000/api/v1` |

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the backend on | `8000` |
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `GITHUB_TOKEN` | GitHub Personal Access Token | - |

## License

MIT
# GitVibes
# GitVibes
