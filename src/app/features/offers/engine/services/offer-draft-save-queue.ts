/** One entry's pending edits and active save; failed edits stay available for retry. */
export class OfferDraftSaveQueue<TChange> {
  pendingDraftChange: TChange | null = null;
  private activeSave: Promise<void> | null = null;

  flush(
    prepareSave: (change: TChange) => (() => Promise<void>) | null,
    setSaving: (saving: boolean) => void,
    reportError: (error: unknown) => void,
  ): Promise<void> {
    if (this.activeSave) {
      return this.activeSave.then(() => this.pendingDraftChange
        ? this.flush(prepareSave, setSaving, reportError)
        : undefined);
    }
    const change = this.pendingDraftChange;
    if (!change) return Promise.resolve();
    const saveDraft = prepareSave(change);
    if (!saveDraft) return Promise.resolve();
    this.pendingDraftChange = null;
    setSaving(true);
    const save = saveDraft()
      .catch(error => {
        if (!this.pendingDraftChange) this.pendingDraftChange = change;
        reportError(error);
        throw error;
      })
      .finally(() => {
        this.activeSave = null;
        setSaving(false);
      });
    this.activeSave = save;
    return save;
  }
}
