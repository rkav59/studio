
'use server';

import { Stripe } from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const USER_PROFILES_COLLECTION = 'userProfiles';

interface CreateCheckoutSessionArgs {
    userId: string;
    userEmail: string;
    priceId: string;
}

export async function createCheckoutSession(args: CreateCheckoutSessionArgs): Promise<{ sessionId: string }> {
  const { userId, userEmail, priceId } = args;

  if (!userId || !userEmail || !priceId) {
    throw new Error('User information and price ID are required.');
  }

  const userProfileRef = doc(db, USER_PROFILES_COLLECTION, userId);
  const userProfileSnap = await getDoc(userProfileRef);
  let userProfile = userProfileSnap.data() as UserProfile | undefined;
  
  let stripeCustomerId = userProfile?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { firebaseUID: userId },
    });
    stripeCustomerId = customer.id;
    // Since profile might not exist, use setDoc with merge to create/update
    await setDoc(userProfileRef, { stripeCustomerId }, { merge: true });
  }
  
  const origin = headers().get('origin') || 'http://localhost:9002';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    customer: stripeCustomerId,
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payments`,
    metadata: {
        firebaseUID: userId,
        priceId: priceId,
    }
  });

  if (!session.id) {
    throw new Error('Failed to create Stripe checkout session.');
  }

  return { sessionId: session.id };
}
