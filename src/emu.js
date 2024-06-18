'use strict'

function Emu (embed)
{
	if (typeof UxnWASM !== 'undefined') {
		console.log("Using WebAssembly core")
		this.uxn = new (UxnWASM.Uxn)(this)
	} else {
		console.log("Using Vanilla JS core")
		this.uxn = new Uxn(this)
	}

	this.el = null
	this.zoom = 1
	this.embed = embed
	this.system = new System(this)
	this.console = new Console(this)
	this.controller = new Controller(this)
	this.screen = new Screen(this)
	this.datetime = new DateTime(this)
	this.mouse = new Mouse(this)
	this.file = new FileDvc(this)

	this.init = (embed) => {
		this.el = document.getElementById("emulator")

		// Support dropping files
		document.body.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
		document.body.addEventListener("drop", (e) => {
			e.preventDefault();
			this.load_file(e.dataTransfer.files[0])
		});

		// Browse button
		document.getElementById("browser").addEventListener("change", (e) => {
			this.load_file(e.target.files[0])
		});

		/* console */
		this.console.input_el = document.getElementById("console_input")
		this.console.input_el.addEventListener("keyup", (event) => {
			if (event.key === "Enter") {
				let query = this.console.input_el.value
				for (let i = 0; i < query.length; i++)
					emulator.console.input(query.charAt(i).charCodeAt(0), 1)
				emulator.console.input(0x0a, 1)
				this.console.input_el.value = ""
			}
		});

		this.console.write_el = document.getElementById("console_std")
		this.console.error_el = document.getElementById("console_err")

		/* screen */
		this.screen.init()
		this.screen.el.addEventListener("pointermove", this.pointer_moved)
		this.screen.el.addEventListener("pointerdown", this.pointer_down)
		this.screen.el.addEventListener("pointerup", this.pointer_up)

		window.addEventListener("keydown", emulator.controller.keyevent)
		window.addEventListener("keyup", emulator.controller.keyevent)

		/* reveal */
		this.el.style.display = "block"

		if(emulator.embed){
			document.body.className = "embed";
		}
		document.title = "Varvara Emulator";
		return this.uxn.init(this)
	}

	this.load = (rom) => {
		this.set_zoom(1)
		this.uxn.load(rom).eval(0x0100);
		share.setROM(rom);
	}

	this.load_file = (file) => {
		let reader = new FileReader()
		reader.onload = (e) => {
			this.screen.init()
			this.load(new Uint8Array(e.target.result));
		};
		reader.readAsArrayBuffer(file)
	}

	this.dei = (port) => {
		switch (port & 0xf0) {
		case 0xc0: return this.datetime.dei(port)
		case 0x20: return this.screen.dei(port)
		}
		return this.uxn.dev[port]
	}

	this.deo = (port, val) => {
		this.uxn.dev[port] = val
		switch(port) {
		// System
		case 0x07: this.system.metadata(peek16(this.uxn.dev, 0x06)); break;
		case 0x03: this.system.expansion(peek16(this.uxn.dev, 0x02)); break;
		case 0x08:
		case 0x09:
		case 0x0a:
		case 0x0b:
		case 0x0c:
		case 0x0d: this.screen.update_palette(); break;
		case 0x0f: console.warn("Program ended."); break;
		// Console
		case 0x18: this.console.write(val); break;
		case 0x19: this.console.error(val); break;
		// Screen
		case 0x22, 0x23:
			this.screen.set_width(peek16(this.uxn.dev, 0x22))
			this.set_zoom(this.zoom)
			break;
		case 0x24, 0x25:
			this.screen.set_height(peek16(this.uxn.dev, 0x24))
			this.set_zoom(this.zoom)
			break;
		case 0x2e: {
			const x = peek16(this.uxn.dev, 0x28)
			const y = peek16(this.uxn.dev, 0x2a)
			const move = this.uxn.dev[0x26]
			const ctrl = this.uxn.dev[0x2e]
			this.screen.draw_pixel(ctrl, x, y, move);
			break; }
		case 0x2f: {
			const x = peek16(this.uxn.dev, 0x28)
			const y = peek16(this.uxn.dev, 0x2a)
			const move = this.uxn.dev[0x26]
			const ctrl = this.uxn.dev[0x2f]
			const ptr = peek16(this.uxn.dev, 0x2c)
			this.screen.draw_sprite(ctrl, x, y, move, ptr);
			break; }
		}
	}

	this.pointer_moved = (event) => {
		const bounds = this.screen.bgCanvas.getBoundingClientRect()
		const x = this.screen.bgCanvas.width * (event.clientX - bounds.left) / bounds.width
		const y = this.screen.bgCanvas.height * (event.clientY - bounds.top) / bounds.height
		this.mouse.move(x, y)
		event.preventDefault()
	}

	this.pointer_down = (event) => {
		this.pointer_moved(event)
		this.mouse.down(event.buttons)
		event.preventDefault()
	}

	this.pointer_up = (event) => {
		this.mouse.up(event.buttons)
		event.preventDefault();
	}

	this.screen_callback = () => {
		this.uxn.eval(peek16(this.uxn.dev, 0x20))
	}

	this.toggle_zoom = () => {
		this.set_zoom(this.zoom == 2 ? 1 : 2)
	}

	this.set_zoom = (zoom) => {
		this.screen.el.style.marginLeft = -(this.screen.width / 2 * zoom) + "px"
		this.screen.el.style.width = (this.screen.width * zoom) + "px"
		this.screen.el.style.height = (this.screen.height * zoom) + "px"
		this.screen.bgCanvas.style.width = this.screen.fgCanvas.style.width = (this.screen.width * zoom) + "px"
		this.zoom = zoom
	}
}

function peek16(mem, addr) {
	return (mem[addr] << 8) + mem[addr + 1]
}

function poke16(mem, addr, val) {
	mem[addr] = val >> 8, mem[addr + 1] = val;
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
