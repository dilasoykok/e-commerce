#!/bin/sh
# Keycloak için ayrı bir kullanıcı ve veritabanı oluşturur.
# Yalnızca postgres-data volume'u ilk kez oluşturulurken çalışır.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER "${KEYCLOAK_DB_USER}" WITH PASSWORD '${KEYCLOAK_DB_PASSWORD}';
  CREATE DATABASE "${KEYCLOAK_DB_NAME}" OWNER "${KEYCLOAK_DB_USER}";
EOSQL
