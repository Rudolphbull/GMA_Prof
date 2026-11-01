# HomeWork: Entra ID Impossible Travel Detector

# Input: entra_logs.csv: user, ip, location, timestamp
# Logic: same user, 2 different countries within 60 mins = flag
import csv
import os
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv

def parse_time(s):
  return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")

risky = []
logs_by_user = defaultdict(list)

with open("entra_logs.csv", "r") as f:
  reader = csv.DictReader(f)
  for row in reader:
    logs_by_user[row['user']].append(row)

# Check each user
for user, logs in logs_by_user.items():
  logs.sort(key=lambda x: parse_time(x['timestamp']))

  for i in range(len(logs)-1):
    curr = logs[i]
    nxt = logs[i+1]

    if curr['location'] != nxt['location']:
      diff = (parse_time(nxt['timestamp']) - parse_time(curr['timestamp'])).total_seconds() / 60

      if diff <= 60 and diff > 0:
        msg = f"IMPOSSIBLE TRAVEL: {user} | {curr['location']} ({curr['ip']} at {curr['timestamp']}) -> {nxt['location']} ({nxt['ip']} at {nxt['timestamp']}) in {int(diff)} mins"
        print(msg)
        risky.append(msg)

# WRITE REPORT - LAST!
with open("risky_users.txt", "w") as out:
  out.write(f"ENTRA ID IMPOSSIBLE TRAVEL REPORT - {datetime.now()}\n")
  out.write("="*60 + "\n\n")
  if not risky:
    out.write("No impossible travel detected.\n")
  else:
    for r in risky:
      out.write(r + "\n")
  out.write("\nAction: Force password reset + MFA check + Block IPs\n")

print(f"\n[+] risky_users.txt saved! Found {len(risky)} alerts")

# BONUS: SLACK WEBHOOK ALERT
import requests
import json

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/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")  # paste your URL here

if risky:
    slack_message = {
        "text": f"🚨 ENTRA ID IMPOSSIBLE TRAVEL ALERT - {len(risky)} found!",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*ENTRA ID IMPOSSIBLE TRAVEL REPORT*\n*Time:* {datetime.now()}\n*Alerts:* {len(risky)} users\n\n" + "\n".join([f"• {r}" for r in risky]) + "\n\n*Action:* Force password reset + MFA check + Block IPs"
                }
            }
        ]
    }
    
    try:
        response = requests.post(SLACK_WEBHOOK_URL, json=slack_message)
        if response.status_code == 200:
            print("[+] Slack alert sent! 🚀")
        else:
            print(f"[-] Slack failed: {response.status_code}")
    except Exception as e:
        print(f"[-] Slack error: {e}")
else:
    print("[+] No risky users - no Slack alert needed")


