# Project Structure

## Root Level
```
├── backend/           # Django REST API application
├── frontend/          # React + Vite client application
├── data/              # Processed data files for import
├── Raw/               # Raw data files and search results
├── docker-compose.yml # Multi-container orchestration
├── merge_json_files.py # Data processing utility
└── verify.py          # Data verification utility
```

## Backend Structure (`backend/`)
```
backend/
├── config/            # Django project configuration
│   ├── settings.py    # Main Django settings
│   ├── urls.py        # Root URL configuration
│   ├── wsgi.py        # WSGI application
│   └── asgi.py        # ASGI application
├── core/              # Main application module
│   ├── models.py      # Data models (Person, Address, etc.)
│   ├── serializers.py # DRF serializers
│   ├── views.py       # API viewsets
│   ├── urls.py        # App URL patterns
│   ├── filters.py     # Custom filtering logic
│   ├── admin.py       # Django admin configuration
│   ├── migrations/    # Database migration files
│   └── management/    # Custom management commands
│       └── commands/  # Import scripts (import_set1.py, etc.)
├── media/             # User uploaded files
├── evidence/          # Static evidence files
├── requirements.txt   # Python dependencies
├── Dockerfile         # Container configuration
├── entrypoint.sh      # Container startup script
└── manage.py          # Django management script
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   │   └── Layout.jsx # Main layout wrapper
│   ├── pages/         # Route-specific page components
│   │   ├── Dashboard.jsx    # Main dashboard/listing
│   │   ├── PersonForm.jsx   # Add/edit person form
│   │   ├── PersonDetail.jsx # Person detail view
│   │   ├── InfoStore.jsx    # Information storage page
│   │   └── Settings.jsx     # Application settings
│   ├── services/      # API communication layer
│   │   ├── api.js     # Base API configuration
│   │   └── people.js  # Person-specific API calls
│   ├── utils/         # Utility functions
│   │   └── date.js    # Date formatting helpers
│   ├── App.jsx        # Main application component
│   ├── main.jsx       # Application entry point
│   ├── index.css      # Global styles
│   └── ErrorBoundary.jsx # Error handling component
├── package.json       # Node.js dependencies and scripts
├── vite.config.js     # Vite build configuration
├── tailwind.config.js # Tailwind CSS configuration
├── postcss.config.js  # PostCSS configuration
├── Dockerfile         # Container configuration
└── index.html         # HTML template
```

## Data Organization
- **`data/`**: Contains processed data files (set1.txt through set10.json) ready for import
- **`Raw/`**: Contains raw search results and unprocessed data files
- **`backend/media/evidence/`**: Stores uploaded evidence files
- **`backend/data/`**: Mounted volume for data access within containers

## Key Architectural Patterns

### Backend (Django)
- **Models**: Single `Person` model with related models for addresses, contacts, relatives, vehicles, and evidence
- **ViewSets**: Uses DRF ModelViewSet pattern for CRUD operations
- **Filtering**: Custom filter classes with django-filter integration
- **Management Commands**: Custom commands for bulk data import operations
- **File Handling**: Support for both file uploads and external links

### Frontend (React)
- **Component Structure**: Pages consume services, services handle API calls
- **Routing**: Client-side routing with React Router DOM
- **State Management**: Local component state (no global state management)
- **Styling**: Utility-first CSS with Tailwind
- **Error Handling**: Error boundary component for graceful error handling

### API Design
- RESTful endpoints following DRF conventions
- Nested serializers for related data (addresses, contacts, etc.)
- Search and filtering capabilities across multiple fields
- Bulk operations support (clear_all endpoint)