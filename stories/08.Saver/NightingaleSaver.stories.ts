import { Meta, Story } from "@storybook/web-components";
import { html } from "lit-html";
import "../../packages/nightingale-navigation/src/index.ts";
import "../../packages/nightingale-saver/src/index.ts";

export default {
  title: "Components/Utils/Saver",
} as Meta;

const Template: Story<{
  "file-name": string;
  "file-format": string;
  "background-color": string;
}> = (args) => {
  return html`<nightingale-navigation
      height="50"
      length="200"
      display-start="30"
      display-end="180"
      highlight="86:104"
      id="navigation"
    ></nightingale-navigation>
    <nightingale-saver
      element-id="navigation"
      file-name=${args["file-name"]}
      file-format=${args["file-format"]}
      background-color=${args["background-color"]}
    >
      <button>Save a Pic! 📸</button>
    </nightingale-saver> `;
};

export const Saver = Template.bind({});
Saver.args = {
  "file-name": "snapshot",
  "file-format": "jpeg",
  "background-color": "#ddddee",
};
