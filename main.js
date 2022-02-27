// get DOM elements
const videos = [];
const videosHolder = document.getElementById("videos")
const filesInput = document.querySelector('input[type=file]');
const filesButton = document.querySelector('a');
const playlist = document.querySelector('ul');
const startStopButton = document.querySelector('button');
const timeRange = document.getElementById("timeRange");
var timeRangeInit = false;
var pausedOnSeek = false;

startStopButton.addEventListener('click', e => {
  console.log("button click");
  videos.forEach((video) => {
    video.paused ? video.play() : video.pause();
  });
});

// add keyboard shortcuts for pause (space) and 5 sec jump (left/right arrow)
document.addEventListener('keydown', e => {
  // console.log(e.keyCode);
  switch (e.keyCode) {
    case 32: // space
      videos.forEach((video) => {
        video.paused ? video.play() : video.pause();
      });
      break;
    case 37: // left arrow
      videos.forEach((video) => {
        video.currentTime += -5;
      });
      break;
    case 39: // right arrow
      videos.forEach((video) => {
        video.currentTime += 5;
      });
      break;
  }
});

function dropHandler(ev) {
  console.log('File(s) dropped');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        const newVideo = document.createElement("video");
        videos.push(newVideo);
        videosHolder.appendChild(newVideo);
        var file = ev.dataTransfer.items[i].getAsFile();
        console.log('... file[' + i + '].name = ' + file.name);
        newVideo.src = URL.createObjectURL(file);
        newVideo.playbackRate = 1;
        newVideo.style.height = "auto";
        newVideo.style.width = "80%";
        newVideo.controls = true;
        newVideo.muted = true;
        if (!timeRangeInit) {
          newVideo.addEventListener('durationchange', e => {
            console.log("trying to set to " + newVideo.duration.toString());
            timeRange.setAttribute("max",newVideo.duration);
          });
          newVideo.addEventListener('timeupdate', e => {
            timeRange.value = newVideo.currentTime
          })
          timeRangeInit = true;
          timeRange.addEventListener("input", e => {
            console.log("change");
            videos.forEach((video) => {
              video.currentTime = timeRange.value;
            });
          });
          timeRange.addEventListener("mousedown", e => {
            console.log("mousdown");
            if (!newVideo.paused) {
              pausedOnSeek = true;
              videos.forEach((video) => {
                video.pause();
              });
            }
          });
          timeRange.addEventListener("mouseup", e => {
            console.log("mouseup");
            if (pausedOnSeek) {
              pausedOnSeek = false;
              videos.forEach((video) => {
                video.play();
              });
            }
          });
        }
      }
    }
  }
}

function dragOverHandler(ev) {
  console.log('File(s) in drop zone');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}
