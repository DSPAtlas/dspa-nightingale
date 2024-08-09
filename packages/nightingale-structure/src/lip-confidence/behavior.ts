/* eslint-disable no-case-declarations */
import { OrderedSet } from "molstar/lib/mol-data/int";
import { Loci } from "molstar/lib/mol-model/loci";
import { StructureElement } from "molstar/lib/mol-model/structure";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import { PluginBehavior } from "molstar/lib/mol-plugin/behavior/behavior";

import { LiPScoreProvider, getLiPScore } from "./prop";
import { LiPScoreColorThemeProvider } from "./color";

export default PluginBehavior.create<{
  autoAttach: boolean;
  showTooltip: boolean;
}>({
  name: "af-confidence-prop",
  category: "custom-props",
  display: {
    name: "AlphaFold Confidence Score",
    description: "AlphaFold Confidence Score.",
  },
  ctor: class extends PluginBehavior.Handler<{
    autoAttach: boolean;
    showTooltip: boolean;
  }> {
    private provider = LiPScoreProvider;

    private labelAfConfScore = {
      label: (loci: Loci): string | undefined => {
        if (
          this.params.showTooltip &&
          loci.kind === "element-loci" &&
          loci.elements.length !== 0
        ) {
          const e = loci.elements[0];
          const u = e.unit;
          if (
            !u.model.customProperties.hasReference(
              LiPScoreProvider.descriptor,
            )
          )
            return;

          const se = StructureElement.Location.create(
            loci.structure,
            u,
            u.elements[OrderedSet.getAt(e.indices, 0)],
          );
          const LiPScore = getLiPScore(se);
          // eslint-disable-next-line consistent-return
          return LiPScore && + LiPScore[0] > 0
            ? `LiP score: ${LiPScore[0]} <small>( ${LiPScore[1]} )</small>`
            : ``;
        }
      },
    };

    register(): void {
      this.ctx.customModelProperties.register(
        this.provider,
        this.params.autoAttach,
      );
      this.ctx.managers.lociLabels.addProvider(this.labelAfConfScore);

      this.ctx.representation.structure.themes.colorThemeRegistry.add(
        LiPScoreColorThemeProvider,
      );
    }

    update(p: { autoAttach: boolean; showTooltip: boolean }) {
      const updated = this.params.autoAttach !== p.autoAttach;
      this.params.autoAttach = p.autoAttach;
      this.params.showTooltip = p.showTooltip;
      this.ctx.customModelProperties.setDefaultAutoAttach(
        this.provider.descriptor.name,
        this.params.autoAttach,
      );
      return updated;
    }

    unregister() {
      this.ctx.customModelProperties.unregister(
        LiPScoreProvider.descriptor.name,
      );
      this.ctx.managers.lociLabels.removeProvider(this.labelAfConfScore);
      this.ctx.representation.structure.themes.colorThemeRegistry.remove(
        LiPScoreColorThemeProvider,
      );
    }
  },
  params: () => ({
    autoAttach: PD.Boolean(false),
    showTooltip: PD.Boolean(true),
  }),
});
