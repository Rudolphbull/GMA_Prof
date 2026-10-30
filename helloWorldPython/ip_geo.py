# IP Geolocator uses free API, no key needed

import requests
import socket

def geolocate_ip(ip_or_domain):
  #if user gave domain, resolve it
  try:
    ip = socket.gethostbyname(ip_or_domain)
  except:
    ip = ip_or_domain

  print(f"[*] Locating {ip}...")

  try:
    r = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
    data = r.json()
    if data['status'] == 'fail':
      print("[-] Failed", data['message'])
      return
    print(f"""
    IP: {data['query']}
    Country: {data['country']} ({data['countryCode']})
    Region: {data['regionName']}
    City: {data['city']} 
    ISP: {data['isp']}
    Org: {data['org']}
    Lat/Long: {data['lat'], {data['lon']}}
    """)

    with open("geo_report.txt", "a") as f:
      f.write(f"{data['query']} - {data['city']}, {data['country']} - {data['isp']}\n")

  except Exception as e:
    print(f"[-] Error: {e}")


if __name__ == "__main__":
  target = input("Enter IP or domain: ").strip()
  geolocate_ip(target)