export interface FamilySystemController {
  destroy(): void;
}

export interface FamilyTabChangeDetail {
  tabId: string;
  panelId: string;
}

export interface FamilyDialogChangeDetail {
  id: string;
  open: boolean;
}

export function initFamilySystem(root?: HTMLElement | Document): FamilySystemController;

declare global {
  interface FamilySystemEventMap {
    "fds:tabchange": CustomEvent<FamilyTabChangeDetail>;
    "fds:dialogchange": CustomEvent<FamilyDialogChangeDetail>;
  }

  interface HTMLElementEventMap {
    "fds:tabchange": CustomEvent<FamilyTabChangeDetail>;
    "fds:dialogchange": CustomEvent<FamilyDialogChangeDetail>;
  }

  interface DocumentEventMap {
    "fds:tabchange": CustomEvent<FamilyTabChangeDetail>;
    "fds:dialogchange": CustomEvent<FamilyDialogChangeDetail>;
  }
}
