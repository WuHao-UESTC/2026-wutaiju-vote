export interface Show {
  id: string;
  name: string;
}

export const SHOWS: Show[] = [
  { id: "1", name: "第一幕" },
  { id: "2", name: "第二幕" },
  { id: "3", name: "第三幕" },
  { id: "4", name: "第四幕" },
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
