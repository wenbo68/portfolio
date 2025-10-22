'use client';

import type { FilterGroupOption, FilterOption } from '~/type';
import Filter from '../filter/Filter';
import { useFilterContext } from '~/app/_contexts/FilterProvider';
import { orderOptions } from '~/const';

export default function ReviewFilters({}: {}) {
  const {
    packageType,
    setPackageType,
    rating,
    setRating,
    order,
    setOrder,
    handleSearch,
  } = useFilterContext();

  // dropdown options for all filters
  const packageTypeOptions: FilterOption[] = [
    { label: 'Basic', urlInput: 'basic' },
    { label: 'Standard', urlInput: 'standard' },
  ];

  const ratingOptions: FilterOption[] = [
    { label: '1 star', urlInput: '1' },
    { label: '2 star', urlInput: '2' },
    { label: '3 star', urlInput: '3' },
    { label: '4 star', urlInput: '4' },
    { label: '5 star', urlInput: '5' },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      id="review-filters"
      onSubmit={handleSubmit}
      className="text-sm w-full grid grid-cols-2 gap-2 lg:gap-3"
    >
      {/* Filter Components */}
      <div className="contents">
        <Filter
          label="Package"
          options={packageTypeOptions}
          isGroupOptions={false}
          value={packageType}
          onChange={setPackageType}
          mode="multi"
        />
        <Filter
          label="Rating"
          options={ratingOptions}
          isGroupOptions={false}
          value={rating}
          onChange={setRating}
          mode="multi"
        />
        <Filter
          label="Order"
          options={orderOptions}
          isGroupOptions={true}
          value={order}
          onChange={setOrder}
          mode="single"
        />
      </div>
    </form>
  );
}
