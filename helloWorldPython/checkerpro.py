# Tool 1 PRO: Password Checker + Hack Time Estimator
import re
import math

def estimate_crack_time(password):
    # Calculate how many characters hackers need to try
    charset = 0
    if re.search(r"[a-z]", password): charset += 26
    if re.search(r"[A-Z]", password): charset += 26
    if re.search(r"[0-9]", password): charset += 10
    if re.search(r"[^a-zA-Z0-9]", password): charset += 32
    
    if charset == 0: charset = 26
    
    # Total combinations = charset ^ length
    combinations = charset ** len(password)
    
    # Hacker speed: 1 billion guesses/sec (modern GPU)
    guesses_per_sec = 1_000_000_000
    seconds = combinations / guesses_per_sec
    
    # Convert to human time
    if seconds < 1:
        return f"{seconds*1000:.2f} milliseconds - INSTANT HACK!"
    elif seconds < 60:
        return f"{seconds:.2f} seconds"
    elif seconds < 3600:
        return f"{seconds/60:.1f} minutes"
    elif seconds < 86400:
        return f"{seconds/3600:.1f} hours"
    elif seconds < 31536000:
        return f"{seconds/86400:.1f} days"
    else:
        years = seconds / 31536000
        if years > 1_000_000_000:
            return f"{years/1_000_000_000:.1f} BILLION years - Unhackable!"
        elif years > 1_000_000:
            return f"{years/1_000_000:.1f} million years"
        else:
            return f"{years:.1f} years"

def check_password_strength(password):
    score = 0
    feedback = []

    if len(password) >= 12: score += 2
    elif len(password) >= 8: score += 1
    else: feedback.append("❌ Too short - use at least 12 chars")

    if re.search(r"[A-Z]", password): score += 1
    else: feedback.append("❌ Add UPPERCASE")
    if re.search(r"[a-z]", password): score += 1
    else: feedback.append("❌ Add lowercase")
    if re.search(r"[0-9]", password): score += 1
    else: feedback.append("❌ Add numbers")
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password): score += 1
    else: feedback.append("❌ Add symbols !@#$")

    common = ["password", "123456", "qwerty", "admin", "letmein", "password123"]
    if password.lower() in common:
        score = 0
        feedback.append("❌ VERY common - in every hacker dictionary!")

    crack_time = estimate_crack_time(password)

    print(f"\n{'='*40}")
    print(f"Password: {'*' * len(password)} (Length: {len(password)})")
    print(f"Score: {score}/6")
    
    if score <= 2:
        print("Result: 🔴 WEAK")
    elif score <= 4:
        print("Result: 🟡 MEDIUM")
    else:
        print("Result: 🟢 STRONG")
    
    print(f"\n⏱️  Time to crack: {crack_time}")
    
    if feedback:
        print("\nHow to improve:")
        for tip in feedback:
            print(f"  {tip}")
    print(f"{'='*40}")

if __name__ == "__main__":
    pwd = input("Enter password to check: ")
    check_password_strength(pwd)