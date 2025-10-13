import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import Stripe from 'stripe';
import { env } from '~/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Define your prices on the server. This is the source of truth.
const priceMap = {
  basic: { upfront: 75, final: 75 },
  standard: { upfront: 200, final: 200 },
  addons: { revision: 30, page: 30 },
};

// Define product names for clarity
const serviceNames = {
  basic: 'Basic',
  standard: 'Standard',
};
const paymentNames = {
  upfront: 'Upfront',
  final: 'Final',
  revision: 'Revision',
  page: 'Page',
};

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        serviceId: z.enum(['basic', 'standard']),
        paymentType: z.enum(['upfront', 'final', 'revision', 'page']),
        quantity: z.number().int().min(1).optional().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, paymentType, quantity } = input;
      const baseUrl = env.AUTH_URL;

      let unit_amount: number;
      let name: string;
      let description: string;

      // --- SERVER-SIDE PRICE CALCULATION ---
      const serviceName = serviceNames[serviceId];
      const paymentName = paymentNames[paymentType];

      if (paymentType === 'upfront' || paymentType === 'final') {
        unit_amount = priceMap[serviceId][paymentType] * 100; // Price in cents
        name = `${serviceName} Package: ${paymentName} Payment`;
        // description = `50% ${paymentType} payment for the ${serviceName} package.`;
      } else {
        // 'revision' or 'page'
        unit_amount = priceMap.addons[paymentType] * 100;
        name = `${serviceName} Package: Additional ${paymentName} x${quantity}`;
        // description = `Payment for ${quantity} additional ${paymentType}(s).`;
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name, // Dynamically generated name
                  // description, // Dynamic description
                },
                unit_amount, // Securely calculated on the server
              },
              quantity: quantity,
            },
          ],
          // --- ADD METADATA FOR YOUR RECORDS ---
          metadata: {
            serviceId,
            paymentType,
            quantity: quantity.toString(),
          },
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
        });

        if (!session.url) {
          throw new Error('Could not create Stripe checkout session');
        }
        return { url: session.url };
      } catch (error) {
        console.error('STRIPE ERROR:', error);
        throw new Error('Failed to create Stripe checkout session');
      }
    }),
});
