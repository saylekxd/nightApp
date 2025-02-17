/*
  # Fix foreign key relationships

  1. Changes
    - Add missing foreign key constraints for qr_codes and reward_redemptions
    - Update validation queries to use proper foreign key names
    
  2. Security
    - Maintain existing RLS policies
*/

-- Fix qr_codes foreign key
ALTER TABLE qr_codes
DROP CONSTRAINT IF EXISTS qr_codes_user_id_fkey,
ADD CONSTRAINT qr_codes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Fix reward_redemptions foreign key
ALTER TABLE reward_redemptions
DROP CONSTRAINT IF EXISTS reward_redemptions_user_id_fkey,
ADD CONSTRAINT reward_redemptions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Update validateQRCode function to use correct join syntax
CREATE OR REPLACE FUNCTION validate_qr_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- First check visit QR code
  SELECT json_build_object(
    'valid', true,
    'data', json_build_object(
      'type', 'visit',
      'code', qr.code,
      'user', json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'points', p.points
      )
    )
  ) INTO v_result
  FROM qr_codes qr
  JOIN profiles p ON p.id = qr.user_id
  WHERE qr.code = p_code
    AND qr.is_active = true
    AND qr.expires_at > now();

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Then check reward redemption
  SELECT json_build_object(
    'valid', true,
    'data', json_build_object(
      'type', 'reward',
      'code', rr.code,
      'expires_at', rr.expires_at,
      'reward', json_build_object(
        'id', r.id,
        'title', r.title,
        'points_required', r.points_required
      ),
      'user', json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'points', p.points
      )
    )
  ) INTO v_result
  FROM reward_redemptions rr
  JOIN rewards r ON r.id = rr.reward_id
  JOIN profiles p ON p.id = rr.user_id
  WHERE rr.code = p_code
    AND rr.status = 'active'
    AND rr.expires_at > now();

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  RETURN json_build_object(
    'valid', false,
    'error', 'Invalid or expired QR code'
  );
END;
$$;