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

const share = new ShareView(document.getElementById("share"));

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
        document.getElementById("title").innerHTML = file.name
        loadROM(rom);
      };
      reader.readAsArrayBuffer(file)
    });
      
    document.getElementById("browser").addEventListener("change", function(event) {
        let file = event.target.files[0], reader = new FileReader()
      reader.onload = function (event) {
        let rom = new Uint8Array(event.target.result)
        emulator.screen.set_size(512, 320)
        document.getElementById("title").innerHTML = file.name
        loadROM(rom);
      };
      reader.readAsArrayBuffer(file)
    });
  }

  const m = window.location.hash.match(/r(om)?=([^&]+)/);
  if (m) {
    let rom = b64decode(m[2]);
    if (!m[1]) {
      rom = decodeUlz(rom);
    }
    loadROM(rom);
  }
  document.getElementById("content").style.display = "block";
  document.getElementById("loading").style.display = "none";
});

function loadROM(rom) {
  emulator.uxn.load(rom).eval(0x0100);
  share.setROM(rom);
}


////////////////////////////////////////////////////////////////////////////////
// Sharing
////////////////////////////////////////////////////////////////////////////////

function ShareView(el) {
  let rom;

  async function toggleSharePopup() {
    if (popupEl.style.display === "none") {
      popupEl.style.display = "block";
      inputEl.value = "...";
      copyButtonEl.disabled = true;
      const hash = "#r=" + await b64encode(encodeUlz(rom));
      inputEl.value = `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}${hash}`;
      copyButtonEl.disabled = false;
    } else {
      popupEl.style.display = "none";
    }
  }

  const shareButtonEl = document.createElement("button");
  shareButtonEl.disabled = true;
  shareButtonEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share" viewBox="0 0 16 16"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`
  shareButtonEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    toggleSharePopup();
  });
  el.appendChild(shareButtonEl);

  const popupEl = document.createElement("div");
  popupEl.style.display = "none";
  popupEl.className = "share-popup";
  el.appendChild(popupEl);

  const inputEl = document.createElement("input");
  inputEl.readOnly = true;
  popupEl.appendChild(inputEl);
  const copyButtonEl = document.createElement("button");
  copyButtonEl.addEventListener("click", async (ev) => {
    ev.preventDefault();
    await navigator.clipboard.writeText(inputEl.value);
    toggleSharePopup();
  });
  copyButtonEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`
  popupEl.appendChild(copyButtonEl);

  this.setROM = (v) => {
    rom = v;
    shareButtonEl.disabled = false;
    popupEl.style.display = "none";
  }
}

async function b64encode(bs) {
  const url = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => { resolve(reader.result); }
    reader.readAsDataURL(new Blob([bs]))
  });
  return url.slice(url.indexOf(',') + 1).replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
}

function b64decode(s) {
  if (s.length % 4 != 0){
    s += ('===').slice(0, 4 - (s.length % 4));
  }
  return new Uint8Array([...atob(s.replace(/_/g, '/').replace(/-/g, '+'))].map(c=>c.charCodeAt()));
}

function decodeUlz(src) {
  const dst = [];
  let sp = 0;
  while (sp < src.length) {
    const c = src[sp++];
    if (c & 0x80) {
      // CPY
      let length;
      if (c & 0x40) {
        if (sp >= src.length) {
          throw new Error(`incomplete CPY2`);
        }
        length = ((c & 0x3f) << 8) | src[sp++];
      } else {
        length = c & 0x3f;
      }
      if (sp >= src.length) {
        throw new Error(`incomplete CPY`);
      }
      let cp = dst.length - (src[sp++] + 1);
      if (cp < 0) {
        throw new Error(`CPY underflow`);
      }
      for (let i = 0; i < length + 4; i++) {
        dst.push(dst[cp++]);
      }
    } else {
      // LIT
      if (sp + c >= src.length) {
        throw new Error(`LIT out of bounds: ${sp} + ${c} >= ${src.length}`);
      }
      for (let i = 0; i < c + 1; i++) {
        dst.push(src[sp++]);
      }
    }
  }
  return new Uint8Array(dst);
}

const MIN_MAX_LENGTH = 4;

function findBestMatch(src, sp, dlen, slen) {
  let bmlen = 0;
  let bmp = 0;
  let dp = sp - dlen;
  for (; dlen; dp++, dlen--) {
    let i = 0;
    for (; ; i++) {
      if (i == slen) {
        return [dp, i];
      }
      if (src[sp + i] != src[dp + (i % dlen)]) {
        break;
      }
    }
    if (i > bmlen) {
      bmlen = i;
      bmp = dp;
    }
  }
  return [bmp, bmlen];
}

function encodeUlz(src) {
  let dst = [];
  let sp = 0;
  let litp = -1;
  while (sp < src.length) {
    const dlen = Math.min(sp, 256);
    const slen = Math.min(src.length - sp, 0x3fff + MIN_MAX_LENGTH);
    const [bmp, bmlen] = findBestMatch(src, sp, dlen, slen);
    if (bmlen >= MIN_MAX_LENGTH) {
      // CPY
      const bmctl = bmlen - MIN_MAX_LENGTH;
      if (bmctl > 0x3f) {
        // 	CPY2
        dst.push((bmctl >> 8) | 0xc0);
        dst.push(bmctl & 0xff);
      } else {
        dst.push(bmctl | 0x80);
      }
      dst.push(sp - bmp - 1);
      sp += bmlen;
      litp = -1;
    } else {
      // LIT
      if (litp >= 0) {
        if ((dst[litp] += 1) == 127) {
          litp = -1;
        }
      } else {
        dst.push(0);
        litp = dst.length - 1;
      }
      dst.push(src[sp++]);
    }
  }
  return new Uint8Array(dst);
}
