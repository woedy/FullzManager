import os
import json
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Debugs set4.txt parsing'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        blocks = content.split('--------- Darkstarshop.me ----------')
        self.stdout.write(f"Found {len(blocks)} blocks.")
        
        for i, block in enumerate(blocks):
             clean_block = block.strip()
             if not clean_block: continue
             
             self.stdout.write(f"--- Block {i} sample: {clean_block[:50]}...")
             try:
                 json.loads(clean_block)
                 self.stdout.write(self.style.SUCCESS(f"Block {i} Valid JSON"))
             except json.JSONDecodeError as e:
                 self.stdout.write(self.style.ERROR(f"Block {i} Invalid: {e}"))
