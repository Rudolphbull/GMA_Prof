import socket


def enum_subdomains(domain, wordlist="subdomains.txt"):
  found = []
  try:
    with open(wordlist) as f:
      subs = [line.strip() for line in f if line.strip()]
  except FileNotFoundError:
    print(f"[-] {wordlist} not found. Create it with like: www, mail, api, dev")
    return


  print(f"[*] Enumerating {len(subs)} subdomains for {domain}")

  for sub in subs:
    full = f"{sub}.{domain}"
    try:
      ip = socket.gethostbyname(full)
      print(f"[+] Found: {full} -> {ip}")
      found.append((full, ip))
    except socket.gaierror:
      pass


  with open("subdomains_found.txt", "w") as out:
    for d, ip in found:
      out.write(f"{d} - {ip}\n")

  print(f"\n[+] Saved {len(found)} to subdomains_found.txt")


  if __name__ == "__main__":
    target = input("Enter domain (e.g. example.com): ").strip()
    enum_subdomains(target)
  