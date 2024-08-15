/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "molstar/lib/mol-util/polyfill";
import { DefaultPluginSpec, PluginSpec } from "molstar/lib/mol-plugin/spec";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import {
  StructureElement,
  StructureProperties,
  StructureSelection,
} from "molstar/lib/mol-model/structure";
import { PluginLayoutControlsDisplay } from "molstar/lib/mol-plugin/layout";
import { Script } from "molstar/lib/mol-script/script";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Color } from "molstar/lib/mol-util/color";

//import LiPConfidenceScore from "./lip-confidence/behavior";

import { PresetStructureRepresentations, StructureRepresentationPresetProvider } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { QualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/prop';
import { QualityAssessmentPLDDTPreset, QualityAssessmentQmeanPreset } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { StateObjectRef } from 'molstar/lib/mol-state';
import { ObjectKeys } from 'molstar/lib/mol-util/type-helpers';
import { Structure } from 'molstar/lib/mol-model/structure/structure/structure';

const Extensions = {
  'ma-quality-assessment': PluginSpec.Behavior(MAQualityAssessment),
};

const viewerOptions = {
  layoutIsExpanded: false,
  layoutShowControls: false,
  layoutShowRemoteState: false,
  layoutControlsDisplay: "reactive" as PluginLayoutControlsDisplay,
  layoutShowSequence: false,
  layoutShowLog: false,
  layoutShowLeftPanel: false,
  disableAntialiasing: false,
  pixelScale: 1,
  enableWboit: false,
  viewportShowExpand: true,
  viewportShowSelectionMode: false,
  viewportShowAnimation: false,
  pdbProvider: "pdbe",
  viewportShowControls: PluginConfig.Viewport.ShowControls.defaultValue,
  viewportShowSettings: PluginConfig.Viewport.ShowSettings.defaultValue,
  extensions: ObjectKeys(Extensions),
};


function addLiPScoresToStructure(structureData: Structure, lipScoreArray: Array<number>) {
  const lipScoresMap = new Map<number, number>();
    lipScoreArray.forEach((score, index) => {
    lipScoresMap.set(index, score); 
  });
  
  if (!structureData.models[0]._staticPropertyData.ma_quality_assessment) {
    structureData.models[0]._staticPropertyData.ma_quality_assessment = {
        data: {
            value: {
                pLDDT: undefined,
                localMetrics: {
                    pLDDT: undefined,
                }
            }
        }
    };
} else if (!structureData.models[0]._staticPropertyData.ma_quality_assessment.data) {
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data = {
        value: {
            pLDDT: undefined,
            localMetrics: {
                pLDDT: undefined,
            }
        }
    };
} else if (!structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value) {
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value = {
        pLDDT: undefined,
        localMetrics: {
            pLDDT: undefined,
        }
    };
} else if (!structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.localMetrics) {
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.localMetrics = {
        pLDDT: undefined,
    };
}

  // Replace pLDDT with LiP scores
  structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.pLDDT = lipScoresMap;
  structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.localMetrics.pLDDT = lipScoresMap;
  
  return structureData;
}

const lipScoreArray = [
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
  60, 60, 60, 60
];

 


const ViewerAutoPreset = StructureRepresentationPresetProvider({
  id: 'preset-structure-representation-viewer-auto',
  display: {
      name: 'Automatic (w/ Annotation)', group: 'Annotation',
      description: 'Show standard automatic representation but colored by quality assessment (if available in the model).'
  },
  isApplicable(a) {
      return (
          !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT')) ||
          !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))
      );
  },
  params: () => StructureRepresentationPresetProvider.CommonParams,
  async apply(ref, params, plugin) {
      const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
      const structure = structureCell?.obj?.data;
      
      if (!structureCell || !structure) return {};
    
      // Apply LiP scores
      const structuremodified = addLiPScoresToStructure(structure, lipScoreArray);

      // Apply the quality assessment presets or the default representation preset
      if (structuremodified.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT'))) {
          console.log('Applying pLDDT preset');
          return await QualityAssessmentPLDDTPreset.apply(ref, params, plugin);
      } else if (structuremodified.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))) {
          console.log('Applying Qmean preset');
          return await QualityAssessmentQmeanPreset.apply(ref, params, plugin);
      } else {
          console.log('Applying default auto preset');
          return await PresetStructureRepresentations.auto.apply(ref, params, plugin);
      }
  }
});

const defaultSpec = DefaultPluginSpec(); // TODO: Make our own to select only essential plugins
const spec: PluginSpec = {
actions: defaultSpec.actions,
behaviors: [
    ...defaultSpec.behaviors,
    ...viewerOptions.extensions.map(e => Extensions[e]),
],
layout: {
  initial: {
    isExpanded: viewerOptions.layoutIsExpanded,
    showControls: viewerOptions.layoutShowControls,
    controlsDisplay: viewerOptions.layoutControlsDisplay,
  },
},
config: [
  [
    PluginConfig.General.DisableAntialiasing,
    viewerOptions.disableAntialiasing,
  ],
  [PluginConfig.General.PixelScale, viewerOptions.pixelScale],
  [PluginConfig.General.EnableWboit, viewerOptions.enableWboit],
  [PluginConfig.Viewport.ShowExpand, viewerOptions.viewportShowExpand],
  [
    PluginConfig.Viewport.ShowSelectionMode,
    viewerOptions.viewportShowSelectionMode,
  ],
  [PluginConfig.Download.DefaultPdbProvider, viewerOptions.pdbProvider],
  [PluginConfig.Structure.DefaultRepresentationPreset, ViewerAutoPreset.id],
],
};

