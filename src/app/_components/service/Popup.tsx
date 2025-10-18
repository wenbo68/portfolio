'use client';

import React, { useState } from 'react';
import { api } from '~/trpc/react';
import { useRouter } from 'next/navigation';
import { Dropdown } from '../Dropdown';
// import { Dropdown } from '~/components/Dropdown'; // Assuming Dropdown is in this path

// Define the shape of our payment options for the dropdown
const paymentOptions = [
  { value: 'upfront', label: '50% Upfront' },
  { value: 'final', label: '50% Final' },
  { value: 'page', label: 'Additional Pages' },
  { value: 'revision', label: 'Additional Revisions' },
];

// Define the type for our paymentType state for better type safety
type PaymentType = 'upfront' | 'final' | 'page' | 'revision';

// Define the types for the props
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: PackageType;
  serviceName: string;
}

export default function Popup({
  isOpen,
  onClose,
  serviceId,
  serviceName,
}: PaymentModalProps) {
  const router = useRouter();

  // State for the selected dropdown option. Initialized to '' for no selection.
  const [paymentType, setPaymentType] = useState<PaymentType | ''>('');
  // State for the quantity, only used for pages/revisions
  const [quantity, setQuantity] = useState(0);

  const { mutate: createCheckoutSession, isPending } =
    api.stripe.createCheckoutSession.useMutation({
      onSuccess: (data) => {
        if (data.url) {
          router.push(data.url);
        }
      },
      onError: (error) => {
        console.error('Failed to create checkout session:', error.message);
        alert('Error: Could not initiate payment. Please try again.');
      },
    });

  // Simplified handler function that reads from state
  const handlePay = () => {
    // Guard against clicks when no option is selected or already processing
    if (!paymentType || isPending) return;

    createCheckoutSession({
      serviceId,
      paymentType,
      // Use quantity from state for addons, default to 1 for milestones
      quantity:
        paymentType === 'page' || paymentType === 'revision' ? quantity : 1,
    });
  };

  // If the modal isn't open, render nothing
  if (!isOpen) {
    return null;
  }

  const showQuantityInput =
    paymentType === 'page' || paymentType === 'revision';

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="flex w-full max-w-[90vw] sm:max-w-md flex-col gap-5 rounded bg-gray-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-300">{serviceName}</span>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-400 min-w-16">
              Payment:
            </label>
            <Dropdown
              options={paymentOptions}
              value={paymentType}
              onChange={(newValue) => setPaymentType(newValue as PaymentType)}
              className="w-full"
            />
          </div>

          {/* Conditionally render the quantity input */}
          {showQuantityInput && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="quantity"
                className="text-sm font-semibold text-gray-400 min-w-16"
              >
                Quantity:
              </label>
              <input
                type="number"
                id="quantity"
                // min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                className="text-sm w-full rounded bg-gray-800 px-3 py-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          )}
        </div>

        {/* <hr className="border-gray-700" /> */}

        {/* Single Pay Button */}
        <button
          onClick={handlePay}
          disabled={!paymentType || isPending}
          className="w-full rounded-md bg-blue-600/50 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-blue-500/50 disabled:cursor-not-allowed disabled:bg-blue-600/50 cursor-pointer"
        >
          {isPending ? 'Processing...' : 'Pay via Stripe'}
        </button>
      </div>
    </div>
  );
}
