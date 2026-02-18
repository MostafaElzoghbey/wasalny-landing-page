import { useState, useRef, useId } from 'react';

// Third-party
import { Plus, Minus } from 'lucide-react';
import { useGSAP } from '@gsap/react';

// Local
import gsap from '@/lib/gsap';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';
import { faqs } from '@/data/faqs';
import type { Faq } from '@/types';

interface FAQItemProps {
    item: Faq;
    isOpen: boolean;
    onClick: () => void;
    id: string;
}

export function FAQItem({ item, isOpen, onClick, id }: FAQItemProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const contentEl = contentRef.current;
        const iconEl = iconRef.current;

        if (!contentEl || !iconEl) return;

        if (isOpen) {
            gsap.to(contentEl, {
                height: 'auto',
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.set(contentEl, { height: 'auto' });
                }
            });
            gsap.to(iconEl, { rotation: 180, duration: 0.3, ease: 'back.out(1.7)' });

            const firstChild = contentEl.children[0];
            if (firstChild) {
                gsap.fromTo(firstChild, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.1 });
            }
        } else {
            gsap.to(contentEl, { height: 0, duration: 0.3, ease: 'power2.in' });
            gsap.to(iconEl, { rotation: 0, duration: 0.3, ease: 'back.in(1.7)' });
        }

        return () => {
            gsap.killTweensOf(contentEl);
            gsap.killTweensOf(iconEl);
            if (contentEl.children[0]) {
                gsap.killTweensOf(contentEl.children[0]);
            }
        };
    }, { dependencies: [isOpen] });

    return (
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-shadow hover:shadow-md">
            <button
                id={`btn-${id}`}
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
}

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const idPrefix = useId();

    useGSAP(() => {
        if (!containerRef.current) return;

        const anim = gsap.from(".faq-item-anim", {
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

        return () => {
            anim.kill();
        };
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
