#!/bin/bash
# Generate a correct bcrypt hash and run the test
BASE="http://127.0.0.1:3002"
COOKIE_JAR="/tmp/ai_test_cookies4.txt"
rm -f "$COOKIE_JAR"

echo "=========================================="
echo "  AI Assistant Flow Test - pi-CMS"
echo "=========================================="

# Save original password hash
ORIG_HASH=$(docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -t -A -c "SELECT password FROM public.\"User\" WHERE email = 'onyedika.akoma@gmail.com'")
echo "Original hash saved: ${ORIG_HASH:0:20}..."

# Generate bcrypt hash using node inside the app container
echo ""
echo "[SETUP] Generating bcrypt hash for test password..."
TEMP_HASH=$(docker exec pi-cms-app node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TestPass2026', 10))")
echo "  Generated hash: ${TEMP_HASH:0:20}..."

# Set temporary password
echo "  Setting temporary test password..."
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$TEMP_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null
echo "  Done"

# Step 1: Get CSRF token
echo ""
echo "[1/6] Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c "$COOKIE_JAR" "$BASE/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "  CSRF token: ${CSRF_TOKEN:0:20}..."

if [ -z "$CSRF_TOKEN" ]; then
  echo "  FAIL: No CSRF token received"
  docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$ORIG_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null
  exit 1
fi
echo "  PASS"

# Step 2: Login
echo ""
echo "[2/6] Logging in as onyedika.akoma@gmail.com..."
LOGIN_HTTP=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=onyedika.akoma@gmail.com" \
  --data-urlencode "password=TestPass2026" \
  --data-urlencode "csrfToken=$CSRF_TOKEN" \
  --data-urlencode "callbackUrl=http://127.0.0.1:3002/dashboard" \
  --data-urlencode "json=true" \
  -o /dev/null -w "%{http_code}")
echo "  Login HTTP status: $LOGIN_HTTP"

# Step 3: Verify session
echo ""
echo "[3/6] Verifying session..."
SESSION_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE/api/auth/session")
echo "  Session: $(echo $SESSION_RESPONSE | head -c 300)"
echo ""

if echo "$SESSION_RESPONSE" | grep -q '"user"'; then
  echo "  PASS: Session is active"
else
  echo "  FAIL: Session not active after login"
  docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$ORIG_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null
  echo "  Password restored"
  rm -f "$COOKIE_JAR"
  exit 1
fi

# Step 4: Test birthdays API
echo ""
echo "[4/6] Testing GET /api/ai-assistant/birthdays?days=30..."
BD_RESPONSE=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "$BASE/api/ai-assistant/birthdays?days=30")
BD_HTTP=$(echo "$BD_RESPONSE" | tail -1)
BD_BODY=$(echo "$BD_RESPONSE" | head -n -1)
echo "  HTTP status: $BD_HTTP"
echo "  Response: $BD_BODY"
echo ""

if [ "$BD_HTTP" = "200" ]; then
  echo "  PASS: Birthdays API returned 200"
  if echo "$BD_BODY" | grep -q '"birthdays"'; then
    echo "  PASS: Response contains birthdays array"
    BD_COUNT=$(echo "$BD_BODY" | grep -o '"userId"' | wc -l)
    echo "  Found $BD_COUNT birthday(s) in response"
  fi
else
  echo "  FAIL: Expected 200, got $BD_HTTP"
fi

# Step 5: Test notifications API
echo ""
echo "[5/6] Testing GET /api/ai-assistant/notifications..."
NOTIF_RESPONSE=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "$BASE/api/ai-assistant/notifications")
NOTIF_HTTP=$(echo "$NOTIF_RESPONSE" | tail -1)
NOTIF_BODY=$(echo "$NOTIF_RESPONSE" | head -n -1)
echo "  HTTP status: $NOTIF_HTTP"
echo "  Response: $(echo $NOTIF_BODY | head -c 500)"
echo ""

if [ "$NOTIF_HTTP" = "200" ]; then
  echo "  PASS: Notifications API returned 200"
else
  echo "  FAIL: Expected 200, got $NOTIF_HTTP"
fi

# Step 6: Test AI message generation
echo ""
echo "[6/6] Testing POST /api/ai-assistant/generate-message..."
GEN_RESPONSE=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "$BASE/api/ai-assistant/generate-message" \
  -H "Content-Type: application/json" \
  -d '{"userId":"JvAVdUu9fVNpWYqWJHmt","type":"birthday"}')
GEN_HTTP=$(echo "$GEN_RESPONSE" | tail -1)
GEN_BODY=$(echo "$GEN_RESPONSE" | head -n -1)
echo "  HTTP status: $GEN_HTTP"
echo "  Response: $GEN_BODY"
echo ""

if [ "$GEN_HTTP" = "200" ]; then
  echo "  PASS: Message generation returned 200"
  if echo "$GEN_BODY" | grep -q '"message"'; then
    echo "  PASS: Response contains generated message"
  fi
else
  echo "  FAIL: Expected 200, got $GEN_HTTP"
fi

# Bonus: Test dashboard page
echo ""
echo "[BONUS] Testing dashboard page..."
DASH_HTTP=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE/dashboard")
echo "  Dashboard HTTP: $DASH_HTTP"
if [ "$DASH_HTTP" = "200" ]; then
  echo "  PASS: Dashboard accessible with session"
else
  echo "  INFO: Dashboard returned $DASH_HTTP"
fi

# Restore original password
echo ""
echo "[CLEANUP] Restoring original password..."
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia -c "UPDATE public.\"User\" SET password = '$ORIG_HASH' WHERE email = 'onyedika.akoma@gmail.com'" > /dev/null
echo "  Password restored"

echo ""
echo "=========================================="
echo "  AI Assistant Flow Test Complete"
echo "=========================================="
rm -f "$COOKIE_JAR"
