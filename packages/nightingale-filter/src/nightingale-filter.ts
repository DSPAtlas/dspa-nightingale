import { customElement, property } from "lit/decorators.js";
import { html } from "lit";
import groupBy from "lodash-es/groupBy";

import NightingaleElement from "@nightingale-elements/nightingale-new-core";
import NightingaleManager from "@nightingale-elements/nightingale-manager";

export type Filter = {
  name: string;
  type: {
    name: string;
    text: string;
  };
  options: {
    labels: string[];
    colors: string[];
  };
  filterData: (data: unknown) => unknown;
};

@customElement("nightingale-filter")
class NightingaleFilter extends NightingaleElement {
  @property({ type: Array<Filter> })
  filters?: Filter[] = [];
  @property({ type: Array })
  selectedFilters?: string[] = [];
  @property({ type: String })
  for: string = "";

  #deselected = new Set();
  #manager?: NightingaleManager;

  constructor() {
    super();
    this.filters = [];
    this.selectedFilters = [];
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.closest("nightingale-manager")) {
      this.#manager = this.closest("nightingale-manager") as NightingaleManager;
      this.#manager.register(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#manager) {
      this.#manager.unregister(this);
    }
  }

  render() {
    const groupByType = groupBy(this.filters, (f: Filter) => {
      return f.type.text;
    });
    return html`
      <style>
        .protvista_checkbox {
          position: relative;
          cursor: pointer;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          margin-top: 10px;
          line-height: 24px;
          outline: none;
        }

        .protvista_checkbox_label {
          margin-left: 0.2rem;
          line-height: 1rem;
        }
      </style>
      ${Object.keys(groupByType).map(
        (type) => html`
          <h4>${type}</h4>
          <div>
            ${groupByType[type].map(
              (filterItem) => html` ${this.getCheckBox(filterItem)} `
            )}
          </div>
        `
      )}
    `;
  }

  getCheckBox(filterItem: Filter) {
    const { name, options } = filterItem;
    const { labels } = options;

    if (options.colors.length == null) {
      options.colors = [...options.colors];
    }
    const isCompound = options.colors.length > 1;
    return html`
      <label class="protvista_checkbox" tabindex="0">
        <input
          type="checkbox"
          style=${`accent-color: ${
            isCompound
              ? `
            linear-gradient(${options.colors[0]},
            ${options.colors[1]})
          `
              : options.colors[0]
          };`}
          checked="true"
          .value="${name}"
          @change="${() => this.toggleFilter(name)}"
        />
        <span class="protvista_checkbox_label"> ${labels.join("/")} </span>
      </label>
    `;
  }

  toggleFilter(name: string) {
    if (!this.#deselected.has(name)) {
      this.#deselected.add(name);
    } else {
      this.#deselected.delete(name);
    }
    this.selectedFilters = this.filters
      ?.filter((f) => !this.#deselected.has(f.name))
      .map((f) => f.name);

    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: {
          type: "filters",
          handler: "property",
          for: this.for,
          value: this.filters
            ?.filter((filter) => this.selectedFilters?.includes(filter.name))
            .map((filter) => ({
              category: filter.type.name,
              filterFn: filter.filterData,
            })),
        },
      })
    );
  }
}

export default NightingaleFilter;
