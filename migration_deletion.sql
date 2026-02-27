-- Enable deletion for posts (only owners)
create policy "Users can delete their own posts."
on public.posts
for delete
using (auth.uid() = author_id);

-- Enable deletion for stories (only owners)
create policy "Users can delete their own stories."
on public.stories
for delete
using (auth.uid() = author_id);
