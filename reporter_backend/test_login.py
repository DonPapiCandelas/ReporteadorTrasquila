import urllib.request
import json
import sys

url = "http://localhost:8000/api/v1/auth/login"
data = {
    "usuario": "admin",
    "password": "password123"
}
headers = {'Content-Type': 'application/json'}

# Convert data to JSON format
encoded_data = json.dumps(data).encode('utf-8')

try:
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        if response.status == 200:
            print("Login SUCCESS")
            print(response.read().decode('utf-8'))
        else:
            print(f"Login FAILED: {response.status}")
except Exception as e:
    print(f"Login ERROR: {e}")
