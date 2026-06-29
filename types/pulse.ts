export interface PulseResponse {
  scenario: string;

  severity: "Low" | "Medium" | "High" | "Critical";

  summary: string;

  risks: {
    type: string;
    level: number;
  }[];

  timeline: {
    now: string[];
    next_10_minutes: string[];
    next_hour: string[];
    today: string[];
  };

  checklist: string[];

  important_contacts: string[];

  follow_up_questions: string[];
}
