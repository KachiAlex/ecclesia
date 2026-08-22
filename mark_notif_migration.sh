#!/bin/bash
docker exec -i ecclesia-db psql -U ecclesia -d ecclesia << 'EOSQL'
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, started_at, applied_steps_count)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'placeholder_checksum',
    '20260821120000_add_notification_system',
    now(),
    now(),
    1
) ON CONFLICT DO NOTHING;
EOSQL
