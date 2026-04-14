alter table public.routes
add column if not exists path jsonb;
