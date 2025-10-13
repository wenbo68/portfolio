'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function TopNav() {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navPosition, setNavPosition] = useState(0);

  const NAVBAR_HEIGHT = 56;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Don't do anything if the user is at the very top of the page
      if (currentScrollY <= 0) {
        setNavPosition(0);
        setLastScrollY(currentScrollY);
        return;
      }

      // Calculate the difference in scroll position
      const scrollDelta = currentScrollY - lastScrollY;

      // Calculate the new position for the navbar
      const newNavPosition = navPosition - scrollDelta;

      // Clamp the position so it doesn't go off-screen
      const clampedNavPosition = Math.max(
        -NAVBAR_HEIGHT,
        Math.min(0, newNavPosition)
      );

      setNavPosition(clampedNavPosition);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, navPosition]);

  return (
    <nav
      className="flex justify-center w-full h-12 bg-gray-900 sticky top-0 z-50 transition-transform duration-0"
      style={{ transform: `translateY(${navPosition}px)` }}
    >
      <div className="max-w-7xl w-full flex items-center justify-end gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8">
        <Link
          href="/"
          onClick={() => sessionStorage.setItem('previousPageUrl', '/')}
          className="text-sm font-semibold hover:text-blue-400"
        >
          Portfolio
        </Link>
        <Link
          href="/services"
          onClick={() => sessionStorage.setItem('previousPageUrl', '/services')}
          className="text-sm font-semibold hover:text-blue-400"
        >
          Services
        </Link>
      </div>
    </nav>
  );
}
