import NightingaleHeatmap from "../dist/index";
import * as data from "./contact-map.json";
let rendered: NightingaleHeatmap;

const dispatchMouseEvent = (
  element: Element,
  type: string,
  { offsetX, offsetY, pageX, pageY }: Record<string, number>,
) => {
  const event = new MouseEvent(type, { bubbles: true });
  Object.defineProperties(event, {
    offsetX: { value: offsetX },
    offsetY: { value: offsetY },
    pageX: { value: pageX },
    pageY: { value: pageY },
  });
  element.dispatchEvent(event);
};

describe("nightingale-heatmap tests", () => {
  beforeEach(() => {
    rendered = new NightingaleHeatmap();
    rendered.setAttribute("height", "200");
    rendered.setAttribute("width", "200");
    document.documentElement.appendChild(rendered);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rendered as any).data = data.value;
  });

  afterEach(() => {
    document.documentElement.removeChild(rendered);
  });

  test("it should render <nightingale-heatmap> element", () => {
    const element = document.querySelector("nightingale-heatmap");
    expect(element).not.toBeNull();
    expect(element instanceof NightingaleHeatmap).toBe(true);
  });

  test("it should render the correct number of x-axis ticks", () => {
    const xAxisElement = document.querySelector("g.x-axis");
    const tickElements = xAxisElement?.querySelectorAll(".tick");
    expect(tickElements).not.toBeNull();
    expect(tickElements?.length).toBe(6);
  });

  test("it should render the correct number of y-axis ticks", () => {
    const yAxisElement = document.querySelector("g.y-axis");
    const tickElements = yAxisElement?.querySelectorAll(".tick");
    expect(tickElements).not.toBeNull();
    expect(tickElements?.length).toBe(6);
  });

  test("it should emit a manager-compatible highlight on hover", () => {
    const canvas = rendered.querySelector(".canvas-heatmap");
    const changes: Array<CustomEvent> = [];
    rendered.addEventListener("change", (event) => {
      changes.push(event as CustomEvent);
    });

    expect(canvas).not.toBeNull();
    dispatchMouseEvent(canvas as Element, "mousemove", {
      offsetX: 50,
      offsetY: 50,
      pageX: 150,
      pageY: 75,
    });

    expect(changes).toHaveLength(1);
    expect(changes[0].detail.eventType).toBe("mouseover");
    expect(changes[0].detail.type).toBe("mousemove");
    expect(changes[0].detail.highlight).toBe(
      `${changes[0].detail.point.xPoint}:${changes[0].detail.point.xPoint}`,
    );
    expect(changes[0].detail.point.xPoint).toBeGreaterThan(0);
    expect(changes[0].detail.point.yPoint).toBeGreaterThan(0);
    expect(changes[0].detail.point.value).not.toBeUndefined();
    expect(changes[0].detail.coords).toEqual([150, 75]);
    expect(changes[0].detail.target).toBe(rendered);
  });

  test("it should clear the manager highlight on mouseout", () => {
    const canvas = rendered.querySelector(".canvas-heatmap");
    const changes: Array<CustomEvent> = [];
    rendered.addEventListener("change", (event) => {
      changes.push(event as CustomEvent);
    });

    expect(canvas).not.toBeNull();
    dispatchMouseEvent(canvas as Element, "mouseout", {
      offsetX: 0,
      offsetY: 0,
      pageX: 0,
      pageY: 0,
    });

    expect(changes).toHaveLength(1);
    expect(changes[0].detail.eventType).toBe("mouseout");
    expect(changes[0].detail.type).toBe("mouseout");
    expect(changes[0].detail.point).toBeNull();
    expect(changes[0].detail.target).toBe(rendered);
    expect(changes[0].detail.coords).toEqual([0, 0]);
    expect(changes[0].detail.highlight).toBeUndefined();
  });
});
