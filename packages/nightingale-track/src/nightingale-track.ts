import { select, Selection } from "d3";
import NightingaleElement, {
  withDimensions,
  withPosition,
  withMargin,
  withResizable,
  withHighlight,
  withManager,
  withZoom,
  bindEvents,
  customElementOnce,
} from "@nightingale-elements/nightingale-new-core";

// import _includes from "lodash-es/includes";
// import _groupBy from "lodash-es/groupBy";
// import _union from "lodash-es/union";
// import _intersection from "lodash-es/intersection";

import { html } from "lit";
import { property } from "lit/decorators.js";

import FeatureShape, { Shapes } from "./FeatureShape";
import NonOverlappingLayout from "./NonOverlappingLayout";
import DefaultLayout from "./DefaultLayout";
import { getShapeByType, getColorByType } from "./ConfigHelper";

export type FeatureLocation = {
  fragments: Array<{
    start: number;
    end: number;
  }>;
};
export type Feature = {
  accession: string;
  color?: string;
  fill?: string;
  shape?: Shapes;
  tooltipContent?: string;
  type?: string;
  locations?: Array<FeatureLocation>;
  feature?: Feature;
  start?: number;
  end?: number;
  opacity?: number;
};

// TODO: height is not triggering a full redrawn when is changed after first render
const ATTRIBUTES_THAT_TRIGGER_REFRESH = ["length", "width", "height"];

