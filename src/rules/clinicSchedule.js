export const clinicSchedule = {
  maccabi: {
    name: "מרפאת מכבי בלניאדו",
    availableDays: ["Sunday", "Thursday"],
    hours: { start: "14:00", end: "17:00" },
    interval: 15, // דקות
    membersOnly: ["Maccabi"]
  },
  private: {
    name: "המרפאה הפרטית",
    availableDays: ["Wednesday", "Monday"],
    hours: {
      Wednesday: { start: "08:30", end: "12:15" },
      Monday: { start: "15:00", end: "17:00" } // אחת לשבועיים
    },
    interval: 15,
    membersAllowed: ["Clalit", "Meuhedet", "Leumit", "Private"]
  }
};
