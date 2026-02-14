#!/bin/bash

# Export All Data Script
# This script exports all person data from the Django application to JSON

echo "🚀 Starting data export..."
echo "=================================="

# Default output file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="exports/fullz_export_${TIMESTAMP}.json"

# Create exports directory if it doesn't exist
mkdir -p exports

# Check if we're running in Docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker container"
    python manage.py export_all_data --output "$OUTPUT_FILE" --pretty
else
    echo "Running outside Docker - using docker-compose"
    docker-compose exec backend python manage.py export_all_data --output "$OUTPUT_FILE" --pretty
fi

echo "=================================="
echo "✅ Export completed!"
echo "📁 File saved as: $OUTPUT_FILE"