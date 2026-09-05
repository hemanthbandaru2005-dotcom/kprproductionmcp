-- ═══════════════════════════════════════════════════════════════════
-- KPR Productions — Admin Management, Username Auth & Temp Passwords
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════
-- 2. UPDATE profiles TABLE
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS temp_password TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create index on username for ultra-fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ═══════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS) POLICIES ON profiles
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing overlapping policies if any
DROP POLICY IF EXISTS "Public profiles read policy" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin full access to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage worker and client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- 1. Authenticated users can view their own profile
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Superadmin has full access to ALL profiles (can read, insert, update, delete admins & users)
CREATE POLICY "Superadmin full access to all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 3. Regular admin can view and manage worker/staff/client profiles (CANNOT touch admin/superadmin profiles)
CREATE POLICY "Admin manage worker and client profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND (role IN ('worker', 'staff', 'client') OR id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND (role IN ('worker', 'staff', 'client') OR id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════
-- 4. MASTER ADMIN RPC: CREATE ADMIN ACCOUNT
-- Only callable by superadmin. Creates Auth User and Profile.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_admin_account(
  p_full_name TEXT,
  p_username TEXT,
  p_temp_password TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_clean_username TEXT;
  v_placeholder_email TEXT;
  v_new_user_id UUID;
  v_encrypted TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify caller is superadmin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only Master Admin can create admins');
  END IF;

  -- Clean and validate inputs
  v_clean_username := lower(trim(p_username));
  IF v_clean_username IS NULL OR length(v_clean_username) < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username must be at least 3 characters');
  END IF;

  IF p_temp_password IS NULL OR length(trim(p_temp_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Temporary password must be at least 6 characters');
  END IF;

  -- Check if username already exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = v_clean_username) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username already taken. Please choose another.');
  END IF;

  v_placeholder_email := v_clean_username || '@internal.kprproduction.local';

  -- Check if auth user already exists with this internal email
  SELECT id INTO v_new_user_id FROM auth.users WHERE email = v_placeholder_email;

  IF v_new_user_id IS NULL THEN
    v_new_user_id := gen_random_uuid();
    v_encrypted := crypt(trim(p_temp_password), gen_salt('bf'));

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role
    ) VALUES (
      v_new_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_placeholder_email,
      v_encrypted,
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', trim(p_full_name), 'username', v_clean_username),
      now(),
      now(),
      'authenticated'
    );
  ELSE
    -- User exists, update password
    v_encrypted := crypt(trim(p_temp_password), gen_salt('bf'));
    UPDATE auth.users
    SET encrypted_password = v_encrypted,
        raw_user_meta_data = jsonb_build_object('full_name', trim(p_full_name), 'username', v_clean_username),
        updated_at = now()
    WHERE id = v_new_user_id;
  END IF;

  -- Insert/Upsert into profiles
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    role,
    temp_password,
    is_temp_password,
    first_login_at,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_new_user_id,
    v_placeholder_email,
    v_clean_username,
    trim(p_full_name),
    COALESCE(p_role, 'admin'),
    trim(p_temp_password),
    TRUE,
    NULL,
    'active',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET username = v_clean_username,
      full_name = trim(p_full_name),
      role = COALESCE(p_role, 'admin'),
      temp_password = trim(p_temp_password),
      is_temp_password = TRUE,
      first_login_at = NULL,
      status = 'active',
      updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_new_user_id::text,
    'username', v_clean_username,
    'full_name', trim(p_full_name),
    'temp_password', trim(p_temp_password),
    'role', COALESCE(p_role, 'admin')
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 5. RPC: LOOKUP INTERNAL EMAIL BY USERNAME
-- Used by the login flow to resolve username -> internal email
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lookup_internal_email_by_username(
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_clean_username TEXT;
  v_profile RECORD;
BEGIN
  v_clean_username := lower(trim(p_username));
  IF v_clean_username IS NULL OR v_clean_username = '' THEN
    RETURN jsonb_build_object('found', false, 'error', 'Invalid username');
  END IF;

  SELECT id, email, username, full_name, role, status INTO v_profile
  FROM public.profiles
  WHERE lower(username) = v_clean_username
     OR lower(email) = v_clean_username
     OR lower(email) = v_clean_username || '@internal.kprproduction.local'
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'email', v_clean_username || '@internal.kprproduction.local',
      'username', v_clean_username
    );
  END IF;

  IF v_profile.status = 'inactive' OR v_profile.status = 'disabled' THEN
    RETURN jsonb_build_object(
      'found', true,
      'disabled', true,
      'error', 'This account has been deactivated. Contact Master Admin.'
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'email', COALESCE(v_profile.email, v_clean_username || '@internal.kprproduction.local'),
    'username', v_profile.username,
    'role', v_profile.role,
    'status', v_profile.status
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 6. RPC: CLEAR TEMP PASSWORD ON LOGIN
-- Clears temp_password permanently once the user logs in
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.clear_temp_password_on_login(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE public.profiles
  SET temp_password = NULL,
      is_temp_password = FALSE,
      first_login_at = COALESCE(first_login_at, now()),
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 7. RPC: TOGGLE ADMIN STATUS (ACTIVE / INACTIVE)
-- Only superadmin can toggle admin status
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.toggle_admin_status(
  p_target_id UUID,
  p_status TEXT
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
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only Master Admin can manage admin status');
  END IF;

  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_id;
  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target admin not found');
  END IF;

  IF p_status NOT IN ('active', 'inactive', 'disabled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status value');
  END IF;

  UPDATE public.profiles
  SET status = p_status,
      updated_at = now()
  WHERE id = p_target_id;

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 8. RPC: ADMIN RESET ACCOUNT TEMP PASSWORD (ANYTIME)
-- Role-based visibility and reset scope:
-- Superadmin: can reset Admin, Employee, and Client accounts.
-- Admin: can ONLY reset Employee (worker/staff) accounts.
-- Sets temp_password, is_temp_password = true, first_login_at = null
-- Updates auth.users password server-side.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_reset_account_temp_password(
  p_target_id UUID,
  p_new_temp_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_target_email TEXT;
  v_encrypted TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only Admins can reset passwords');
  END IF;

  SELECT role, email INTO v_target_role, v_target_email FROM public.profiles WHERE id = p_target_id;
  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target account not found');
  END IF;

  -- Enforce scope: Standard Admin can ONLY manage worker/staff accounts
  IF v_caller_role = 'admin' AND v_target_role NOT IN ('worker', 'staff') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin can only reset Employee passwords. Client and Admin resets require Master Admin.');
  END IF;

  IF p_new_temp_password IS NULL OR length(trim(p_new_temp_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Temporary password must be at least 6 characters');
  END IF;

  -- 1. Update Auth user password
  v_encrypted := crypt(trim(p_new_temp_password), gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_encrypted,
      updated_at = now()
  WHERE id = p_target_id;

  -- 2. Update Profile with new temporary password & reset first_login_at
  UPDATE public.profiles
  SET temp_password = trim(p_new_temp_password),
      is_temp_password = TRUE,
      first_login_at = NULL,
      updated_at = now()
  WHERE id = p_target_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_target_id::text,
    'temp_password', trim(p_new_temp_password),
    'role', v_target_role
  );
END;
$$;
