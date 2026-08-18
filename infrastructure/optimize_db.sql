-- SEEDHA PROPERTIES: Database Optimization & Performance Indexing for 10K+ Concurrent Users
-- Run in Supabase SQL Editor / PostgreSQL

-- 1. Enable query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. Frequently filtered and queried property indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- 3. Composite indexes for high-volume searches
CREATE INDEX IF NOT EXISTS idx_properties_city_type_price 
ON properties(city, listing_type, price) 
WHERE status = 'available';

-- 4. User roles and auth lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 5. Leads & Inquiries indexes
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON property_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON property_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON property_leads(created_at DESC);

-- 6. Table statistics update for query planner
ANALYZE properties;
ANALYZE user_roles;
ANALYZE property_leads;
ANALYZE profiles;
