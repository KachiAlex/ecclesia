#!/bin/bash
# Check specific ecclesia references
echo "=== ecclesia references in detail ==="
grep -rin "ecclesia" /opt/ecclesia-app/lib/church-context.ts /opt/ecclesia-app/lib/branding/constants.ts /opt/ecclesia-app/lib/email-templates.ts /opt/ecclesia-app/lib/qr-code.ts /opt/ecclesia-app/lib/ai/openai.ts /opt/ecclesia-app/app/layout.tsx /opt/ecclesia-app/app/page.tsx /opt/ecclesia-app/app/auth/login/page.tsx /opt/ecclesia-app/app/login/page.tsx /opt/ecclesia-app/app/login/\[slug\]/page.tsx 2>/dev/null | head -40

echo ""
echo "=== Docker compose mismatch (local vs VPS) ==="
echo "Local docker-compose.yml uses: pi-cms-db, picms, pi_cms_pgdata"
echo "VPS docker-compose.yml uses: ecclesia-db, ecclesia, ecclesia_pgdata"
echo ""
echo "VPS docker-compose:"
cat /opt/ecclesia-app/docker-compose.yml

echo ""
echo "=== Check if app container can reach DB ==="
docker exec pi-cms-app node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT count(*) as count FROM public.\"Church\"\`.then(r => {
  console.log('DB connection OK. Churches:', r[0].count);
  return p.\$disconnect();
}).catch(e => { console.error('DB ERROR:', e.message); p.\$disconnect(); });
"

echo ""
echo "=== Check Firebase env vars in container ==="
docker exec pi-cms-app node -e "
console.log('FIREBASE_SERVICE_ACCOUNT_BASE64:', process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'SET' : 'NOT SET');
console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
"
