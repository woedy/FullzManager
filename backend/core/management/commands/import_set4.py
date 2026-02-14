import re
import os
import json
from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo, Vehicle, Relative
from django.db import transaction
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports people data from set4.txt (JSON blocks)'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file')

    def parse_date(self, date_val):
        """
        Handles various date formats:
        - integer/string 7141968 -> 07/14/1968
        - string "08-15-1966"
        - string "10/31/1986"
        """
        if not date_val:
            return None
        
        try:
            # Convert int to str safely
            s = str(date_val).strip()
            
            # Format: MMDDYYYY (7 or 8 digits)
            if s.isdigit():
                # 7141968 -> 07141968
                if len(s) == 7:
                    s = '0' + s
                if len(s) == 8:
                    try:
                        return datetime.strptime(s, '%m%d%Y').date()
                    except ValueError:
                        pass

            # Format: MM-DD-YYYY or MM/DD/YYYY
            # Replace separator
            s = s.replace('-', '/').replace('\\', '/')
            try:
                return datetime.strptime(s, '%m/%d/%Y').date()
            except ValueError:
                pass
                
        except (TypeError, AttributeError) as e:
            # Handle cases where date_val is not string/int compatible
            pass
            
        return None

    def create_person_from_dict(self, data, main_person=None, relation_to_main=None):
        """
        Creates a Person object from a dictionary (main or cosigner).
        If main_person is provided, creation is linked to it via Relative.
        """
        try:
            ssn = str(data.get('ssn', '')).strip()
            
            # Logic to skip if SSN implies it's the same person?
            # But here we just create. Caller handles existing checks.
            
            first = str(data.get('first', '')).strip()
            last = str(data.get('last', '')).strip()
            middle = str(data.get('middle', '')).strip()
            
            dob = self.parse_date(data.get('dob'))
        except (TypeError, AttributeError) as e:
            raise Exception(f"Error processing basic person data: {e} - Data: {data}")
        
        try:
            dl_data = data.get('dl', {}) or {}
            dl_num = str(dl_data.get('id', '')).strip() if dl_data.get('id') else None
            dl_state = str(dl_data.get('state', '')).strip() if dl_data.get('state') else None
            dl_exp = self.parse_date(dl_data.get('exp'))
        except (TypeError, AttributeError) as e:
            raise Exception(f"Error processing driver license data: {e} - DL Data: {dl_data}")

        # Prepare Notes for Job/Income
        try:
            notes = []
            job = data.get('job', {}) or {}
            if job:
                 employer = str(job.get('employer', '')).strip() if job.get('employer') else ''
                 position = str(job.get('position', '')).strip() if job.get('position') else ''
                 salary = str(job.get('salary', '')).strip() if job.get('salary') else ''
                 if employer:
                     notes.append(f"Employment: {position} at {employer} (${salary})")
            
            income = data.get('totalIncome')
            if income:
                notes.append(f"Total Income: ${str(income)}")
        except (TypeError, AttributeError) as e:
            raise Exception(f"Error processing job/income data: {e} - Job: {job}, Income: {income}")

        person = Person.objects.create(
            first_name=first,
            last_name=last,
            middle_name=middle,
            date_of_birth=dob,
            ssn=ssn,
            driver_license_number=dl_num,
            # driver_license_state=dl_state, # Model doesn't have this field? Checking models.py... it does NOT.
            # We should probably put DL State in notes or assume it matches address state? 
            # Or just ignore for now as field missing.
            driver_license_issue_date=None, # Not provided
            driver_license_expiration=dl_exp,
            notes="\n".join(notes)
        )
        # If DL State exists, maybe append to notes too?
        if dl_state:
            person.notes += f"\nDL State: {dl_state}"
            person.save()

        # Contact Info
        try:
            email = data.get('email')
            if email:
                ContactInfo.objects.create(person=person, type='EMAIL', value=str(email).strip())
            
            phone = data.get('phone')
            if phone:
                ContactInfo.objects.create(person=person, type='PHONE', value=str(phone).strip())
        except (TypeError, AttributeError) as e:
            raise Exception(f"Error processing contact info: {e} - Email: {email}, Phone: {phone}")

        # Address
        try:
            addr_data = data.get('address', {}) or {}
            if addr_data:
                Address.objects.create(
                    person=person,
                    street=str(addr_data.get('address', '')).strip() if addr_data.get('address') else '',
                    city=str(addr_data.get('city', '')).strip() if addr_data.get('city') else '',
                    state=str(addr_data.get('state', '')).strip() if addr_data.get('state') else '',
                    zip_code=str(addr_data.get('zip', '')).strip() if addr_data.get('zip') else '',
                    is_current=True
                )
                
            prev_addr = data.get('prevAddress', {}) or {}
            if prev_addr:
                 Address.objects.create(
                    person=person,
                    street=str(prev_addr.get('address', '')).strip() if prev_addr.get('address') else '',
                    city=str(prev_addr.get('city', '')).strip() if prev_addr.get('city') else '',
                    state=str(prev_addr.get('state', '')).strip() if prev_addr.get('state') else '',
                    zip_code=str(prev_addr.get('zip', '')).strip() if prev_addr.get('zip') else '',
                    is_current=False
                )
        except (TypeError, AttributeError) as e:
            raise Exception(f"Error processing address data: {e} - Address: {addr_data}, PrevAddress: {prev_addr}")

        # Vehicle (Loan) - Only for main person typically? Or whoever has the loan data.
        # Check loan description
        try:
            loan = data.get('loan', {}) or {}
            desc = loan.get('description', '')
            if desc:
                desc_str = str(desc).strip()
                # Try to parse year
                # "2018 Winnebago Forza"
                match = re.match(r'^(\d{4})\s+(.*)', desc_str)
                if match:
                    year = int(match.group(1))
                    model_str = match.group(2)
                    # Split make/model? "Winnebago Forza" -> Make: Winnebago, Model: Forza?
                    # Hard to be sure. Put whole thing in make or model?
                    # Let's put rest in 'Make' for now or 'Model'
                    Vehicle.objects.create(
                        person=person,
                        year=year,
                        make=model_str, # Loose mapping
                        model="" 
                    )
                else:
                    # Just string
                    # Vehicle.objects.create(person=person, make=desc_str) 
                    pass
        except (TypeError, AttributeError, ValueError) as e:
            raise Exception(f"Error processing vehicle data: {e} - Loan: {loan}, Desc: {desc}")

        # Relatives linking
        if main_person and relation_to_main:
            # Link Main -> Created Cosigner
            Relative.objects.create(
                person=main_person,
                name=f"{first} {last}",
                relation=relation_to_main
            )
            # Link Created Cosigner -> Main (Inferred?)
            # Maybe "Spouse" -> "Spouse"
            # We don't know the inverse relation name for sure (e.g. Fiance -> Fiancee?)
            Relative.objects.create(
                person=person,
                name=f"{main_person.first_name} {main_person.last_name}",
                relation="Associated Main Profile"
            )

        return person

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split by delimiter using regex to be robust
        blocks = re.split(r'-+\s*Darkstarshop\.me\s*-+', content)
        count = 0
        
        for block in blocks:
            clean_block = block.strip().rstrip(',')
            if not clean_block: continue
            
            try:
                data = json.loads(clean_block)
                
                with transaction.atomic():
                    # 1. Main Person
                    main_person = self.create_person_from_dict(data)
                    count += 1
                    
                    # 2. Cosigner
                    cosigner_data = data.get('cosigner', {})
                    if cosigner_data:
                        # Check if it has enough info (SSN is a good check)
                        c_ssn = str(cosigner_data.get('ssn', '')).strip()
                        m_ssn = str(data.get('ssn', '')).strip()
                        
                        # Only create if valid and NOT same as main
                        if c_ssn and c_ssn != m_ssn and c_ssn != 'None':
                             self.create_person_from_dict(
                                 cosigner_data, 
                                 main_person=main_person, 
                                 relation_to_main=cosigner_data.get('relation', 'Cosigner')
                             )
                             count += 1 # Count cosigners as imported people? Sure.

            except json.JSONDecodeError:
                # self.stdout.write(self.style.WARNING('Skipping invalid JSON block'))
                pass
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing block: {e}"))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} records (including cosigners)'))