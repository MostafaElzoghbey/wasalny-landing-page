import { usePricingCalculator } from '@/hooks/usePricingCalculator';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PriceBreakdown } from '@/components/ui/PriceBreakdown';
import { useBatchReveal } from '@/hooks/useAnimations';
import { AlertCircle, Plane, MapPin } from 'lucide-react';
import { RouteSelectionCard } from '@/components/pricing/RouteSelectionCard';
import { VehiclePassengerCard } from '@/components/pricing/VehiclePassengerCard';
import { DateTimeCard } from '@/components/pricing/DateTimeCard';


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
            {/* Route Type Toggle */}
            <div className="pricing-card bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">نوع الرحلة</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => pricing.actions.setRouteType('travel')}
                  className={`
                    flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold
                    transition-all duration-300 transform hover:scale-105
                    ${pricing.state.routeType === 'travel'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Plane className="w-5 h-5" />
                  <span>سفر</span>
                </button>
                <button
                  onClick={() => pricing.actions.setRouteType('internal')}
                  className={`
                    flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold
                    transition-all duration-300 transform hover:scale-105
                    ${pricing.state.routeType === 'internal'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <MapPin className="w-5 h-5" />
                  <span>دمياط داخلي</span>
                </button>
              </div>
            </div>

            <div className="relative z-30">
              <RouteSelectionCard 
                routeType={pricing.state.routeType}
                fromLocation={pricing.state.fromLocation}
                setFromLocation={pricing.actions.setFromLocation}
                toLocation={pricing.state.toLocation}
                setToLocation={pricing.actions.setToLocation}
                availableFromLocations={pricing.computed.availableFromLocations}
                availableToLocations={pricing.computed.availableToLocations}
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
                 showRoundTripToggle={pricing.computed.showRoundTripToggle}
              />
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
                معلومات مهمة
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside opacity-80">
                <li>أسعار ثابتة على مدار اليوم</li>
                <li>رحلات الذهاب والعودة في نفس اليوم</li>
                <li>السعر شامل جميع الرسوم</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
