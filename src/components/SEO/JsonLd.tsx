import type { Car } from '@/types';

interface JsonLdProps {
    cars: Car[];
}

export const JsonLd = ({ cars }: JsonLdProps) => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CarRental",
        "name": "Wasalny Travel - وصلني ترافيل",
        "image": "https://wasalny-travel.com/assets/images/logo/logo.jpeg",
        "description": "Premium car rental and passenger transport services in Damietta, Cairo, and Airports. Modern fleet of Sedans, SUVs, and Minibuses.",
        "url": "https://wasalny-travel.com",
        "telephone": "+201005656117",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Damietta",
            "addressLocality": "Damietta",
            "addressRegion": "Damietta",
            "postalCode": "34511",
            "addressCountry": "EG"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "31.4175",
            "longitude": "31.8144"
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Car Rental Fleet",
            "itemListElement": cars
                .filter(car => car.images?.length > 0)
                .map((car, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Product",
                        "name": car.nameAr,
                        "description": car.description,
                        "image": `https://wasalny-travel.com${car.images[0]}`
                    }
                }))
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
};
