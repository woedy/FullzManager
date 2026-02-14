from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Imports all data sets from set1 to set10'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-first',
            action='store_true',
            help='Clear all existing data before importing',
        )
        parser.add_argument(
            '--skip-errors',
            action='store_true',
            help='Continue importing even if one set fails',
        )

    def handle(self, *args, **options):
        # Clear data if requested
        if options['clear_first']:
            self.stdout.write(self.style.WARNING('Clearing all existing data...'))
            try:
                call_command('clear_all')
                self.stdout.write(self.style.SUCCESS('Data cleared successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error clearing data: {e}'))
                if not options['skip_errors']:
                    return

        # Define the data file paths
        # Try container path first (mounted at /app/data), then relative path
        data_dir_paths = [
            os.path.join(settings.BASE_DIR, '..', 'data'),  # /app/backend/../data -> /app/data
            '/app/data',  # Hardcoded container path
            os.path.join(settings.BASE_DIR, 'data'),  # Local development path
        ]
        
        data_dir = None
        for path in data_dir_paths:
            if os.path.exists(path):
                data_dir = path
                break
        
        if not data_dir:
            self.stdout.write(self.style.ERROR('Data directory not found'))
            return

        # Define import commands and their corresponding files
        # Sets 1-4 require file path arguments, sets 5-10 find their own files
        import_sets = [
            ('import_set1', 'set1.txt'),
            ('import_set2', 'set2.txt'),
            ('import_set3', 'set3.txt'),
            ('import_set4', 'set4.txt'),
            ('import_set5', None),  # These find their own files
            ('import_set6', None),
            ('import_set7', None),
            ('import_set8', None),
            ('import_set9', None),
            ('import_set10', None),
        ]

        total_imported = 0
        failed_sets = []

        self.stdout.write(self.style.SUCCESS(f'Starting import of all sets from {data_dir}...'))
        self.stdout.write('=' * 60)

        for command_name, filename in import_sets:
            set_number = command_name.replace('import_set', '')
            
            try:
                self.stdout.write(f'Importing Set {set_number}...')
                
                if filename:
                    # Text file sets (1-8)
                    file_path = os.path.join(data_dir, filename)
                    if not os.path.exists(file_path):
                        raise FileNotFoundError(f'File not found: {file_path}')
                    call_command(command_name, file_path)
                else:
                    # JSON sets (9-10) - they find their own files
                    call_command(command_name)
                
                self.stdout.write(self.style.SUCCESS(f'✓ Set {set_number} imported successfully'))
                total_imported += 1
                
            except Exception as e:
                error_msg = f'✗ Set {set_number} failed: {e}'
                self.stdout.write(self.style.ERROR(error_msg))
                failed_sets.append(set_number)
                
                if not options['skip_errors']:
                    self.stdout.write(self.style.ERROR('Stopping import due to error. Use --skip-errors to continue.'))
                    break

        # Summary
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS(f'Import Summary:'))
        self.stdout.write(f'Successfully imported: {total_imported}/10 sets')
        
        if failed_sets:
            self.stdout.write(self.style.WARNING(f'Failed sets: {", ".join(failed_sets)}'))
        else:
            self.stdout.write(self.style.SUCCESS('All sets imported successfully! 🎉'))