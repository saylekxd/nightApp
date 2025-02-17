/*
  # QR Code Acceptance Functions

  1. New Functions
    - `accept_visit`: Process visit QR code acceptance
    - `accept_reward`: Process reward QR code acceptance

  2. Changes
    - Add functions to handle both visit and reward QR code acceptance
    - Award points for visits
    - Mark rewards as used
    - Update user statistics
*/

-- Function to accept a visit QR code
CREATE OR REPLACE FUNCTION accept_visit(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_visit_id uuid;
BEGIN
  -- Get user ID from QR code and validate
  SELECT user_id INTO v_user_id
  FROM qr_codes
  WHERE code = p_code
    AND is_active = true
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired QR code';
  END IF;

  -- Create visit and award points
  SELECT id INTO v_visit_id FROM create_visit(v_user_id);

  -- Deactivate the QR code
  UPDATE qr_codes
  SET is_active = false
  WHERE code = p_code;
END;
$$;

-- Function to accept a reward redemption
CREATE OR REPLACE FUNCTION accept_reward(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redemption_id uuid;
BEGIN
  -- Get redemption and validate
  SELECT id INTO v_redemption_id
  FROM reward_redemptions
  WHERE code = p_code
    AND status = 'active'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired redemption code';
  END IF;

  -- Mark redemption as used
  UPDATE reward_redemptions
  SET 
    status = 'used',
    used_at = now()
  WHERE id = v_redemption_id;
END;
$$;