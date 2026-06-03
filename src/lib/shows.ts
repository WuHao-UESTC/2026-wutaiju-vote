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
  { id: "amazing", label: "非常精彩", emoji: "👏" },
  { id: "good", label: "不错", emoji: "👍" },
  { id: "ok", label: "一般", emoji: "😊" },
  { id: "poor", label: "还需努力", emoji: "💪" },
];

export function getShowById(id: string): Show | undefined {
  return SHOWS.find((s) => s.id === id);
}
