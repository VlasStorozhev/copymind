export function getOrCreateVisitorId(input: {
  existingVisitorId?: string | null;
  createId?: () => string;
}): { visitorId: string; shouldSetCookie: boolean } {
  if (input.existingVisitorId) {
    return { visitorId: input.existingVisitorId, shouldSetCookie: false };
  }

  const visitorId = input.createId ? input.createId() : crypto.randomUUID();
  return { visitorId, shouldSetCookie: true };
}
