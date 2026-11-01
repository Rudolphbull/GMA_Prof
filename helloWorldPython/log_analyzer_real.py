import re
from collections import Counter
from datetime import datetime


ips = []
alerts = []

# ======= Real File Version =======
try:
    with open("auth.log.txt", "r") as file:
        for line in file:
            if "Failed" in line:
                m = re.search(r"from (\d+\.\d+\.\d+\.\d+)", line)
                if m:
                    ips.append(m.group(1))
except FileNotFoundError:
    print("auth.log.txt not found! Put it in same folder as this script")
    exit()

print("=== SOC Log Analyzer(REAL LOG) ===")
print(f"Total failed attempts: {len(ips)}")
print(f"IPs: {dict(Counter(ips))}")

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

print("\n[+] Report saved!")