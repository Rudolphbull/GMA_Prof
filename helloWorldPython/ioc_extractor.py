#IOC_Extractor
import re
from datetime import datetime

def extract_iocs(text):
    ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', text)
    urls = re.findall(r'https?://[^\s]+', text)
    hashes = re.findall(r'\b[a-fA-F0-9]{32,64}\b', text)
    return {"ips": ips, "urls": urls, "hashes": hashes}

#1. Test with single log
log = "Failed from 192.168.1.10 visited http://evil.com hash 5f4dcc3b5aa765d61d8327deb882cf99"
print(extract_iocs(log))

#2. Test with Real File
print("\n=== Reading threat_report.txt ===")
with open("threat_report.txt", "r") as f:
    text = f.read()

result = extract_iocs(text)
print(result)

# 3. WRITE REPORT 

with open("ioc_report.txt", "w") as out:
    out.write(f"IOC REPORT: - {datetime.now()}\n")
    out.write("="*50 + "\n\n")
    out.write(f"IPs found: {result['ips']}\n")
    out.write("URLs found: {result['urls']}\n")
    out.write(f"Hashes found: {result['hashes']}\n\n")
    out.write("Action: Block IPs/URLs on firewall, hunt hashes in SIEN\n")

print("\n[+] ioc_report.txt saved!")
              