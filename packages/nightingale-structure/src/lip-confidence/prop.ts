/**
 * Copyright (c) 2021 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { Unit } from 'molstar/lib/mol-model/structure';
import { CustomProperty } from 'molstar/lib/mol-model-props/common/custom-property';
import { CustomModelProperty } from 'molstar/lib/mol-model-props/common/custom-model-property';
import { Model, ResidueIndex } from 'molstar/lib/mol-model/structure/model';
import { QuerySymbolRuntime } from 'molstar/lib/mol-script/runtime/query/compiler';
import { CustomPropSymbol } from 'molstar/lib/mol-script/language/symbol';
import { Type } from 'molstar/lib/mol-script/language/type';
import { CustomPropertyDescriptor } from 'molstar/lib/mol-model/custom-property';
import { MmcifFormat } from 'molstar/lib//mol-model-formats/structure/mmcif';
import { AtomicIndex } from 'molstar/lib/mol-model/structure/model/properties/atomic';

export { QualityAssessment };

interface QualityAssessment {
    localMetrics: Map<string, Map<ResidueIndex, number>>
    pLDDT?: Map<ResidueIndex, number>
    qmean?: Map<ResidueIndex, number>
    LiPScore?:  Map<ResidueIndex, number>
}

namespace QualityAssessment {
    const Empty = {
        value: {
            localMetrics: new Map()
        }
    };

    export function isApplicable(model?: Model, localMetricName?: 'pLDDT' | 'qmean'): boolean {
        if (!model || !MmcifFormat.is(model.sourceData)) return false;
        const { db } = model.sourceData.data;
        const hasLocalMetric = (
            db.ma_qa_metric.id.isDefined &&
            db.ma_qa_metric_local.ordinal_id.isDefined
        );
        if (localMetricName && hasLocalMetric) {
            for (let i = 0, il = db.ma_qa_metric._rowCount; i < il; i++) {
                if (db.ma_qa_metric.mode.value(i) !== 'local') continue;
                if (localMetricName === db.ma_qa_metric.name.value(i)) return true;
            }
            return false;
        } else {
            return hasLocalMetric;
        }
    }

    export async function obtain(ctx: CustomProperty.Context, model: Model, props: QualityAssessmentProps): Promise<CustomProperty.Data<QualityAssessment>> {
        if (!model || !MmcifFormat.is(model.sourceData)) return Empty;
        const { ma_qa_metric, ma_qa_metric_local } = model.sourceData.data.db;
        const { model_id, label_asym_id, label_seq_id, metric_id, metric_value } = ma_qa_metric_local;
        const { index } = model.atomicHierarchy;

        // for simplicity we assume names in ma_qa_metric for mode 'local' are unique
        const localMetrics = new Map<string, Map<ResidueIndex, number>>();
        const localNames = new Map<number, string>();

        for (let i = 0, il = ma_qa_metric._rowCount; i < il; i++) {
            if (ma_qa_metric.mode.value(i) !== 'local') continue;

            const name = ma_qa_metric.name.value(i);
            if (localMetrics.has(name)) {
                console.warn(`local ma_qa_metric with name '${name}' already added`);
                continue;
            }

            localMetrics.set(name, new Map());
            localNames.set(ma_qa_metric.id.value(i), name);
        }

        const residueKey: AtomicIndex.ResidueLabelKey = {
            label_entity_id: '',
            label_asym_id: '',
            label_seq_id: 0,
            pdbx_PDB_ins_code: undefined,
        };

        for (let i = 0, il = ma_qa_metric_local._rowCount; i < il; i++) {
            if (model_id.value(i) !== model.modelNum) continue;

            const labelAsymId = label_asym_id.value(i);
            const entityIndex = index.findEntity(labelAsymId);

            residueKey.label_entity_id = model.entities.data.id.value(entityIndex);
            residueKey.label_asym_id = labelAsymId;
            residueKey.label_seq_id = label_seq_id.value(i);

            const rI = index.findResidueLabel(residueKey);
            if (rI >= 0) {
                const name = localNames.get(metric_id.value(i))!;
                localMetrics.get(name)!.set(rI, metric_value.value(i));
            }
        }

        return {
            value: {
                localMetrics,
                pLDDT: localMetrics.get('pLDDT'),
                qmean: localMetrics.get('qmean'),
            }
        };
    }

    export const symbols = {
        pLDDT: QuerySymbolRuntime.Dynamic(CustomPropSymbol('ma', 'quality-assessment.pLDDT', Type.Num),
            ctx => {
                const { unit, element } = ctx.element;
                if (!Unit.isAtomic(unit)) return -1;
                const qualityAssessment = QualityAssessmentProvider.get(unit.model).value;
                return qualityAssessment?.pLDDT?.get(unit.model.atomicHierarchy.residueAtomSegments.index[element]) ?? -1;
            }
        ),
        qmean: QuerySymbolRuntime.Dynamic(CustomPropSymbol('ma', 'quality-assessment.qmean', Type.Num),
            ctx => {
                const { unit, element } = ctx.element;
                if (!Unit.isAtomic(unit)) return -1;
                const qualityAssessment = QualityAssessmentProvider.get(unit.model).value;
                return qualityAssessment?.qmean?.get(unit.model.atomicHierarchy.residueAtomSegments.index[element]) ?? -1;
            }
        ),
    };
}

export const QualityAssessmentParams = { };
export type QualityAssessmentParams = typeof QualityAssessmentParams
export type QualityAssessmentProps = PD.Values<QualityAssessmentParams>

export const QualityAssessmentProvider: CustomModelProperty.Provider<QualityAssessmentParams, QualityAssessment> = CustomModelProperty.createProvider({
    label: 'QualityAssessment',
    descriptor: CustomPropertyDescriptor({
        name: 'ma_quality_assessment',
        symbols: QualityAssessment.symbols
    }),
    type: 'static',
    defaultParams: QualityAssessmentParams,
    getParams: (data: Model) => QualityAssessmentParams,
    isApplicable: (data: Model) => QualityAssessment.isApplicable(data),
    obtain: async (ctx: CustomProperty.Context, data: Model, props: Partial<QualityAssessmentProps>) => {
        const p = { ...PD.getDefaultValues(QualityAssessmentParams), ...props };
        return await QualityAssessment.obtain(ctx, data, p);
    }
});



// from nightingale 

/* eslint-disable camelcase */
/* esling-disable no-namespace */
/**
 * Copyright (c) 2018-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Column, Table } from "molstar/lib/mol-data/db";
import { toTable } from "molstar/lib/mol-io/reader/cif/schema";
import {
  StructureElement,
  Structure,
} from "molstar/lib/mol-model/structure/structure";
import {
    IndexedCustomProperty,
  } from "molstar/lib/mol-model/structure";
import { PropertyWrapper } from "molstar/lib/mol-model-props/common/wrapper";
import { dateToUtcString } from "molstar/lib/mol-util/date";
import { arraySetAdd } from "molstar/lib/mol-util/array";

export { LiPScore };

type LiPScore = PropertyWrapper<
  | {
      score: IndexedCustomProperty.Residue<[number, string]>;
      category: string[];
    }
  | undefined
>;

export const DefaultServerUrl = "";

export const isApplicable = (model?: Model): boolean => {
  return !!model && Model.isFromPdbArchive(model);
};

export interface Info {
  timestamp_utc: string;
}

export const Schema = {
  local_metric_values: {
    label_asym_id: Column.Schema.str,
    label_comp_id: Column.Schema.str,
    label_seq_id: Column.Schema.int,
    metric_id: Column.Schema.int,
    metric_value: Column.Schema.float,
    model_id: Column.Schema.int,
    ordinal_id: Column.Schema.int,
  },
};
export type Schema = typeof Schema;

const tryGetInfoFromCif = (
  categoryName: string,
  model: Model,
): undefined | Info => {
  if (
    !MmcifFormat.is(model.sourceData) ||
    !model.sourceData.data.frame.categoryNames.includes(categoryName)
  ) {
    return;
  }
  const timestampField =
    model.sourceData.data.frame.categories[categoryName].getField(
      "metric_value",
    );
  if (!timestampField || timestampField.rowCount === 0) return;

  // eslint-disable-next-line consistent-return
  return {
    timestamp_utc: timestampField.str(0) || dateToUtcString(new Date()),
  };
};

const fromCif = (
  ctx: CustomProperty.Context,
  model: Model,
): LiPScore | undefined => {
  const info = tryGetInfoFromCif("ma_qa_metric_local", model);
  if (!info) return;
  const data = getCifData(model);
  const metricMap = createScoreMapFromCif(model, data.residues);
  // eslint-disable-next-line consistent-return
  return { info, data: metricMap };
};

export async function fromCifOrServer(
  ctx: CustomProperty.Context,
  model: Model,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: LiPScoreProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const cif = fromCif(ctx, model);
  return { value: cif };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getLiPScore(e: StructureElement.Location) {
  if (!Unit.isAtomic(e.unit)) return [-1, "No Score"];
  const prop = LiPScoreProvider.get(e.unit.model).value;
  if (!prop || !prop.data) return [-1, "No Score"];
  const rI = e.unit.residueIndex[e.element];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return prop.data.score.has(rI) ? prop.data.score.get(rI)! : [-1, "No Score"];
}

const _emptyArray: string[] = [];
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getCategories(structure?: Structure) {
  if (!structure) return _emptyArray;
  const prop = LiPScoreProvider.get(structure.models[0]).value;
  if (!prop || !prop.data) return _emptyArray;
  return prop.data.category;
}

function getCifData(model: Model) {
  if (!MmcifFormat.is(model.sourceData))
    throw new Error("Data format must be mmCIF.");
  return {
    residues: toTable(
      Schema.local_metric_values,
      model.sourceData.data.frame.categories.ma_qa_metric_local,
    ),
  };
}

const LiPScoreParams = {
  serverUrl: PD.Text(DefaultServerUrl, {
    description: "JSON API Server URL",
  }),
};
export type LiPScoreParams = typeof LiPScoreParams;
export type LiPScoreProps = PD.Values<LiPScoreParams>;

export const LiPScoreProvider: CustomModelProperty.Provider<
  LiPScoreParams,
  LiPScore
> = CustomModelProperty.createProvider({
  label: "LiP Score",
  descriptor: CustomPropertyDescriptor({
    name: "lip_score",
  }),
  type: "static",
  defaultParams: LiPScoreParams,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getParams: (data: Model) => LiPScoreParams,
  isApplicable: (data: Model) => isApplicable(data),
  obtain: async (
    ctx: CustomProperty.Context,
    data: Model,
    props: Partial<LiPScoreProps>,
  ) => {
    const p = { ...PD.getDefaultValues(LiPScoreParams), ...props };
    const conf = await fromCifOrServer(ctx, data, p);
    return conf;
  },
});

function createScoreMapFromCif(
  modelData: Model,
  residueData: Table<typeof Schema.local_metric_values>,
): LiPScore["data"] | undefined {
  const ret = new Map<ResidueIndex, [number, string]>();
  const { label_asym_id, label_seq_id, metric_value, _rowCount } = residueData;

  const categories: string[] = [];

  for (let i = 0; i < _rowCount; i++) {
    const confidenceScore = metric_value.value(i);
    const idx = modelData.atomicHierarchy.index.findResidue(
      "1",
      label_asym_id.value(i),
      label_seq_id.value(i),
      "",
    );

    let confidencyCategory = "Very low";
    if (confidenceScore > 50 && confidenceScore <= 70) {
      confidencyCategory = "Low";
    } else if (confidenceScore > 70 && confidenceScore <= 90) {
      confidencyCategory = "Medium";
    } else if (confidenceScore > 90) {
      confidencyCategory = "High";
    }

    ret.set(idx, [confidenceScore, confidencyCategory]);
    arraySetAdd(categories, confidencyCategory);
  }

  return {
    score: IndexedCustomProperty.fromResidueMap(ret),
    category: categories,
  };
}
