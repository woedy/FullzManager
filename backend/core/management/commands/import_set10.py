from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
import os
import json
from datetime import datetime, date

class Command(BaseCommand):
    help = 'Imports data from set10.json'

    def handle(self, *args, **kwargs):
        # Try container path first (mounted at /app/data)
        from django.conf import settings
        # In the container, settings.BASE_DIR is usually /app/backend.
        # We need to access /app/data/set10.json
        
        # Check standard locations
        possible_paths = [
            os.path.join(settings.BASE_DIR, '..', 'data', 'set10.json'), # /app/backend/../data -> /app/data
            os.path.join(settings.BASE_DIR, 'data', 'set10.json'),       # /app/backend/data (unlikely but possible dev setup)
            '/app/data/set10.json'                                       # Hardcoded container path
        ]
        
        file_path = None
        for path in possible_paths:
            if os.path.exists(path):
                file_path = path
                break
        
        if not file_path:
             self.stdout.write(self.style.ERROR(f'File set10.json not found in expected locations.'))
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
                first_name = item.get('first_name', '')
                if first_name: first_name = first_name.strip()
                
                middle_name = item.get('middle_name', '')
                if middle_name: middle_name = middle_name.strip()
                
                last_name = item.get('last_name', '')
                if last_name: last_name = last_name.strip()
                
                ssn = item.get('ssn', '')
                if ssn: ssn = ssn.strip()
                
                dob_str = item.get('dob') # Can be None/null
                
                street = item.get('street', '')
                if street: street = street.strip()
                
                city = item.get('city', '')
                if city: city = city.strip()
                
                state = item.get('state', '')
                if state: state = state.strip()
                
                zip_code = item.get('zip', '')
                if zip_code: zip_code = zip_code.strip()
                
                phones = item.get('phones', [])
                emails = item.get('emails', [])

                if not first_name:
                    continue
                
                # Skip if no SSN
                if not ssn:
                    self.stdout.write(self.style.WARNING(f'Record {i}: No SSN found. Skipping.'))
                    skipped += 1
                    continue

                # Check duplicates by SSN
                if Person.objects.filter(ssn=ssn).exists():
                    self.stdout.write(self.style.WARNING(f'Record {i}: Person with SSN {ssn} already exists. Skipping.'))
                    skipped += 1
                    continue
                
                # Also check by name + dob if SSN is missing to avoid dupes?
                # For now keeping logic simple as per instruction "no repeating info" handled in JSON gen.
                # But database might already have these people from other sets? 
                # User asked specifically for "set10.json with no repeating info" which we did.
                # Standard import logic checks SSN.

                # Date parsing
                dob = None
                if dob_str:
                    try:
                        # JSON usually YYYY-MM-DD. Handle "00" days/months if present in data?
                        # Based on typical bad data, might need flexible parsing.
                        # Python date doesn't support 00 month/day.
                        # If simple strptime fails, try to handle partials or just set None.
                        if '-00' in dob_str:
                             # partial date like 1967-03-00. 
                             # We can try to store what we can or just skip DOB.
                             # For now, simplistic approach:
                             parts = dob_str.split('-')
                             if len(parts) == 3:
                                y, m, d = parts
                                if m == '00': m = '01'
                                if d == '00': d = '01'
                                dob = date(int(y), int(m), int(d))
                        else:
                            dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f'Record {i}: Invalid Date format "{dob_str}"'))
                    except Exception:
                         pass

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
