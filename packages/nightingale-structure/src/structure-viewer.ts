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
import { ValueBox } from "molstar/lib/mol-util/value-cell";
import { ChainIdColorThemeProvider } from "molstar/lib/mol-theme/color/chain-id";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra";

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



const defaultSpec = DefaultPluginSpec(); // TODO: Make our own to select only essential plugins
const spec: PluginSpec = {
  actions: defaultSpec.actions,
  behaviors: [
    ...defaultSpec.behaviors,
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
  loadPdb(pdb: string, lipscoreArray?: Array<number>): Promise<void>;
  loadCifUrl(url: string, lipscoreArray: Array<number>, isBinary?: boolean): Promise<void>;
  highlight(ranges: Range[]): void;
  clearHighlight(): void;
  changeHighlightColor(color: number): void;
  zoom(factor: number): void;
  handleResize(): void;
  addLiPScores(lipscoreArray: Array<number>): void;
  applyLipColorTheme(): Promise<void>;
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
    renderer.backgroundColor = Color(0xffffff); // Set background to white
    renderer.pickingAlphaThreshold = 0.5; // Adjust picking alpha threshold

   
  },
});

const structureViewer: StructureViewer = {
  plugin,
  async loadPdb(pdb, lipscoreArray: Array<number> = []) {
    await this.loadCifUrl(
      `https://www.ebi.ac.uk/pdbe/model-server/v1/${pdb.toLowerCase()}/full?encoding=bcif`,
      lipscoreArray,
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
    await this.applyLipColorTheme();
    // TODO maybe add here more logic
  },
  addLiPScores(lipscoreArray: Array<number>) {
    const structureData = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
    if(!structureData){
      return;
    }
  
    const lipScoresMap = new Map();
    lipscoreArray.forEach((score, index) => {
      lipScoresMap.set(index, score);
    });
  
    // Mol* exposes all models parsed from the loaded structure file here.
    // In our current usage (AlphaFold and the typical PDB entries we show),
    // the first item is the main/usually only protein model, so we attach the
    // LiP score data to models[0]. Extra entries would only appear for true
    // multi-model files such as NMR ensembles.
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

    const model = structureData.models?.[0];
    const lipPropertyName = LIPColorTheme.propertyProvider.descriptor.name;
    const lipPropertyContainer = model?._dynamicPropertyData?.[lipPropertyName]
      ?? model?._staticPropertyData?.[lipPropertyName];
    if (lipPropertyContainer?.data && model) {
      const residueIndex = model.atomicHierarchy.residueAtomSegments.index;
      const label_seq_id = model.atomicHierarchy.residues.label_seq_id;
      const residueRowCount = model.atomicHierarchy.atoms._rowCount;

      const lipMap = new Map();
      for (let i = 0; i < residueRowCount; i++) {
        const resId = residueIndex[i];
        const seqId = label_seq_id.value(resId) as number;
        const score = lipScoresMap.get(seqId - 1);
        lipMap.set(i, score !== undefined ? score : 0);
      }

      lipPropertyContainer.data = ValueBox.withValue(
        lipPropertyContainer.data,
        lipMap
      );
    }

    console.log('LiP scores successfully added to structure data.');
    console.log('Updated structure data:', JSON.stringify(modelData, null, 2));
  },

  applyLipColorTheme() {
    return plugin.dataTransaction(async () => {
      for (const structure of plugin.managers.structure.hierarchy.current.structures || []) {
        if (!structure?.components?.length) {
          continue;
        }

        await plugin.managers.structure.component.updateRepresentationsTheme(
          structure.components,
          {
            color: LIPColorTheme.propertyProvider.descriptor.name as typeof ChainIdColorThemeProvider.name, // Replace with a predefined type
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

  zoom(factor: number) {
    const camera = plugin.canvas3d?.camera;
    if (!camera || factor <= 0) {
      return;
    }

    const snapshot = camera.getSnapshot();
    const direction = Vec3.sub(Vec3(), snapshot.position, snapshot.target);
    const currentDistance = Vec3.magnitude(direction);
    if (!Number.isFinite(currentDistance) || currentDistance === 0) {
      return;
    }

    const nextDistance = Math.max(currentDistance * factor, 1);
    const nextDirection = Vec3.setMagnitude(direction, direction, nextDistance);
    const nextPosition = Vec3.add(Vec3(), snapshot.target, nextDirection);
    plugin.managers.camera.setSnapshot({
      position: nextPosition,
      radius: Math.max(snapshot.radius * factor, 0.1),
      radiusMax: Math.max(snapshot.radiusMax * factor, 0.1),
    }, 150);
  },

  handleResize() {
    plugin.layout.events.updated.next(null);
  },
};
  return structureViewer;
};