type SequencePosition = { chain: string; position: number };
type Range = { chain: string; start: number; end: number };

export type StructureViewer = {
  plugin: PluginContext;
  //lipscoreList
  loadPdb(pdb: string): Promise<void>;
  loadCifUrl(url: string, isBinary?: boolean): Promise<void>;
  highlight(ranges: Range[]): void;
  clearHighlight(): void;
  changeHighlightColor(color: number): void;
  handleResize(): void;
  addLiPScores(lipScoreArray: Array<number>): void;
};

export const getStructureViewer = async (
  container: HTMLDivElement,
  onHighlightClick: (sequencePositions: SequencePosition[]) => void
): Promise<StructureViewer> => {
const plugin = new PluginContext(spec);
await plugin.init();

console.log(plugin.builders.structure);
plugin.builders.structure.representation.registerPreset(ViewerAutoPreset);


const canvas = container.querySelector<HTMLCanvasElement>("canvas");

if (!canvas || !plugin.initViewer(canvas, container)) {
  throw new Error("Failed to init Mol*");
}


plugin.behaviors.interaction.click.subscribe((event) => {
  if (StructureElement.Loci.is(event.current.loci)) {
    const loc = StructureElement.Location.create();
    StructureElement.Loci.getFirstLocation(event.current.loci, loc);
    const sequencePosition = StructureProperties.residue.label_seq_id(loc);
    const chain = StructureProperties.chain.auth_asym_id(loc);
    onHighlightClick([{ position: sequencePosition, chain: chain }]);
  }
});

PluginCommands.Canvas3D.SetSettings(plugin, {
  settings: ({ renderer, marking }) => {
    renderer.backgroundColor = Color(0xeeeeee);
    // For highlight
    marking.edgeScale = 1.5;
    renderer.selectStrength = 0;
    // For hover
    renderer.highlightStrength = 1;
  },
});

const structureViewer: StructureViewer = {
  plugin,
  async loadPdb(pdb) {
    await this.loadCifUrl(
      `https://www.ebi.ac.uk/pdbe/model-server/v1/${pdb.toLowerCase()}/full?encoding=bcif`,
      true
    );
  },
  async loadCifUrl(url, isBinary = false): Promise<void> {
    const data = await plugin.builders.data.download(
      { url, isBinary },
      { state: { isGhost: true } }
    );

    console.log("data", data);

    const trajectory = await plugin.builders.structure.parseTrajectory(
      data,
      "mmcif"
    );

    
    await plugin.builders.structure.hierarchy.applyPreset(
      trajectory,
      "all-models",
      { useDefaultIfSingleModel: true }
    );

    this.addLiPScores([
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 
      60, 60, 60, 60
    ])  
   
  },

  highlight(ranges) {
    // What nightingale calls "highlight", mol* calls "select"
    // The query in this method is over label_seq_id so the provided start & end
    // coordinates must be in PDB space
    const data =
      plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj
        ?.data;
    if (!data) {
      return;
    }
    const sel = Script.getStructureSelection(
      (Q) =>
        Q.struct.generator.atomGroups({
          "residue-test": Q.core.logic.or(
            ranges.map(({ start, end, chain }) =>
              Q.core.logic.and([
                Q.core.rel.inRange([
                  Q.struct.atomProperty.macromolecular.label_seq_id(),
                  start,
                  end,
                ]),
                Q.core.rel.eq([
                  Q.struct.atomProperty.macromolecular.auth_asym_id(),
                  chain,
                ]),
              ])
            )
          ),
        }),
      data
    );
    const loci = StructureSelection.toLociWithSourceUnits(sel);
    plugin.managers.camera.focusLoci(loci);
    plugin.managers.interactivity.lociSelects.selectOnly({ loci });
  },
  clearHighlight() {
    plugin.managers.interactivity.lociSelects.deselectAll();
    PluginCommands.Camera.Reset(plugin, {});
  },
  changeHighlightColor(color: number) {
    PluginCommands.Canvas3D.SetSettings(plugin, {
      settings: ({ renderer, marking }) => {
        // For highlight
        marking.selectEdgeColor = Color(color);
        // For hover
        marking.highlightEdgeColor = Color(color);
        renderer.highlightColor = Color(color);
      },
    });
  },

  handleResize() {
    plugin.layout.events.updated.next(null);
  },

  addLiPScores(lipScoreArray: Array<number>) {
    const structureData = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
    if (!structureData) {
        console.error("No structure data found to apply LiP scores.");
        return;
    }

    const lipScoresMap = new Map<number, number>();
    lipScoreArray.forEach((score, index) => {
        lipScoresMap.set(index, score); 
    });
    
    // replace plddt with lipscore 
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.pLDDT = lipScoresMap;
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.localMetrics.pLDDT = lipScoresMap;
    structureData.models[0]._staticPropertyData.ma_quality_assessment.data.value.localMetrics.set('pLDDT', lipScoresMap);
    
    console.log("LiP scores applied and representation updated.")

      },
    };

   
  return structureViewer;
};