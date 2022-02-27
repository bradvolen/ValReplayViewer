import { createApp } from 'vue'
import App from './App.vue'
import VideoPlayer from './VideoPlayer.vue'
import '@unocss/reset/tailwind.css'
import 'uno.css'

const app = createApp(App)
app.component("VideoPlayer", VideoPlayer) // XXX component reg in script setup not working correctly :/
app.mount('#app')
