#!/bin/bash
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia << 'EOSQL'
-- Check users with dateOfBirth
SELECT id, "firstName", "lastName", email, "dateOfBirth", "churchId"
FROM public."User"
WHERE "dateOfBirth" IS NOT NULL
LIMIT 10;

-- Count total users with dateOfBirth
SELECT COUNT(*) as total_with_dob FROM public."User" WHERE "dateOfBirth" IS NOT NULL;

-- Count total users
SELECT COUNT(*) as total_users FROM public."User";

-- Check churches
SELECT id, name FROM public."Church" LIMIT 5;

-- Check Notification table exists
SELECT COUNT(*) as notification_count FROM public."Notification";

-- Check _prisma_migrations
SELECT migration_name, applied_steps_count FROM public."_prisma_migrations";
EOSQL
