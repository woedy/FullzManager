import requests
import json

try:
    resp = requests.post(
        "http://localhost:8000/api/people/",
        json={
            "first_name": "Manual",
            "last_name": "Verify",
            "sex": "M",
            "ssn": "999-99-9999",
            "date_of_birth": "2000-01-01"
        }
    )
    print(f"Status: {resp.status_code}")
    print(resp.json())
except Exception as e:
    print(e)
