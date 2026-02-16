# Image Optimization Plan

## 1. Current State Analysis
- **Location**: Images are stored in `public/assets/images`.
- **Formats**: Primarily JPEG.
- **Sizes**: Varying sizes, some up to 300KB+.
- **Usage**: Used in `HeroSection` and `FleetSection` via direct `img` tags and background images.

## 2. Optimization Strategy

### A. Format Conversion
- **Goal**: Convert all JPEG/PNG images to **WebP** and **AVIF**.
- **Benefit**: Significant reduction in file size (often 30-50% smaller) without loss of quality.
- **Action**: 
    - Batch convert existing images.
    - Keep fallback JPEGs for legacy browser support (though support is high for WebP).

### B. Responsive Sizing (Resolution Switching)
- **Goal**: Serve appropriate image sizes based on device viewport.
- **Action**:
    - Generate multiple variants for main images:
        - Small (mobile): ~640px wide
        - Medium (tablet): ~1024px wide
        - Large (desktop): ~1920px wide
    - Implement `srcset` and `sizes` attributes in `img` tags.

### C. Reusable Image Component
- **Goal**: Abstract the complexity of responsive images.
- **Action**:
    - Create `src/components/ui/OptimizedImage.tsx`.
    - Features:
        - Automatic `srcset` generation (logic or prop based).
        - Blur-up placeholder support (low-res base64 or solid color).
        - Lazy loading by default.
        - `picture` tag wrapper for format selection (AVIF > WebP > JPEG).

### D. Component Specific Updates
- **HeroSection**:
    - Use `OptimizedImage` for the main car image.
    - Ensure LCP (Largest Contentful Paint) image is eager loaded (not lazy).
- **FleetSection**:
    - The carousel uses many images. Lazy loading is critical here (already implemented, but can be improved with `OptimizedImage`).
    - Use smaller thumbnails for the navigation strip.

## 3. Library Recommendations
- **Sharp** (dev-dependency): For resizing and converting images during build or via a script.
- **Vite Image Optimizer**: Plugin for automated compression.

## 4. Implementation Steps
1.  **Audit**: List all large images.
2.  **Tooling**: Set up a script (e.g., `scripts/optimize-images.js` using `sharp`) to generate WebP/AVIF and resized versions.
3.  **Component**: Build `<OptimizedImage />`.
4.  **Refactor**: Replace standard `img` tags in `HeroSection` and `FleetSection` with `<OptimizedImage />`.
5.  **Verify**: Check Network tab for file type and size.
