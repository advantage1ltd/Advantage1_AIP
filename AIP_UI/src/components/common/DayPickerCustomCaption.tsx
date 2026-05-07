import * as React from 'react';
import { CaptionProps, useNavigation } from 'react-day-picker';

export function CustomCaption(props: CaptionProps) {
  const { calendarMonth } = props;
  const { goToMonth, nextMonth, previousMonth } = useNavigation();

	const month = calendarMonth.date.toLocaleDateString('default', { month: 'long' });
	const year = calendarMonth.date.toLocaleDateString('default', { year: 'numeric' });

  return (
		<div className="flex items-center justify-between w-full mb-4 px-2">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
				className="w-8 h-8 flex items-center justify-center text-xl text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        aria-label="Previous Month"
      >
        ‹
      </button>
			<div className="flex-1 text-center min-w-0">
				<span className="text-base font-semibold text-gray-900 whitespace-nowrap">
					{month} {year}
        </span>
      </div>
      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
				className="w-8 h-8 flex items-center justify-center text-xl text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        aria-label="Next Month"
      >
        ›
      </button>
    </div>
  );
}

