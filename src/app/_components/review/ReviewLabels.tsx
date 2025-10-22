'use client';

import { useMemo } from 'react';
import {
  ClickableLabel,
  UnclickableLabel,
  LabelContainer,
} from '../filter/Label';
import { useFilterContext } from '~/app/_contexts/FilterProvider';
import { orderOptions } from '~/const';

type ActiveLabel = {
  key: string;
  label: string;
  type: 'packageType' | 'rating';
  onRemove?: () => void;
  className?: string;
};

export default function ReviewLabels(
  {
    //   filterOptions,
    // }: {
    //   filterOptions: FilterOptionsFromDb;
  }
) {
  const {
    packageType,
    setPackageType,
    rating,
    setRating,
    order,
    // Note: We don't need setOrder here, as the order label isn't removable.
    handleSearch,
  } = useFilterContext();

  const { activeLabels, orderLabel } = useMemo(() => {
    const activeLabels: ActiveLabel[] = [];

    // Package
    packageType.forEach((pkg) => {
      activeLabels.push({
        key: `package-${pkg}`,
        label: pkg === 'basic' ? 'Basic' : 'Standard',
        type: 'packageType',
        onRemove: () => {
          const newPackage = packageType.filter((p) => p !== pkg);
          setPackageType(newPackage);
          handleSearch({ packageType: newPackage });
        },
      });
    });

    // Rating
    rating.forEach((rtg) => {
      activeLabels.push({
        key: `rating-${rtg}`,
        label: `${rtg} Star`,
        type: 'rating',
        onRemove: () => {
          const newRating = rating.filter((r) => r !== rtg);
          setRating(newRating);
          handleSearch({ rating: newRating });
        },
      });
    });

    // Order Label
    let orderLabel: string | null = null;
    if (order) {
      for (const group of orderOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === order);
        if (foundOption) {
          orderLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { activeLabels, orderLabel };
  }, [
    rating,
    setPackageType,
    rating,
    setRating,
    order,
    // filterOptions,
    handleSearch,
  ]);

  return (
    <LabelContainer>
      {activeLabels.length === 0 ? (
        orderLabel ? (
          <UnclickableLabel label={orderLabel} colorType="order" />
        ) : (
          <UnclickableLabel label={'Empty Search'} colorType="order" />
        )
      ) : (
        <>
          {activeLabels.map((label) => {
            return label.onRemove ? (
              <ClickableLabel
                key={label.key}
                label={label.label}
                colorType={label.type}
                onRemove={label.onRemove}
              />
            ) : (
              <UnclickableLabel
                key={label.key}
                label={label.label}
                colorType={label.type}
              />
            );
          })}
          {orderLabel && (
            <UnclickableLabel label={orderLabel} colorType="order" />
          )}
        </>
      )}
    </LabelContainer>
  );
}
