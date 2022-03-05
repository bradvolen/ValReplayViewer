<template lang="pug">
.h-full.flex.flex-col(@dragover.prevent @drop.prevent="onDropZoneDrop")
  .border-b.border-black.flex.items-center.p-2
    h1.font-bold.mr-4 Valorant Replay Viewer
    .flex-1.text-gray-500 Drop a video file anywhere or #[input(type="file" disabled)]
  .flex-1.overflow-hidden
    .relative
      VideoPlayer.w-full(v-if="videos[0]" :video="videos[0]" @durationchange="onVideoDurationChange(0)" @timeupdate="onVideoTimeUpdate(0)" style="height:100%" @loadstart="onVideoLoadStart(0)")
        //- 1243,48   12x21 -- min0
        //- 1276,48   12x21 -- sec0
        //- 1300,48   12x21 -- sec1
      .absolute.bg-red.opacity-25(v-if="videos[0]?.el" style="width:12px;height:21px" :style="{left: `${1300 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${48 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
    //-
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1246 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${52 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1246 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${61 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1246 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${70 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1246 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${79 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1259 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${52 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1259 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${61 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1259 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${70 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
      .absolute.bg-red(v-if="videos[0]?.el" style="width:1px;height:1px" :style="{left: `${1259 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${79 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;

    //-.flex(:style="{height: videos.length >= 5 ? '60%' : (videos.length > 2 ? '50%': '100%')}")
      //- XXX it shouldn't be the first but rather the longest video that updates currentTime
      .flex-1.bg-black(v-if="videos[0]")
        VideoPlayer.h-full.mx-auto(:video="videos[0]" @durationchange="onVideoDurationChange(0)" @timeupdate="onVideoTimeUpdate(0)" @loadstart="onVideoLoadStart(0)")
      .flex-1.bg-black(v-if="videos[1]")
        VideoPlayer.h-full.mx-auto(:video="videos[1]" @durationchange="onVideoDurationChange(1)" @loadstart="onVideoLoadStart(1)")
      .flex-1.bg-black(v-if="videos[4]")
        VideoPlayer.h-full.mx-auto(:video="videos[4]" @durationchange="onVideoDurationChange(4)" @loadstart="onVideoLoadStart(4)")
    .flex(v-if="videos.length > 2" :style="{height: videos.length >= 5 ? '40%' : '50%'}")
      .flex-1.bg-black(v-if="videos[2]")
        VideoPlayer.h-full.mx-auto(:video="videos[2]" @durationchange="onVideoDurationChange(2)" @loadstart="onVideoLoadStart(2)")
      .flex-1.bg-black(v-if="videos[3]")
        VideoPlayer.h-full.mx-auto(:video="videos[3]" @durationchange="onVideoDurationChange(3)" @loadstart="onVideoLoadStart(3)")
  .border-t.border-black.p-2.flex.items-center.flex-shrink-0
    button.bg-gray-200.rounded.text-4xl(@click="togglePlaying" :disabled="!videos.length")
      .i-mdi-pause(v-if="playing")
      .i-mdi-play(v-else)
    .relative.w-full.mx-2
      input.w-full(type="range" v-model="currentTime" :min="0" :max="maxTime" @change="updateVideosCurrentTime" @mousedown="scrubbing = true" @mouseup="scrubbing = false")
      .absolute.top-0.bg-red.w-px(v-for="t in sixCrossesAt" style="height:5px" :style="{left: `${t*100/maxTime}%`}")
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"

const lightPixels = reactive([])
const firstWhite = reactive([])
const sixCrossesAt = reactive([])
const timedMoments = reactive([])
const roundStarts = reactive([])

// 1243,48   12x21 -- min0
// 1276,48   12x21 -- sec0
// 1300,48   12x21 -- sec1
// 8 points to sample relative to top left x+3 and x+16 and y+4 y+13 y+22 y+31
// 0:30
const min0 = [1243, 48, 12, 21]
const sec0 = [1276, 48, 12, 21]
const sec1 = [1300, 48, 12, 21]

const detectClockTime = imageData => {
  return [
    detectNumberAt(imageData, min0),
    detectNumberAt(imageData, sec0),
    detectNumberAt(imageData, sec1),
  ]
}

// assume same length
const isEqual = (arr0, arr1) => {
  for (let i = 0; i < arr0.length; i++) {
    if (arr0[i] !== arr1[i]) {
      return false
    }
  }
  return true
}

// we know how wide the number is and know how many parts we need to sample to detect
// we should know the midpoints of each number
const detectNumberAt = (imageData, [x, y, w, h]) => {
  const ys = []
  // high-low/sample
  for (let x = low; x <= high; x += 2) {
    ys.push(countCrossesOfWhiteFromTopAt(imageData, x))
  }
  if (ys[8] === 0 && ys[3] !== 0) {
    return 1
  }
  // TODO if the x of the shop is open, look for different colors for the number! (blur)
  // can make these speedier by mapping this array to num
  if (isEqual(ys, [2, 2, 4, 4, 4, 6, 8, 2, 2, 2, 0])) return 0 
  if (isEqual(ys, [2, 2, 4, 4, 4, 4, 4, 4, 2, 0, 0])) return 0
  if (isEqual(ys, [2, 2, 4, 4, 4, 4, 4, 4, 2, 2, 0])) return 0
  if (isEqual(ys, [4, 4, 6, 6, 6, 6, 6, 4, 4, 0, 0])) return 2
  if (isEqual(ys, [4, 4, 4, 6, 6, 6, 6, 6, 4, 0, 0])) return 3
  if (isEqual(ys, [2, 4, 4, 4, 4, 4, 4, 2, 2, 2, 0])) return 4
  if (isEqual(ys, [2, 4, 4, 6, 6, 6, 6, 4, 2, 2, 0])) return 5
  if (isEqual(ys, [2, 4, 4, 4, 6, 6, 6, 2, 2, 2, 0])) return 6 // XXX wrong?
  if (isEqual(ys, [2, 4, 4, 4, 6, 6, 6, 4, 2, 2, 0])) return 6
  if (isEqual(ys, [2, 2, 4, 4, 4, 4, 4, 2, 2, 0, 0])) return 7
  if (isEqual(ys, [4, 4, 6, 6, 6, 6, 6, 4, 4, 2, 0])) return 8
  if (isEqual(ys, [2, 4, 6, 6, 6, 6, 4, 2, 2, 2, 0])) return 9 // XXX wrong?
  if (isEqual(ys, [2, 2, 6, 6, 6, 6, 4, 2, 2, 4, 0])) return 9
  if (isEqual(ys, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])) return // probably shop open
  console.log('>', low, ys)
}

// TODO when buy shop is open and there is blur this doesn't detect the white!!!
const countCrossesOfWhiteFromTopAt = (imageData, x) => {
  let crosses = 0
  let inWhite = false
  for (let y = 0; y < imageData.height; y++) {
    const offset = (y * imageData.width + x) * 4
    const [r,g,b,a] = [imageData.data[offset+0], imageData.data[offset+1], imageData.data[offset+2], imageData.data[offset+3]]
    const isWhite = r >= 230 && g >= 230 && b >= 230
    if (inWhite !== isWhite) {
      crosses++
      inWhite = !inWhite
    }
    // TODO
    if (y > 90) {
      break
    }
  }
  return crosses
}

const currentTime = ref(0)

const makeGetFrameAt = async url => {
  const video = document.createElement("video")
  let seekResolve
  video.addEventListener("seeked", () => seekResolve?.())
  video.src = url
  // workaround chromium metadata bug (https://stackoverflow.com/q/38062864/993683)
  while ((video.duration === Infinity || isNaN(video.duration)) && video.readyState < 2) {
    await new Promise(r => setTimeout(r, 1000))
    video.currentTime = 10000000 * Math.random()
  }
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  const [w, h] = [video.videoWidth, video.videoHeight]
  canvas.width =  w
  canvas.height = h
  return async function getFrameAt(time) {
    video.currentTime = time
    await new Promise(r => seekResolve = r)
    context.drawImage(video, 0, 0, w, h)
    return context.getImageData(0, 0, w, h)
  }
}

let getFrameAt
// https://stackoverflow.com/a/52357595/387413
const parseMoments = async (url, fps = 25) => {
  getFrameAt = await makeGetFrameAt(url)

  return

  /*
  let time = 0
  while (time < video.duration) {
    const imageData = await getFrameAt(time)
    const midx = parseInt(imageData.width / 2)
    const x = midx + 30 // figure out this based on ratio
    // since we have to wait on seek time... we could do some more clever searching of the video
    // and pinpoint the frames where rounds start by looking for more things and binary searching the 0:30
    const moment = detectMoment(imageData)
    console.log(time, ...moment.crosses)
    timedMoments.push({ time, moment })
    time += 1 // interval
    currentTime.value = time // XXX just to show process
  }
  */
}

const videos = reactive([])
const selectedVideoId = ref()
const maxTime = ref(0)
const scrubbing = ref(false)

const allVideos = fn => videos.forEach(fn)

const updateVideosCurrentTime = e => {
  allVideos(video => video.el.currentTime = e.target.value)
}

const onKeydown = e => {
  switch (e.keyCode) {
    case 32: // space
      e.preventDefault()
      togglePlaying()
      break
    case 37: // left arrow
      e.preventDefault()
      allVideos(video => video.el.currentTime -= 5)
      break
    case 39: // right arrow
      e.preventDefault()
      allVideos(video => video.el.currentTime += 5)
      break
  }
}

onMounted(() => document.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown))

// 33.461653 -> 0:01
// 34.441174 -> 0:00
// 35.678251 -> 0:29
// 36.722539 -> 0:28
// 37.339367 -> 0:27


const playing = ref(false)
const togglePlaying = () => playing.value = !playing.value
watch(playing, v => allVideos(video => v ? video.el.play() : video.el.pause()))

const onVideoDurationChange = idx => {
  const videoEl = videos[idx].el
  if (maxTime.value < videoEl.duration) {
    maxTime.value = videoEl.duration
  }
}

const onVideoLoadStart = idx => {
  const videoEl = videos[idx].el
  parseMoments(videoEl.src)
  // XXX assumes same video, of course here would have to go to point in video that is in sync with this time
  videoEl.currentTime = currentTime.value
  if (playing.value) {
    videoEl.play()
  }
  videoEl.currentTime = 37
}

const onVideoTimeUpdate = idx => {
  if (scrubbing.value) {
    return
  }
  const video = videos[idx]
  if (video.el) {
    currentTime.value = video.el.currentTime
    if (getFrameAt) {
      getFrameAt(currentTime.value).then(imageData => {
        const [min0, sec0, sec1] = detectClockTime(imageData)
        if (min0 == null && sec0 == null && sec1 == null) {
          return
        }
        console.log(currentTime.value, `${min0 ?? '?'}:${sec0 ?? '?'}${sec1 ?? '?'}`)
      })
    }
  }
}

const onDropZoneDrop = e => {
  if (!e.dataTransfer.items) {
    return
  }
  for (const item of  e.dataTransfer.items) {
    if (item.kind !== "file") {
      continue
    }
    videos.push({
      el: undefined,
      src:  URL.createObjectURL(item.getAsFile()),
    })
  }
}
</script>

<style>
button[disabled] {
  opacity: 0.5;
}
</style>
