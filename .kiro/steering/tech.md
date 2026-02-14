# Technology Stack

## Backend
- **Framework**: Django 5.x with Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (fallback)
- **Key Libraries**:
  - `django-cors-headers` - CORS handling for frontend communication
  - `django-filter` - Advanced filtering capabilities
  - `psycopg2-binary` - PostgreSQL adapter
  - `gunicorn` - WSGI HTTP server
  - `whitenoise` - Static file serving

## Frontend
- **Framework**: React 18 with Vite build tool
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with PostCSS
- **HTTP Client**: Axios
- **UI Components**: Lucide React icons, RC Slider
- **Utilities**: clsx, tailwind-merge

## Infrastructure
- **Containerization**: Docker with docker-compose
- **Development Server**: Vite dev server (port 5173)
- **API Server**: Django development server (port 8000)
- **Database**: PostgreSQL 15 Alpine (port 5432)

## Common Commands

### Development Setup
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild containers
docker-compose up --build
```

### Backend Operations
```bash
# Run Django management commands
docker-compose exec backend python manage.py <command>

# Database migrations
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Import data (various sets available)
docker-compose exec backend python manage.py import_set1
docker-compose exec backend python manage.py import_set2
# ... (sets 1-10 available)
```

### Frontend Operations
```bash
# Install dependencies
cd frontend && npm install

# Development server (if running outside Docker)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Lint code
cd frontend && npm run lint
```

## Environment Configuration
- Environment variables configured in `docker-compose.yml`
- Backend uses environment-based configuration for database, debug mode, and secrets
- Frontend uses Vite environment variables (VITE_API_URL)
- CORS is currently set to allow all origins (development only)