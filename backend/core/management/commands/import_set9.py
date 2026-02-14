from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
import os
import json
from datetime import datetime, date

class Command(BaseCommand):
    help = 'Imports data from set9.json'

    def handle(self, *args, **kwargs):
        # Try container path first (mounted at /app/data)
        from django.conf import settings
        file_path = os.path.join(settings.BASE_DIR, 'data', 'set9.json')
        
        if not os.path.exists(file_path):
             # Try host path (sibling 'data' folder)
             file_path = os.path.join(settings.BASE_DIR, '..', 'data', 'set9.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        self.stdout.write(f'Starting import from {file_path}...')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data_json = json.load(f)
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f'Invalid JSON: {e}'))
            return

        items = data_json.get('data', [])
        count = 0
        errors = 0
        skipped = 0

        for i, item in enumerate(items):
            try:
                first_name = item.get('first_name', '').strip()
                middle_name = item.get('middle_name', '').strip()
                last_name = item.get('last_name', '').strip()
                ssn = item.get('ssn', '').strip()
                dob_str = item.get('dob') # Can be None/null
                
                street = item.get('street', '').strip()
                city = item.get('city', '').strip()
                state = item.get('state', '').strip()
                zip_code = item.get('zip', '').strip()
                
                phones = item.get('phones', [])
                emails = item.get('emails', [])

                if not first_name:
                    continue

                # Check duplicates
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    self.stdout.write(self.style.WARNING(f'Record {i}: Person with SSN {ssn} already exists. Skipping.'))
                    skipped += 1
                    continue

                # Date parsing
                dob = None
                if dob_str:
                    try:
                        # JSON usually YYYY-MM-DD
                        dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f'Record {i}: Invalid Date format "{dob_str}"'))

                # Create Person
                person = Person.objects.create(
                    first_name=first_name,
                    middle_name=middle_name,
                    last_name=last_name,
                    ssn=ssn,
                    date_of_birth=dob
                )

                # Create Address
                if any([street, city, state, zip_code]):
                    Address.objects.create(
                        person=person,
                        street=street,
                        city=city,
                        state=state,
                        zip_code=zip_code,
                        country='USA',
                        is_current=True
                    )

                # Contacts
                for phone in phones:
                    if phone:
                        ContactInfo.objects.create(
                            person=person,
                            type='PHONE',
                            value=phone
                        )
                
                for email in emails:
                    if email:
                        ContactInfo.objects.create(
                            person=person,
                            type='EMAIL',
                            value=email
                        )

                self.stdout.write(self.style.SUCCESS(f'Imported {first_name} {last_name}'))
                count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error importing record {i}: {e}'))
                errors += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} persons. {skipped} skipped. {errors} errors.'))
