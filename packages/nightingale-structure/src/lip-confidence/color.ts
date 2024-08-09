import { Location } from "molstar/lib/mol-model/location";
import { StructureElement } from "molstar/lib/mol-model/structure";
import { ColorTheme, LocationColor } from "molstar/lib/mol-theme/color";
import { ThemeDataContext } from "molstar/lib/mol-theme/theme";
import { Color } from "molstar/lib/mol-util/color";
// import { TableLegend } from 'molstar/lib/mol-util/legend';
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import { CustomProperty } from "molstar/lib/mol-model-props/common/custom-property";

import {
  LiPScoreProvider,
  getCategories,
  getLiPScore,
  isApplicable,
} from "./prop";

const LiPScoreColors: Record<string, Color> = {
  "No Score": Color.fromRgb(170, 170, 170), // not applicable
  "Very low": Color.fromRgb(255, 125, 69), // VL
  Low: Color.fromRgb(255, 219, 19), // L
  Medium: Color.fromRgb(101, 203, 243), // M
  High: Color.fromRgb(0, 83, 214), // H
};

export const LiPScoreColorThemeParams = {
  type: PD.MappedStatic("score", {
    score: PD.Group({}),
    category: PD.Group({
      kind: PD.Text(),
    }),
  }),
};

type Params = typeof LiPScoreColorThemeParams;

export function LiPScoreColorTheme(
  ctx: ThemeDataContext,
  props: PD.Values<Params>,
): ColorTheme<Params> {
  let color: LocationColor;

  if (
    ctx.structure &&
    !ctx.structure.isEmpty &&
    ctx.structure.models[0].customProperties.has(
      LiPScoreProvider.descriptor,
    )
  ) {
    if (props.type.name === "score") {
      color = (location: Location) => {
        if (StructureElement.Location.is(location)) {
          const LiPScore = getLiPScore(location);
          return LiPScoreColors[LiPScore[1]];
        }
        return LiPScoreColors["No Score"];
      };
    } else {
      const categoryProp = props.type.params.kind;
      color = (location: Location) => {
        if (StructureElement.Location.is(location)) {
          const LiPScore = getLiPScore(location);
          if (LiPScore[1] === categoryProp)
            return LiPScoreColors[LiPScore[1]];
          return LiPScoreColors["No Score"];
        }
        return LiPScoreColors["No Score"];
      };
    }
  } else {
    color = () => LiPScoreColors["No Score"];
  }

  return {
    factory: LiPScoreColorTheme,
    granularity: "group",
    color,
    props,
    description: "Assigns residue colors according to the LiP score",
  };
}

export const LiPScoreColorThemeProvider: ColorTheme.Provider<
  Params,
  "lip-score"
> = {
  name: "lip-score",
  label: "LiP Score",
  category: ColorTheme.Category.Validation,
  factory: LiPScoreColorTheme,
  getParams: (ctx) => {
    const categories = getCategories(ctx.structure);
    if (categories.length === 0) {
      return {
        type: PD.MappedStatic("score", {
          score: PD.Group({}),
        }),
      };
    }

    return {
      type: PD.MappedStatic("score", {
        score: PD.Group({}),
        category: PD.Group(
          {
            kind: PD.Select(categories[0], PD.arrayToOptions(categories)),
          },
          { isFlat: true },
        ),
      }),
    };
  },
  defaultValues: PD.getDefaultValues(LiPScoreColorThemeParams),
  isApplicable: (ctx: ThemeDataContext) =>
    isApplicable(ctx.structure?.models[0]),
  ensureCustomProperties: {
    attach: (ctx: CustomProperty.Context, data: ThemeDataContext) =>
      data.structure
        ? LiPScoreProvider.attach(
            ctx,
            data.structure.models[0],
            undefined,
            true,
          )
        : Promise.resolve(),
    detach: (data) =>
      data.structure &&
      data.structure.models[0].customProperties.reference(
        LiPScoreProvider.descriptor,
        false,
      ),
  },
};
