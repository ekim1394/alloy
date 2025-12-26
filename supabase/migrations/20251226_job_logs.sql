-- Create bucket if not exists (handled by policies mostly, but good to be explicit)
insert into storage.buckets (id, name, public)
values ('logs', 'logs', false)
on conflict (id) do nothing;

-- Policy: Allow authenticated upload to logs bucket
create policy "Allow authenticated upload to logs"
on "storage"."objects"
as permissive
for insert
to public
using ((bucket_id = 'logs'::text));

-- Policy: Allow authenticated read access to logs bucket
create policy "Allow authenticated read access to logs"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'logs'::text));
