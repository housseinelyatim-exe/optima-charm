-- Create instagram_posts table
CREATE TABLE public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Instagram posts are publicly readable"
  ON public.instagram_posts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert instagram posts"
  ON public.instagram_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update instagram posts"
  ON public.instagram_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete instagram posts"
  ON public.instagram_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Insert default posts
INSERT INTO public.instagram_posts (image_url, alt_text, display_order) VALUES
  ('https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop', 'Lunettes de soleil tendance', 1),
  ('https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop', 'Collection été', 2),
  ('https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop', 'Lunettes optiques', 3),
  ('https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop', 'Style urbain', 4),
  ('https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop', 'Accessoires mode', 5),
  ('https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=400&fit=crop', 'Nouveautés boutique', 6);