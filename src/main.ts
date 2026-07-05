import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./app/App.vue";
import { i18n } from "./shared/i18n";
import "./app/styles.css";

createApp(App).use(createPinia()).use(i18n).mount("#app");
