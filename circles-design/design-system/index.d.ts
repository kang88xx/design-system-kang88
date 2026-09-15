export interface ThreeCirclesSystemController {
  destroy(): void;
}

export interface ThreeCirclesTabChangeDetail {
  tabId: string;
  panelId: string;
}

export interface ThreeCirclesSectionChangeDetail {
  id: string;
}

export interface ThreeCirclesDialogChangeDetail {
  id: string;
  open: boolean;
}

export function initThreeCirclesSystem(root?: HTMLElement | Document): ThreeCirclesSystemController;

declare global {
  interface ThreeCirclesSystemEventMap {
    "tcs:tabchange": CustomEvent<ThreeCirclesTabChangeDetail>;
    "tcs:dialogchange": CustomEvent<ThreeCirclesDialogChangeDetail>;
    "tcs:sectionchange": CustomEvent<ThreeCirclesSectionChangeDetail>;
  }

  interface HTMLElementEventMap {
    "tcs:tabchange": CustomEvent<ThreeCirclesTabChangeDetail>;
    "tcs:dialogchange": CustomEvent<ThreeCirclesDialogChangeDetail>;
    "tcs:sectionchange": CustomEvent<ThreeCirclesSectionChangeDetail>;
  }

  interface DocumentEventMap {
    "tcs:tabchange": CustomEvent<ThreeCirclesTabChangeDetail>;
    "tcs:dialogchange": CustomEvent<ThreeCirclesDialogChangeDetail>;
    "tcs:sectionchange": CustomEvent<ThreeCirclesSectionChangeDetail>;
  }
}
