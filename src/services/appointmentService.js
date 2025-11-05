import { clinicSchedule } from "../rules/clinicSchedule.js";
import dayjs from "dayjs";

export function generateAvailableAppointments() {
  const today = dayjs();
  const appointments = [];

  Object.entries(clinicSchedule).forEach(([key, clinic]) => {
    const days = clinic.availableDays;
    days.forEach((day) => {
      let date = today.day(dayjs().day(day).day());
      if (date.isBefore(today)) date = date.add(1, "week");

      let start, end;
      if (typeof clinic.hours.start === "string") {
        start = clinic.hours.start;
        end = clinic.hours.end;
      } else {
        start = clinic.hours[day].start;
        end = clinic.hours[day].end;
      }

      let current = dayjs(`${date.format("YYYY-MM-DD")}T${start}`);
      const last = dayjs(`${date.format("YYYY-MM-DD")}T${end}`);

      while (current.isBefore(last)) {
        appointments.push({
          clinic: key,
          date: current.format("YYYY-MM-DD"),
          time: current.format("HH:mm")
        });
        current = current.add(clinic.interval, "minute");
      }
    });
  });

  return appointments;
}
