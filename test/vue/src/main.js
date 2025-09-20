import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import { USALPlugin } from '@usal/vue';
createApp(App).use(USALPlugin).mount('#app');
