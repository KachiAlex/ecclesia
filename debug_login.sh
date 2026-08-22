#!/bin/bash
BASE="http://127.0.0.1:3002"
COOKIE_JAR="/tmp/ai_test_debug.txt"
rm -f "$COOKIE_JAR"

# Save original password hash
ORIG_HASH=$(docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -t -A -c "SELECT password FROM public.\"User\" WHERE email = 'onyedika.akoma@gmail.com'")

# Generate and set test password
TEMP_HASH=$(docker exec pi-cms-app node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TestPass2026', 10))")
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$TEMP_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null

echo "Hash set: ${TEMP_HASH:0:30}..."

# Verify hash was set
DB_HASH=$(docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -t -A -c "SELECT password FROM public.\"User\" WHERE email = 'onyedika.akoma@gmail.com'")
echo "DB hash:  ${DB_HASH:0:30}..."

# Verify bcrypt match inside container
echo ""
echo "Verifying bcrypt match..."
docker exec pi-cms-app node -e "const bcrypt = require('bcryptjs'); const hash = '$TEMP_HASH'; console.log('Match:', bcrypt.compareSync('TestPass2026', hash))"

# Get CSRF
CSRF_RESPONSE=$(curl -s -c "$COOKIE_JAR" "$BASE/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF: $CSRF_TOKEN"

# Login with verbose output
echo ""
echo "=== Login attempt ==="
LOGIN_FULL=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=onyedika.akoma@gmail.com" \
  --data-urlencode "password=TestPass2026" \
  --data-urlencode "csrfToken=$CSRF_TOKEN" \
  --data-urlencode "callbackUrl=http://127.0.0.1:3002/dashboard" \
  --data-urlencode "json=true" \
  -D /tmp/login_headers.txt \
  -w "\n---HTTP_CODE:%{http_code}---")
echo "Response: $LOGIN_FULL"
echo ""
echo "Headers:"
cat /tmp/login_headers.txt
echo ""

# Check cookies
echo "Cookies:"
cat "$COOKIE_JAR"

# Check session
echo ""
echo "=== Session check ==="
SESSION=$(curl -s -b "$COOKIE_JAR" "$BASE/api/auth/session")
echo "Session: $SESSION"

# Restore
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$ORIG_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null
echo ""
echo "Password restored"
rm -f "$COOKIE_JAR"
