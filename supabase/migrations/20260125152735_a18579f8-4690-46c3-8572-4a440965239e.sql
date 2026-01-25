-- Drop the unique constraint on name to allow same names for subcategories
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;