// /* eslint-disable no-case-declarations, camelcase, no-namespace */
// import { OrderedSet } from "molstar/lib/mol-data/int";
// import { Loci } from "molstar/lib/mol-model/loci";
// import { PluginBehavior } from "molstar/lib/mol-plugin/behavior/behavior";
// import { Column, Table } from "molstar/lib/mol-data/db";
// import { toTable } from "molstar/lib/mol-io/reader/cif/schema";
// import {
//   Model,
//   ResidueIndex,
//   Unit,
//   IndexedCustomProperty,
// } from "molstar/lib/mol-model/structure";
// import {
//   StructureElement,
//   Structure,
// } from "molstar/lib/mol-model/structure/structure";
// import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
// import { MmcifFormat } from "molstar/lib/mol-model-formats/structure/mmcif";
// import { PropertyWrapper } from "molstar/lib/mol-model-props/common/wrapper";
// import { CustomProperty } from "molstar/lib/mol-model-props/common/custom-property";
// import { CustomModelProperty } from "molstar/lib/mol-model-props/common/custom-model-property";
// import { CustomPropertyDescriptor } from "molstar/lib/mol-model/custom-property";
// import { dateToUtcString } from "molstar/lib/mol-util/date";
// import { arraySetAdd } from "molstar/lib/mol-util/array";



// export default PluginBehavior.create<{
//   autoAttach: boolean;
//   showTooltip: boolean;
// }>({
//   name: "lip-prop",
//   category: "custom-props",
//   display: {
//     name: "LIP Score",
//     description: "LIP Score.",
//   },
//   ctor: class extends PluginBehavior.Handler<{
//     autoAttach: boolean;
//     showTooltip: boolean;
//   }> {
//     private provider = LIPScoreProvider;

//     private labelLIPScore = {
//       label: (loci: Loci): string | undefined => {
//         if (
//           this.params.showTooltip &&
//           loci.kind === "element-loci" &&
//           loci.elements.length !== 0
//         ) {
//           const e = loci.elements[0];
//           const u = e.unit;
//           if (!u.model.customProperties.hasReference(LIPScoreProvider.descriptor))
//             return;

//           const se = StructureElement.Location.create(loci.structure, u, u.elements[OrderedSet.getAt(e.indices, 0)]);
//           const LIPScore = getConfidenceScore(se);
//           return LIPScore && +LIPScore[0] > 0 ? `Confidence score: ${LIPScore[0]} <small>( ${LIPScore[1]} )</small>` : ``;
//         }
//       },
//     };

//     register(): void {
//       this.ctx.customModelProperties.register(this.provider, this.params.autoAttach);
//       this.ctx.managers.lociLabels.addProvider(this.labelLIPScore);
//       this.ctx.representation.structure.themes.colorThemeRegistry.add(LIPColorThemeProvider);
//     }

//     update(p: { autoAttach: boolean; showTooltip: boolean }) {
//       const updated = this.params.autoAttach !== p.autoAttach;
//       this.params.autoAttach = p.autoAttach;
//       this.params.showTooltip = p.showTooltip;
//       this.ctx.customModelProperties.setDefaultAutoAttach(this.provider.descriptor.name, this.params.autoAttach);
//       return updated;
//     }

//     unregister() {
//       this.ctx.customModelProperties.unregister(LIPScoreProvider.descriptor.name);
//       this.ctx.managers.lociLabels.removeProvider(this.labelLIPScore);
//       this.ctx.representation.structure.themes.colorThemeRegistry.remove(LIPColorThemeProvider);
//     }
//   },
//   params: () => ({
//     autoAttach: PD.Boolean(false),
//     showTooltip: PD.Boolean(true),
//   }),
// });

// import { Location } from "molstar/lib/mol-model/location";
// import { ColorTheme, LocationColor } from "molstar/lib/mol-theme/color";
// import { ThemeDataContext } from "molstar/lib/mol-theme/theme";
// import { Color } from "molstar/lib/mol-util/color";

// const LIPColors: Record<string, Color> = {
//   "No Score": Color.fromRgb(170, 170, 170), // not applicable
//   "Very low": Color.fromRgb(255, 125, 69), // VL
//   Low: Color.fromRgb(255, 219, 19), // L
//   Medium: Color.fromRgb(101, 203, 243), // M
//   High: Color.fromRgb(0, 83, 214), // H
// };

