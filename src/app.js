'use strict'

const emulator = new Emu(window.self !== window.top)

/* share */
const share_el = document.getElementById("share")
const share = new ShareView(share_el);

emulator.init()