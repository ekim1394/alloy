-- Create sources bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do update set public = false;

-- Policy: Allow authenticated uploads to sources
create policy "Allow authenticated uploads to sources"
on storage.objects for insert
to authenticated
with check (bucket_id = 'sources');

-- Policy: Allow authenticated downloads from sources
create policy "Allow authenticated downloads from sources"
on storage.objects for select
to authenticated
using (bucket_id = 'sources');

-- Note: No update/delete policies for now (immutable sources/cleanup by service role)
