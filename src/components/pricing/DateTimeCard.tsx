import { Calendar, Clock, ArrowRightLeft } from 'lucide-react';

interface DateTimeProps {
  tripDate: Date;
  setTripDate: (date: Date) => void;
  tripTime: string;
  setTripTime: (time: string) => void;
  isRoundTrip: boolean;
  setIsRoundTrip: (isRoundTrip: boolean) => void;
  showRoundTripToggle: boolean;
}

const formatDateForInput = (date: Date | undefined) => {
  if (!date || isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  try {
    return localDate.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export const DateTimeCard = ({
  tripDate, setTripDate,
  tripTime, setTripTime,
  isRoundTrip, setIsRoundTrip,
  showRoundTripToggle
}: DateTimeProps) => {

  return (
    <div className="pricing-card bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
           <Calendar className="w-5 h-5" />
        </div>
        الموعد والتوقيت
      </h3>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <Calendar className="w-4 h-4 text-gray-400" />
               تاريخ الرحلة
            </label>
            <input 
              type="date"
              min={new Date().toISOString().split('T')[0]} // Min today
              value={formatDateForInput(tripDate)}
              onChange={(e) => setTripDate(new Date(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:[color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <Clock className="w-4 h-4 text-gray-400" />
               وقت الرحلة
            </label>
            <input 
              type="time" 
              value={tripTime}
              onChange={(e) => setTripTime(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {showRoundTripToggle && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full transition-colors ${isRoundTrip ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                      <ArrowRightLeft className="w-5 h-5" />
                   </div>
                   <div>
                      <span className="block font-medium text-gray-900 dark:text-white">ذهاب وعودة</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">في نفس اليوم</span>
                   </div>
               </div>
               
               <div 
                onClick={() => setIsRoundTrip(!isRoundTrip)}
                className={`
                  w-12 h-6 rounded-full transition-colors duration-300 relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer
                  ${isRoundTrip ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <div 
                  className={`
                    w-4 h-4 rounded-full bg-white dark:bg-black shadow-sm transition-transform duration-300 absolute top-1 left-1
                    ${isRoundTrip ? 'translate-x-6' : 'translate-x-0'}
                  `} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
