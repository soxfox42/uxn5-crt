'use strict'

const emulator = new Emu(window.self !== window.top)

/* share */
const share_el = document.getElementById("share")
const share = new ShareView(share_el);

emulator.init().then(() => {
	// Rom in url
	const rom_url = window.location.hash.match(/r(om)?=([^&]+)/);
	if (rom_url) {
		let rom = b64decode(rom_url[2]);
		if(!rom_url[1]) {
			rom = decodeUlz(rom);
		}
		emulator.load(rom);
	}

	// Animation callback
	function step() {
		emulator.screen_callback();
	}

	setInterval(() => {
		window.requestAnimationFrame(step);
	}, 1000 / 60);
});
