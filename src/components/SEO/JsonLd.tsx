import type { Car } from '@/types';

interface JsonLdProps {
    cars: Car[];
}

export const JsonLd = ({ cars }: JsonLdProps) => {
    const structuredData = {
        "@context": "https://schema.org",
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
            "latitude": "31.4175",
            "longitude": "31.8144"
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
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "5",
            "bestRating": "5",
            "worstRating": "1"
        },
        "mainEntity": {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "كيف يمكنني حجز رحلة؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "يمكنك حجز رحلتك بسهولة عن طريق الاتصال بنا مباشرة أو التواصل معنا عبر واتساب. فريق خدمة العملاء متاح على مدار الساعة لتنسيق رحلتك."
                    }
                },
                {
                    "@type": "Question",
                    "name": "ما هي أسعار الرحلات من دمياط للقاهرة؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نقدم أسعاراً تنافسية تبدأ من أسعار اقتصادية للسيارات السيدان وتختلف حسب نوع السيارة (SUV، ميكروباص) والوجهة (القاهرة، المطار). تواصل معنا للحصول على عرض سعر دقيق لرحلتك."
                    }
                },
                {
                    "@type": "Question",
                    "name": "هل توفرون خدمة استقبال من المطار؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نعم، نوفر خدمة استقبال من مطار القاهرة الدولي. سيكون السائق في انتظارك في صالة الوصول لضمان تجربة مريحة وسلسة."
                    }
                },
                {
                    "@type": "Question",
                    "name": "ما هي أنواع السيارات المتاحة لديكم؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "لدينا أسطول متنوع يشمل سيارات سيدان حديثة (تويوتا، كيا)، سيارات عائلية (SUV)، وميكروباصات حديثة (HiAce) للمجموعات، بالإضافة إلى سيارات ليموزين للمناسبات الخاصة."
                    }
                },
                {
                    "@type": "Question",
                    "name": "هل يمكن حجز سيارة عائلية للسفر؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "بالتأكيد! نوفر سيارات عائلية واسعة ومريحة (مثل كيا كرنفال وتويوتا هايس) لضمان راحة جميع أفراد العائلة مع مساحة كافية للأمتعة."
                    }
                }
            ]
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/<\//g, '<\\/') }}
        />
    );
};
