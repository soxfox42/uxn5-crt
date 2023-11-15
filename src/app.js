'use strict'

let isEmbed;
try {
  isEmbed = window.self !== window.top;
} catch (e) {
  isEmbed = true;
}

if (!isEmbed) {
  document.body.className = "";
}

const emulator = new Emu()

emulator.init().then(() => {
  emulator.console.write_el = document.getElementById("console_std")
  emulator.console.error_el = document.getElementById("console_err")
  emulator.bgCanvas = document.getElementById("bgcanvas");
  emulator.fgCanvas = document.getElementById("fgcanvas");
  emulator.screen.bgctx = emulator.bgCanvas.getContext("2d", {"willReadFrequently": true})
  emulator.screen.fgctx = emulator.fgCanvas.getContext("2d", {"willReadFrequently": true})
  emulator.fgCanvas.addEventListener("pointermove", emulator.pointer_moved);
  emulator.fgCanvas.addEventListener("pointerdown", emulator.pointer_down);
  emulator.fgCanvas.addEventListener("pointerup", emulator.pointer_up);
  window.addEventListener("keydown", emulator.controller.keyevent);
  window.addEventListener("keyup", emulator.controller.keyevent);

  // Input box
  const console_input = document.getElementById("console_input")
  console_input.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      let query = console_input.value
      for (let i = 0; i < query.length; i++)
        emulator.console.input(query.charAt(i).charCodeAt(0), 1)
      emulator.console.input(0x0a, 1)
      console_input.value = ""
    }
  });

  // Animation callback

  function step() {
    emulator.screen_callback();
    window.requestAnimationFrame(step)
  }

  emulator.screen.set_size(512, 320)
  window.requestAnimationFrame(step);

  if (!isEmbed) {
    // Support dropping files
    const target = document.body
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    target.addEventListener("drop", (ev) => {
      ev.preventDefault();
      let file = ev.dataTransfer.files[0], reader = new FileReader()
      reader.onload = function (event) {
        let rom = new Uint8Array(event.target.result)
        emulator.screen.set_size(512, 320)
        emulator.uxn.load(rom).eval(0x0100)
        document.getElementById("title").innerHTML = file.name
        handleROMLoaded(rom);
      };
      reader.readAsArrayBuffer(file)
    });
      
    document.getElementById("browser").addEventListener("change", function(event) {
        let file = event.target.files[0], reader = new FileReader()
      reader.onload = function (event) {
        let rom = new Uint8Array(event.target.result)
        emulator.screen.set_size(512, 320)
        emulator.uxn.load(rom).eval(0x0100)
        document.getElementById("title").innerHTML = file.name
        handleROMLoaded(rom);
      };
      reader.readAsArrayBuffer(file)
    });
  }

  const m = window.location.hash.match(/rom=([^&]+)/);
  if (m) {
    emulator.uxn.load(b64decode(m[1])).eval(0x0100);
  }
  document.getElementById("content").style.display = "block";
  document.getElementById("loading").style.display = "none";
});

async function handleROMLoaded(rom) {
  history.replaceState('', '', "#rom=" + await b64encode(rom));
}

async function b64encode(bs) {
  const url = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => { resolve(reader.result); }
    reader.readAsDataURL(new Blob([bs]))
  });
  return url.slice(url.indexOf(',') + 1);
}

function b64decode(s) {
  return new Uint8Array([...atob(s)].map(c=>c.charCodeAt()));
}

