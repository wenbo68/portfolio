'use client';

import React, { useState } from 'react';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import Popup from './Popup';

export default function Service({
  serviceId,
  title,
  price,
  features,
}: {
  serviceId: 'basic' | 'standard';
  title: string;
  price: string;
  features: string[];
}) {
  // State to control the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Use a React Fragment to return multiple elements */}
      <div className="basis-0 flex-grow flex flex-col gap-4 bg-gray-900 rounded-lg p-5">
        <div className="flex flex-col gap-3">
          <span className="text-gray-300 font-semibold">{title}</span>
          <span className="text-gray-300 font-bold text-xl">{price}</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:laboratorymember008@gmail.com"
              className="flex items-center justify-center basis-0 flex-grow rounded-lg bg-blue-600 px-4 py-1.5 text-gray-300 hover:bg-blue-500 cursor-pointer text-sm font-semibold"
            >
              Consult
            </a>
            {/* This button now opens the modal */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="basis-0 flex-grow rounded-lg bg-blue-600 px-4 py-1.5 text-gray-300 hover:bg-blue-500 cursor-pointer text-sm font-semibold"
            >
              Order
            </button>
          </div>
        </div>
        <hr className="border-gray-600" />
        <div className="flex flex-col gap-2">
          <span className="text-gray-300 font-semibold">Features</span>
          <div className="flex flex-col gap-1">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <IoIosCheckmarkCircle size={16} className="shrink-0 mt-[3px]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Conditionally render the modal */}
      <Popup
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceId={serviceId}
        serviceName={title}
      />
    </>
  );
}
