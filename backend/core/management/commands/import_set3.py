import re
import os
from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
from django.db import transaction
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports people data from set3.txt (8-line block format)'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split by empty blocks (regex for 2+ newlines)
        blocks = re.split(r'\n\s*\n', content)
        count = 0

        for block in blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            
            # Format:
            # 1. Name
            # 2. DOB
            # 3. Address Ln 1
            # 4. Address Ln 2 (City, State Zip)
            # 5. SSN
            # 6. Phone
            # 7. Carrier Name (ignore)
            # 8. Carrier Pin (ignore)

            if len(lines) < 6: 
                continue

            try:
                with transaction.atomic():
                    # 1. Name
                    name_parts = lines[0].split()
                    if not name_parts: continue
                    first_name = name_parts[0]
                    last_name = name_parts[-1] if len(name_parts) > 1 else ""
                    middle = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""

                    # 2. DOB
                    dob_str = lines[1]
                    dob = None
                    try:
                        dob = datetime.strptime(dob_str, '%m/%d/%Y').date()
                    except:
                        pass
                    
                    # 5. SSN (might be line 4 or 5 depending on address lines? Template says 3 & 4 are address)
                    # Let's verify line content by regex if strict index fails? 
                    # Template:
                    # Line 0: Name
                    # Line 1: DOB
                    # Line 2: Street
                    # Line 3: CityStateZip
                    # Line 4: SSN
                    # Line 5: Phone
                    
                    ssn_str = lines[4].lower().replace('ssn:', '').strip()
                    
                    person = Person.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        middle_name=middle,
                        date_of_birth=dob,
                        ssn=ssn_str,
                        sex='O'
                    )

                    # 3 & 4 Address
                    street = lines[2].strip().rstrip(',')
                    city_state_zip = lines[3]
                    
                    city = ""
                    state = ""
                    zip_code = ""

                    # Parse City, State Zip
                    # "TACOMA, WA 98444"
                    # Match Zip at end
                    zip_match = re.search(r'\b\d{5}(?:-\d{4})?\b', city_state_zip)
                    if zip_match:
                        zip_code = zip_match.group(0)
                        rem = city_state_zip.replace(zip_code, '').strip().rstrip(',')
                    else:
                        rem = city_state_zip

                    # State is usually last 2 chars
                    parts = rem.split()
                    if len(parts) >= 1:
                        # Check last part for State
                        potential_state = parts[-1].replace(',', '')
                        if len(potential_state) == 2:
                            state = potential_state
                            # City is parsing rest
                            city = " ".join(parts[:-1]).rstrip(',')
                        else:
                            # Maybe city string?
                            city = rem

                    Address.objects.create(
                        person=person,
                        street=street,
                        city=city,
                        state=state,
                        zip_code=zip_code,
                        is_current=True
                    )

                    # 6. Phone
                    phone = lines[5]
                    ContactInfo.objects.create(person=person, type='PHONE', value=phone)

                    count += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Failed to import block starting {lines[0]}: {e}"))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} records'))
