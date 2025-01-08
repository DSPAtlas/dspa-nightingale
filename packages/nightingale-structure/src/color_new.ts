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
        console.log('Fetching ma_quality_assessment data from model...');
        const lip = new Array(254).fill(70);
        
        const maQualityAssessment = model._staticPropertyData?.ma_quality_assessment?.data?.value;
        if (lip) {
            // Create a Map where each key is the index and the value is the value from the lip array
            const lipMap = new Map(lip.map((value, index) => [index, value]));
            console.log('lipMap created:', lipMap);
            return { value: lipMap };
        }
        if (!maQualityAssessment || !maQualityAssessment.lipScore) {
            return { value: new Map() };
        }
        
       // console.log('lipScore data found:', maQualityAssessment.lipScore);
        return { value: maQualityAssessment.lipScore };
       
    },
    coloring: {
        getColor: (e) => {
            const score= e as number; // e as number;
            if (score > 90) return Color.fromRgb(255, 0, 0); // High scores in red
            if (score > 50) return Color.fromRgb(255, 165, 0); // Medium scores in orange
            return Color.fromRgb(0, 255, 0); // Low scores in green
        },
        defaultColor: Color(0xCCCCCC) // Default gray color if no score is available
    },
    getLabel: (e) => `LIP Score: ${e}`
});
