// All user-facing text lives here, so adding a language later means one new file.
export const t = {
  tabs: {
    timer: "Timer",
    subjects: "Subjects",
    week: "Week",
    settings: "Settings",
  },
  timer: {
    focus: "Focus",
    break: "Break",
    studying: "Studying",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    ready: "Ready when you are",
    paused: "Paused",
    shortBreak: "Short break",
    longBreak: "Long break",
    sessionLength: (min: number) => `${min} min session`,
    sessionOf: (current: number, total: number) =>
      `Session ${current} of ${total}`,
    saved: (minutes: number, subject: string) =>
      `Saved ${minutes} min of ${subject}.`,
    todayOf: (done: number, goal: number) => `${done} of ${goal} min today`,
    goalReached: "Goal reached",
    chooseSubject: "Subject",
    chooseLength: "Session length",
    minutes: (min: number) => `${min} min`,
  },
  theme: { toNight: "Night", toLight: "Light" },
  errors: {
    nameEmpty: "Enter a name for the subject.",
    nameTooLong: (max: number) => `Use ${max} characters or fewer.`,
    nameTaken: "You already have a subject with that name.",
    saveFailed: "Could not save the subject. Try again.",
  },
  placeholder: {
    subjects:
      "Subjects arrive in step 3: colors, weekly goals, and exam dates.",
    week: "The weekly chart and the session log arrive in step 4.",
    settings:
      "Settings arrive in step 5. Until then, lengths come from DEFAULT_SETTINGS in src/config.ts.",
  },
} as const;
