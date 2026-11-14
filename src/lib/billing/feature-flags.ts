/**
 * Temporary launch mode: all authenticated active organisations can use
 * SHEiQpro without a subscription. Keep Dodo wiring for a future rollout.
 *
 * To restore paid subscriptions, change this to true only after the
 * checkout, webhook, Supabase migration and RLS enforcement are verified.
 */
export const BILLING_ENABLED = false;
