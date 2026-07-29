import urllib.request
import urllib.error
import json

PROJECT_REF = "dhowfdzppzcfhoobidbe"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob3dmZHpwcHpjZmhvb2JpZGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDIyMDUzMSwiZXhwIjoyMDk5Nzk2NTMxfQ.RXRGTycYg9KKAmZdf5-HZVNKb6nnxW3yrZHJVjz34xE"

# Test various Supabase endpoints
endpoints = [
    f"https://{PROJECT_REF}.supabase.co/auth/v1/admin/config",
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth",
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/auth/config"
]

for url in endpoints:
    print(f"\n--- Testing {url} ---")
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[SUCCESS {resp.status}]", resp.read().decode('utf-8')[:300])
    except urllib.error.HTTPError as e:
        print(f"[HTTP {e.code}]", e.read().decode('utf-8'))
    except Exception as ex:
        print(f"[ERR]", ex)
