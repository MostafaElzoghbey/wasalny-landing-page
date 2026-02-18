import { useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { routeData } from '@/data/routeData';
import { contactInfo } from '@/data/content';

export function RoutePage() {
    const { id } = useParams();
    const data = id ? routeData[id] : null;
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!data || !containerRef.current) return;

        const anim = gsap.from('.route-content', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power2.out'
        });

        return () => {
            anim.kill();
        };
    }, { scope: containerRef, dependencies: [id] });

    // Remove this useEffect - ScrollToTop component handles scroll reset
    // useEffect(() => {
    //     window.scrollTo(0, 0);
    // }, [id]);

    if (!data) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{data.metaTitle}</title>
                <meta name="description" content={data.metaDescription} />
                <link rel="canonical" href={`https://wasalny.pages.dev/routes/${id}`} />
            </Helmet>

            <div ref={containerRef} className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-gray-950">
                <div className="section-container">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 route-content">
                        <Link to="/" className="hover:text-primary-600 transition-colors">الرئيسية</Link>
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-gray-900 dark:text-white font-medium">{data.title}</span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Content Side */}
                        <div className="space-y-8 route-content">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                    {data.title}
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {data.description}
                                </p>
                            </div>

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">المدة المتوقعة</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{data.duration}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">المسافة</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{data.distance}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">مميزات الرحلة</h3>
                                <ul className="grid sm:grid-cols-2 gap-3">
                                    {data.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Specific FAQs */}
                            {data.faqs.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">أسئلة شائعة عن هذا الخط</h3>
                                    <div className="space-y-4">
                                        {data.faqs.map((faq, idx) => (
                                            <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <p className="font-bold text-gray-900 dark:text-white mb-2">{faq.question}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Visual/CTA Side */}
                        <div className="lg:sticky lg:top-24 space-y-6 route-content">
                            <div className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl">
                                <img
                                    src={data.heroImage}
                                    alt={data.title}
                                    className="w-full h-full object-cover"
                                    width="1280"
                                    height="720"
                                    loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <p className="text-sm font-medium opacity-90 mb-1">يبدأ من</p>
                                        <p className="text-3xl font-bold">{data.priceStart} جنيه</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">احجز رحلتك الآن</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">تواصل معنا لحجز سيارة خاصة لهذا المسار. متاحين 24 ساعة.</p>
                                <div className="space-y-3">
                                    <a
                                        href={`tel:${contactInfo.phone}`}
                                        className="block w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors"
                                    >
                                        اتصل الآن
                                    </a>
                                    <a
                                        href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(`السلام عليكم، أريد الاستفسار عن رحلة ${data.title}`)}`}
                                        className="block w-full py-3 bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-xl font-bold transition-colors"
                                    >
                                        واتساب
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
