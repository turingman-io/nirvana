import { useEffect, useState } from 'react';

import { type SaveDashboardDrawer, type SaveFormDraft } from './SaveDashboardDrawer';

/**
 * Parks what a save form shows on the drawer as it changes, not on unmount: React renders the form
 * that takes over before this one's cleanup runs, so an unmount write would reach it one swap too late
 */
export function useParkSaveFormDraft(drawer: SaveDashboardDrawer, title: string, description: string) {
  useEffect(() => {
    drawer.saveFormDraft = { title, description };
  }, [drawer, title, description]);
}

/**
 * What the form this one replaced showed, read once on mount. From then on the drawer holds what this
 * form parks, so following it per render would feed every keystroke back into the defaults
 */
export function useSaveFormDraft(drawer: SaveDashboardDrawer): SaveFormDraft | undefined {
  const [draft] = useState(() => drawer.saveFormDraft);
  return draft;
}
