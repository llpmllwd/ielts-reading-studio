-- Run in your own Supabase project's SQL Editor.
-- Students may INSERT submissions but cannot SELECT or UPDATE them.
-- Only explicitly approved teacher accounts can read submissions.
-- IMPORTANT: Results sent by this starter are self-reported. Teachers must review
-- answers manually: client-side marking is not tamper-proof.

create table if not exists public.reading_teachers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.reading_teachers enable row level security;
revoke all on public.reading_teachers from anon, authenticated;
grant select on public.reading_teachers to authenticated;
drop policy if exists "teacher sees own approval" on public.reading_teachers;
create policy "teacher sees own approval" on public.reading_teachers
  for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.reading_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_name text not null check (char_length(trim(student_name)) between 1 and 100),
  exercise_id text not null check (char_length(exercise_id) between 1 and 80),
  exercise_title text not null check (char_length(exercise_title) between 1 and 180),
  question_type text not null check (char_length(question_type) between 1 and 80),
  answers jsonb not null check (jsonb_typeof(answers)='object' and pg_column_size(answers) < 16000),
  question_count integer not null check (question_count between 1 and 100),
  self_reported_score integer check (self_reported_score >= 0 and self_reported_score <= question_count)
);
alter table public.reading_submissions enable row level security;
revoke all on public.reading_submissions from anon, authenticated;
grant insert (student_name, exercise_id, exercise_title, question_type,
              answers, question_count, self_reported_score)
  on public.reading_submissions to anon, authenticated;
grant select on public.reading_submissions to authenticated;
drop policy if exists "students can submit only" on public.reading_submissions;
create policy "students can submit only" on public.reading_submissions
  for insert to anon, authenticated with check (true);
drop policy if exists "approved teachers read" on public.reading_submissions;
create policy "approved teachers read" on public.reading_submissions
  for select to authenticated using (
    exists (select 1 from public.reading_teachers t where t.user_id = (select auth.uid()))
  );

-- AFTER you sign in to teacher.html for the first time, run this SQL in
-- Supabase SQL Editor, replacing the example with YOUR own teacher email:
-- insert into public.reading_teachers(user_id)
-- select id from auth.users where email = 'YOUR_TEACHER_EMAIL'
-- on conflict do nothing;

-- Set Site URL and redirect URLs in Supabase Authentication URL Configuration:
-- https://llpmllwd.github.io/ielts-reading-studio/teacher.html
-- Add this exact URL to Redirect URLs to support email sign-in.
