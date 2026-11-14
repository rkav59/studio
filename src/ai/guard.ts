import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { verifiedClient } from '@/lib/supabase/server';
import { geminiConfigured } from './model-config';
import { validateAiInput } from './input-policy';

/** Every public AI action must enter here before calling a model. Fail closed. */
export async function runGuardedAi<T>(token: string, input: unknown, generate: () => Promise<T>): Promise<T> {
  const { client, user } = await verifiedClient(token);
  if (user.is_anonymous || !user.email_confirmed_at) throw new Error('Verify your email before using AI.');
  const { data: profile, error } = await client.from('profiles')
    .select('organization_id,active,role').eq('id', user.id).single();
  if (error || !profile?.active || !profile.organization_id || profile.role === 'visitor') {
    throw new Error('An active organisation membership with AI access is required.');
  }
  if (!geminiConfigured()) throw new Error('AI is not ready. Ask an administrator to complete the paid API setup.');
  validateAiInput(input);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: reservation, error: quotaError } = await admin.rpc('reserve_ai_request', {
    member_id: user.id, tenant_id: profile.organization_id,
  });
  if (quotaError) throw new Error('AI usage controls are unavailable. Please try again later.');
  if (reservation !== 'allowed') throw new Error(reservation === 'daily_limit'
    ? 'You have reached your daily AI limit. Please try again tomorrow (UTC).'
    : 'The monthly AI allowance has been reached. Contact your administrator.');
  // Do not refund failures: the provider may have processed a request despite a timeout.
  try { return await generate(); }
  catch { throw new Error('AI could not complete this draft. Please review your input and try again later.'); }
}
