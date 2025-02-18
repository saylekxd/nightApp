import { supabase } from './supabase';

interface User {
  id: string;
  full_name: string;
  points: number;
}

interface Reward {
  id: string;
  title: string;
  points_required: number;
}

interface VisitQRData {
  type: 'visit';
  user: User;
  code: string;
}

interface RewardQRData {
  type: 'reward';
  user: User;
  reward: Reward;
  code: string;
  expires_at: string;
}

export interface QRValidationResult {
  valid: boolean;
  data?: VisitQRData | RewardQRData;
  error?: string;
}

export interface AdminStats {
  visits_count: number;
  rewards_used: number;
  points_awarded: number;
  capacity_percentage: number;
}

export async function checkAdminStatus(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;
  return data.is_admin || false;
}

export async function validateQRCode(code: string, activity_name: string): Promise<QRValidationResult> {
  try {
    // Check admin status first
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { data, error } = await supabase
      .rpc('validate_qr_code', { 
        p_code: code,
        p_activity_name: activity_name 
      });

    if (error) throw error;
    return data as QRValidationResult;
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate QR code',
    };
  }
}

export async function acceptVisit(code: string, activity_name: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('accept_visit', { 
        p_code: code,
        p_activity_name: activity_name 
      });

    if (error) throw error;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to accept visit');
  }
}

export async function acceptReward(code: string) {
  // Check admin status first
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { error } = await supabase
    .rpc('accept_reward', { p_code: code });

  if (error) throw error;
}

export async function getAdminStats(): Promise<AdminStats> {
  // Check admin status first
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { data, error } = await supabase
    .rpc('get_admin_stats', {
      p_date: new Date().toISOString(),
    });

  if (error) throw error;
  return data as AdminStats;
}