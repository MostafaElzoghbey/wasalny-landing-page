import { usePricingCalculator } from '@/hooks/usePricingCalculator';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PriceBreakdown } from '@/components/ui/PriceBreakdown';
import { ServiceSelector } from '@/components/ui/ServiceSelector';
import { useBatchReveal } from '@/hooks/useAnimations';
import { AlertCircle } from 'lucide-react';
import { RouteSelectionCard } from '@/components/pricing/RouteSelectionCard';
import { VehiclePassengerCard } from '@/components/pricing/VehiclePassengerCard';
import { DateTimeCard } from '@/components/pricing/DateTimeCard';


// --- Utils ---

// Internal definitions removed - imported from @/components/pricing/


export const PricingCalculator = () => {
  const [containerRef] = useBatchReveal({
    selector: '.pricing-card',
    interval: 0.1,
  });

  const pricing = usePricingCalculator();

  return (
    <section 
      id="pricing"
      ref={containerRef} 
      className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 relative"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      <div className="absolute -left-20 top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -right-20 bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeading 
          title="احسب سعر رحلتك"
          subtitle="خطط ميزانيتك بدقة واحصل على أفضل سعر لرحلتك مع وصلني"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6 isolate">
            <div className="relative z-30">
              <RouteSelectionCard 
                fromLocation={pricing.state.fromLocation}
                setFromLocation={pricing.actions.setFromLocation}
                toLocation={pricing.state.toLocation}
                setToLocation={pricing.actions.setToLocation}
                availableToLocations={pricing.computed.availableToLocations}
                currentRoute={pricing.computed.currentRoute || null}
              />
            </div>
            
            <div className="relative z-20">
              <VehiclePassengerCard 
                 vehicleCategory={pricing.state.vehicleCategory}
                 setVehicleCategory={pricing.actions.setVehicleCategory}
                 passengerCount={pricing.state.passengerCount}
                 setPassengerCount={pricing.actions.setPassengerCount}
              />
            </div>
            
            <div className="relative z-10">
              <DateTimeCard 
                 tripDate={pricing.state.tripDate}
                 setTripDate={pricing.actions.setTripDate}
                 tripTime={pricing.state.tripTime}
                 setTripTime={pricing.actions.setTripTime}
                 isRoundTrip={pricing.state.isRoundTrip}
                 setIsRoundTrip={pricing.actions.setIsRoundTrip}
                 returnDate={pricing.state.returnDate}
                 setReturnDate={pricing.actions.setReturnDate}
                 returnTime={pricing.state.returnTime}
                 setReturnTime={pricing.actions.setReturnTime}
              />
            </div>
            
            <div className="relative z-0">
              <div className="pricing-card bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                 <ServiceSelector 
                    selectedServices={pricing.state.selectedServices}
                    onToggle={pricing.actions.toggleService}
                 />
              </div>
            </div>
          </div>
          
          {/* Summary Column */}
          <div className="lg:col-span-1 sticky top-24 h-fit">
            <PriceBreakdown 
              result={pricing.computed.calculationResult}
              whatsappLink={pricing.computed.whatsappLink}
            />
            
            {/* Quick Tips */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                نصائح للتوفير
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside opacity-80">
                <li>احجز رحلة ذهاب وعودة لخصم 15%</li>
                <li>المجموعات الكبيرة (5+) تحصل على خصم إضافي</li>
                <li>الحجز المبكر (3 أيام) يوفر 10%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
