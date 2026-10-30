import socket
import sys

domain = sys.argv[1] if len(sys.argv) > 1 else "google.com"
print(f"[*] Target: {domain}")

try:
    with open("subdomains.txt") as f:
        subs = [l.strip() for l in f if l.strip()]
except:
    subs = ["www","mail","ftp","api","dev","admin"]
    print("[!] subdomains.txt not found, using default list")

print(f"[*] Enumerating {len(subs)} subdomains for {domain}")
found = []
for sub in subs:
    full = f"{sub}.{domain}"
    try:
        ip = socket.gethostbyname(full)
        print(f"[+] Found: {full} -> {ip}")
        found.append(f"{full} - {ip}")
    except:
        pass

with open("subdomains_found.txt","w") as out:
    out.write("\n".join(found))

print(f"[+] Saved {len(found)} to subdomains_found.txt")