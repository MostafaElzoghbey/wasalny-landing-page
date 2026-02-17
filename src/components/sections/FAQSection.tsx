import { useState, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

const faqs = [
    {
        question: 'كيف يمكنني حجز رحلة؟',
        answer: 'يمكنك حجز رحلتك بسهولة عن طريق الاتصال بنا مباشرة أو التواصل معنا عبر واتساب. فريق خدمة العملاء متاح على مدار الساعة لتنسيق رحلتك.',
    },
    {
        question: 'ما هي أسعار الرحلات من دمياط للقاهرة؟',
        answer: 'نقدم أسعاراً تنافسية تبدأ من أسعار اقتصادية للسيارات السيدان وتختلف حسب نوع السيارة (SUV، ميكروباص) والوجهة (القاهرة، المطار). تواصل معنا للحصول على عرض سعر دقيق لرحلتك.',
    },
    {
        question: 'هل توفرون خدمة استقبال من المطار؟',
        answer: 'نعم، نوفر خدمة استقبال من مطار القاهرة الدولي. سيكون السائق في انتظارك في صالة الوصول لضمان تجربة مريحة وسلسة.',
    },
    {
        question: 'ما هي أنواع السيارات المتاحة لديكم؟',
        answer: 'لدينا أسطول متنوع يشمل سيارات سيدان حديثة (تويوتا، كيا)، سيارات عائلية (SUV)، وميكروباصات حديثة (HiAce) للمجموعات، بالإضافة إلى سيارات ليموزين للمناسبات الخاصة.',
    },
    {
        question: 'هل يمكن حجز سيارة عائلية للسفر؟',
        answer: 'بالتأكيد! نوفر سيارات عائلية واسعة ومريحة (مثل كيا كرنفال وتويوتا هايس) لضمان راحة جميع أفراد العائلة مع مساحة كافية للأمتعة.',
    },
];

const FAQItem = ({ item, isOpen, onClick }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void }) => {
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
            >
                <span className={cn("text-lg font-bold text-gray-900 dark:text-white transition-colors", isOpen && "text-primary-600 dark:text-primary-400")}>
                    {item.question}
                </span>
                <div ref={iconRef} className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 transition-colors", isOpen && "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400")}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
            </button>
            <div ref={contentRef} className="h-0 overflow-hidden">
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
                        <div key={index} className="faq-item-anim">
                            <FAQItem
                                item={faq}
                                isOpen={openIndex === index}
                                onClick={() => setOpenIndex(index === openIndex ? null : index)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