// export const LIPColorThemeParams = {
//   type: PD.MappedStatic("score", {
//     score: PD.Group({}),
//     category: PD.Group({
//       kind: PD.Text(),
//     }),
//   }),
// };

// type Params = typeof LIPColorThemeParams;

// export function LIPColorTheme(ctx: ThemeDataContext, props: PD.Values<Params>): ColorTheme<Params> {
//   let color: LocationColor;

//   if (
//     ctx.structure &&
//     !ctx.structure.isEmpty &&
//     ctx.structure.models[0].customProperties.has(LIPScoreProvider.descriptor)
//   ) {
//     if (props.type.name === "score") {
//       color = (location: Location) => {
//         if (StructureElement.Location.is(location)) {
//           const LIPScore = getConfidenceScore(location);
//           return LIPColors[LIPScore[1]];
//         }
//         return LIPColors["No Score"];
//       };
//     } else {
//       const categoryProp = props.type.params.kind;
//       color = (location: Location) => {
//         if (StructureElement.Location.is(location)) {
//           const LIPScore = getConfidenceScore(location);
//           if (LIPScore[1] === categoryProp)
//             return LIPColors[LIPScore[1]];
//           return LIPColors["No Score"];
//         }
//         return LIPColors["No Score"];
//       };
//     }
//   } else {
//     color = () => LIPColors["No Score"];
//   }

//   return {
//     factory: LIPColorTheme,
//     granularity: "group",
//     color,
//     props,
//     description: "Assigns residue colors according to the LIP score",
//   };
// }

// export const LIPColorThemeProvider: ColorTheme.Provider<Params, "lipscore"> = {
//   name: "lipscore",
//   label: "LIP Score Color",
//   category: ColorTheme.Category.Validation,
//   factory: LIPColorTheme,
//   getParams: (ctx) => {
//     const categories = getCategories(ctx.structure);
//     if (categories.length === 0) {
//       return {
//         type: PD.MappedStatic("score", {
//           score: PD.Group({}),
//         }),
//       };
//     }

//     return {
//       type: PD.MappedStatic("score", {
//         score: PD.Group({}),
//         category: PD.Group(
//           {
//             kind: PD.Select(categories[0], PD.arrayToOptions(categories)),
//           },
//           { isFlat: true },
//         ),
//       }),
//     };
//   },
//   defaultValues: PD.getDefaultValues(LIPColorThemeParams),
//   isApplicable: (ctx: ThemeDataContext) => isApplicable(ctx.structure?.models[0]),
//   ensureCustomProperties: {
//     attach: (ctx: CustomProperty.Context, data: ThemeDataContext) => data.structure ? LIPScoreProvider.attach(ctx, data.structure.models[0], undefined, true) : Promise.resolve(),
//     detach: (data) => data.structure && data.structure.models[0].customProperties.reference(LIPScoreProvider.descriptor, false),
//   },
// };

// /**
//  * Copyright (c) 2018-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
//  *
//  * @author David Sehnal <david.sehnal@gmail.com>
//  * @author Alexander Rose <alexander.rose@weirdbyte.de>
//  */

// type LIP = PropertyWrapper<{
//   score: IndexedCustomProperty.Residue<[number, string]>;
//   category: string[];
// } | undefined>;

// export const DefaultServerUrl = "";

// export const isApplicable = (model?: Model): boolean => !!model && model.entryId.startsWith('AF');

// export interface Info {
//   timestamp_utc: string;
// }

// export const Schema = {
//   local_metric_values: {
//     label_asym_id: Column.Schema.str,
//     label_comp_id: Column.Schema.str,
//     label_seq_id: Column.Schema.int,
//     metric_id: Column.Schema.int,
//     metric_value: Column.Schema.float,
//     model_id: Column.Schema.int,
//     ordinal_id: Column.Schema.int,
//   },
// };

// export type Schema = typeof Schema;

// const tryGetInfoFromCif = (
//   categoryName: string,
//   model: Model,
// ): undefined | Info => {
//   if (
//     !MmcifFormat.is(model.sourceData) ||
//     !model.sourceData.data.frame.categoryNames.includes(categoryName)
//   ) {
//     return;
//   }
//   const timestampField = model.sourceData.data.frame.categories[categoryName].getField("metric_value");
//   if (!timestampField || timestampField.rowCount === 0) return;

