import { useState, useRef, useId } from 'react';
import { Plus, Minus } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useGSAP } from '@/lib/gsap';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import { faqs } from '@/data/faqs';

const FAQItem = ({ item, isOpen, onClick, id }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void, id: string }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (isOpen) {
            gsap.to(contentRef.current, { height: 'auto', duration: 0.3, ease: 'power2.out' });
            gsap.to(iconRef.current, { rotation: 180, duration: 0.3, ease: 'back.out(1.7)' });
            if (contentRef.current?.children[0]) {
                gsap.fromTo(contentRef.current.children[0], { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.1 });
            }
        } else {
            gsap.to(contentRef.current, { height: 0, duration: 0.3, ease: 'power2.in' });
            gsap.to(iconRef.current, { rotation: 0, duration: 0.3, ease: 'back.in(1.7)' });
        }
    }, { dependencies: [isOpen] });

    return (
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-shadow hover:shadow-md">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
                aria-expanded={isOpen}
                aria-controls={id}
            >
                <span className={cn("text-lg font-bold text-gray-900 dark:text-white transition-colors", isOpen && "text-primary-600 dark:text-primary-400")}>
                    {item.question}
                </span>
                <div ref={iconRef} className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 transition-colors", isOpen && "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400")}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
            </button>
            <div
                id={id}
                ref={contentRef}
                className="h-0 overflow-hidden"
                role="region"
                aria-labelledby={`btn-${id}`}
            >
                <p className="p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800">
                    {item.answer}
                </p>
            </div>
        </div>
    );
};

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const idPrefix = useId();

    useGSAP(() => {
        gsap.from(".faq-item-anim", {
            y: 30,
            opacity: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                once: true
            }
        });
    }, { scope: containerRef });

    return (
        <section id="faq" ref={containerRef} className="section-padding relative overflow-hidden bg-gray-50 dark:bg-gray-950/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.2] dark:opacity-[0.05]" />

            <div className="section-container relative z-10 max-w-4xl mx-auto">
                <SectionHeading
                    title="الأسئلة الشائعة"
                    subtitle="إجابات على أكثر الأسئلة شيوعاً حول خدماتنا"
                    centered
                />

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={faq.question} className="faq-item-anim">
                            <FAQItem
                                item={faq}
                                isOpen={openIndex === index}
                                onClick={() => setOpenIndex(index === openIndex ? null : index)}
                                id={`${idPrefix}-${index}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
