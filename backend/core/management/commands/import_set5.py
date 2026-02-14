from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports data from set5.txt'

    def handle(self, *args, **kwargs):
        # Try container path first (mounted at /app/data)
        from django.conf import settings
        file_path = os.path.join(settings.BASE_DIR, 'data', 'set5.txt')
        
        if not os.path.exists(file_path):
             # Try host path (sibling 'data' folder)
             file_path = os.path.join(settings.BASE_DIR, '..', 'data', 'set5.txt')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        self.stdout.write(f'Starting import from {file_path}...')
        
        count = 0
        errors = 0

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                
                parts = line.split('\t')
                
                # Check if we have enough parts. The file format seems to have varying trailing tabs.
                # Expected at least up to Zip (index 8). Email is index 11.
                # We will pad to 12.
                if len(parts) < 12:
                     parts += [''] * (12 - len(parts))
                
                # Unpack fields based on observation
                # 0: Name, 1: DOB, 2: Gender, 3: SSN, 4: Occupation, 5: Address, 6: City, 7: State, 8: Zip, 9: Phone1, 10: Phone2, 11: Email
                full_name = parts[0].strip()
                dob_str = parts[1].strip()
                gender_str = parts[2].strip()
                ssn = parts[3].strip()
                occupation = parts[4].strip()
                address_str = parts[5].strip()
                city = parts[6].strip()
                state = parts[7].strip()
                zip_code = parts[8].strip()
                phone1 = parts[9].strip()
                phone2 = parts[10].strip()
                email = parts[11].strip()

                # Basic validation: Name is required
                if not full_name:
                    continue

                # Parse Name
                name_parts = full_name.split()
                first_name = ""
                middle_name = ""
                last_name = ""
                
                if len(name_parts) > 0:
                    first_name = name_parts[0]
                    if len(name_parts) == 2:
                        last_name = name_parts[1]
                    elif len(name_parts) > 2:
                        # Heuristic: Check if the second part is a middle initial or name
                        # For "BRUCE BOOKER", len=2.
                        # For "CRAIG A MEISENBACH", len=3. Middle=A.
                        # For "Bruce Wayne Booker", len=3. Middle=Wayne.
                        middle_name = " ".join(name_parts[1:-1])
                        last_name = name_parts[-1]
                
                # Parse DOB
                dob = None
                if dob_str:
                    try:
                        dob = datetime.strptime(dob_str, '%m/%d/%Y').date()
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f'Line {line_num}: Invalid Date format "{dob_str}" for {full_name}'))
                        # specific fix for one bad line if any, or just start logging
                
                # Parse Gender
                sex = None
                g_lower = gender_str.lower()
                if 'female' in g_lower:
                    sex = 'F'
                elif 'male' in g_lower:
                    sex = 'M'
                
                # Avoid duplicates
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    self.stdout.write(self.style.WARNING(f'Line {line_num}: Person with SSN {ssn} already exists using filter(ssn=ssn). Skipping.'))
                    continue
                
                # Create Person
                try:
                    person = Person.objects.create(
                        first_name=first_name,
                        middle_name=middle_name,
                        last_name=last_name,
                        sex=sex,
                        date_of_birth=dob,
                        ssn=ssn,
                        notes=f"Occupation: {occupation}" if occupation else ""
                    )
                    
                    # Create Address
                    if any([address_str, city, state, zip_code]):
                        Address.objects.create(
                            person=person,
                            street=address_str,
                            city=city,
                            state=state,
                            zip_code=zip_code,
                            country='USA',
                            is_current=True
                        )

                    # Create Contacts
                    if phone1:
                        ContactInfo.objects.create(
                            person=person,
                            type='PHONE',
                            value=phone1
                        )
                    
                    if phone2 and phone2 != phone1:
                        ContactInfo.objects.create(
                            person=person,
                            type='PHONE',
                            value=phone2
                        )
                        
                    if email:
                         ContactInfo.objects.create(
                            person=person,
                            type='EMAIL',
                            value=email
                        )
                    
                    self.stdout.write(self.style.SUCCESS(f'Imported {full_name}'))
                    count += 1
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error importing line {line_num}: {e}'))
                    errors += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} persons. {errors} errors encountered.'))
