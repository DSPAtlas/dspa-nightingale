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
import { ChainIdColorThemeProvider } from "molstar/lib/mol-theme/color/chain-id";

//import { QualityAssessmentQmeanPreset } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { StateObjectRef } from 'molstar/lib/mol-state';
import { ObjectKeys } from 'molstar/lib/mol-util/type-helpers';
import { Structure } from 'molstar/lib/mol-model/structure/structure/structure';
import {LIPColorTheme} from './color_new';



interface CustomPluginState {
  lipscoreArray: Array<number>;
}

class CustomPluginContext extends PluginContext {
  customState: CustomPluginState;

  constructor(spec: any) {
    super(spec);
    this.customState = {
      lipscoreArray: [],
    };
  }
}

// export const QualityAssessmentLIPPreset = StructureRepresentationPresetProvider({
//   id: 'preset-structure-representation-ma-quality-assessment-lipScore',
//   display: {
//       name: 'lipScore', group: 'Annotation',
//       description: 'Color structure based on LIP Score.'
//   },
//   isApplicable(a) {
//       return true;
//   },
//   params: () => StructureRepresentationPresetProvider.CommonParams,
//   async apply(ref, params, plugin) {
//       const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
//       const structure = structureCell?.obj?.data;
//       if (!structureCell || !structure) return {};

//       const colorTheme = LIPColorThemeProvider.name as any;
//       return await PresetStructureRepresentations.auto.apply(ref, { ...params, theme: { 
//         globalName: colorTheme, focus: { name: colorTheme } } }, plugin);
//   }
// });


// const Extensions = {
//  'ma-quality-assessment': PluginSpec.Behavior(MAQualityAssessment),
//};

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
};


function addLiPScoresToStructure(structureData: Structure, lipscoreArray: Array<number>): Structure {
  if (!lipscoreArray || lipscoreArray.length === 0) {
      console.error('lipScoreArray is null or empty. Skipping LiP scores application.');
      return structureData;
  }

  const lipScoresMap = new Map<number, number>();
  lipscoreArray.forEach((score, index) => {
      lipScoresMap.set(index, score); 
  });

  const modelData = structureData.models[0]._staticPropertyData;

  // Ensure `ma_quality_assessment` and its nested properties are initialized
  if (!modelData.ma_quality_assessment) {
      modelData.ma_quality_assessment = {
          data: {
              value: {
                  lipScore: undefined,
                  localMetrics: undefined,
              },
          },
      };
  } else if (!modelData.ma_quality_assessment.data) {
      modelData.ma_quality_assessment.data = {
          value: {
              lipScore: undefined,
              localMetrics: undefined,
          },
      };
  } else if (!modelData.ma_quality_assessment.data.value) {
      modelData.ma_quality_assessment.data.value = {
          lipScore: undefined,
          localMetrics: undefined,
      };
  } else if (!modelData.ma_quality_assessment.data.value.localMetrics) {
      // Initialize `localMetrics` as a Map
      modelData.ma_quality_assessment.data.value.localMetrics = new Map<number, number>();
  }

  // Assign the LiP scores map
  modelData.ma_quality_assessment.data.value.lipScore = lipScoresMap;
  modelData.ma_quality_assessment.data.value.localMetrics = lipScoresMap;

  console.log('LiP scores successfully added to structure data.');
  console.log('Updated structure data:', JSON.stringify(modelData, null, 2));

  return structureData;
}


// const ViewerAutoPreset = StructureRepresentationPresetProvider({
//   id: 'preset-structure-representation-viewer-auto',
//   display: {
//       name: 'Automatic (w/ Annotation)', group: 'Annotation',
//       description: 'Show standard automatic representation but colored by quality assessment (if available in the model).'
//   },
//   isApplicable(a) {
//       return (
//           !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT')) ||
//           !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'qmean')) 
//       );
//   },
//   params: () => StructureRepresentationPresetProvider.CommonParams,
//   async apply(ref, params, plugin: CustomPluginContext) {
//     const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
//     const structure = structureCell?.obj?.data;

//     if (!structureCell || !structure) return {};

//     const lipscoreArray = plugin.customState.lipscoreArray;

//     // Apply LiP scores
//     if (lipscoreArray && lipscoreArray.length > 0) {
//         console.log('Applying LiP scores...');
//         addLiPScoresToStructure(structure, lipscoreArray);
//     } else {
//         console.warn('No LiP scores provided. Skipping application.');
//     }

//     // Apply the quality assessment presets or the default representation preset
//     if (lipscoreArray && lipscoreArray.length > 0) {
//         console.log('Applying LiP Score Preset...', structure);
//         console.log('rtest');
//         return await QualityAssessmentLIPPreset.apply(ref, params, plugin);
//     } else {
//         console.log('Applying default auto preset');
//         return await PresetStructureRepresentations.auto.apply(ref, params, plugin);
//     }
// }

// });

