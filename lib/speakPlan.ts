export function speakPlan(
  summary: string,
  criticalAction: string,
  timeline: {
    now: string[];
    next_10_minutes: string[];
  }
) {
  speechSynthesis.cancel();

  const text = `
Emergency summary.

${summary}

Most important action.

${criticalAction}

Right now.

${timeline.now.join(". ")}

Next ten minutes.

${timeline.next_10_minutes.join(". ")}
`;

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}