import { QualityAssessment, QualityAssessmentProvider } from './qualityassesment';
import { Location } from 'molstar/lib/mol-model/location';
import { Bond, Model, StructureElement, Unit } from 'molstar/lib/mol-model/structure';
import { ColorTheme, LocationColor } from 'molstar/lib/mol-theme/color';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';
import { Color } from 'molstar/lib/mol-util/color';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { CustomProperty } from 'molstar/lib/mol-model-props/common/custom-property';
import { TableLegend } from 'molstar/lib/mol-util/legend';

const DefaultColor = Color(0xf0f0f5);
const ConfidenceColors = {
    'No Score': DefaultColor,
    'Very Low': Color(0xfb3b3ff),
    'Low': Color(0xf2d9e6),
    'Confident': Color(0xd98cb3),
    'Very High': Color(0x993366)
};

const ConfidenceColorLegend = TableLegend(Object.entries(ConfidenceColors));

export function getLIPColorThemeParams(ctx: ThemeDataContext) {
    return {};
}
export type LIPColorThemeParams = ReturnType<typeof getLIPColorThemeParams>

// export function LIPColorTheme(ctx: ThemeDataContext, props: PD.Values<LIPColorThemeParams>): ColorTheme<LIPColorThemeParams> {
//     let color: LocationColor = () => DefaultColor;

//     if (ctx.structure) {
//         const l = StructureElement.Location.create(ctx.structure.root);

//         const getColor = (location: StructureElement.Location): Color => {
//             const { unit, element } = location;
//             if (!Unit.isAtomic(unit)) return DefaultColor;

//             const qualityAssessment = QualityAssessmentProvider.get(unit.model).value;
//             let score = qualityAssessment?.lipScore?.get(unit.model.atomicHierarchy.residueAtomSegments.index[element]);
//             console.log("score", score);
//             if (typeof score !== 'number') {
//                 score = unit.model.atomicConformation.B_iso_or_equiv.value(element);
//             }

//             if (score < 0) {
//                 return DefaultColor;
//             } else if (score <= 50) {
//                 return Color(0xfb3b3ff);
//             } else if (score <= 70) {
//                 return Color(0xf2d9e6);
//             } else if (score <= 90) {
//                 return Color(0xd98cb3);
//             } else {
//                 return Color(0x993366);
//             }
//         };

//         color = (location: Location) => {
//             if (StructureElement.Location.is(location)) {
//                 return getColor(location);
//             } else if (Bond.isLocation(location)) {
//                 l.unit = location.aUnit;
//                 l.element = location.aUnit.elements[location.aIndex];
//                 return getColor(l);
//             }
//             return DefaultColor;
//         };
//     }

//     return {
//         factory: LIPColorTheme,
//         granularity: 'group',
//         preferSmoothing: true,
//         color,
//         props,
//         description: 'Assigns residue colors according to the LIP score.',
//         legend: ConfidenceColorLegend
//     };
// }

export const LIPColorThemeProvider: ColorTheme.Provider<LIPColorThemeParams, 'lipScore'> = {
    name: 'lipScore',
    label: 'lipScore',
    category: ColorTheme.Category.Validation,
    factory: LIPColorTheme2,
    getParams: getLIPColorThemeParams,
    defaultValues: PD.getDefaultValues(getLIPColorThemeParams({})),
    isApplicable: (ctx: ThemeDataContext) => !!ctx.structure?.models.some(m => QualityAssessment.isApplicable(m, 'lipScore') || (m.atomicConformation.B_iso_or_equiv.isDefined)), //  && !Model.isExperimental(m))
    ensureCustomProperties: {
        attach: async (ctx: CustomProperty.Context, data: ThemeDataContext) => {
            if (data.structure) {
                for (const m of data.structure.models) {
                    await QualityAssessmentProvider.attach(ctx, m, void 0, true);
                }
            }
        },
        detach: async (data: ThemeDataContext) => {
            if (data.structure) {
                for (const m of data.structure.models) {
                    QualityAssessmentProvider.ref(m, false);
                }
            }
        }
    }
};



const RedColor = Color(0xFF0000);      // Red
const BlueColor = Color(0x0000FF);  //

export function LIPColorTheme2(ctx: ThemeDataContext, props: PD.Values<LIPColorThemeParams>): ColorTheme<LIPColorThemeParams> {
    const color: LocationColor = (location: Location) => {
        if (!StructureElement.Location.is(location)) {
            return DefaultColor; // Return default color if location is not a StructureElement
        }

        const modelIndex = StructureElement.Location.residueIndex(location);
        const score = ctx.customState?.lipscoreArray[modelIndex];  // Assuming lipscoreArray is part of the custom state

        if (typeof score === 'number') {
            return score > 50 ? RedColor : BlueColor; // Red for scores > 50, Blue otherwise
        }

        return BlueColor; // Default color if score is not a number
    };

    return {
        factory: LIPColorTheme2,
        granularity: 'group',
        color,
        props,
        description: 'Colors structure based on LIP scores.',
        legend: undefined // Define your legend here if necessary
    };
}