const defaultSpec = DefaultPluginSpec(); // TODO: Make our own to select only essential plugins
const spec: PluginSpec = {
  actions: defaultSpec.actions,
  behaviors: [
    ...defaultSpec.behaviors,
    //PluginSpec.Behavior(AfConfidenceScore, {
     // autoAttach: true,
      //showTooltip: true,
    //}),
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
    [
      PluginConfig.Structure.DefaultRepresentationPresetParams,
      {
        theme: {
          globalName: "af-confidence",
          carbonByChainId: false,
          focus: {
            name: "element-symbol",
            params: { carbonByChainId: false },
          },
        },
      },
    ],
  ],
};

type SequencePosition = { chain: string; position: number };
type Range = { chain: string; start: number; end: number };

export type StructureViewer = {
  plugin: CustomPluginContext;
  loadPdb(pdb: string): Promise<void>;
  loadCifUrl(url: string, lipscoreArray: Array<number>, isBinary?: boolean): Promise<void>;
  highlight(ranges: Range[]): void;
  clearHighlight(): void;
  changeHighlightColor(color: number): void;
  handleResize(): void;
  addLiPScores(lipscoreArray: Array<number>): void;
  applyLipColorTheme(): void;
};



export const getStructureViewer = async (
  
  container: HTMLDivElement,
  onHighlightClick: (sequencePositions: SequencePosition[]) => void,
  lipscoreArray: Array<number>,
  colorTheme?: string
): Promise<StructureViewer> => {
  const spec: PluginSpec = DefaultPluginSpec(); // Adjust this based on your specific plugin requirements
  const plugin = new CustomPluginContext(spec); // Use your custom context
  await plugin.init();

  const canvas = container.querySelector<HTMLCanvasElement>("canvas");

  if (!canvas || !plugin.initViewer(canvas, container)) {
    throw new Error("Failed to init Mol*");
  }

  if (LIPColorTheme.colorThemeProvider)
    plugin.representation.structure.themes.colorThemeRegistry.add(
      LIPColorTheme.colorThemeProvider
    );
  if (LIPColorTheme.labelProvider)
    plugin.managers.lociLabels.addProvider(
      LIPColorTheme.labelProvider
    );
  plugin.customModelProperties.register(
    LIPColorTheme.propertyProvider,
    true
  );


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
    renderer.backgroundColor = Color(0xffffff);
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
      [],
      true
    );
  },
  async loadCifUrl(url:string, lipscoreArray:Array<number> = [], isBinary:boolean = false): Promise<void> {
    const data = await plugin.builders.data.download(
      { url, isBinary },
      { state: { isGhost: true } }
    );
    const trajectory = await plugin.builders.structure.parseTrajectory(
      data,
      "mmcif"
    );

    await plugin.builders.structure.hierarchy.applyPreset(
      trajectory,
      "all-models",
      { useDefaultIfSingleModel: true }
    );

    plugin.customState.lipscoreArray = lipscoreArray || [];
    this.addLiPScores(lipscoreArray);  
    this.applyLipColorTheme();
    // TODO maybe add here more logic
  },
  addLiPScores(lipscoreArray: Array<number>) {
    const structureData = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
    if (!lipscoreArray || lipscoreArray.length === 0) {
      console.error('lipScoreArray is null or empty. Skipping LiP scores application.');
      return structureData;
    }
    if(!structureData){
      return;
    }
  
    const lipScoresMap = new Map();
    lipscoreArray.forEach((score, index) => {
      lipScoresMap.set(index, score);
    });
  
    const modelData = structureData.models?.[0]._staticPropertyData;
    if (!modelData) {
      console.error("Model data is missing in the structure data.");
      return structureData;
    }
  
    // Initialize ma_quality_assessment if it doesn't exist
    modelData.ma_quality_assessment = modelData.ma_quality_assessment || { data: { value: { lipScore: undefined, localMetrics: undefined } } };
    modelData.ma_quality_assessment.data = modelData.ma_quality_assessment.data || { value: { lipScore: undefined, localMetrics: undefined } };
    modelData.ma_quality_assessment.data.value = modelData.ma_quality_assessment.data.value || { lipScore: undefined, localMetrics: undefined };
    modelData.ma_quality_assessment.data.value.localMetrics = modelData.ma_quality_assessment.data.value.localMetrics || new Map();
  
    // Assign the LiP scores map
    modelData.ma_quality_assessment.data.value.lipScore = lipScoresMap;
    modelData.ma_quality_assessment.data.value.localMetrics = lipScoresMap;
  
    console.log('LiP scores successfully added to structure data.');
    console.log('Updated structure data:', JSON.stringify(modelData, null, 2));
  },

  applyLipColorTheme() {
    let colouringTheme: string;
    
    colouringTheme = LIPColorTheme.propertyProvider.descriptor.name;
    
    // apply colouring
    plugin?.dataTransaction(async () => {
      for (const s of plugin?.managers.structure.hierarchy.current
        .structures || []) {
        await plugin?.managers.structure.component.updateRepresentationsTheme(
          s.components,
          {
            color: colouringTheme as typeof ChainIdColorThemeProvider.name,
          }
        );
      }
    });
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
};
  //  plugin.builders.structure.representation.registerPreset(ViewerAutoPreset);
  return structureViewer;
};