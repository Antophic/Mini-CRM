export const pipelineStages = [
  { key: "new_lead", label: "New Lead", sortOrder: 10, isWon: false, isClosed: false },
  { key: "contacted", label: "Contacted", sortOrder: 20, isWon: false, isClosed: false },
  { key: "proposal", label: "Proposal", sortOrder: 30, isWon: false, isClosed: false },
  { key: "negotiation", label: "Negotiation", sortOrder: 40, isWon: false, isClosed: false },
  { key: "won", label: "Won", sortOrder: 50, isWon: true, isClosed: true },
  { key: "lost", label: "Lost", sortOrder: 60, isWon: false, isClosed: true },
] as const;

export const statusOptions = pipelineStages.map((stage) => stage.label);

export type LeadStatus = (typeof pipelineStages)[number]["label"];

const keyByInput = new Map(
  pipelineStages.flatMap((stage) => [
    [stage.key.toLowerCase(), stage.key],
    [stage.label.toLowerCase(), stage.key],
  ]),
);

const stageByKey = new Map<string, (typeof pipelineStages)[number]>(
  pipelineStages.map((stage) => [stage.key, stage]),
);

export function getStageKeyFromInput(value: string) {
  return keyByInput.get(value.trim().toLowerCase()) ?? null;
}

export function getStageLabel(stageKey: string) {
  return stageByKey.get(stageKey)?.label ?? stageKey;
}

export function isClosedStage(stageKey: string) {
  return Boolean(stageByKey.get(stageKey)?.isClosed);
}

export function isWonStage(stageKey: string) {
  return Boolean(stageByKey.get(stageKey)?.isWon);
}
