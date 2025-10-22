'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useSessionStorageState } from '../_hooks/useSessionStorage';

// Define the context type
type FilterContextType = {
  packageType: string[];
  setPackageType: Dispatch<SetStateAction<string[]>>;
  rating: string[];
  setRating: Dispatch<SetStateAction<string[]>>;
  order: string;
  setOrder: Dispatch<SetStateAction<string>>;
  handleSearch: (
    overrides?: Partial<{
      packageType: string[];
      rating: string[];
      order: string;
    }>
  ) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. use states for instant highlight on selected filter options
  const [packageType, setPackageType] = useState(() =>
    searchParams.getAll('package')
  );
  const [rating, setRating] = useState(() => searchParams.getAll('rating'));
  const [order, setOrder] = useSessionStorageState(
    'order',
    searchParams.get('order') ?? ''
  );

  // 2. sync url to states
  useEffect(() => {
    setPackageType(searchParams.getAll('package'));
    setRating(searchParams.getAll('rating'));
    setOrder(searchParams.get('order') ?? '');
  }, [searchParams]);

  // 3. sync state (or arbitrary value) to url
  type SearchParamsOverride = Partial<{
    packageType: string[];
    rating: string[];
    order: string;
  }>;

  const handleSearch = (overrides: SearchParamsOverride = {}) => {
    const newParams = new URLSearchParams();

    // Use overrides if provided, otherwise fall back to state
    const finalPackageType = overrides.packageType ?? packageType;
    const finalRating = overrides.rating ?? rating;
    const finalOrder = overrides.order ?? order;

    finalPackageType.forEach((v) => newParams.append('package', v));
    finalRating.forEach((v) => newParams.append('rating', v));
    if (finalOrder) {
      newParams.set('order', finalOrder);
    } else {
      setOrder('created-desc');
      newParams.set('order', 'created-desc');
    }

    // Always reset to page 1 for a new search
    newParams.set('page', '1');

    const url = `/services?${newParams.toString()}#review-filters`;
    router.push(url);
  };

  const value = {
    packageType,
    setPackageType,
    rating,
    setRating,
    order,
    setOrder,
    handleSearch,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

// Custom hook remains the same
export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
