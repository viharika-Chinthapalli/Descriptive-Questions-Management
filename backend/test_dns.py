"""Test DNS resolution for Supabase hostnames."""

import socket
import sys

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_hostname(hostname):
    """Test DNS resolution for a hostname."""
    print(f"Testing: {hostname}")
    try:
        ip = socket.gethostbyname(hostname)
        print(f"  ✅ Resolved to: {ip}")
        return True
    except socket.gaierror as e:
        print(f"  ❌ DNS Error: {e}")
        return False

print("=" * 70)
print("Supabase DNS Resolution Test")
print("=" * 70)
print()

# Test direct connection hostname
direct_host = "db.rqbuvffgmmsgffksswyz.supabase.co"
print("1. Direct Connection Hostname:")
direct_ok = test_hostname(direct_host)
print()

# Test pooler hostname
pooler_host = "aws-0-ap-south-1.pooler.supabase.com"
print("2. Connection Pooler Hostname:")
pooler_ok = test_hostname(pooler_host)
print()

print("=" * 70)
if direct_ok and pooler_ok:
    print("✅ Both hostnames resolve correctly")
    print("   The DNS issue might be with the specific connection attempt.")
    print("   Try checking if your Supabase project is paused.")
elif pooler_ok:
    print("✅ Connection Pooler hostname resolves")
    print("   ❌ Direct connection hostname does not resolve")
    print("   Recommendation: Use Connection Pooler instead")
elif direct_ok:
    print("✅ Direct connection hostname resolves")
    print("   ❌ Connection Pooler hostname does not resolve")
    print("   Recommendation: Use Direct Connection")
else:
    print("❌ Neither hostname resolves")
    print("   Possible causes:")
    print("   1. Supabase project is paused")
    print("   2. Network connectivity issues")
    print("   3. Firewall blocking DNS resolution")
    print("   4. Wrong hostname format")
print("=" * 70)

