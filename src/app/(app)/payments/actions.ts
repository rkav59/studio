'use server';

import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const USER_PROFILES_COLLECTION = 'userProfiles';

export async function createCheckoutSession() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const userProfileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
  const userProfileSnap = await getDoc(userProfileRef);

  if (!userProfileSnap.exists()) {
    throw new Error('User profile not found');
  }

  let customerId = userProfileSnap.data()?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.displayName || undefined,
      metadata: {
        firebaseUID: user.uid,
      },
    });
    customerId = customer.id;
    await updateDoc(userProfileRef, { stripeCustomerId: customerId });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    throw new Error('Stripe Pro Price ID not configured.');
  }

  const origin = headers().get('origin') || process.env.NEXT_PUBLIC_URL;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer: customerId,
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payments`,
  });

  if (!session.id) {
    throw new Error('Could not create Stripe Checkout session.');
  }

  return { sessionId: session.id };
}
