'use client';

import React, { useState } from 'react';
import { api } from '~/trpc/react';
// import { CgSpinner } from 'react-icons/cg'; // A nice loading spinner
import router from 'next/router';

// Define the types for the props
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: 'basic' | 'standard';
  serviceName: string;
}

export default function Popup({
  isOpen,
  onClose,
  serviceId,
  serviceName,
}: PaymentModalProps) {
  // State to hold the quantity for additional pages/revisions
  const [quantity, setQuantity] = useState(1);

  const { mutate: createCheckoutSession, isPending } =
    api.stripe.createCheckoutSession.useMutation({
      onSuccess: (data) => {
        // Redirect the user to the Stripe Checkout page
        if (data.url) {
          router.push(data.url);
        }
      },
      onError: (error) => {
        // On error, log it and maybe show a toast notification to the user
        console.error('Failed to create checkout session:', error.message);
        alert('Error: Could not initiate payment. Please try again.');
      },
    });

  // A single handler function to initiate payment
  const handlePay = (
    paymentType: 'upfront' | 'final' | 'revision' | 'page',
    qty: number
  ) => {
    // Prevent multiple clicks while loading
    if (isPending) return;

    createCheckoutSession({
      serviceId,
      paymentType,
      quantity: qty,
    });
  };

  // If the modal isn't open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    // Modal Overlay: covers the whole screen
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal Content: stopPropagation prevents clicks inside from closing the modal */}
      <div
        className="relative flex w-full max-w-md flex-col gap-4 rounded-lg bg-gray-800 p-6 text-gray-300 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">
            Choose Payment Option
          </span>
          <span className="text-sm text-gray-400">For: {serviceName}</span>
        </div>

        {/* Payment Options */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Upfront Payment */}
          <button
            onClick={() => handlePay('upfront', 1)}
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            Pay 50% Upfront
          </button>

          {/* Option 2: Final Payment */}
          <button
            onClick={() => handlePay('final', 1)}
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            Pay 50% on Delivery (Final)
          </button>
        </div>

        <hr className="border-gray-600" />

        {/* Option 3: Additional Items */}
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-white">
            Purchase Additional Items
          </span>
          <div className="flex items-center gap-3">
            <label htmlFor="quantity" className="text-sm">
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-md border-gray-600 bg-gray-700 p-2 text-center text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handlePay('page', quantity)}
              disabled={isPending}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Pay for Pages
            </button>
            <button
              onClick={() => handlePay('revision', quantity)}
              disabled={isPending}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Pay for Revisions
            </button>
          </div>
        </div>

        {isPending && (
          <div className="text-center text-sm text-gray-400">
            Redirecting to Stripe...
          </div>
        )}
      </div>
    </div>
  );
}
