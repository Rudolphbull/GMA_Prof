import re
from collections import Counter
from datetime import datetime

logs = ["Failed password for root from 192.168.1.10"]*4 + ["Failed password for admin from 10.0.0.5"]
ips = []
for line in logs:
    m = re.search(r"from (\d+\.\d+\.\d+\.\d+)", line)
    if m:
        ips.append(m.group(1))

alerts = []
print("=== SOC Log Analyzer ===")

for ip, count in Counter(ips).items():
    if count > 2:
        msg = f"ALERT: {ip} failed {count} times - Possible brute force"
        print(msg)
        alerts.append(msg)

with open("soc_alert_report.txt", "w") as f:
    f.write(f"SOC ALERT REPORT - {datetime.now()}\n")
    f.write("="*50 + "\n\n")
    f.write(f"IPs Analyzed: {dict(Counter(ips))}\n\n")
    for a in alerts:
        f.write(a + "\n")
    f.write("\nAction: Block IP on firewall\n")
