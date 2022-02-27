<template lang="pug">
.h-full.flex.flex-col(@dragover.prevent @drop.prevent="onDropZoneDrop")
  .border-b.border-black.flex.items-center.p-2
    h1.font-bold.mr-4 Valorant Replay Viewer
    .flex-1.text-gray-500 Drop a video file anywhere or #[input(type="file" disabled)]
  .flex-1.overflow-hidden
    .flex(:style="{height: videos.length >= 5 ? '60%' : (videos.length > 2 ? '50%': '100%')}")
      //- XXX it shouldn't be the first but rather the longest video that updates currentTime
      .flex-1.bg-black(v-if="videos[0]")
        VideoPlayer.mx-auto(:video="videos[0]" @durationchange="onVideoDurationChange(0)" @timeupdate="onVideoTimeUpdate(0)" style="height:100%")
      .flex-1.bg-black(v-if="videos[1]")
        VideoPlayer.h-full.mx-auto(:video="videos[1]" @durationchange="onVideoDurationChange(1)" @loadstart="onVideoLoadStart")
      .flex-1.bg-black(v-if="videos[4]")
        VideoPlayer.h-full.mx-auto(:video="videos[4]" @durationchange="onVideoDurationChange(4)" @loadstart="onVideoLoadStart")
    .flex(v-if="videos.length > 2" :style="{height: videos.length >= 5 ? '40%' : '50%'}")
      .flex-1.bg-black(v-if="videos[2]")
        VideoPlayer.h-full.mx-auto(:video="videos[2]" @durationchange="onVideoDurationChange(2)" @loadstart="onVideoLoadStart")
      .flex-1.bg-black(v-if="videos[3]")
        VideoPlayer.h-full.mx-auto(:video="videos[3]" @durationchange="onVideoDurationChange(3)" @loadstart="onVideoLoadStart")
  .border-t.border-black.p-2.flex.items-center.flex-shrink-0
    button.bg-gray-200.rounded.text-4xl(@click="togglePlaying" :disabled="!videos.length")
      .i-mdi-pause(v-if="playing")
      .i-mdi-play(v-else)
    input.w-full.mx-2(type="range" v-model="currentTime" :min="0" :max="maxTime" @change="updateVideosCurrentTime" @mousedown="scrubbing = true" @mouseup="scrubbing = false")
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue"

const videos = reactive([])
const selectedVideoId = ref()
const maxTime = ref(0)
const scrubbing = ref(false)

const allVideos = fn => videos.forEach(fn)

const currentTime = ref(0)
const updateVideosCurrentTime = e => {
  allVideos(video => video.el.currentTime = e.target.value)
}

onMounted(() => {
  document.addEventListener("keydown", e => {
    switch (e.keyCode) {
      case 32: // space
        togglePlaying()
        break
      case 37: // left arrow
        allVideos(video => video.el.currentTime -= 5)
        break
      case 39: // right arrow
        allVideos(video => video.el.currentTime += 5)
        break
    }
  })
})

const playing = ref(false)
const togglePlaying = () => playing.value = !playing.value
watch(playing, v => allVideos(video => v ? video.el.play() : video.el.pause()))

const onVideoDurationChange = idx => {
  const videoEl = videos[idx].el
  if (maxTime.value < videoEl.duration) {
    maxTime.value = videoEl.duration
  }
}

const onVideoLoadStart = e => {
  // XXX assumes same video, of course here would have to go to point in video that is in sync with this time
  e.target.currentTime = currentTime.value
  if (playing.value) {
    e.target.play()
  }
}

const onVideoTimeUpdate = idx => {
  if (scrubbing.value) {
    return
  }
  const video = videos[idx]
  if (video.el) {
    console.log("HEREEE?", video.el.currentTime)
    currentTime.value = video.el.currentTime
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
