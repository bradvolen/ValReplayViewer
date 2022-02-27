import Unocss from 'unocss/vite'
import presetWind from '@unocss/preset-wind'
import Vue from '@vitejs/plugin-vue'
import extractorPug from '@unocss/extractor-pug'
import { extractorSplit } from '@unocss/core'
import presetIcons from '@unocss/preset-icons'

export default {
  plugins: [
    Unocss({
      extractors: [extractorPug(), extractorSplit],
      presets: [presetWind(), presetIcons()],
    }),
    Vue(),
  ],
}
