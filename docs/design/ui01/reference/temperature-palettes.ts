// B selected by the owner; A/C retained for comparison. K is a design warmth index.
export const temperaturePhases = [
  { hour: 5.75, label: "Świt" }, { hour: 8, label: "Rano" },
  { hour: 13, label: "Południe" }, { hour: 18, label: "Wieczór" },
  { hour: 23, label: "Noc" },
] as const;

export const nightHour = 22.5;
export const temperaturePresets = [
  ...temperaturePhases.slice(0, 4),
  { hour: 20, label: "Zmierzch 20:00" },
  { hour: 21, label: "Wieczór 21:00" },
  { hour: nightHour, label: "Noc 22:30" },
] as const;

export const temperaturePalettes = [
  {
    id: "subtle", name: "A · Delikatna zmiana", selected: false,
    description: "Delikatne ocieplenie bieli rano i wieczorem.",
    kelvin: [3300, 4300, 5200, 3600, 2300],
    backgrounds: ["#f7efdf", "#f7f2e7", "#f7f7f4", "#f4e8d6", "#122b29"],
    surfaces: ["#fffbf2", "#fffdf7", "#ffffff", "#fff8ec", "#193431"],
    muted: ["#eee7da", "#eeeae1", "#eceee8", "#ede2d1", "#294a40"],
  },
  {
    id: "distinct", name: "B · Wyraźna zmiana", selected: true,
    description: "Ciepły krem rano i wieczorem, neutralna biel w południe.",
    kelvin: [2500, 3700, 5200, 2800, 2300],
    backgrounds: ["#f4e4cb", "#f6eddc", "#f5f5f2", "#eedbbd", "#122b29"],
    surfaces: ["#fff6e5", "#fffbf2", "#ffffff", "#fff4df", "#193431"],
    muted: ["#ecdbc1", "#ece5d8", "#ebede7", "#e6d5b9", "#294a40"],
  },
  {
    id: "warm-range", name: "C · Cieplejszy zakres", selected: false,
    description: "Lekko ciepła biel także w południe; mocniejsze ocieplenie wieczorem.",
    kelvin: [2500, 3500, 4500, 2700, 2300],
    backgrounds: ["#f3e4cf", "#f7efdf", "#f8f4e9", "#efdfc5", "#122b29"],
    surfaces: ["#fff7e9", "#fffaf0", "#fffdf7", "#fff5e3", "#193431"],
    muted: ["#eadfcc", "#eee7d8", "#eee9dc", "#e6d8c0", "#294a40"],
  },
] as const;
