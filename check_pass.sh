#!/bin/bash
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia << 'EOSQL'
-- Get user password hash to verify it exists
SELECT id, email, password, role FROM public."User" WHERE email = 'onyedika.akoma@gmail.com';
EOSQL
