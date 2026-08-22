#!/bin/bash
# Check which service files import from firestore vs prisma
echo "=== Services importing from Firestore ==="
grep -rl "from '@/lib/firestore'" /opt/ecclesia-app/lib/services/ 2>/dev/null | sort

echo ""
echo "=== Services importing from Prisma ==="
grep -rl "from '@/lib/prisma'" /opt/ecclesia-app/lib/services/ 2>/dev/null | sort

echo ""
echo "=== Services importing both ==="
comm -12 <(grep -rl "from '@/lib/firestore'" /opt/ecclesia-app/lib/services/ 2>/dev/null | sort) <(grep -rl "from '@/lib/prisma'" /opt/ecclesia-app/lib/services/ 2>/dev/null | sort)

echo ""
echo "=== API routes importing from Firestore (will fail without Firebase) ==="
grep -rl "from '@/lib/firestore'" /opt/ecclesia-app/app/api/ 2>/dev/null | wc -l
echo "files"

echo ""
echo "=== API routes importing from Prisma (will work on VPS) ==="
grep -rl "from '@/lib/prisma'" /opt/ecclesia-app/app/api/ 2>/dev/null | wc -l
echo "files"

echo ""
echo "=== API routes importing Firestore-based services ==="
grep -rl "from '@/lib/services/" /opt/ecclesia-app/app/api/ 2>/dev/null | wc -l
echo "files total using services"

echo ""
echo "=== Remaining 'ecclesia' references (case-insensitive) ==="
grep -ri "ecclesia" /opt/ecclesia-app/lib/ /opt/ecclesia-app/app/ /opt/ecclesia-app/components/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | grep -v node_modules | sort

echo ""
echo "=== Docker compose on VPS ==="
cat /opt/ecclesia-app/docker-compose.yml | head -5
