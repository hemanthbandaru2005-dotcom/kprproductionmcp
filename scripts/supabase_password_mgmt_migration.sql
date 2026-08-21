-- ═══════════════════════════════════════════════════════════════════
-- KPR Productions — Password Management & Admin Recovery
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ensure pgcrypto extension is available (for hashing security answers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════
-- 2. CREATE security_questions TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.security_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_1 TEXT NOT NULL DEFAULT 'Type the code 1',
  answer_1_hash TEXT NOT NULL,
  question_2 TEXT NOT NULL DEFAULT 'Type the code 2',
  answer_2_hash TEXT NOT NULL,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own security questions
CREATE POLICY "Users can read own security questions"
  ON public.security_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security questions"
  ON public.security_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security questions"
  ON public.security_questions FOR UPDATE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. SAVE SECURITY QUESTIONS RPC
-- Called by Admin to set up their recovery security questions
-- Hashes answers server-side using pgcrypto bcrypt
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.save_security_questions(
  p_answer_1 TEXT,
  p_answer_2 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_hash_1 TEXT;
  v_hash_2 TEXT;
BEGIN
  -- Get the calling user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify the calling user is admin
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admin can set security questions');
  END IF;

  -- Validate inputs
  IF p_answer_1 IS NULL OR trim(p_answer_1) = '' OR p_answer_2 IS NULL OR trim(p_answer_2) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both answers are required');
  END IF;

  -- Hash the answers with bcrypt
  v_hash_1 := crypt(lower(trim(p_answer_1)), gen_salt('bf'));
  v_hash_2 := crypt(lower(trim(p_answer_2)), gen_salt('bf'));

  -- Upsert the security questions
  INSERT INTO public.security_questions (user_id, answer_1_hash, answer_2_hash, failed_attempts, locked_until, updated_at)
  VALUES (v_user_id, v_hash_1, v_hash_2, 0, NULL, now())
  ON CONFLICT (user_id) DO UPDATE
  SET answer_1_hash = v_hash_1,
      answer_2_hash = v_hash_2,
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. VERIFY SECURITY ANSWERS RPC
-- Called during Admin forgot-password flow (no auth required)
-- Rate-limited with failed_attempts + locked_until
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.verify_security_answers(
  p_email TEXT,
  p_answer_1 TEXT,
  p_answer_2 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_sq RECORD;
  v_valid_1 BOOLEAN;
  v_valid_2 BOOLEAN;
BEGIN
  -- Find admin user by email
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = lower(trim(p_email));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'locked', false, 'error', 'Verification failed');
  END IF;

  -- Verify the user is admin
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('valid', false, 'locked', false, 'error', 'Verification failed');
  END IF;

  -- Fetch security questions record
  SELECT * INTO v_sq FROM public.security_questions WHERE user_id = v_user_id;
  IF v_sq IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'locked', false, 'error', 'Security questions not configured');
  END IF;

  -- Check lockout (5 failed attempts = locked for 15 minutes)
  IF v_sq.failed_attempts >= 5 AND v_sq.locked_until IS NOT NULL AND v_sq.locked_until > now() THEN
    RETURN jsonb_build_object('valid', false, 'locked', true, 'error', 'Too many failed attempts. Try again later.');
  END IF;

  -- If lock expired, reset counter
  IF v_sq.locked_until IS NOT NULL AND v_sq.locked_until <= now() THEN
    UPDATE public.security_questions
    SET failed_attempts = 0, locked_until = NULL
    WHERE user_id = v_user_id;
  END IF;

  -- Verify answers
  v_valid_1 := (v_sq.answer_1_hash = crypt(lower(trim(p_answer_1)), v_sq.answer_1_hash));
  v_valid_2 := (v_sq.answer_2_hash = crypt(lower(trim(p_answer_2)), v_sq.answer_2_hash));

  IF v_valid_1 AND v_valid_2 THEN
    -- Reset failed attempts on success
    UPDATE public.security_questions
    SET failed_attempts = 0, locked_until = NULL
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object('valid', true, 'locked', false, 'user_id', v_user_id::text);
  ELSE
    -- Increment failed attempts
    UPDATE public.security_questions
    SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
        locked_until = CASE
          WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN now() + interval '15 minutes'
          ELSE locked_until
        END
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object('valid', false, 'locked', false, 'error', 'Verification failed');
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 5. ADMIN RESET USER PASSWORD RPC
-- Called by Admin to reset Staff/Worker/Client passwords
-- Uses SECURITY DEFINER to access auth.users table
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_target_user_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_encrypted TEXT;
BEGIN
  -- Get caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify caller is admin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can reset passwords');
  END IF;

  -- Verify target user exists
  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user_id;
  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user not found');
  END IF;

  -- Validate password
  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters');
  END IF;

  -- Hash and update the password in auth.users
  v_encrypted := crypt(trim(p_new_password), gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_encrypted,
      updated_at = now()
  WHERE id = p_target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 6. ADMIN RECOVERY PASSWORD RESET (via security questions)
-- Called after verify_security_answers succeeds
-- Does NOT require auth — re-verifies answers atomically
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_recovery_reset_password(
  p_email TEXT,
  p_answer_1 TEXT,
  p_answer_2 TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_sq RECORD;
  v_valid_1 BOOLEAN;
  v_valid_2 BOOLEAN;
  v_encrypted TEXT;
BEGIN
  -- Find admin user by email
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = lower(trim(p_email));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification failed');
  END IF;

  -- Verify the user is admin
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification failed');
  END IF;

  -- Fetch security questions
  SELECT * INTO v_sq FROM public.security_questions WHERE user_id = v_user_id;
  IF v_sq IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Security questions not configured');
  END IF;

  -- Check lockout
  IF v_sq.failed_attempts >= 5 AND v_sq.locked_until IS NOT NULL AND v_sq.locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too many failed attempts. Try again later.');
  END IF;

  -- Re-verify answers (atomic check)
  v_valid_1 := (v_sq.answer_1_hash = crypt(lower(trim(p_answer_1)), v_sq.answer_1_hash));
  v_valid_2 := (v_sq.answer_2_hash = crypt(lower(trim(p_answer_2)), v_sq.answer_2_hash));

  IF NOT (v_valid_1 AND v_valid_2) THEN
    UPDATE public.security_questions
    SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
        locked_until = CASE
          WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN now() + interval '15 minutes'
          ELSE locked_until
        END
    WHERE user_id = v_user_id;
    RETURN jsonb_build_object('success', false, 'error', 'Verification failed');
  END IF;

  -- Validate new password
  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters');
  END IF;

  -- Hash and update password
  v_encrypted := crypt(trim(p_new_password), gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_encrypted,
      updated_at = now()
  WHERE id = v_user_id;

  -- Reset failed attempts
  UPDATE public.security_questions
  SET failed_attempts = 0, locked_until = NULL
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 7. CHECK IF ADMIN HAS SECURITY QUESTIONS SET UP
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.check_admin_security_setup(
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_has_sq BOOLEAN;
BEGIN
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = lower(trim(p_email));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('has_security_questions', false);
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role != 'admin' THEN
    RETURN jsonb_build_object('has_security_questions', false);
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.security_questions WHERE user_id = v_user_id) INTO v_has_sq;
  RETURN jsonb_build_object('has_security_questions', v_has_sq);
END;
$$;
