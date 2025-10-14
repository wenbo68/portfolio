'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { AuthShowcase } from '../auth/AuthShowcase';
import { AuthShowcaseFallback } from '../auth/AuthShowcaseFallback';

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
      <div className="max-w-7xl w-full flex items-center justify-between px-3 sm:px-3 md:px-4 lg:px-5 xl:px-6">
        <div className="h-full flex items-center gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
          <Link
            href="/"
            onClick={() => sessionStorage.setItem('previousPageUrl', '/')}
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            Portfolio
          </Link>
          <Link
            href="/services"
            onClick={() =>
              sessionStorage.setItem('previousPageUrl', '/services')
            }
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            Services
          </Link>
        </div>
        <Suspense fallback={<AuthShowcaseFallback />}>
          <AuthShowcase />
        </Suspense>
      </div>
    </nav>
  );
}
