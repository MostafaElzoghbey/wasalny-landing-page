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
  } catch {
    return '';
  }
};

/** Format a Date to a human-readable Arabic date string */
const formatDateDisplay = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return 'اختر التاريخ';
  try {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'اختر التاريخ';
  }
};

/** Format a time string (HH:mm) to a human-readable Arabic string */
const formatTimeDisplay = (time: string): string => {
  if (!time) return 'اختر الوقت';
  try {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'اختر الوقت';
  }
};

export const DateTimeCard = ({
  tripDate, setTripDate,
  tripTime, setTripTime,
  isRoundTrip, setIsRoundTrip,
  showRoundTripToggle
}: DateTimeProps) => {

  return (
    <div className="pricing-card bg-[hsl(var(--card))] rounded-xl p-6 shadow-sm border border-[hsl(var(--border))] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Calendar className="w-5 h-5" />
        </div>
        الموعد والتوقيت
      </h3>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              تاريخ الرحلة
            </label>
            <div className="relative">
              {/* Visible styled display */}
              <div className="pointer-events-none absolute inset-0 flex items-center gap-3 px-4 z-10">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[hsl(var(--foreground))] font-medium text-sm truncate">
                  {formatDateDisplay(tripDate)}
                </span>
              </div>
              {/* Actual native input overlaid */}
              <input
                type="date"
                lang="ar"
                dir="rtl"
                min={new Date().toISOString().split('T')[0]}
                value={formatDateForInput(tripDate)}
                onChange={(e) => setTripDate(new Date(e.target.value))}
                className="date-time-input w-full h-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-transparent cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all hover:border-primary/30 dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              وقت الرحلة
            </label>
            <div className="relative">
              {/* Visible styled display */}
              <div className="pointer-events-none absolute inset-0 flex items-center gap-3 px-4 z-10">
                <div className="p-1.5 bg-accent-500/10 rounded-md">
                  <Clock className="w-4 h-4 text-accent-500" />
                </div>
                <span className="text-[hsl(var(--foreground))] font-medium text-sm">
                  {formatTimeDisplay(tripTime)}
                </span>
              </div>
              {/* Actual native input overlaid */}
              <input
                type="time"
                lang="ar"
                dir="rtl"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                className="date-time-input w-full h-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-transparent cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all hover:border-primary/30 dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {showRoundTripToggle && (
          <div className="p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]">
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
