import re
from collections import Counter

logs = ["Failed password for root from 192.168.1.10"]*4 + ["Failed password for admin from 10.0.0.5"]
ips = []
for line in logs:
    m = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
    if m:
        ips.append(m.group(1))

for ip, count in Counter(ips).items():
    if count > 2:
        print(f"ALERT: {ip} failed {count} times - Possible brute force")

#IOC_Extractor
import re
def extract_iocs(text):
    ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', text)
    urls = re.findall(r'https?://[^\s]+', text)
    hashes = re.findall(r'\b[a-fA-F0-9]{32,64}\b', text)
    return {"ips": ips, "urls": urls, "hashes": hashes}

log = "Failed from 192.168.1.10 visited http://evil.com hash 5f4dcc3b5aa765d61d8327deb882cf99"
print(extract_iocs(log))

# HomeWork: Entra IDImpossible Travel

# entra_logs.csv: user, ip, location, timestamp
# Logic: same user, 2 different countries within 60 mins = flag
import csv
from datetime import datetime

# TODO for student:
# Read CSV
# Group by user
# Compare timestamps
# If diff < 60 mins and location1 != location2 => write to risky_users.txt
print("Build this - this is real SOC detection!")  