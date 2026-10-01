export interface Sentence {
  id: number;
  text: string;
  translation: string;
  done: boolean;
}

export interface Stats {
  total: number;
  done: number;
  remaining: number;
  percent: number;
}