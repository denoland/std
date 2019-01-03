export const parseDate = (date, format: string) => {
  let m, d, y: string;

  if (format === "mm-dd-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    [ , m, d, y] = datePattern.exec(date);
  } else if (format === "dd-mm-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    [ , d, m, y] = datePattern.exec(date);
  } else if (format === "yyyy-mm-dd") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    [ , y, m, d] = datePattern.exec(date);
  }

  return {
    year: Number(y),
    month: Number(m),
    day: Number(d)
  }
}

export const parseDateTime = (datetime, format: string) => {
  let m, d, y, ho, mi: string;

  if (format === "mm-dd-yyyy hh:mm") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [ , m, d, y, ho, mi] = datePattern.exec(datetime);
  } else if (format === "dd-mm-yyyy hh:mm") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [ , d, m, y, ho, mi] = datePattern.exec(datetime);
  } else if (format === "yyyy-mm-dd hh:mm") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    [ , y, m, d, ho, mi] = datePattern.exec(datetime);
  } else if (format === "hh:mm mm-dd-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [ , ho, mi, m, d, y] = datePattern.exec(datetime);
  } else if (format === "hh:mm dd-mm-yyyy") {
    const datePattern = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
    [ , ho, mi, d, m, y] = datePattern.exec(datetime);
  } else if (format === "hh:mm yyyy-mm-dd") {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    [ , ho, mi, y, m, d] = datePattern.exec(datetime);
  }

  return {
    year: Number(y),
    month: Number(m),
    day: Number(d),
    hours: Number(ho),
    minutes: Number(mi)
  }
}

export const currentDayOfYear = () => Math.floor(
  (new Date().getMilliseconds() - new Date(new Date().getFullYear(), 0, 0).getMilliseconds()) / 1000 / 60 / 60 / 24
);
