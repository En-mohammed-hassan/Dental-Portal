export const CLINIC_OPEN_MINUTES = 10 * 60
export const CLINIC_CLOSE_MINUTES = 22 * 60
export const CLINIC_HOURS_MESSAGE =
  "Reservations must start at or after 10:00 AM and finish by 10:00 PM"

type ZonedDateParts = {
  dateKey: string
  minutes: number
}

function zonedDateParts(date: Date, timeZone: string): ZonedDateParts | null {
  if (Number.isNaN(date.getTime())) return null

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const parts = formatter.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  const year = value("year")
  const month = value("month")
  const day = value("day")
  const hour = Number(value("hour"))
  const minute = Number(value("minute"))

  if (!year || !month || !day || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null
  }

  return {
    dateKey: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  }
}

export function isWithinClinicHours(start: Date, end: Date, timeZone: string): boolean {
  if (end <= start) return false
  const startParts = zonedDateParts(start, timeZone)
  const endParts = zonedDateParts(end, timeZone)

  return Boolean(
    startParts &&
      endParts &&
      startParts.dateKey === endParts.dateKey &&
      startParts.minutes >= CLINIC_OPEN_MINUTES &&
      endParts.minutes <= CLINIC_CLOSE_MINUTES
  )
}
