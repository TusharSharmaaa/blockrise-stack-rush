-- Profiles policies
create policy if not exists "Profiles are readable publicly"
on public.profiles
for select
using (true);

create policy if not exists "Users can insert their profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update their profile"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Leaderboard policies
create policy if not exists "Leaderboard is readable publicly"
on public.leaderboard
for select
using (true);

create policy if not exists "Users can insert their own scores"
on public.leaderboard
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = leaderboard.profile_id
      and p.user_id = auth.uid()
  )
);

create policy if not exists "Users can delete their scores"
on public.leaderboard
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = leaderboard.profile_id
      and p.user_id = auth.uid()
  )
);
