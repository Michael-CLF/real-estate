/** Component-scoped record of the last successful save; never marks failures saved. */
export class SuccessfulDraftSave {
  private snapshot: string | null = null;
  fingerprint(offerUid: string, versionUid: string, payload: unknown): string {
    return JSON.stringify([offerUid, versionUid, payload]);
  }
  matches(snapshot: string): boolean { return this.snapshot === snapshot; }
  record(snapshot: string): void { this.snapshot = snapshot; }
}
