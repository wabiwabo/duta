-- Creates a separate database for Logto within the same PostgreSQL instance
SELECT 'CREATE DATABASE logto OWNER duta'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'logto')\gexec
