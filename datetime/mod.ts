export const parseDate = (dateStr: string, format: string): Date => {
  let m, d, y: string;

  if (format === "mm-dd-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    [, m, d, y] = datePattern.exec(dateStr);
  } else if (format === "dd-mm-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    [, d, m, y] = datePattern.exec(dateStr);
  } else if (format === "yyyy-mm-dd") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    [, y, m, d] = datePattern.exec(dateStr);
  }

  return new Date(Number(y), Number(m) - 1, Number(d));
};

export const parseDateTime = (datetimeStr: string, format: string): Date => {
  let m, d, y, ho, mi: string;

  if (format === "mm-dd-yyyy hh:mm") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [, m, d, y, ho, mi] = datePattern.exec(datetimeStr);
  } else if (format === "dd-mm-yyyy hh:mm") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [, d, m, y, ho, mi] = datePattern.exec(datetimeStr);
  } else if (format === "yyyy-mm-dd hh:mm") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    [, y, m, d, ho, mi] = datePattern.exec(datetimeStr);
  } else if (format === "hh:mm mm-dd-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [, ho, mi, m, d, y] = datePattern.exec(datetimeStr);
  } else if (format === "hh:mm dd-mm-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [, ho, mi, d, m, y] = datePattern.exec(datetimeStr);
  } else if (format === "hh:mm yyyy-mm-dd") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    [, ho, mi, y, m, d] = datePattern.exec(datetimeStr);
  }

  return new Date(Number(y), Number(m) - 1, Number(d), Number(ho), Number(mi));
};

export const currentDayOfYear = () =>
  Math.floor(
    (new Date().getMilliseconds() -
      new Date(new Date().getFullYear(), 0, 0).getMilliseconds()) /
      1000 /
      60 /
      60 /
      24
  );
