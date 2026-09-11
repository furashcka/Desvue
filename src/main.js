import { createApp } from "vue";
import App from "@/App.vue";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "prismjs/themes/prism-tomorrow.css";
import "@/style.css";

const themeColor = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-panel-header")
  .trim();

document
  .querySelector('meta[name="theme-color"]')
  ?.setAttribute("content", themeColor);

createApp(App).mount("#app");
