/**
 * Returns a new Date object that represents a date that is one week from the current date.
 *
 * @returns {Date} A new Date object that represents a date that is one week from the current date.
 */
export function computeOneWeekDateRange(): Date {
  const today = new Date();
  const oneWeekFromNowTime = new Date(
    today.getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  return oneWeekFromNowTime;
}
