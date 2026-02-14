import json
import os
from datetime import datetime, date
from django.core.management.base import BaseCommand
from django.core.serializers.json import DjangoJSONEncoder
from core.models import Person, Address, ContactInfo, Vehicle, Relative, PublicDataEvidence

class DateTimeEncoder(DjangoJSONEncoder):
    """Custom JSON encoder to handle date/datetime objects"""
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

class Command(BaseCommand):
    help = 'Exports all person data to a JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default='exported_data.json',
            help='Output file path (default: exported_data.json)'
        )
        parser.add_argument(
            '--pretty',
            action='store_true',
            help='Pretty print JSON with indentation'
        )
        parser.add_argument(
            '--include-ids',
            action='store_true',
            help='Include database IDs in export'
        )

    def handle(self, *args, **options):
        output_file = options['output']
        pretty_print = options['pretty']
        include_ids = options['include_ids']

        self.stdout.write('Starting data export...')
        
        # Get all persons with related data
        persons = Person.objects.all().prefetch_related(
            'addresses',
            'contacts',
            'vehicles', 
            'relatives',
            'evidence'
        )

        exported_data = {
            'export_info': {
                'timestamp': datetime.now().isoformat(),
                'total_persons': persons.count(),
                'exported_by': 'Django Management Command'
            },
            'persons': []
        }

        count = 0
        for person in persons:
            person_data = {
                'first_name': person.first_name,
                'middle_name': person.middle_name,
                'last_name': person.last_name,
                'date_of_birth': person.date_of_birth,
                'sex': person.sex,
                'ssn': person.ssn,
                'driver_license_number': person.driver_license_number,
                'driver_license_issue_date': person.driver_license_issue_date,
                'driver_license_expiration': person.driver_license_expiration,
                'credit_score': person.credit_score,
                'is_used': person.is_used,
                'used_date': person.used_date,
                'notes': person.notes,
                'created_at': person.created_at,
                'updated_at': person.updated_at
            }

            # Include database ID if requested
            if include_ids:
                person_data['id'] = person.id

            # Add addresses
            person_data['addresses'] = []
            for address in person.addresses.all():
                addr_data = {
                    'street': address.street,
                    'city': address.city,
                    'state': address.state,
                    'zip_code': address.zip_code,
                    'country': address.country,
                    'is_current': address.is_current
                }
                if include_ids:
                    addr_data['id'] = address.id
                person_data['addresses'].append(addr_data)

            # Add contact information
            person_data['contact_info'] = []
            for contact in person.contacts.all():
                contact_data = {
                    'type': contact.type,
                    'value': contact.value
                }
                if include_ids:
                    contact_data['id'] = contact.id
                person_data['contact_info'].append(contact_data)

            # Add vehicles
            person_data['vehicles'] = []
            for vehicle in person.vehicles.all():
                vehicle_data = {
                    'year': vehicle.year,
                    'make': vehicle.make,
                    'model': vehicle.model,
                    'vin': vehicle.vin,
                    'plate_number': vehicle.plate_number
                }
                if include_ids:
                    vehicle_data['id'] = vehicle.id
                person_data['vehicles'].append(vehicle_data)

            # Add relatives
            person_data['relatives'] = []
            for relative in person.relatives.all():
                relative_data = {
                    'name': relative.name,
                    'relation': relative.relation
                }
                if include_ids:
                    relative_data['id'] = relative.id
                person_data['relatives'].append(relative_data)

            # Add evidence files
            person_data['evidence'] = []
            for evidence in person.evidence.all():
                evidence_data = {
                    'title': evidence.title,
                    'description': evidence.description,
                    'file_path': evidence.file.name if evidence.file else None,
                    'external_link': evidence.external_link
                }
                if include_ids:
                    evidence_data['id'] = evidence.id
                person_data['evidence'].append(evidence_data)

            exported_data['persons'].append(person_data)
            count += 1

            # Progress indicator
            if count % 100 == 0:
                self.stdout.write(f'Processed {count} persons...')

        # Write to file
        try:
            # Ensure output directory exists
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            with open(output_file, 'w', encoding='utf-8') as f:
                if pretty_print:
                    json.dump(exported_data, f, cls=DateTimeEncoder, indent=2, ensure_ascii=False)
                else:
                    json.dump(exported_data, f, cls=DateTimeEncoder, ensure_ascii=False)

            # File size info
            file_size = os.path.getsize(output_file)
            file_size_mb = file_size / (1024 * 1024)

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully exported {count} persons to {output_file}\n'
                    f'File size: {file_size_mb:.2f} MB'
                )
            )

            # Summary statistics
            total_addresses = sum(len(p['addresses']) for p in exported_data['persons'])
            total_contacts = sum(len(p['contact_info']) for p in exported_data['persons'])
            total_vehicles = sum(len(p['vehicles']) for p in exported_data['persons'])
            total_relatives = sum(len(p['relatives']) for p in exported_data['persons'])
            total_evidence = sum(len(p['evidence']) for p in exported_data['persons'])

            self.stdout.write(
                f'\nExport Summary:\n'
                f'- Persons: {count}\n'
                f'- Addresses: {total_addresses}\n'
                f'- Contact Info: {total_contacts}\n'
                f'- Vehicles: {total_vehicles}\n'
                f'- Relatives: {total_relatives}\n'
                f'- Evidence Files: {total_evidence}'
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error writing to file {output_file}: {e}')
            )