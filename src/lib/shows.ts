export interface Show {
  id: string;
  name: string;
}

export const SHOWS: Show[] = [
  { id: "1", name: "觉醒之声" },
  { id: "2", name: "延乔路上的黎明" },
  { id: "3", name: "赤水挽澜" },
  { id: "4", name: "寒夜抉择" },
];

export const VOTE_OPTIONS = [
  { id: "amazing", label: "炽烈回响", emoji: "" },
  { id: "good", label: "风骨动人", emoji: "" },
  { id: "ok", label: "意韵悠长", emoji: "" },
  { id: "poor", label: "尚待淬火", emoji: "" },
];

export function getShowById(id: string): Show | undefined {
  return SHOWS.find((s) => s.id === id);
}
