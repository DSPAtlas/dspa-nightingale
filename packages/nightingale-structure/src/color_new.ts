import { CustomElementProperty} from "molstar/lib/mol-model-props/common/custom-element-property";
import { Color } from "molstar/lib/mol-util/color";
import { scaleLinear, color } from "d3";

const AM_COLOR_SCALE = {
  checkpoints: [0, 10, 20, 30, 40, 50, 60, 70, 100],
  colors: [
    "#2166ac",
    "#4290bf",
    "#8cbcd4",
    "#c3d6e0",
    "#e2e2e2",
    "#edcdba",
    "#e99e7c",
    "#d15e4b",
    "#b2182b",
  ],
};

const amColorScale = scaleLinear(
  AM_COLOR_SCALE.checkpoints,
  AM_COLOR_SCALE.colors
);

const defaultColor = Color(0x000000);

interface CustomProperty {
    // Add the properties and methods you expect to exist on CustomProperty
    definition: any;
    name?: string;  // Including name here if it's expected to be used
}

// Extend the interface for your specific use
interface NamedCustomProperty extends CustomProperty {
    name: string;
}

// Helper to convert hex strings (e.g., '#782162') to Mol* Color.
const hexToColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return Color.fromRgb(r, g, b);
};

const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
});

const interpolateChannel = (start: number, end: number, ratio: number) =>
    Math.round(start + (end - start) * ratio);

const getInterpolatedLipColor = (score: number) => {
    const noCoverageColor = LIP_SCALE[LIP_SCALE.length - 1].color;

    if (!Number.isFinite(score) || score <= 0) {
        return hexToColor(noCoverageColor);
    }

    const gradientStops = LIP_SCALE.filter((entry) => Number.isFinite(entry.threshold)).sort(
        (left, right) => left.threshold - right.threshold
    );

    if (score <= gradientStops[0].threshold) {
        return hexToColor(gradientStops[0].color);
    }

    if (score >= gradientStops[gradientStops.length - 1].threshold) {
        return hexToColor(gradientStops[gradientStops.length - 1].color);
    }

    for (let i = 0; i < gradientStops.length - 1; i++) {
        const lowerStop = gradientStops[i];
        const upperStop = gradientStops[i + 1];

        if (score <= upperStop.threshold) {
            const ratio = (score - lowerStop.threshold) / (upperStop.threshold - lowerStop.threshold);
            const lowerColor = hexToRgb(lowerStop.color);
            const upperColor = hexToRgb(upperStop.color);

            return Color.fromRgb(
                interpolateChannel(lowerColor.r, upperColor.r, ratio),
                interpolateChannel(lowerColor.g, upperColor.g, ratio),
                interpolateChannel(lowerColor.b, upperColor.b, ratio)
            );
        }
    }

    return hexToColor(gradientStops[gradientStops.length - 1].color);
};

// LIP Color Scale. This is exportable, to reuse as LIP_COLOR_SCALE in NightingaleComponent.jsx
// Normalized [0, 1] range (scores from backend are min-max normalized)
export const LIP_SCALE = [
    { threshold: 1.0,        color: '#da49a9', label: 'Very High ( ≥ 0.8 )' },
    { threshold: 0.8,        color: '#f2c0e1', label: 'High ( 0.7 - 0.8 )' },
    { threshold: 0.6,        color: '#fbeaf5', label: 'Medium-High ( 0.6 - 0.7 )' },
    { threshold: 0.4,        color: '#acc1db', label: 'Medium ( 0.4-0.6 )' },
    { threshold: 0.0,        color: '#346aae', label: 'Low ( < 0.4 )' },
    { threshold: -Infinity,  color: '#3f3d3d', label: 'No coverage' },
];

export const LIPColorTheme = CustomElementProperty.create({
  label: "LIP Score Coloring",
  name: "lip-score-coloring",
  getData: (model) => {
      const lipScoreMap = model._staticPropertyData?.ma_quality_assessment?.data?.value.lipScore;
      
      if (lipScoreMap && model.atomicHierarchy.residueAtomSegments) {
        const residueIndex = model.atomicHierarchy.residueAtomSegments.index;
        const label_seq_id = model.atomicHierarchy.residues.label_seq_id;
        const residueRowCount = model.atomicHierarchy.atoms._rowCount;
  
        // Create a map where atom indices are keys, and LiP scores are values
        const lipMap = new Map();
  
        for (let i = 0; i < residueRowCount; i++) {
          const resId = residueIndex[i]; // Map atom index to internal residue index
          const seqId = label_seq_id.value(resId); // 1-based sequence id
          const score = lipScoreMap.get(seqId - 1); // lipScoreMap uses 0-based index
          lipMap.set(i, score !== undefined ? score : 0); // Set atom index to score
        }
  
        console.log('lipMap created for', residueRowCount, 'atoms');
        return { value: lipMap };
      }

      return { value:new Map() };
     
  },
  coloring: {
      // Must match LIP_COLOR_SCALE in NightingaleComponent.jsx
      getColor: (e) => {
          const score = e as number;
          return getInterpolatedLipColor(score);
      },
      defaultColor: Color(0x3f3d3d20)
  },
  getLabel: (e) => `LIP Score: ${e}`
});
  
