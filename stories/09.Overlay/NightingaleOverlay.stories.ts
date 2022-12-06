import { Meta, Story } from "@storybook/web-components";
import { html } from "lit-html";
import "../../packages/nightingale-navigation/src/index.ts";
import "../../packages/nightingale-saver/src/index.ts";

export default {
  title: "Components/Utils/Overlay",
  argTypes: {
    for: {
      options: ["all", "navigation", "sequence", "div"],
      control: { type: "radio" },
    },
  },
} as Meta;

const Template: Story<{
  for: string;
  label: string;
}> = (args) => {
  return html`
    <div id="all">
      <nightingale-navigation
        height="50"
        length="27"
        id="navigation"
      ></nightingale-navigation>
      <nightingale-sequence
        id="sequence"
        height="50"
        sequence="THISISANEXAMPLEFORASEQUENCE"
        length="27"
      ></nightingale-sequence>
      <div id="div" style="background:red;width: 300px;height: 300px;"></div>
    </div>
    <nightingale-overlay
      for=${args["for"]}
      label=${args["label"]}
    ></nightingale-overlay>
  `;
};

export const Overlay = Template.bind({});
Overlay.args = {
  for: "all",
  label: "Use [CTRL] + scroll to zoom",
};
