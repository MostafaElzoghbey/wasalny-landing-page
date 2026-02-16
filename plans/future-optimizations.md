# Future Optimizations & SEO Strategy

## 1. Repository Management (Git & Large Files)
- **Current Status**: ~150MB is **safe** for GitHub (Limit: 1GB soft, 100MB per file).
- **Risk**: Every time you optimize/change images, Git stores a *copy* of the old ones in history. The repo size will grow indefinitely.
- **Solution**:
    - **Git LFS (Large File Storage)**: The professional standard for assets. It stores pointers in Git and files on a separate server.
    - **External Hosting**: Move `assets` to AWS S3 or Cloudflare R2 and change URLs in `src/data/cars.ts`. (Recommended only if size > 500MB).

## 2. SEO Optimizations (High Impact)
The current image SEO is **weak**.
- **Issue 1: Filenames**: `sedan-01.webp` tells Google (and users) nothing.
    - *Fix*: Rename to `toyota-corolla-rental-damietta.webp`.
- **Issue 2: Alt Text**: Currently hardcoded as `"Car view"` or `"سيارة وصلني"`.
    - *Fix*: Dynamic Alt Text usage. 
    `alt={`${car.brand} ${car.model} rental in Damietta - View ${index + 1}`}`.
- **Issue 3: Structured Data (Schema.org)**:
    - *Add*: JSON-LD `Product` or `Vehicle` schema to the Fleet section so Google knows these are bookable items.

## 3. Advanced Image Features
- **Art Direction**: Use `<source media="..." >` to show a different *crop* on mobile (zoomed in) vs desktop (wide angle), not just a resized version.
- **Blur-Up Placeholders**: Generate base64 tiny thumbnails during build time to show immediately while the main image loads (prevents white flashes).
