-- Initialize databases for each microservice
CREATE DATABASE identity_db;
CREATE DATABASE chef_profile_db;
CREATE DATABASE catalog_db;
CREATE DATABASE media_db;
CREATE DATABASE review_db;
CREATE DATABASE badge_db;
CREATE DATABASE analytics_db;
CREATE DATABASE notification_db;

-- Enable PostGIS on chef_profile_db
\c chef_profile_db;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable TimescaleDB on analytics_db (if using TimescaleDB image)
-- \c analytics_db;
-- CREATE EXTENSION IF NOT EXISTS timescaledb;
