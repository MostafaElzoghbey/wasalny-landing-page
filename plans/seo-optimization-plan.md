# SEO Optimization Implementation Plan

## 1. Image Filenames (Renaming Strategy)

### What
Rename generic image files from `sedan-01.webp` to descriptive, keyword-rich names like `toyota-corolla-rental-damietta.webp`.

### Why
-   **Search Engines**: Google uses filenames to understand what an image depicts. `sedan-01` is meaningless; `toyota-corolla-rental` is highly specific.
-   **Context**: It reinforces the page content relevance for queries like "rent Toyota Corolla Damietta".

### How
1.  **AI Image Analysis (New)**:
    -   I (the AI Agent) will visually inspect the source images in `public/assets/images` to identify the *actual* make and model of each car (replacing placeholder data like "Toyota Corolla" with the real car identity).
    -   I will generate a `renaming-map.json` file mapping the current ID (e.g., `sedan-01.jpeg`) to the real, descriptive name (e.g., `hyundai-elantra-2023-white-front.jpeg`).

2.  **Scripted Renaming**:
    -   Create a script `scripts/rename-images.js` that reads `renaming-map.json`.
    -   Rename the source files on disk.
    -   Update `src/data/cars.ts` with the new paths and correct car metadata (Brand, Model, Year).

3.  **Re-run Optimization**:
    -   Run `optimize-images.js` to generate fresh WebP/AVIF assets from the accurately renamed source files.
    -   Cleanup old generic files.

---

## 2. Dynamic Alt Text (Accessibility & SEO)

### What
Replace hardcoded static alt text (e.g., "Car view") with dynamic, descriptive text generated from car data.

### Why
-   **Accessibility**: Screen readers rely on alt text to describe images to visually impaired users. "Car view" provides no value; "Toyota Corolla white interior view" does.
-   **SEO**: Alt text plays a crucial role in Google Images ranking. It serves as anchor text for the image link.

### How
-   **Modify `src/data/cars.ts`**: Ensure each car object has `brand`, `model`, and `color` (if applicable) available.
-   **Update `FleetSection.tsx`**:
    -   In the `CarouselCard` and `Lightbox` components, remove static strings.
    -   Construct the string dynamically:
        ```tsx
        // Example Implementation
        const altText = `${car.name} (${car.nameAr}) - ${categoryInfo[activeCategory].name} - View ${index + 1}`;
        ```
    -   Pass this precise string to the `OptimizedImage` component.

---

## 3. Structured Data (JSON-LD Schema)

### What
Inject a strictly formatted JSON-LD script tag into the `<head>` of the page that describes the fleet using Schema.org vocabulary (`Product` or `Vehicle`).

### Why
-   **Rich Snippets**: Enables Google to display "Product" information (price, availability, rating) directly in search results.
-   **Knowledge Graph**: Helps Google understand the *relationships* between your brand ("Wasalny"), the location ("Damietta"), and the products ("Car Rental").

### How
1.  **Define Schema Strategy**:
    -   Use `Product` schema for each car category or specific car.
    -   Include `name`, `description`, `image`, `offers` (price), and `aggregateRating`.
2.  **Implementation**:
    -   Create a new component `src/components/seo/FleetSchema.tsx`.
    -   Generate the JSON object dynamically from `src/data/cars.ts`.
    -   Inject it using `useEffect` or a `Head` component manager (if available, otherwise standard React portal or effect).

    ```json
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Toyota Corolla Rental",
      "image": "https://wasalny.com/assets/images/cars/sedan/toyota-corolla.webp",
      "description": "Rent a Toyota Corolla in Damietta. AC, Comfort seats, USB.",
      "brand": {
        "@type": "Brand",
        "name": "Toyota"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EGP",
        "price": "500.00",
        "priceNotes": "Example pricing - update with actual rates",
        "availability": "https://schema.org/InStock"
      }
    }
    ```
