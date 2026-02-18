import type { Car } from '@/types';
import { faqs } from '@/data/faqs';

interface JsonLdProps {
    cars: Car[];
}

export function JsonLd({ cars }: JsonLdProps) {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CarRental",
                "name": "مكتب وصلني في دمياط (Wasalny Office)",
                "image": "https://wasalny.pages.dev/assets/images/logo/logo.jpeg",
                "description": "Premium car rental and passenger transport services in Damietta, Cairo, and Airports. Modern fleet of Sedans, SUVs, and Minibuses.",
                "url": "https://wasalny.pages.dev",
                "sameAs": [
                    "https://share.google/qCkiUoMQSmVUzxSly",
                    "https://www.facebook.com/profile.php?id=100054619677322"
                ],
                "telephone": "+201005656117",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "قهوة حكاوي، شارع وزير، قسم دمياط",
                    "addressLocality": "Damietta",
                    "addressRegion": "Damietta",
                    "postalCode": "34511",
                    "addressCountry": "EG"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 31.4175,
                    "longitude": 31.8144
                },
                "priceRange": "$$",
                "areaServed": [
                    {
                        "@type": "City",
                        "name": "Damietta"
                    },
                    {
                        "@type": "City",
                        "name": "Cairo"
                    },
                    {
                        "@type": "Place",
                        "name": "Cairo International Airport"
                    }
                ],
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
                                "description": car.seoDescription || car.description,
                                "image": `https://wasalny.pages.dev${car.images[0]}`
                            }
                        }))
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/<\//g, '<\\/') }}
        />
    );
};
