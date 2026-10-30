import socket

from datetime import datetime


def scan_port(target, port):
    #Create a socket - like a phone to call the port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1) #wait 1 sec, don't hang forever

    #Try to connect - if it works, port is OPEN
    result = s.connect_ex((target, port))
    s.close()
    return result == 0


def main():
    #Security Use: Store IPs, ports like your slide!
    target = input("Enter IP to scan(use 127.0.0.1or scanme.nmap.org): ").strip()

    # Common important ports
    
    ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3306, 3389, 8080]
    
    print(f"\n{'='*50}")
    print(f"Scanning {target}...")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*50}\n")
    
    open_ports = []
    
    for port in ports:
        print(f"Checking port {port}...", end=" ")
        if scan_port(target, port):
            print(f"🟢 OPEN")
            open_ports.append(port)
        else:
            print(f"closed")
    
    print(f"\n{'='*50}")
    print(f"Scan complete for {target}")
    if open_ports:
        print(f"Open ports found: {open_ports}")
        for p in open_ports:
            if p == 22: print(f"  Port {p}: SSH - remote login")
            elif p == 80: print(f"  Port {p}: HTTP - website")
            elif p == 443: print(f"  Port {p}: HTTPS - secure website")
            elif p == 3389: print(f"  Port {p}: RDP - Windows remote desktop")
            else: print(f"  Port {p}: Open - investigate!")
    else:
        print("No open ports found from this list (or firewall blocked)")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()