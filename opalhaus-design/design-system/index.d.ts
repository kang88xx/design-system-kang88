export interface OpalhausController {
  /** Initialize new descendants after framework or DOM updates. */
  refresh(): void;
  /** Remove listeners and restore attributes changed by the controller. Idempotent. */
  destroy(): void;
}
/** Call after DOM mount. Repeated calls with the same root return the active controller. */
export declare function initOpalhaus(root?: Document | Element): OpalhausController;
