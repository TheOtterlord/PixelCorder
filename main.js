// Import libraries
const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");
const { dialog, Menu } = remote;

let mediaRecorder;
const chunks = [];


// Begin recording when "start" button clicked
const start = document.querySelector("#start");
start.addEventListener("click", function() {
  if (mediaRecorder.state == "inactive") {
    try {
      mediaRecorder.start();
      start.style.background = "#eee";
      start.disabled = true;
    } catch (e) {
      showMessage("An error occured");
    }
  }
});


// End recording when "stop" button clicked
const stop = document.querySelector("#stop");
stop.addEventListener("click", function() {
  if (mediaRecorder.state == "recording") {
    try {
      mediaRecorder.stop();
      start.style.background = "#0A0";
      start.disabled = false;
    } catch (e) {
      showMessage("An error occured");
    }
  } else {
    showMessage("Not recording");
  }
});


// Allow user to select video source and display a preview
const videoPreview = document.querySelector("video");
const videoSelect = document.querySelector("#videoSelect");
videoSelect.addEventListener("click", getSources);
async function getSources() {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });
  const videoSelectMenu = Menu.buildFromTemplate(
    sources.map(source => {
      return {
        click: () => selectSource(source),
        label: source.name
      };
    })
  );
  videoSelectMenu.popup();
}
async function selectSource(source) {
  videoSelect.innerText = source.name;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoPreview.srcObject = stream;
  videoPreview.play();
  const options = {mimeType: "video/webm; codecs=vp9"};
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  };
  mediaRecorder.onstop = save;
}

// show messages to the user via the snackbar
const snack = document.querySelector("#snackbar");
function showMessage(str) {
  snack.innerHTML = str;
  snack.className = "show";
  setTimeout(function(){ snack.className = snack.className.replace("show", ""); }, 3000);
}

// get the timestamp for the file
function getTimestamp() {
  var d = new Date();
  var timestamp = d.toISOString().split("T")[0]+" "+d.toTimeString().split(" ")[0].replace(":","-").replace(":", "-");
  return timestamp;
}

// save the file as a webm file
async function save(e) {
  const blob = new Blob(chunks, {
    type: "video/webm; codecs=vp9"
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `${getTimestamp()}.webm`
  });
  if (filePath) {
    writeFile(filePath, buffer, () => showMessage("Video saved!"));
  } else {
    showMessage("Video was not saved");
  }
}
