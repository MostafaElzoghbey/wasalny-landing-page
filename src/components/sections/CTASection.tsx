import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { contactInfo } from '@/data/content';
import { useTextReveal, useMagneticButton, useBatchReveal } from '@/hooks/useAnimations';
import gsap, { useGSAP } from '@/lib/gsap';

const MagneticWrapper = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useMagneticButton(ref);
  
  return (
    <div ref={ref} className="inline-block">
      {children}
    </div>
  );
};

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  
  useTextReveal(titleRef, {
    split: "chars",
    from: { opacity: 0, scale: 0.5, y: 100, rotationX: -90 },
    to: { opacity: 1, scale: 1, y: 0, rotationX: 0 },
    stagger: 0.02
  });

  const [cardsRef] = useBatchReveal({
    selector: '.contact-card',
    interval: 0.2,
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0 }
  });

  useGSAP(() => {
    if (pulseRef.current) {
      gsap.to(pulseRef.current, {
        scale: 1.1,
        boxShadow: "0 0 40px 10px rgba(255, 255, 255, 0.4)",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, { scope: containerRef });

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('مرحباً، أريد حجز رحلة من دمياط')}`,
      '_blank'
    );
  };

  const handleCall = () => {
    window.open(`tel:${contactInfo.phone}`);
  };

  return (
    <section id="contact" ref={containerRef} className="section-padding relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="section-container relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div ref={titleRef}>
            <SectionHeading
              title="احجز رحلتك الآن"
              subtitle="تواصل معنا الآن واحجز رحلتك بسهولة. نحن في خدمتك على مدار الساعة."
              className="text-white [&_h2]:text-white [&_p]:text-primary-100 [&_div]:bg-white/30"
            />
          </div>

          {/* Contact Info Cards */}
          <div
            ref={cardsRef}
            className="grid sm:grid-cols-3 gap-6 mb-10"
          >
            <MagneticWrapper>
              <div
                className="contact-card bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white h-full cursor-pointer hover:bg-white/15 transition-colors"
              >
                <Phone className="w-8 h-8 mx-auto mb-3 text-accent-400" />
                <p className="font-bold text-lg mb-1">اتصل بنا</p>
                <p className="text-primary-200" dir="ltr">{contactInfo.phone}</p>
              </div>
            </MagneticWrapper>

            <MagneticWrapper>
              <div
                className="contact-card bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white h-full cursor-pointer hover:bg-white/15 transition-colors"
              >
                <MapPin className="w-8 h-8 mx-auto mb-3 text-accent-400" />
                <p className="font-bold text-lg mb-1">موقعنا</p>
                <p className="text-primary-200">دمياط، مصر</p>
              </div>
            </MagneticWrapper>

            <MagneticWrapper>
              <div
                className="contact-card bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white h-full cursor-pointer hover:bg-white/15 transition-colors"
              >
                <Clock className="w-8 h-8 mx-auto mb-3 text-accent-400" />
                <p className="font-bold text-lg mb-1">متاحين</p>
                <p className="text-primary-200">24 ساعة / 7 أيام</p>
              </div>
            </MagneticWrapper>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div ref={pulseRef} className="rounded-full">
              <Button
                variant="accent"
                size="lg"
                icon={MessageCircle}
                onClick={handleWhatsApp}
                className="w-full sm:w-auto text-lg px-10 py-4 shadow-xl shadow-accent-500/30"
              >
                احجز عبر واتساب
              </Button>
            </div>
            
            <MagneticWrapper>
              <Button
                size="lg"
                icon={Phone}
                onClick={handleCall}
                className="w-full sm:w-auto text-lg px-10 py-4 bg-white text-primary-700 hover:bg-primary-50 shadow-xl"
              >
                اتصل الآن
              </Button>
            </MagneticWrapper>
          </div>

          {/* Trust Badge */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-primary-200 text-sm"
          >
            ✨ أكثر من 5000 رحلة ناجحة • 3000+ عميل سعيد • خدمة موثوقة منذ 2020
          </motion.p>
        </div>
      </div>
    </section>
  );
}
