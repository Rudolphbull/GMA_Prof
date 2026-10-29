# Tool 1: Password Strength Checker - Cybersecurity Portfolio
import re

def check_password_strength(password):
    score = 0
    feedback = []

    # 1. Length check
    if len(password) >= 12:
        score += 2
    elif len(password) >= 8:
        score += 1
    else:
        feedback.append("❌ Too short - use at least 8 chars, 12+ is better")

    # 2. Complexity checks
    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("❌ Add UPPERCASE letters")

    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("❌ Add lowercase letters")

    if re.search(r"[0-9]", password):
        score += 1
    else:
        feedback.append("❌ Add numbers")

    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 1
    else:
        feedback.append("❌ Add special symbols like !@#$")

    # 3. Check common weak passwords
    common = ["password", "123456", "qwerty", "admin", "letmein"]
    if password.lower() in common:
        score = 0
        feedback.append("❌ This is a VERY common password - easily hacked!")

    # Final verdict
    print(f"\nPassword: {'*' * len(password)} (Length: {len(password)})")
    print(f"Score: {score}/6")

    if score <= 2:
        print("Result: 🔴 WEAK - Hackable in seconds")
    elif score <= 4:
        print("Result: 🟡 MEDIUM - Could be stronger")
    else:
        print("Result: 🟢 STRONG - Good job!")

    if feedback:
        print("\nHow to improve:")
        for tip in feedback:
            print(f"  {tip}")

# Run it
if __name__ == "__main__":
    pwd = input("Enter password to check: ")
    check_password_strength(pwd)