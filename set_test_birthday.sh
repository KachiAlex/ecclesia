#!/bin/bash
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia << 'EOSQL'
-- Get the existing user details
SELECT id, "firstName", "lastName", email, role, "churchId", "dateOfBirth" FROM public."User" LIMIT 5;

-- Set a birthday for the existing user (set to a date coming up soon - Aug 25, 1990)
UPDATE public."User"
SET "dateOfBirth" = '1990-08-25'
WHERE "dateOfBirth" IS NULL
RETURNING id, "firstName", "lastName", "dateOfBirth";
EOSQL
