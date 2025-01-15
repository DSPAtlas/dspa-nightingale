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

// eslint-disable-next-line no-magic-numbers
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

export const LIPColorTheme = CustomElementProperty.create({
  label: "LIP Score Coloring",
  name: "lip-score-coloring",
  getData: (model) => {
      console.log('Fetching ma_quality_assessment data from model...',model);
      //const lip = new Array(1000).fill(70);
      const residueIndex = model.atomicHierarchy.residueAtomSegments.index;
      console.log("residueindex", residueIndex);
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
      
     // console.log('lipScore data found:', maQualityAssessment.lipScore);
      return { value:new Map() };
     
  },
  coloring: {
      getColor: (e) => {
          const score= e as number; // e as number;
          if (score > 7) return Color.fromRgb(120, 33, 98);
          if (score > 5) return Color.fromRgb(218, 73, 169); // High scores in red
          if (score > 4) return Color.fromRgb(242, 192, 225); // Medium scores in orange
          if (score > 3) return Color.fromRgb(251, 234, 245);
          return Color.fromRgb(172, 193, 219); // Low scores in green
      },
      defaultColor: Color(0xCCCCCC) // Default gray color if no score is available
  },
  getLabel: (e) => `LIP Score: ${e}`
});
  