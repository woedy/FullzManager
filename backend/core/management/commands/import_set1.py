import re
import os
from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
from django.db import transaction
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports people data from set1.txt (6-line format)'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split by double newline to get blocks
        blocks = content.split('\n\n')
        count = 0

        for block in blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            
            # Expecting exactly 6 lines, but let's be flexible if >6 or slightly malformed
            # User said: 
            # 1: Name
            # 2: Address
            # 3: Phone
            # 4: Email
            # 5: SSN
            # 6: DOB
            
            if len(lines) < 6:
                # self.stdout.write(self.style.WARNING(f'Skipping incomplete block: {lines}'))
                continue

            try:
                with transaction.atomic():
                    # 1. Name
                    name_parts = lines[0].split()
                    if not name_parts: continue
                    
                    first_name = name_parts[0]
                    last_name = name_parts[-1] if len(name_parts) > 1 else "Unknown"
                    middle_name = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""

                    person = Person.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        middle_name=middle_name,
                        sex='O' 
                    )

                    # 2. Address
                    raw_addr = lines[1]
                    # Attempt to parse: Street, City, State Zip
                    # 888 Juniper St Ne Apt 2719, Atlanta, GA 30309-4842
                    
                    # Regex for State Zip at end
                    # Looks for: (Comma or space) (State 2 chars or full name) (Comma or space) (Zip 5 or 5-4) End
                    # Simplification: Assume US addresses.
                    
                    street = raw_addr
                    city = ""
                    state = ""
                    zip_code = ""

                    # Extract Zip
                    zip_match = re.search(r'(\d{5}(?:-\d{4})?)', raw_addr)
                    if zip_match:
                        zip_code = zip_match.group(1)
                        # Remove zip from processing string
                        temp_addr = raw_addr.replace(zip_code, '').strip(', ')
                        
                        # Extract State (Last token)
                        tokens = temp_addr.split()
                        if tokens:
                            # State usually last word if zip is gone. 
                            # If "GA,", strip comma
                            st = tokens[-1].replace(',', '')
                            if len(st) == 2 or len(st) > 3: # GA or Texas or California
                                state = st
                                # Remove state
                                temp_addr = " ".join(tokens[:-1]).strip(', ')
                                
                                # Assume last part is City, but addresses are messy.
                                # "Atlanta" or "Manvel" or "New York"
                                # If there is a comma, everything after comma is likely State/City area?
                                # "888 Juniper St Ne Apt 2719, Atlanta"
                                if ',' in temp_addr:
                                    parts = temp_addr.rsplit(',', 1)
                                    city = parts[1].strip()
                                    street = parts[0].strip()
                                else:
                                    # No commas left? "2638 cutter ct Manvel"
                                    # Determine city vs street is hard without DB. 
                                    # Fallback: Put everything remaining in Street, City empty? 
                                    # Or guess last word is City.
                                    street = temp_addr
                            else:
                                street = temp_addr
                    
                    Address.objects.create(
                        person=person,
                        street=street, # Fallback to full raw if parsing fails
                        city=city,
                        state=state,
                        zip_code=zip_code,
                        is_current=True
                    )

                    # 3. Phone
                    phone_raw = lines[2]
                    # Extract digits
                    ph_digits = re.sub(r'\D', '', phone_raw)
                    if len(ph_digits) >= 10:
                        ContactInfo.objects.create(person=person, type='PHONE', value=phone_raw)

                    # 4. Email
                    email_raw = lines[3]
                    # basic validation
                    if '@' in email_raw:
                        ContactInfo.objects.create(person=person, type='EMAIL', value=email_raw)

                    # 5. SSN
                    ssn_line = lines[4]
                    ssn_val = ssn_line.replace('SSN:', '').strip()
                    if ssn_val:
                        person.ssn = ssn_val

                    # 6. DOB
                    dob_line = lines[5]
                    dob_val = dob_line.replace('DOB:', '').strip()
                    if dob_val:
                        try:
                            person.date_of_birth = datetime.strptime(dob_val, '%m/%d/%Y').date()
                        except ValueError:
                            pass
                    
                    person.save()
                    count += 1
                    # self.stdout.write(self.style.SUCCESS(f'Imported {first_name} {last_name}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error importing block starting with {lines[0]}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} records'))
