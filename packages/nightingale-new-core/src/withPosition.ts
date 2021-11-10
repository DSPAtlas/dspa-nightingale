import NightingaleBaseElement, {
  Constructor,
} from "./nightingale-base-element";
import { property } from "lit/decorators.js";

export interface withPositionInterface extends NightingaleBaseElement {
  displaystart?: number;
  displayend?: number;
  length?: number;
}

const withPosition = <T extends Constructor<NightingaleBaseElement>>(
  superClass: T,
  options: {
    displaystart: number;
    displayend: number;
    length: number;
  } = {
    displaystart: 1,
    displayend: 1,
    length: 0,
  }
) => {
  class WithPosition extends superClass {
    @property()
    displaystart: number = options.displaystart;
    @property()
    displayend: number = options.displayend;
    @property()
    length: number = options.length;
  }
  return WithPosition as Constructor<withPositionInterface> & T;
};

export default withPosition;