@customElementOnce("nightingale-track")
class NightingaleTrack extends withManager(
  withZoom(
    withResizable(
      withMargin(
        withPosition(withDimensions(withHighlight(NightingaleElement))),
      ),
    ),
  ),
) {
  @property({ type: String })
  color?: string | null;
  @property({ type: String })
  shape?: string | null;
  @property({ type: String })
  layout?: "non-overlapping" | "default";

  protected featureShape = new FeatureShape();
  protected layoutObj?: DefaultLayout | NonOverlappingLayout;
  #originalData: Feature[] = [];
  #data: Feature[] = [];
  filters = null;

  protected seqG?: Selection<
    SVGGElement,
    unknown,
    HTMLElement | SVGElement | null,
    unknown
  >;
  #highlighted?: Selection<
    SVGGElement,
    unknown,
    HTMLElement | SVGElement | null,
    unknown
  >;
  protected margins?: Selection<
    SVGGElement,
    unknown,
    HTMLElement | SVGElement | null,
    unknown
  >;

  getLayout() {
    if (String(this.layout).toLowerCase() === "non-overlapping")
      return new NonOverlappingLayout({
        layoutHeight: this.height,
      });
    return new DefaultLayout({
      layoutHeight: this.height,
      margin: {
        top: this["margin-top"],
        bottom: this["margin-bottom"],
        left: this["margin-left"],
        right: this["margin-right"],
      },
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.layoutObj = this.getLayout();
    if (this.#data) this.createTrack();

    // TODO: re-enable when the dataloadre is implemented
    // this.addEventListener("load", (e) => {
    //   if (_includes(this.children, e.target)) {
    //     this.data = e.detail.payload;
    //   }
    // });
  }

  static normalizeLocations(data: Feature[]) {
    return data.map((obj) => {
      const { locations, start, end } = obj;
      return locations
        ? obj
        : Object.assign(obj, {
            locations: [
              {
                fragments: [
                  {
                    start,
                    end,
                  },
                ],
              },
            ],
          });
    });
  }

  processData(data: Feature[]) {
    this.#originalData = NightingaleTrack.normalizeLocations(data);
  }

  set data(data: Feature[]) {
    this.processData(data);
    this.applyFilters();
    this.layoutObj = this.getLayout();
    this.createTrack();
  }
  get data() {
    return this.#data;
  }
  // TODO: re-enable filters
  // set filters(filters) {
  //   this._filters = filters;
  //   this.applyFilters();
  //   this.createTrack();
  // }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (
      ATTRIBUTES_THAT_TRIGGER_REFRESH.includes(name) ||
      name.startsWith("margin-")
    ) {
      this.applyFilters();
      this.layoutObj = this.getLayout();
      this.createTrack();
    }
  }

  protected getFeatureColor(f: Feature | { feature: Feature }): string {
    const defaultColor = "gray";
    if ((f as Feature).color) {
      return (f as Feature).color || defaultColor;
    }
    if ((f as { feature: Feature })?.feature?.color) {
      return (f as { feature: Feature })?.feature?.color || defaultColor;
    }
    if (this.color) {
      return this.color;
    }
    if ((f as Feature).type) {
      return getColorByType((f as Feature).type as string);
    }
    if ((f as { feature: Feature })?.feature?.type) {
      return getColorByType((f as { feature: Feature }).feature.type as string);
    }
    return defaultColor;
  }

  protected getFeatureFillColor(f: Feature | { feature: Feature }) {
    const defaultColor = "gray";
    if ((f as Feature).fill) {
      return (f as Feature).fill || defaultColor;
    }
    if ((f as { feature: Feature })?.feature?.fill) {
      return (f as { feature: Feature }).feature.fill || defaultColor;
    }
    return this.getFeatureColor(f);
  }

  protected getShape(f: Feature | { feature: Feature }): Shapes {
    const defaultShape = "rectangle";
    if ((f as Feature).shape) {
      return (f as Feature).shape || defaultShape;
    }
    if ((f as { feature: Feature })?.feature?.shape) {
      return (f as { feature: Feature }).feature.shape || defaultShape;
    }
    if (this.shape) {
      return this.shape as Shapes;
    }
    if ((f as Feature).type) {
      return getShapeByType((f as Feature).type as string) as Shapes;
    }
    if ((f as { feature: Feature }).feature?.type) {
      return getShapeByType(
        (f as { feature: Feature }).feature.type as string,
      ) as Shapes;
    }
    return defaultShape;
  }

  protected createTrack() {
    if (!this.#data) {
      return;
    }
    this.layoutObj?.init(this.#data);

    this.svg?.selectAll("g").remove();

    this.svg = select(this as unknown as NightingaleElement)
      //.append("svg")
      .selectAll<SVGSVGElement, unknown>("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    if (!this.svg) return;
    this.seqG = this.svg.append("g").attr("class", "sequence-features");
    this.createFeatures();
    this.#highlighted = this.svg.append("g").attr("class", "highlighted");
    this.margins = this.svg.append("g").attr("class", "margin");
  }

  protected createFeatures() {
    if (!this.seqG) return;
    const featuresG = this.seqG.selectAll("g.feature-group").data(this.#data);

    const locationsG = featuresG
      .enter()
      .append("g")
      .attr("class", "feature-group")
      .attr("id", (d) => `g_${d.accession}`)
      .selectAll("g.location-group")
      .data((d) =>
        (d.locations || []).map((loc) =>
          Object.assign({}, loc, {
            feature: d,
          }),
        ),
      )
      .enter()
      .append("g")
      .attr("class", "location-group");

    const fragmentGroup = locationsG
      .selectAll("g.fragment-group")
      .data((d) =>
        d.fragments.map((loc) =>
          Object.assign({}, loc, {
            feature: d.feature,
          }),
        ),
      )
      .enter()
      .append("g")
      .attr("class", "fragment-group");

    fragmentGroup
      .append("path")
      .attr("class", (f) => `${this.getShape(f)} feature`)
      .attr("d", (f) =>
        this.featureShape.getFeatureShape(
          this.getSingleBaseWidth(),
          this.layoutObj?.getFeatureHeight() || 0,
          f.end ? f.end - f.start + 1 : 1,
          this.getShape(f),
        ),
      )
      .attr(
        "transform",
        (f) =>
          `translate(${this.getXFromSeqPosition(f.start)},${
            this.layoutObj?.getFeatureYPos(f.feature) || 0
          })`,
      )
      .style("fill", (f) => this.getFeatureFillColor(f))
      .attr("stroke", (f) => this.getFeatureColor(f))
      .style("fill-opacity", ({ feature }) => (feature.opacity ? feature.opacity : 0.9))
      .style("stroke-opacity", ({ feature }) => (feature.opacity ? feature.opacity : 0.9))
      .on("mouseover", (event, f) => {
        const tooltip = document.getElementById("tooltip");
        if (tooltip) {
          tooltip.innerHTML = `<strong>XXXXX</strong><br>Type: sssssss`;
          tooltip.style.visibility = "visible";
        }
      })
      .on("mousemove", (event) => {
        const tooltip = document.getElementById("tooltip");
        if (tooltip) {
          tooltip.style.top = `${event.pageY + 10}px`;
          tooltip.style.left = `${event.pageX + 10}px`;
        }
      })
      .on("mouseleave", () => {
        const tooltip = document.getElementById("tooltip");
        if (tooltip) {
          tooltip.style.visibility = "hidden";
        }
      });
      
    

    fragmentGroup
      .append("rect")
      .attr("class", "outer-rectangle feature")
      .attr("width", (f) =>
        Math.max(
          0,
          this.getSingleBaseWidth() * (f.end ? f.end - f.start + 1 : 1),
        ),
      )
      .attr("height", this.layoutObj?.getFeatureHeight() || 0)
      .attr(
        "transform",
        (f) =>
          `translate(${this.getXFromSeqPosition(f.start)},${
            this.layoutObj?.getFeatureYPos(f.feature) || 0
          })`,
      )
      .style("fill", "transparent")
      .attr("stroke", "transparent")
      .call(bindEvents, this);
  }

  private applyFilters() {
    if ((this.filters || []).length <= 0) {
      this.#data = this.#originalData;
      return;
    }
    // TODO: re-enable filters
    //   // Filters are OR-ed within a category and AND-ed between categories
    //   const groupedFilters = _groupBy(this._filters, "category");
    //   const filteredGroups = Object.values(groupedFilters).map((filterGroup) => {
    //     const filteredData = filterGroup.map((filterItem) =>
    //       filterItem.filterFn(this.#originalData)
    //     );
    //     return _union(...filteredData);
    //   });
    //   const intersection = _intersection(...filteredGroups);
    //   this._data = intersection;
  }

  refresh() {
    if (this.xScale && this.seqG) {
      const fragmentG = this.seqG.selectAll("g.fragment-group").data(
        this.#data.reduce(
          (acc: unknown[], f) =>
            acc.concat(
              (f.locations || []).reduce(
                (acc2: unknown[], e) =>
                  acc2.concat(
                    e.fragments.map((loc) =>
                      Object.assign({}, loc, {
                        feature: f,
                      }),
                    ),
                  ),
                [],
              ),
            ),
          [],
        ),
      );

      fragmentG
        .selectAll<SVGPathElement, Feature>("path.feature")
        .attr("d", (f) =>
          this.featureShape.getFeatureShape(
            this.getSingleBaseWidth(),
            this.layoutObj?.getFeatureHeight() || 0,
            f?.end && f?.start ? f.end - f.start + 1 : 1,
            this.getShape(f),
          ),
        )
        .attr(
          "transform",
          (f) =>
            `translate(${this.getXFromSeqPosition(
              f.start || 0,
            )},${this.layoutObj?.getFeatureYPos(f.feature as Feature)})`,
        );

      fragmentG
        .selectAll<SVGRectElement, Feature>("rect.outer-rectangle")
        .attr("width", (f) =>
          Math.max(
            0,
            this.getSingleBaseWidth() *
              (f?.end && f?.start ? f.end - f.start + 1 : 1),
          ),
        )
        .attr("height", this.layoutObj?.getFeatureHeight() || 0)
        .attr(
          "transform",
          (f) =>
            `translate(${this.getXFromSeqPosition(f.start || 0)},${
              this.layoutObj?.getFeatureYPos(f.feature as Feature) || 0
            })`,
        );
    }
    this.updateHighlight();

    this.renderMarginOnGroup(this.margins);
  }

  protected updateHighlight() {
    if (!this.#highlighted) return;
    const highlighs = this.#highlighted
      .selectAll<
        SVGRectElement,
        {
          start: number;
          end: number;
        }[]
      >("rect")
      .data(this.highlightedRegion.segments);

    highlighs
      .enter()
      .append("rect")
      .style("pointer-events", "none")
      .merge(highlighs)
      .attr("fill", this["highlight-color"])
      .attr("height", this.height)
      .attr("x", (d) => this.getXFromSeqPosition(d.start))
      .attr("width", (d) =>
        Math.max(0, this.getSingleBaseWidth() * (d.end - d.start + 1)),
      );

    highlighs.exit().remove();
  }

  zoomRefreshed() {
    if (this.getWidthWithMargins() > 0) this.refresh();
  }

  firstUpdated() {
    this.createTrack();
  }

  render() {
    return html`
    <style>
      .tooltip {
        position: absolute;
        visibility: hidden;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 4px;
        padding: 5px;
        pointer-events: none;
        font-size: 12px;
        z-index: 10;
      }
    </style>
    <svg class="container"></svg>
    <div id="tooltip" class="tooltip"></div>
  `;
  }
}

export default NightingaleTrack;

export { DefaultLayout };
export { getColorByType };
