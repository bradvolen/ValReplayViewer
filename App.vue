<template lang="pug">
.h-full.flex.flex-col(@dragover.prevent @drop.prevent="onDropZoneDrop")
  .border-b.border-black.flex.items-center.p-2
    h1.font-bold.mr-4 Valorant Replay Viewer
    .flex-1.text-gray-500 Drop a video file anywhere or #[input(type="file" disabled)]
  .flex-1.overflow-hidden
    //-.relative
      VideoPlayer.w-full(v-if="videos[0]" :video="videos[0]" @durationchange="onVideoDurationChange(0)" @timeupdate="onVideoTimeUpdate(0)" style="height:100%" @loadstart="onVideoLoadStart(0)")
      .absolute.bg-red.opacity-50(v-if="videos[0]?.el" :style="{height: `${37 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, width: `${21 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, left: `${1243 / videos[0].el.videoWidth * videos[0].el.clientWidth}px`, top: `${48 / videos[0].el.videoHeight * videos[0].el.clientHeight}px`}") &nbsp;
    .flex(:style="{height: videos.length >= 5 ? '60%' : (videos.length > 2 ? '50%': '100%')}")
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
const min0 = [1243, 48, 21, 31]
const sec0 = [1276, 48, 21, 31]
const sec1 = [1300, 48, 21, 31]

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

const colorAt = (imageData, x, y) => {
  const offset = (y * imageData.width + x) * 4
  return {
    r: imageData.data[offset+0],
    g: imageData.data[offset+1],
    b: imageData.data[offset+2],
  } // , imageData.data[offset+3]]
}

// XXX depending on whether shop is open
const isWhite = ({ r, g, b }) => {
  return r > 230 && g > 230 && b > 230
}

// we know how wide the number is and know how many parts we need to sample to detect
// we should know the midpoints of each number
const detectNumberAt = (imageData, [x, y, w, h]) => {
  // 0 3
  // 1 4
  // 2 5
  const w0 = isWhite(colorAt(imageData, x + w * 0.25, y + h * 0.25))
  const w1 = isWhite(colorAt(imageData, x + w * 0.25, y + h * 0.50))
  const w2 = isWhite(colorAt(imageData, x + w * 0.25, y + h * 0.75))
  const w3 = isWhite(colorAt(imageData, x + w * 0.75, y + h * 0.25))
  const w4 = isWhite(colorAt(imageData, x + w * 0.75, y + h * 0.50))
  const w5 = isWhite(colorAt(imageData, x + w * 0.75, y + h * 0.75))
  if (w0 && w1 && w2 && w3 && w4 && w5) {
    return 0
  }
  // TODO figure out which points to sample...
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
