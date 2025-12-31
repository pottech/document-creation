#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Keycloak database
    CREATE DATABASE keycloak;
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO $POSTGRES_USER;

    -- HAPI FHIR database
    CREATE DATABASE hapi;
    GRANT ALL PRIVILEGES ON DATABASE hapi TO $POSTGRES_USER;
EOSQL
