'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoMdArrowRoundBack } from 'react-icons/io';

export function BackButton() {
  const [backUrl, setBackUrl] = useState<string>('/'); // Default fallback URL

  useEffect(() => {
    // This effect runs once on the client after the component mounts
    const storedUrl = sessionStorage.getItem('previousPageUrl');
    if (storedUrl) {
      setBackUrl(storedUrl);
    }
  }, []); // Empty dependency array ensures it only runs once

  return (
    <Link
      href={backUrl}
      className="inline-flex items-start gap-2 text-sm font-semibold text-gray-400 transition hover:text-blue-400"
    >
      <IoMdArrowRoundBack className="text-[16px] sm:text-[20px]" />
      <span>Back</span>
    </Link>
  );
}
