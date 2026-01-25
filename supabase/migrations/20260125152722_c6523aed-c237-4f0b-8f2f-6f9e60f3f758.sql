-- Step 1: Add parent_id column for subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;