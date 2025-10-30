const envEnable = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENABLE_GOLDEN_TICKET : undefined;

export const features = {
  // Default off for Phase 1; can be enabled via NEXT_PUBLIC_ENABLE_GOLDEN_TICKET=true
  goldenTickets: envEnable === 'true' ? true : false,
};

export function isGoldenTicketEnabled(): boolean {
  return features.goldenTickets === true;
}


