import { useState } from 'react';
import { SectionHeading } from "@/components/ui/SectionHeading";

export function MapEmbed() {
    const [isMapVisible, setIsMapVisible] = useState(false);



    return (
        <section className="section-padding bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
            <div className="section-container">
                <SectionHeading
                    title="موقعنا"
                    subtitle="موقعنا في دمياط ويوجد لدينا توصيل لجميع أنحاء دمياط و سفر خارج دمياط"
                    centered
                />
                <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800 relative group">
                    {isMapVisible ? (
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1576.4530022294156!2d31.8152554761009!3d31.41680572236315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f9e31d3f9e2b1d%3A0x6b098b0f44923f05!2z2YXYYtix2YUg2YjYtdmE2YbZiiDYrNmF2YrYp9i3!5e0!3m2!1sar!2seg!4v1700000000000!5m2!1sar!2seg"
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-forms allow-pointer-lock"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="موقع مكتب وصلني"
                            aria-label="موقع مكتب وصلني على خرائط جوجل"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsMapVisible(true)}
                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 w-full h-full p-0 border-0 bg-transparent appearance-none text-right"
                            aria-label="اضغط لعرض الخريطة"
                        >
                            <div className="bg-[hsl(var(--card))] p-4 rounded-full shadow-lg mb-4 pointer-events-none mx-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 dark:text-primary-500">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white pointer-events-none block text-center">اضغط لعرض الخريطة</span>
                        </button>
                    )}
                </div>
            </div>
        </section >
    );
}
