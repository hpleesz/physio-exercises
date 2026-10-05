-- Links drawings in the public "drawings" storage bucket (001.jpg, 002.jpg ...).
-- Replace YOUR-PROJECT and change the number range to the drawings you uploaded.
update exercises
set image_url = 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/drawings/'
                || lpad(number::text, 4, '0') || '.jpg'
where number between 1 and 12;
