import json
import glob
import os

def merge_json_files():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    output_file = os.path.join(data_dir, 'set10.json')
    
    # Find all search_*.json files
    pattern = os.path.join(data_dir, 'search_*.json')
    files = glob.glob(pattern)
    
    print(f"Found {len(files)} files to merge.")
    
    all_records = []
    seen_records = set()
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                if 'data' in content and isinstance(content['data'], list):
                    for record in content['data']:
                        # Create a hashable representation of the record (tuple of sorted items)
                        # We need to handle lists inside the record (like emails, phones) correctly for hashing
                        # Convert lists to tuples
                        record_tuple = tuple(sorted(
                            (k, tuple(v) if isinstance(v, list) else v) 
                            for k, v in record.items()
                        ))
                        
                        if record_tuple not in seen_records:
                            seen_records.add(record_tuple)
                            all_records.append(record)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {file_path}")
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            
    print(f"Total unique records collected: {len(all_records)}")
    
    output_data = {
        "data": all_records,
        "total_results": len(all_records)
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"Successfully wrote merged data to {output_file}")

if __name__ == "__main__":
    merge_json_files()
