import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://dhowfdzppzcfhoobidbe.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob3dmZHpwcHpjZmhvb2JpZGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDIyMDUzMSwiZXhwIjoyMDk5Nzk2NTMxfQ.RXRGTycYg9KKAmZdf5-HZVNKb6nnxW3yrZHJVjz34xE"

def test_generate_link(email):
    url = f"{SUPABASE_URL}/auth/v1/admin/generate_link"
    payload = json.dumps({
        "type": "recovery",
        "email": email,
        "options": {
            "redirect_to": "https://ybstoplulugu.ozgurcanaka.me/auth/callback?next=/reset-password"
        }
    }).encode('utf-8')
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            print(f"[GENERATE LINK SUCCESS] Status: {resp.status}")
            data = json.loads(body)
            print("Action link:", data.get("action_link") or data.get("properties", {}).get("action_link"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[HTTP ERROR {e.code}] {err_body}")
    except Exception as ex:
        print(f"[EXCEPT] {ex}")

if __name__ == "__main__":
    test_generate_link("ozgurcan.aka@ogr.deu.edu.tr")
