import React from 'react';
import { type PriceCalculationResult, formatPrice } from '@/utils/pricingCalculator';
import { Info, MessageCircle, AlertCircle } from 'lucide-react';

interface PriceBreakdownProps {
  result: PriceCalculationResult | null;
  whatsappLink: string;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  result,
  whatsappLink,
}) => {
  if (!result) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center items-center text-center opacity-60">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          أدخل تفاصيل رحلتك لرؤية تفاصيل السعر هنا
        </p>
      </div>
    );
  }

  const { breakdown, details, warnings } = result;

  return (
    <div className="bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          ملخص السعر
          {details.isRoundTrip && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              ذهاب وعودة
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {details.routeNameAr}
        </p>
      </div>

      {/* Breakdown Items */}
      <div className="p-6 space-y-4">
        {/* Vehicle Type */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-300">نوع السيارة</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {breakdown.vehicleType}
          </span>
        </div>

        {/* Passenger Count */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-300">عدد الركاب</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {details.passengerCount}
          </span>
        </div>

        {/* Trip Type */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-300">نوع الرحلة</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {details.isRoundTrip ? 'ذهاب وعودة' : 'ذهاب فقط'}
          </span>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 space-y-1">
            {warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t-2 border-gray-100 dark:border-gray-800 my-4"></div>

        {/* Total Price & CTA */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-gray-900 dark:text-white">الإجمالي</span>
            <span className="text-3xl font-extrabold text-primary">
              {formatPrice(breakdown.total)}
            </span>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg
              transition-all duration-300 transform hover:-translate-y-1 active:scale-95
              ${warnings.length > 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none' 
                : 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-500/20'
              }
            `}
          >
            <MessageCircle className="w-6 h-6" />
            تأكيد الحجز عبر واتساب
          </a>
          
          <p className="text-xs text-center text-gray-400">
            * السعر نهائي وشامل جميع الرسوم
          </p>
        </div>
      </div>
    </div>
  );
};
