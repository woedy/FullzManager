import json
import re
from datetime import datetime, date
from django.db import transaction
from core.models import Person, Address, ContactInfo, Vehicle, Relative

class DataImportService:
    @staticmethod
    def parse_date(date_val):
        """
        Robust date parser handling various formats:
        - YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY
        - 7141968 (MMDDYYYY or similar)
        """
        if not date_val: return None
        
        # If it's already a date/datetime object
        if isinstance(date_val, (date, datetime)):
            return date_val

        s = str(date_val).strip()
        if not s: return None

        # Try standard formats
        formats = [
            '%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', 
            '%d-%b-%y', '%m/%d/%y', # 2-digit year
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(s, fmt).date()
                # Fix 2-digit year pivot if needed (roughly)
                if fmt.endswith('%y') and dt > date.today():
                    dt = dt.replace(year=dt.year - 100)
                return dt
            except ValueError:
                continue
        
        # Try digit strings like 7141968 -> 07/14/1968
        if s.isdigit():
            # Pad to 8 digits if 7
            if len(s) == 7: s = '0' + s
            if len(s) == 8:
                try:
                    return datetime.strptime(s, '%m%d%Y').date()
                except ValueError:
                    pass

        return None

    @staticmethod
    def detect_format_and_import(file_content, filename):
        summary = { 'success': 0, 'errors': 0, 'skipped': 0, 'details': [] }
        
        # 1. Custom JSON Blocks (Set 4) -- Check for separator
        if '---------' in file_content and 'Darkstarshop' in file_content:
            return DataImportService.import_custom_json_blocks(file_content)

        # 2. JSON (Set 9, 10)
        if filename.endswith('.json') or file_content.strip().startswith('{') or file_content.strip().startswith('['):
            try:
                data = json.loads(file_content)
                if isinstance(data, list):
                     return DataImportService.import_json(data)
                elif isinstance(data, dict):
                    if 'data' in data and isinstance(data['data'], list):
                        return DataImportService.import_json(data['data'])
                    else:
                        return DataImportService.import_json([data])
            except json.JSONDecodeError:
                pass # Fall through

        lines = file_content.splitlines()
        non_empty_lines = [l for l in lines if l.strip()]
        if not non_empty_lines: return summary

        # 3. TSV (Tab Separated) - Sets 5, 6, 7, 8
        # Check first valid line for tabs
        first_line = non_empty_lines[0]
        if '\t' in first_line:
            # Check column count roughly. Set 5+ usually has 10+ columns.
            if len(first_line.split('\t')) > 5:
                return DataImportService.import_tsv(lines)

        # 4. Key-Value (Set 2)
        # Check for "Key:" pattern
        key_value_score = 0
        for line in non_empty_lines[:5]:
            if ':' in line and len(line.split(':', 1)[0].split()) < 5:
                 key_value_score += 1
        
        if key_value_score >= 3:
             return DataImportService.import_key_value(lines)

        # 5. Text Blocks (Set 1 or Set 3)
        # Set 3 has 8-line blocks with "Carrier name:"
        if 'Carrier name:' in file_content:
            return DataImportService.import_set3_blocks(file_content)
        
        # Default to Set 1 layout
        return DataImportService.import_text_blocks(file_content)

    @staticmethod
    def import_tsv(lines):
        summary = { 'success': 0, 'errors': 0, 'skipped': 0 }
        
        for i, line in enumerate(lines):
            if not line.strip(): continue
            try:
                parts = line.split('\t')
                # Pad parts
                if len(parts) < 12: parts += [''] * (12 - len(parts))
                
                # Mapping based on Set 5/6/7/8 observation:
                # 0: Name, 1: DOB, 2: Gender, 3: SSN, 4: Occ, 5: Addr, 6: City, 7: State, 8: Zip, 9: Ph1, 10: Ph2, 11: Email
                full_name = parts[0].strip()
                if not full_name: continue

                dob = DataImportService.parse_date(parts[1])
                ssn = parts[3].strip()
                
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    summary['skipped'] += 1
                    continue
                
                name_parts = full_name.split()
                first = name_parts[0]
                last = name_parts[-1] if len(name_parts) > 1 else ''
                middle = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ''
                
                sex = None
                if 'female' in parts[2].lower(): sex = 'F'
                elif 'male' in parts[2].lower(): sex = 'M'
                
                with transaction.atomic():
                    person = Person.objects.create(
                        first_name=first, middle_name=middle, last_name=last,
                        sex=sex, date_of_birth=dob, ssn=ssn,
                        notes=f"Occupation: {parts[4]}" if parts[4] else ""
                    )
                    
                    if any([parts[5], parts[6], parts[7], parts[8]]):
                        Address.objects.create(
                            person=person, street=parts[5], city=parts[6], 
                            state=parts[7], zip_code=parts[8], is_current=True
                        )
                    
                    if parts[9]: ContactInfo.objects.create(person=person, type='PHONE', value=parts[9])
                    if parts[10]: ContactInfo.objects.create(person=person, type='PHONE', value=parts[10])
                    if parts[11]: ContactInfo.objects.create(person=person, type='EMAIL', value=parts[11])
                    
                    summary['success'] += 1
            except Exception as e:
                print(f"TSV Import Error: {e}")
                summary['errors'] += 1
        return summary

    @staticmethod
    def import_set3_blocks(content):
        summary = { 'success': 0, 'errors': 0, 'skipped': 0 }
        # Split by empty lines
        blocks = re.split(r'\n\s*\n', content)
        
        for block in blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if len(lines) < 6: continue
            
            try:
                # 1. Name, 2. DOB, 3. Addr1, 4. Addr2, 5. SSN, 6. Phone
                name_parts = lines[0].split()
                first = name_parts[0]
                last = name_parts[-1] if len(name_parts) > 1 else ''
                middle = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ''
                
                dob = DataImportService.parse_date(lines[1])
                
                # Find SSN line (usually line index 4, but let's be safe)
                ssn = None
                phone = None
                address_lines = []
                
                for line in lines[2:]:
                    if 'ssn:' in line.lower():
                        ssn = line.lower().replace('ssn:', '').strip()
                    elif 'carrier' in line.lower():
                        continue
                    elif re.search(r'\(\d{3}\)', line):
                        phone = line
                    else:
                        address_lines.append(line)
                
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    summary['skipped'] += 1
                    continue
                
                with transaction.atomic():
                    person = Person.objects.create(
                        first_name=first, last_name=last, middle_name=middle,
                        date_of_birth=dob, ssn=ssn, sex='O'
                    )
                    
                    # Address parsing (naive)
                    if address_lines:
                        street = address_lines[0]
                        rest = " ".join(address_lines[1:])
                        # Try to extract zip
                        zip_code = ''
                        state = ''
                        city = rest
                        
                        zip_match = re.search(r'\d{5}', rest)
                        if zip_match:
                            zip_code = zip_match.group(0)
                            city = rest.replace(zip_code, '').strip().rstrip(',')
                        
                        # Extract State (2 chars at end of city string usually)
                        # "TACOMA, WA"
                        parts = city.split()
                        if parts and len(parts[-1]) == 2:
                             state = parts[-1]
                             city = " ".join(parts[:-1]).rstrip(',')

                        Address.objects.create(
                            person=person, street=street, city=city, 
                            state=state, zip_code=zip_code, is_current=True
                        )
                    
                    if phone:
                        ContactInfo.objects.create(person=person, type='PHONE', value=phone)
                    
                    summary['success'] += 1
            except Exception:
                summary['errors'] += 1
        return summary

    @staticmethod
    def import_text_blocks(content):
        # Set 1 style (6 lines)
        summary = { 'success': 0, 'errors': 0, 'skipped': 0 }
        blocks = content.split('\n\n')
        
        for block in blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if len(lines) < 4: continue
            
            try:
                # Layout varies, use fuzzy finding
                name_parts = lines[0].split()
                first = name_parts[0]
                last = name_parts[-1] if len(name_parts) > 1 else ''
                
                ssn = None
                dob = None
                phones = []
                emails = []
                addr_line = lines[1] if len(lines) > 1 else ''
                
                for line in lines:
                    if 'SSN' in line or re.match(r'^\d{3}-\d{2}-\d{4}$', line):
                        ssn = line.replace('SSN:', '').strip()
                    elif 'DOB:' in line or re.match(r'\d{1,2}/\d{1,2}/\d{4}', line):
                        val = line.replace('DOB:', '').strip()
                        if not dob: dob = DataImportService.parse_date(val)
                    elif '@' in line:
                         emails.append(line)
                    elif re.search(r'\d{3}-\d{3}-\d{4}', line) and 'SSN' not in line:
                         phones.append(line)
                
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    summary['skipped'] += 1
                    continue
                    
                with transaction.atomic():
                    person = Person.objects.create(
                        first_name=first, last_name=last, ssn=ssn, date_of_birth=dob
                    )
                    if addr_line:
                        Address.objects.create(person=person, street=addr_line, is_current=True)
                    for p in phones: ContactInfo.objects.create(person=person, type='PHONE', value=p)
                    for e in emails: ContactInfo.objects.create(person=person, type='EMAIL', value=e)
                    summary['success'] += 1
            except Exception:
                summary['errors'] += 1
        return summary

    @staticmethod
    def import_key_value(lines):
        # Set 2 style
        summary = { 'success': 0, 'errors': 0, 'skipped': 0 }
        record = {}
        
        def save_record(r):
            if not r.get('first'): return
            try:
                ssn = r.get('ssn')
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    summary['skipped'] += 1
                    return
                
                with transaction.atomic():
                    person = Person.objects.create(
                        first_name=r.get('first', ''), last_name=r.get('last', ''),
                        ssn=ssn, date_of_birth=DataImportService.parse_date(r.get('dob'))
                    )
                    
                    street = r.get('street', '')
                    if r.get('suite'): street += f" {r['suite']}"
                    
                    Address.objects.create(
                        person=person, street=street, city=r.get('city', ''),
                        state=r.get('state', ''), zip_code=r.get('zip', ''), is_current=True
                    )
                    
                    if r.get('phone'): ContactInfo.objects.create(person=person, type='PHONE', value=r['phone'])
                    summary['success'] += 1
            except:
                summary['errors'] += 1

        for line in lines:
            if not line.strip(): continue
            if 'first name:' in line.lower():
                if record: save_record(record)
                record = {}
            
            if ':' in line:
                k, v = line.split(':', 1)
                k = k.lower().strip()
                v = v.strip()
                
                if 'first' in k: record['first'] = v
                elif 'last' in k: record['last'] = v
                elif 'ssn' in k: record['ssn'] = v
                elif 'dob' in k: record['dob'] = v
                elif 'street' in k: record['street'] = v
                elif 'suite' in k: record['suite'] = v
                elif 'city' in k: record['city'] = v # Usually inferred in Set 2 but if present
                elif 'state' in k: record['state'] = v
                elif 'zip' in k: record['zip'] = v
                elif 'phone' in k: record['phone'] = v
        
        if record: save_record(record)
        return summary

    @staticmethod
    def import_custom_json_blocks(content):
        # Set 4 style (Split by separator)
        parts = re.split(r'-+\s*Darkstarshop\.me\s*-+', content)
        items = []
        for p in parts:
            p = p.strip()
            if not p: continue
            try:
                # Cleanup potential JS weirdness
                p = re.sub(r',(\s*})', r'\1', p)
                items.append(json.loads(p))
            except: pass
        return DataImportService.import_json(items)

    @staticmethod
    def import_json(items):
        summary = { 'success': 0, 'errors': 0, 'skipped': 0 }
        
        for item in items:
            try:
                # Normalize keys (some use snake_case, some camelCase or short keys)
                first = item.get('first_name') or item.get('first') or ''
                last = item.get('last_name') or item.get('last') or ''
                middle = item.get('middle_name') or item.get('middle') or ''
                ssn = item.get('ssn')
                dob = DataImportService.parse_date(item.get('dob'))
                
                if not first: continue
                
                if ssn and Person.objects.filter(ssn=ssn).exists():
                    summary['skipped'] += 1
                    continue

                with transaction.atomic():
                    person = Person.objects.create(
                        first_name=first, last_name=last, middle_name=middle,
                        ssn=ssn, date_of_birth=dob
                    )
                    
                    # Address
                    addr = item.get('address')
                    if isinstance(addr, dict):
                        Address.objects.create(
                            person=person,
                            street=addr.get('address', '') or addr.get('street', ''),
                            city=addr.get('city', ''),
                            state=addr.get('state', ''),
                            zip_code=addr.get('zip', ''),
                            is_current=True
                        )
                    elif item.get('street'): # Flat
                        Address.objects.create(
                             person=person, street=item.get('street', ''),
                             city=item.get('city', ''), state=item.get('state', ''),
                             zip_code=item.get('zip', ''), is_current=True
                        )
                    
                    # Contact
                    ph = item.get('phone') or item.get('phones')
                    if isinstance(ph, list):
                        for p in ph: ContactInfo.objects.create(person=person, type='PHONE', value=p)
                    elif ph:
                        ContactInfo.objects.create(person=person, type='PHONE', value=str(ph))
                        
                    em = item.get('email') or item.get('emails') or item.get('_id')
                    if isinstance(em, list):
                        for e in em: ContactInfo.objects.create(person=person, type='EMAIL', value=e)
                    elif em and '@' in str(em):
                        ContactInfo.objects.create(person=person, type='EMAIL', value=str(em))
                    
                    # Extra info
                    notes = []
                    job = item.get('job')
                    if isinstance(job, dict): 
                        notes.append(f"Job: {job.get('position')} at {job.get('employer')} (${job.get('salary', '')})")
                    
                    bank = item.get('bank')
                    if isinstance(bank, dict): 
                        notes.append(f"Bank: {bank.get('name')}")
                    
                    if notes:
                        person.notes = "\n".join(notes)
                        person.save()

                    # Vehicle (Set 4 Loan)
                    loan = item.get('loan')
                    if isinstance(loan, dict):
                        desc = loan.get('description', '')
                        if desc:
                            # Try to extract Year Make Model
                            # "2018 Winnebago Forza"
                            year = None
                            make = desc
                            match = re.match(r'^(\d{4})\s+(.*)', desc)
                            if match:
                                year = int(match.group(1))
                                make = match.group(2)
                            
                            Vehicle.objects.create(
                                person=person,
                                year=year,
                                make=make,
                                model=''
                            )

                    # Relative (Set 4 Cosigner)
                    cosigner = item.get('cosigner')
                    if isinstance(cosigner, dict):
                        c_first = cosigner.get('first', '')
                        c_last = cosigner.get('last', '')
                        if c_first:
                            Relative.objects.create(
                                person=person,
                                name=f"{c_first} {c_last}".strip(),
                                relation=cosigner.get('relation', 'Cosigner')
                            )

                    summary['success'] += 1
            except Exception as e:
                print(f"Error importing item: {e}")
                summary['errors'] += 1
        return summary
