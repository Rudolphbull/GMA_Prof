#Tool 2 PRO: Port Scanner + Report + Custom Range

import socket 
from datetime import datetime


def scan_port(target, port):
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  s.settimeout(0.8)
  result = s.connect_ex((target, port))
  s.close()
  return result == 0


def get_service(port):
  services = {
    21: "FTP - File Transfer",
    22: "SSH - Secure Remote Login",
    23: "Telnet - Unsecure Login (Danger!)",
    25: "SMTP - Email",
    53: "DNS - Domain Name",
    80: "HTTP - Website",
    110: "POP3 - Email",
    135: "RPC - Windows Service",
    143: "IMAP - Email",
    443: "HTTPS - Secure Website",
    445: "SMB - Windows File Sharing (WannaCry!)",
    3306: "MYSQL - Database",
    3309: "RDP - Windows Remote Desktop",
    8080: "HTTP-Alt - Web Proxy"
  }

  return services.get(port, "unknown - investigate!")


print("="*60)
print("  🔍 PYTHON PORT SCANNER PRO - Cybersecurity Tool 2")
print("="*60)

target = input("\nEnter IP (127.0.0.1 or scanme.nmap.org): ").strip()

# PRO Feature: Custom range
range_input = input("Enter port range (e.g. 1-100 or 1-1024 or press Enter for common): ").strip()

if "-" in range_input:
    start, end = map(int, range_input.split("-"))
    ports = range(start, end + 1)
else:
    # Default common ports
    ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3306, 3389, 8080]

print(f"\n{'='*60}")
print(f"Target: {target}")
print(f"Ports: {list(ports)[:10]}{'...' if len(list(ports)) > 10 else ''} ({len(list(ports))} total)")
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"{'='*60}\n")

open_ports = []
start_time = datetime.now()

for port in ports:
    # Small dot to show progress
    print(f"Scanning {port}...", end="\r")
    if scan_port(target, port):
        service = get_service(port)
        print(f"Port {port}: 🟢 OPEN  -> {service}")
        open_ports.append((port, service))
        
end_time = datetime.now()
duration = (end_time - start_time).total_seconds()

print(f"\n{'='*60}")
print(f"SCAN COMPLETE")
print(f"{'='*60}")
print(f"Target: {target}")
print(f"Time Taken: {duration:.2f} seconds")
print(f"Open Ports: {len(open_ports)}/{len(list(ports))}")

if open_ports:
    print(f"\n--- OPEN PORTS DETAIL ---")
    for port, service in open_ports:
        print(f"  {port}/tcp  OPEN  {service}")
    
    # PRO Feature: Save report
    with open("scan_report.txt", "w") as f:
        f.write(f"Port Scan Report - {datetime.now()}\n")
        f.write(f"Target: {target}\n")
        f.write(f"Duration: {duration:.2f}s\n")
        f.write(f"Open Ports:\n")
        for port, service in open_ports:
            f.write(f"  {port} - {service}\n")
    print(f"\n📄 Report saved to: scan_report.txt")
else:
    print("No open ports found (firewall may be blocking)")

print(f"{'='*60}")