//   return {
//     timestamp_utc: timestampField.str(0) || dateToUtcString(new Date()),
//   }; 
// };

// const fromCif = (
//   ctx: CustomProperty.Context,
//   model: Model,
// ): LIPScore | undefined => {
//   const info = tryGetInfoFromCif("ma_qa_metric_local", model);
//   if (!info) return;
//   const data = getCifData(model);
//   const metricMap = createScoreMapFromCif(model, data.residues);
//   return { info, data: metricMap };
// };

// export async function fromCifOrServer(
//   ctx: CustomProperty.Context,
//   model: Model,
//   props: LIPProps,
// ): Promise<any> {
//   const cif = fromCif(ctx, model);
//   return { value: cif };
// }

// export function getConfidenceScore(location: StructureElement.Location) {
//   if (!Unit.isAtomic(location.unit)) return [-1, "No Score"];
//   const prop = LIPScoreProvider.get(location.unit.model).value;
//   if (!prop || !prop.data) return [-1, "No Score"];
//   const rI = location.unit.residueIndex[location.element];
//   return prop.data.score.has(rI) ? prop.data.score.get(rI) : [-1, "No Score"];
// }

// const _emptyArray: string[] = [];
// export function getCategories(structure?: Structure) {
//   if (!structure) return _emptyArray;
//   const prop = LIPScoreProvider.get(structure.models[0]).value;
//   if (!prop || !prop.data) return _emptyArray;
//   return prop.data.category;
// }

// function getCifData(model: Model) {
//   if (!MmcifFormat.is(model.sourceData))
//     throw new Error("Data format must be mmCIF.");
//   return {
//     residues: toTable(
//       Schema.local_metric_values,
//       model.sourceData.data.frame.categories.ma_qa_metric_local,
//     ),
//   };
// }

// const LIPScoreParams = {
//   serverUrl: PD.Text(DefaultServerUrl, {
//     description: "JSON API Server URL",
//   }),
// };

// export type LIPScoreParams = typeof LIPScoreParams;
// export type LIPScore = PD.Values<LIPScoreParams>;

// export const LIPScoreProvider: CustomModelProperty.Provider<
//   LIPScoreParams,
//   LIPScore
// > = CustomModelProperty.createProvider({
//   label: "LIP Score",
//   descriptor: CustomPropertyDescriptor({
//     name: "lip_score",
//   }),
//   type: "static",
//   defaultParams: LIPScoreParams,
//   getParams: (data: Model) => LIPScoreParams,
//   isApplicable: (data: Model) => isApplicable(data),
//   obtain: async (
//     ctx: CustomProperty.Context,
//     data: Model,
//     props: Partial<LIPScore>,
//   ) => {
//     const p = { ...PD.getDefaultValues(LIPScoreParams), ...props };
//     const score = await fromCifOrServer(ctx, data, p);
//     return score;
//   },
// });

// function createScoreMapFromCif(
//   modelData: Model,
//   residueData: Table<typeof Schema.local_metric_values>,
// ): LIPScore["data"] | undefined {
//   const ret = new Map<ResidueIndex, [number, string]>();
//   const { label_asym_id, label_seq_id, metric_value, _rowCount } = residueData;

//   const categories: string[] = [];

//   for (let i = 0; i < _rowCount; i++) {
//     const lipScore = metric_value.value(i);
//     const idx = modelData.atomicHierarchy.index.findResidue(
//       "1",
//       label_asym_id.value(i),
//       label_seq_id.value(i),
//       "",
//     );

//     let confidenceCategory = "Very low";
//     if (lipScore > 50 && lipScore <= 70) {
//       confidenceCategory = "Low";
//     } else if (lipScore > 70 && lipScore <= 90) {
//       confidenceCategory = "Medium";
//     } else if (lipScore > 90) {
//       confidenceCategory = "High";
//     }

//     ret.set(idx, [lipScore, confidenceCategory]);
//     arraySetAdd(categories, confidenceCategory);
//   }

//   return {
//     score: IndexedCustomProperty.fromResidueMap(ret),
//     category: categories,
//   };
// }
