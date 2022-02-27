<template lang="pug">
video.border(:ref="el => video.el = el" :src="video.src" muted @durationchange="$emit('durationchange')" @timeupdate="$emit('timeupdate')")
</template>

<script setup>
defineProps({
  video: {
    type: Object,
    required: true,
  },
})

defineEmits(["durationchange", "timeupdate"])
</script>
