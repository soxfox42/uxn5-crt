'use strict'

const emulator = new Emu(window.self !== window.top)

/* share */
const share_el = document.getElementById("share")
const share = new ShareView(share_el);

emulator.init().then(() => {

	// Animation callback
	function step() {
		emulator.screen_callback();
	}

	setInterval(() => {
		window.requestAnimationFrame(step);
	}, 1000 / 60);

	if(!emulator.embed) {
		// Support dropping files
		const target = document.body
		target.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
		target.addEventListener("drop", (e) => {
			e.preventDefault();
			let file = e.dataTransfer.files[0], reader = new FileReader()
			reader.onload = function (event) {
				let rom = new Uint8Array(event.target.result)
				emulator.screen.init()
				emulator.load(rom);
			};
			reader.readAsArrayBuffer(file)
		});

		document.getElementById("browser").addEventListener("change", (e) => {
			let file = e.target.files[0], reader = new FileReader()
			reader.onload = function (event) {
				let rom = new Uint8Array(event.target.result)
				emulator.screen.init()
				emulator.load(rom);
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
		emulator.load(rom);
	}
	document.title = "Varvara Emulator";
});



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
	shareButtonEl.innerHTML = `Share`
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
	copyButtonEl.innerHTML = `Copy`
	popupEl.appendChild(copyButtonEl);

	this.setROM = (v) => {
		rom = v;
		shareButtonEl.disabled = false;
		popupEl.style.display = "none";
		share_el.style.display = "initial"
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
	if (s.length % 4 != 0) {
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
				//	CPY2
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