import { SectionHeading } from "@/components/ui/SectionHeading";

export function MapEmbed() {
    return (
        <section className="section-padding bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="section-container">
                <SectionHeading
                    title="موقعنا"
                    subtitle="موقعنا في دمياط ويوجد لدينا توصيل لجميع انحاء دمياط و سفر خارج دمياط"
                    centered
                />
                <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-500">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1576.4530022294156!2d31.8152554761009!3d31.41680572236315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f9e31d3f9e2b1d%3A0x6b098b0f44923f05!2z2YXYYtix2YUg2YjYtdmE2YbZiiDYrNmF2YrYp9i3!5e0!3m2!1sar!2seg!4v1700000000000!5m2!1sar!2seg"
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="موقع مكتب وصلني"
                        sandbox="allow-scripts allow-same-origin"
                        aria-label="موقع مكتب وصلني على خرائط جوجل"
                    />
                </div>
            </div>
        </section>
    );
}
