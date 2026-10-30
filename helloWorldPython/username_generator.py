# Tool 3: Username Generator for Security Testing

import random
import math


def generate_usernames(full_name):
  """Takes 'John Doe' and returns 3 formats"""
  full_name = full_name.lower().strip()
  parts = full_name.split()

  if len(parts) < 2:
    return []


  first = parts[0]
  last = parts[-1]

  u1 = f"{first[0]}.{last}"       #j.doe
  u2 = f"{first}.{last}"          #johndoe
  u3 = f"{first}.{last}2026"      #johndoe2026

  return [u1, u2, u3]



def calculate_entropy(password):
  """Bonus: entropy calculation"""
  charset = 0
  if any(c.islower() for c in password): charset += 26
  if any(c.isupper() for c in password): charset += 26
  if any(c.isdigit() for c in password): charset += 10
  if charset == 0: return 0
  return len(password) * math.log2(charset)



# --- Main  ---

print("--- Username Generator ---")
try:
  with open("names.txt", "r") as f:
    names = [line.strip() for line in f if line.strip()]

  all_usernames = []
  for name in names:
    all_usernames.extend(generate_usernames(name))

  with open("usernames.txt", "w") as out:
    for u in all_usernames:
      out.write(u + "\n")

      #Bonus entropy
      ent = calculate_entropy(u)
      print(f"{u} - Entropy: {ent: .2f}")


  print(f"\nSaved {len(all_usernames)} usernames to usernames.txt")
  print("Deliverable ready: Push 2 files to Github + screenshot")

except FileNotFoundError:
  print("Create names.txt first with 20 names, one per line. Example:")
  print("John Doe\nJane Smith...")