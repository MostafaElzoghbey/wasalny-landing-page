import { motion } from 'framer-motion';
import { MapPin, Clock, ArrowLeft } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { staggerContainer, fadeInUp, viewportConfig, drawPath } from '@/lib/animations';
import { routes } from '@/data/content';

export function RoutesSection() {
  return (
    <section id="routes" className="section-padding relative overflow-hidden bg-[hsl(var(--muted))]/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="section-container relative z-10">
        <SectionHeading
          title="مساراتنا"
          subtitle="نغطي المسارات الرئيسية بين دمياط والقاهرة والمطار"
        />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Animated Map */}
          <motion.div
            className="relative order-2 lg:order-1"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6 }}
          >
            <div className="relative bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-950/20 rounded-3xl p-8 shadow-xl">
              {/* Simplified Egypt Map SVG */}
              <svg
                viewBox="0 0 400 500"
                className="w-full h-auto"
                style={{ maxHeight: '400px' }}
              >
                {/* Background */}
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-primary-200)', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-primary-400)', stopOpacity: 0.1 }} />
                  </linearGradient>
                </defs>

                {/* Nile Delta Region (simplified) */}
                <motion.path
                  d="M 100 150 Q 150 100 250 120 Q 350 140 380 200 Q 360 280 300 350 Q 250 400 200 380 Q 150 360 100 300 Q 80 220 100 150 Z"
                  fill="url(#mapGradient)"
                  stroke="var(--color-primary-400)"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={viewportConfig}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />

                {/* Route Line: Damietta to Cairo */}
                <motion.path
                  d="M 320 140 C 280 180 240 220 200 320"
                  fill="none"
                  stroke="var(--color-primary-600)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 4"
                  variants={drawPath}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportConfig}
                />

                {/* Route Line: Cairo to Airport */}
                <motion.path
                  d="M 200 320 C 180 310 160 290 140 280"
                  fill="none"
                  stroke="var(--color-accent-500)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 4"
                  variants={drawPath}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportConfig}
                />

                {/* Location: Damietta */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <circle cx="320" cy="140" r="20" fill="var(--color-primary-500)" opacity="0.2" />
                  <circle cx="320" cy="140" r="12" fill="var(--color-primary-600)" />
                  <motion.circle
                    cx="320" cy="140" r="20"
                    fill="none"
                    stroke="var(--color-primary-500)"
                    strokeWidth="2"
                    initial={{ r: 12 }}
                    animate={{ r: 30, opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <text x="320" y="100" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-sm font-bold">
                    دمياط
                  </text>
                </motion.g>

                {/* Location: Cairo */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={viewportConfig}
                  transition={{ delay: 1, type: 'spring' }}
                >
                  <circle cx="200" cy="320" r="25" fill="var(--color-primary-500)" opacity="0.2" />
                  <circle cx="200" cy="320" r="15" fill="var(--color-primary-600)" />
                  <motion.circle
                    cx="200" cy="320" r="25"
                    fill="none"
                    stroke="var(--color-primary-500)"
                    strokeWidth="2"
                    initial={{ r: 15 }}
                    animate={{ r: 35, opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <text x="200" y="365" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-sm font-bold">
                    القاهرة
                  </text>
                </motion.g>

                {/* Location: Airport */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={viewportConfig}
                  transition={{ delay: 1.5, type: 'spring' }}
                >
                  <circle cx="140" cy="280" r="18" fill="var(--color-accent-500)" opacity="0.2" />
                  <circle cx="140" cy="280" r="10" fill="var(--color-accent-600)" />
                  <motion.circle
                    cx="140" cy="280" r="18"
                    fill="none"
                    stroke="var(--color-accent-500)"
                    strokeWidth="2"
                    initial={{ r: 10 }}
                    animate={{ r: 25, opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  <text x="140" y="250" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-xs font-bold">
                    المطار
                  </text>
                </motion.g>

                {/* Animated Car */}
                <motion.g
                  initial={{ offsetDistance: '0%' }}
                  animate={{ offsetDistance: '100%' }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                  style={{ offsetPath: 'path("M 320 140 C 280 180 240 220 200 320")' }}
                >
                  <circle r="8" fill="var(--color-accent-500)" />
                </motion.g>
              </svg>
            </div>
          </motion.div>

          {/* Routes List */}
          <motion.div
            className="order-1 lg:order-2 space-y-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                variants={fadeInUp}
                custom={index}
                className="group"
              >
                <motion.div
                  className="card flex items-center gap-6 cursor-pointer"
                  whileHover={{ x: -10, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                    <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors duration-300" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-[hsl(var(--foreground))]">
                        {route.from}
                      </span>
                      <ArrowLeft className="w-5 h-5 text-primary-500 flip-rtl" />
                      <span className="font-bold text-lg text-[hsl(var(--foreground))]">
                        {route.to}
                      </span>
                    </div>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2">
                      {route.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {route.duration}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-6 h-6 text-primary-500 flip-rtl" />
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
