"use client";

import { ImgHTMLAttributes, useEffect, useMemo, useState } from "react";
import { normalizeImageSrc } from "@/lib/image-utils";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeImage({ src, fallbackSrc = "/college-placeholder.svg", alt = "", onError, ...props }: SafeImageProps) {
  const initialSrc = useMemo(() => normalizeImageSrc(src, fallbackSrc), [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        onError?.(event);
      }}
    />
  );
}
