import re
import os
from django.core.management.base import BaseCommand
from core.models import Person, Address, ContactInfo
from django.db import transaction
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports people data from set2.txt (Key: Value format)'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        count = 0
        current_record = {}
        
        # Helper to process a record
        def process_record(record):
            if not record: return False
            
            try:
                with transaction.atomic():
                    # Parse DOB
                    dob = None
                    if record.get('dob'):
                        try:
                            dob = datetime.strptime(record['dob'], '%m/%d/%Y').date()
                        except ValueError:
                            pass

                    # Create Person
                    person = Person.objects.create(
                        first_name=record.get('first_name', ''),
                        last_name=record.get('last_name', ''),
                        # middle_name? Not in set2 keys explicitly
                        date_of_birth=dob,
                        ssn=record.get('ssn'),
                        sex='O' # Default or unknown
                    )

                    # Create Address
                    street = record.get('street', '')
                    suite = record.get('suite', '')
                    if suite:
                        street = f"{street}, {suite}"
                        
                    Address.objects.create(
                        person=person,
                        street=street,
                        state=record.get('state', ''),
                        zip_code=record.get('zip', ''),
                        city='', # No city key provided
                        is_current=True
                    )

                    # Create Phone
                    if record.get('phone'):
                        ContactInfo.objects.create(
                            person=person,
                            type='PHONE', 
                            value=record.get('phone')
                        )
                    
                    return True
            except Exception as e:
                print(f"Error importing record {record.get('first_name')}: {e}")
                return False

        imported_count = 0

        for line in lines:
            line = line.strip()
            if not line: continue

            # Check for new record start
            if line.lower().startswith('first name:'):
                # If we have a current record, save it first
                if current_record:
                    if process_record(current_record):
                        imported_count += 1
                    current_record = {}

            # Parse line
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()

                if key == 'first name':
                    current_record['first_name'] = value
                elif key == 'last name':
                    current_record['last_name'] = value
                elif key == 'date of birth':
                    current_record['dob'] = value
                elif key == 'ssn number':
                    current_record['ssn'] = value
                elif key == 'state':
                    current_record['state'] = value
                elif key == 'street address':
                    current_record['street'] = value
                elif key.startswith('suite'): # suite/apt/other
                    current_record['suite'] = value
                elif key == 'zip code':
                    current_record['zip'] = value
                elif key == 'phone number':
                    current_record['phone'] = value
                # Ignore Carrier name/pin

        # Process last record
        if current_record:
            if process_record(current_record):
                imported_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {imported_count} records'))
