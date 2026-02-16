
import React, { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string; // Applied to wrapper
    imgClassName?: string; // Applied directly to img
    width?: number | string;
    height?: number | string;
    priority?: boolean;
    sizes?: string;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
    (
        {
            src,
            alt,
            className,
            imgClassName,
            width,
            height,
            priority = false,
            sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
            onLoad,
            onError,
            ...props
        },
        ref
    ) => {
        const [isLoaded, setIsLoaded] = useState(false);
        const [error, setError] = useState(false);

        // Helper to generate source paths
        const generateSrcSet = () => {
            if (!src || typeof src !== 'string' || error) return undefined;

            const lastDotIndex = src.lastIndexOf('.');
            if (lastDotIndex === -1) return undefined;

            const baseName = src.substring(0, lastDotIndex);

            // We use a more limited srcset to avoid too many 404s if variants are missing
            // The browser will fallback to the <img> src if these fail
            return `
                ${baseName}-640.webp 640w,
                ${baseName}-1024.webp 1024w,
                ${baseName}.webp 1920w
            `;
        };

        const webpSrcSet = generateSrcSet();

        const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
            setIsLoaded(true);
            if (onLoad) {
                onLoad(e);
            }
        };

        const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
            console.warn(`Image failed to load: ${src}`);
            setError(true);
            if (onError) {
                onError(e);
            }
        };

        return (
            <div
                className={cn("relative overflow-hidden bg-gray-100 dark:bg-gray-800/50", className)}
                style={{
                    width: width && typeof width === 'number' ? `${width}px` : width,
                    height: height && typeof height === 'number' ? `${height}px` : height
                }}
            >
                <picture>
                    {!error && webpSrcSet && (
                        <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
                    )}
                    <img
                        ref={ref}
                        src={src}
                        alt={alt}
                        loading={priority ? "eager" : "lazy"}
                        decoding={priority ? "sync" : "async"}
                        onLoad={handleLoad}
                        onError={handleError}
                        className={cn(
                            "w-full h-full transition-all duration-700 ease-in-out",
                            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-sm",
                            priority && "opacity-100 scale-100 blur-0",
                            imgClassName
                        )}
                        {...props}
                    />
                </picture>

                {!isLoaded && !priority && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12 animate-shimmer" />
                    </div>
                )}

                {/* Error fallback */}
                {error && !isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                        <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                        <span className="text-xs">{alt}</span>
                    </div>
                )}
            </div>
        );
    }
);

OptimizedImage.displayName = 'OptimizedImage';
