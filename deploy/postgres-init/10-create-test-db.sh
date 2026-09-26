#!/bin/bash
# Só em desenvolvimento (montado pelo docker-compose.yml): cria o banco dos
# testes automatizados. Roda apenas quando o volume do postgres nasce.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE teia_test;
EOSQL
