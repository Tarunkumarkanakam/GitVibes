#!/bin/bash

# Rename gitvibe-next to gitvibe-frontend
mv gitvibe-next gitvibe-frontend

echo "Directory renamed from gitvibe-next to gitvibe-frontend"

# Update any internal references if needed
# Find and replace in files (case sensitive)
find gitvibe-frontend -type f -exec sed -i '' 's/gitvibe-next/gitvibe-frontend/g' {} \;

echo "Updated internal references in files"

echo "Setup complete! You can now use docker-compose up to start the application"
