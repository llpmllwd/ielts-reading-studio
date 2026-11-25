# IELTS Reading Studio

Student practice website: https://llpmllwd.github.io/ielts-reading-studio/

- `index.html`: Full IELTS Academic Reading mock exam (40 questions, no timer).
- `reading-tests-16-17.html`: Two full untimed IELTS-style reading papers sourced from the teacher-uploaded Reading Test 16 and Test 17 PDFs (3 long passages and 40 questions each). Students can save responses, self-check, export CSV, and submit via the existing Supabase integration.
- `practice.html`: 6 types of reading practice, 6 passages, 48 questions, no timer.
- `teacher.html`: Teacher Dashboard (secure login once Supabase is set up).
- `submission.js`: Student “Submit to Teacher” feature (only active once database is connected).
- `submission-config.js`: Public configuration (Supabase project URL and **anon/publishable key only**).
- `supabase-setup.sql`: Private submissions database and teacher access policies.

## Enable automatic student submissions

**At present the GitHub Pages site is static. The Send to Teacher button stays disabled until a Supabase database is set up and configured. This prevents false "sent" confirmations.**

1. Create or connect a Supabase project at https://supabase.com/. Choose a region and keep your database password private.
2. In the Supabase SQL Editor, paste the full contents of [supabase-setup.sql](./supabase-setup.sql) and run it. The script creates `reading_submissions`, `reading_teachers`, and row-level security.
3. From Supabase **Project Settings → API** copy the **Project URL** and **anon/public publishable key**. NEVER copy your service-role or secret key into the website.
4. In GitHub, edit [submission-config.js](./submission-config.js) to enter your project URL and public key in place of the placeholders. Commit the change.
5. In Supabase **Authentication → URL Configuration**, add this URL as an allowed Redirect URL: `https://llpmllwd.github.io/ielts-reading-studio/teacher.html`.
6. Open [teacher.html](https://llpmllwd.github.io/ielts-reading-studio/teacher.html), enter your email, and sign in using the emailed link. You may initially see the “not approved” message.
7. In the Supabase SQL Editor, approve your teacher account (replace with your actual login email):
   ```sql
   insert into public.reading_teachers(user_id)
   select id from auth.users where email = 'YOUR_TEACHER_EMAIL'
   on conflict do nothing;
   ```
8. Refresh the Teacher Dashboard. Test the system by submitting an answer from the student practice page and checking that it appears in the dashboard. Students do **not** need a Supabase or GitHub account.

### Important security and grading notes

- Anonymous students have **INSERT-only** access to submissions. They cannot read other students' answers. Teacher data access is protected by Supabase authentication and row-level security.
- Scores are labelled **self-reported** because existing static pages compute them in the browser. The teacher should verify them; they are not tamper-proof exam results.
- The static practice and mock test files contain correct answers for self-study. For a controlled exam, move the answer key and grading to a private server.
- A public student submission endpoint can be spammed. Add rate limiting, CAPTCHA or signed exercise links before high-volume use.
- Before enabling student use, test with a dummy submission. Do not promise private data collection until working.

## GitHub Pages setup

Repository **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
