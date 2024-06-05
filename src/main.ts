import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/tailwind.css";
import "@icon-park/vue-next/styles/index.css";
import "highlight.js/styles/lightfair.css";
import {install} from '@icon-park/vue-next/es/all';

const app = createApp(App);
install(app);
app.use(router).mount("#app");
