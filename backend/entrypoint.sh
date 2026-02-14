#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $DB_HOST $DB_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Starting server..."
exec "$@"
