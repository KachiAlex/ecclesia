#!/bin/bash
# Find exact Ecclesia references in remaining files
echo "=== CredentialsLoginForm ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/components/auth/CredentialsLoginForm.tsx 2>/dev/null

echo ""
echo "=== GeneralSettings ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/components/GeneralSettings.tsx 2>/dev/null

echo ""
echo "=== DigitalSchool ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/components/DigitalSchool.tsx 2>/dev/null

echo ""
echo "=== SlugShareCard ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/components/superadmin/SlugShareCard.tsx 2>/dev/null

echo ""
echo "=== auth/register/page.tsx ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/app/auth/register/page.tsx 2>/dev/null

echo ""
echo "=== Other API routes with ecclesia ==="
grep -rn "ecclesia\|Ecclesia" /opt/ecclesia-app/app/api/digital-school/enrollments/ /opt/ecclesia-app/app/api/subscriptions/checkout/ /opt/ecclesia-app/app/api/superadmin/bootstrap/ /opt/ecclesia-app/app/api/superadmin/create/ /opt/ecclesia-app/app/api/surveys/ 2>/dev/null

echo ""
echo "=== Other dashboard pages with ecclesia ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/app/\(dashboard\)/settings/streaming-platforms/page.tsx /opt/ecclesia-app/app/\(dashboard\)/subscription/page.tsx 2>/dev/null

echo ""
echo "=== Service files with ecclesia ==="
grep -n "ecclesia\|Ecclesia" /opt/ecclesia-app/lib/services/certificate-service.ts /opt/ecclesia-app/lib/services/email-service.ts /opt/ecclesia-app/lib/services/flutterwave-service.ts /opt/ecclesia-app/lib/services/google-meet-service.ts /opt/ecclesia-app/lib/services/payment-service.ts /opt/ecclesia-app/lib/services/receipt-service.ts 2>/dev/null
