import { useRef } from 'react';
import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { contactInfo } from '@/data/content';
import { useMagneticButton, useBatchReveal } from '@/hooks/useAnimations';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const trustBadgeRef = useRef<HTMLParagraphElement>(null);
  
  // Use simple fade-in for Arabic text instead of character split
  useGSAP(() => {
    if (!titleRef.current) return;
    
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, {});

  const [cardsRef] = useBatchReveal({
    selector: '.contact-card',
    interval: 0.2,
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0 }
  });

  // Pulse animation for CTA button
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

  // Background blob animations
  useGSAP(() => {
    // Blob 1 - rotate and scale
    if (blob1Ref.current) {
      gsap.to(blob1Ref.current, {
        scale: 1.2,
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
      });
    }

    // Blob 2 - reverse rotation and scale
    if (blob2Ref.current) {
      gsap.to(blob2Ref.current, {
        scale: 1,
        rotation: -360,
        duration: 25,
        repeat: -1,
        ease: 'none'
      });
      gsap.fromTo(blob2Ref.current,
        { scale: 1.2 },
        { scale: 1, duration: 12.5, repeat: -1, yoyo: true, ease: 'sine.inOut' }
      );
    }

    // Blob 3 - pulsing center blob
    if (blob3Ref.current) {
      gsap.to(blob3Ref.current, {
        scale: 1.1,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  }, {});

  // Trust badge entrance
  useGSAP(() => {
    if (trustBadgeRef.current) {
      gsap.fromTo(trustBadgeRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: trustBadgeRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          },
          delay: 0.5
        }
      );
    }
  }, {});

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
        <div
          ref={blob1Ref}
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"
        />
        <div
          ref={blob2Ref}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full"
        />
        <div
          ref={blob3Ref}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl"
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
          <p
            ref={trustBadgeRef}
            className="mt-8 text-primary-200 text-sm opacity-0"
          >
            ✨ أكثر من 5000 رحلة ناجحة • 3000+ عميل سعيد • خدمة موثوقة منذ 2020
          </p>
        </div>
      </div>
    </section>
  );
}
