-- 20260817140000_add_housing_fields.sql

ALTER TABLE public.properties
ADD COLUMN project_name text,
ADD COLUMN bhk_type text,
ADD COLUMN area_unit text DEFAULT 'Sq.ft';
