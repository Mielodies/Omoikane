import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StudyCalendar({ history = [] }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const activityMap = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      map[h.study_date] = (map[h.study_date] || 0) + h.cards_studied;
    });
    return map;
  }, [history]);

  const maxDay = useMemo(() => Math.max(1, ...Object.values(activityMap)), [activityMap]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getColor(count) {
    if (count === 0) return 'bg-gray-800';
    const ratio = count / maxDay;
    if (ratio < 0.33) return 'bg-grape-300';
    if (ratio < 0.66) return 'bg-grape-500';
    return 'bg-grape-700';
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = activityMap[dateStr] || 0;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${count} cards`}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${getColor(count)} ${
                isToday ? 'ring-2 ring-grape-400' : ''
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
