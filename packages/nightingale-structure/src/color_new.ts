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

// LIP Color Scale. This is exportable, to reuse as LIP_COLOR_SCALE in NightingaleComponent.jsx
export const LIP_SCALE = [
    { threshold: 7,          color: '#289b22', label: '> 7' },
    { threshold: 5,          color: '#da49a9', label: '5 - 7' },
    { threshold: 4,          color: '#f2c0e1', label: '4 - 5' },
    { threshold: 3,          color: '#fbeaf5', label: '3 - 4' },
    { threshold: 0,          color: '#acc1db', label: '0 - 3' },
    { threshold: -Infinity,  color: '#3f3d3d', label: 'no coverage' },
];

export const LIPColorTheme = CustomElementProperty.create({
  label: "LIP Score Coloring",
  name: "lip-score-coloring",
  getData: (model) => {
      const lip = Array.from(model._staticPropertyData?.ma_quality_assessment?.data?.value.lipScore.values());
      
      if (lip && model.atomicHierarchy.residueAtomSegments) {
        const residueIndex = model.atomicHierarchy.residueAtomSegments.index;
        const residueRowCount = model.atomicHierarchy.atoms._rowCount;
  
        // Create a map where residue indices are keys, and LiP scores are values
        const lipMap = new Map();
  
        for (let i = 0; i < residueRowCount; i++) {
          const residueId = residueIndex[i]; // Map atom index to residue index
          const score = lip[residueId] || 0; // Use LiP score or default to 0
          lipMap.set(i, score); // Set atom index to score
        }
  
        console.log('lipMap created:', model);
        return { value: lipMap };
      }

      return { value:new Map() };
     
  },
  coloring: {
      // Must match LIP_COLOR_SCALE in NightingaleComponent.jsx
      getColor: (e) => {
          const score = e as number;
          for (const entry of LIP_SCALE) {
              if (score > entry.threshold) return hexToColor(entry.color);
          }
          return hexToColor(LIP_SCALE[LIP_SCALE.length - 1].color);
      },
      defaultColor: Color(0x000000)
  },
  getLabel: (e) => `LIP Score: ${e}`
});
  