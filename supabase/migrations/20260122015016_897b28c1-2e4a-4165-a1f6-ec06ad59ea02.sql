-- Create background_templates table for database-driven background management
CREATE TABLE public.background_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  thumbnail_url text,
  interior_backgrounds text[] DEFAULT '{}'::text[],
  unlock_code text,
  is_custom boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.background_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active background templates
CREATE POLICY "Anyone can view active background templates"
  ON public.background_templates
  FOR SELECT
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_background_templates_updated_at
  BEFORE UPDATE ON public.background_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all existing backgrounds
INSERT INTO public.background_templates (template_id, name, description, image_url, thumbnail_url, interior_backgrounds, unlock_code, is_custom, display_order) VALUES
('showroom', 'Showroom', 'En modern bilhall med naturligt ljus', '/backgrounds/studio-background.jpg', '/backgrounds/thumbnails/studio-background-thumb.jpg', ARRAY['/backgrounds/studio-background.jpg'], NULL, false, 1),
('luxury-studio', 'Luxury Studio', 'Elegant studio med mjukt ljus och neutrala toner', '/templates/luxury-studio.jpg', '/templates/luxury-studio.jpg', ARRAY['/templates/luxury-studio.jpg'], NULL, false, 2),
('dark-studio', 'Dark Studio', 'Mörk studio med dramatisk belysning', '/backgrounds/dark-studio.jpg', '/backgrounds/thumbnails/dark-studio-thumb.jpg', ARRAY['/backgrounds/dark-studio.jpg'], NULL, false, 3),
('gallery', 'Gallery', 'Ljus gallerilokal med vita väggar', '/backgrounds/gallery.jpg', '/backgrounds/thumbnails/gallery-thumb.jpg', ARRAY['/backgrounds/gallery.jpg'], NULL, false, 4),
('curved-studio', 'Curved Studio', 'Modern studio med böjda väggar', '/backgrounds/curved-studio.jpg', '/backgrounds/thumbnails/curved-studio-thumb.jpg', ARRAY['/backgrounds/curved-studio.jpg'], NULL, false, 5),
('ceiling-lights', 'Ceiling Lights', 'Studio med takbelysning', '/backgrounds/ceiling-lights.jpg', '/backgrounds/thumbnails/ceiling-lights-thumb.jpg', ARRAY['/backgrounds/ceiling-lights.jpg'], NULL, false, 6),
('panel-wall', 'Panel Wall', 'Studio med panelvägg', '/backgrounds/panel-wall.jpg', '/backgrounds/thumbnails/panel-wall-thumb.jpg', ARRAY['/backgrounds/panel-wall.jpg'], NULL, false, 7),
('dark-walls-light-floor', 'Dark Walls Light Floor', 'Mörka väggar med ljust golv', '/backgrounds/dark-walls-light-floor.jpg', '/backgrounds/thumbnails/dark-walls-light-floor-thumb.jpg', ARRAY['/backgrounds/dark-walls-light-floor.jpg'], NULL, false, 8),
('concrete-showroom', 'Betong Showroom', 'Industriell betongstudio med rå känsla', '/backgrounds/concrete-showroom.jpg', '/backgrounds/thumbnails/concrete-showroom-thumb.jpg', ARRAY['/backgrounds/concrete-showroom.jpg'], '=DDkyZYm', false, 9),
('spotlight-studio', 'Spotlight Studio', 'Vit vägg med spotlights och polerat golv', '/backgrounds/spotlight-studio.jpg', '/backgrounds/thumbnails/spotlight-studio-thumb.jpg', ARRAY['/backgrounds/spotlight-studio.jpg'], '2P6058', false, 10),
('custom-studio', 'Custom Studio', 'Skapa din egen unika studiomiljö med AI', NULL, NULL, ARRAY[]::text[], NULL, true, 99);