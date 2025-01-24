'use strict'

function Screen(emu)
{
	function MAR(x) { return x + 0x8; }
	function MAR2(x) { return x + 0x10; }
	function clamp(v,a,b) { if(v < a) return a; else if(v >= b) return b; else return v; }
	function twos(v) { if(v & 0x8000) return v - 0x10000;  return v; }

	const blending = [
		[0, 0, 0, 0, 1, 0, 1, 1, 2, 2, 0, 2, 3, 3, 3, 0],
		[0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
		[1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1],
		[2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2]];

	this.zoom = 1
	this.width = 0
	this.height = 0
	this.layers = {fg: 0, bg: 0};
	this.colors = [{r: 0, g: 0, b:0}];

	this.init = () => {
		this.el = document.getElementById("screen")
		this.bgCanvas = document.getElementById("bgcanvas");
		this.fgCanvas = document.getElementById("fgcanvas");
		this.bgctx = this.bgCanvas.getContext("2d", {"willReadFrequently": true})
		this.fgctx = this.fgCanvas.getContext("2d", {"willReadFrequently": true})
		if (emu.embed) { this.set_size(window.innerWidth, window.innerHeight) }
		else{ this.set_size(512, 320) }
	}
	
	this.changed = () => {
		clamp(this.x1, 0, this.width);
		clamp(this.y1, 0, this.height);
		clamp(this.x2, 0, this.width);
		clamp(this.y2, 0, this.height);
		return this.x2 > this.x1 && this.y2 > this.y1;
	}
	
	this.change = (x1, y1, x2, y2) => {
		if(x1 < this.x1) this.x1 = x1;
		if(y1 < this.y1) this.y1 = y1;
		if(x2 > this.x2) this.x2 = x2;
		if(y2 > this.y2) this.y2 = y2;
	}

	this.palette = () => {
		let i, shift, colors = [];
		for(i = 0, shift = 4; i < 4; ++i, shift ^= 4) {
			let
				r = (emu.uxn.dev[0x8 + i / 2] >> shift) & 0xf,
				g = (emu.uxn.dev[0xa + i / 2] >> shift) & 0xf,
				b = (emu.uxn.dev[0xc + i / 2] >> shift) & 0xf;
			colors[i] = 0x0f000000 | r << 16 | g << 8 | b;
			colors[i] |= colors[i] << 4;
		}
		for(i = 0; i < 16; i++)
			this.palette[i] = colors[(i >> 2) ? (i >> 2) : (i & 3)];
		this.change(0, 0, this.width, this.height);
	}

	this.resize = (width, height, scale) => {
		clamp(width, 8, 0x800);
		clamp(height, 8, 0x800);
		clamp(scale, 1, 3);
		/* on rescale */
		this.pixels = new Uint32Array(width * height * scale * scale);
		this.scale = scale;
		/* on resize */
		if(this.width != width || this.height != height) {
			let length = MAR2(width) * MAR2(height);
			this.layers.fg = new Uint8Array(length)
			this.layers.bg = new Uint8Array(length)
			this.width = width;
			this.height = height;
		}
		this.change(0, 0, width, height);
		emu.resize(width, height);
	}
	
	this.screen_redraw = () => {
		let i, x, y, k, l;
		for(y = this.y1; y < this.y2; y++) {
			let ys = y * this.scale;
			for(x = this.x1, i = MAR(x) + MAR(y) * MAR2(this.width); x < this.x2; x++, i++) {
				let c = this.palette[this.fg[i] << 2 | this.bg[i]];
				for(k = 0; k < this.scale; k++) {
					let oo = ((ys + k) * this.width + x) * this.scale;
					for(l = 0; l < this.scale; l++)
						this.pixels[oo + l] = c;
				}
			}
		}
		this.x1 = this.y1 = 9999;
		this.x2 = this.y2 = 0;
	}

	let rX, rY, rA, rMX, rMY, rMA, rML, rDX, rDY;

	this.dei = (addr) => {
		switch(addr) {
		case 0x22: return this.width >> 8;
		case 0x23: return this.width;
		case 0x24: return this.height >> 8;
		case 0x25: return this.height;
		case 0x28: return rX >> 8;
		case 0x29: return rX;
		case 0x2a: return rY >> 8;
		case 0x2b: return rY;
		case 0x2c: return rA >> 8;
		case 0x2d: return rA;
		default: return emu.uxn.dev[addr];
		}
	}

	this.deo = (addr) => {
		switch(addr) {
		case 0x21: this.vector = emu.uxn.dev[0x20] << 8 | emu.uxn.dev[0x21]; return;
		case 0x23: this.resize(emu.uxn.dev[0x22] << 8 | emu.uxn.dev[0x23], this.height, this.scale); return;
		case 0x25: this.resize(this.width, emu.uxn.dev[0x24] << 8 | emu.uxn.dev[0x25], this.scale); return;
		case 0x26: 
			rMX = emu.uxn.dev[0x26] & 0x1;
			rMY = emu.uxn.dev[0x26] & 0x2;
			rMA = emu.uxn.dev[0x26] & 0x4;
			rML = emu.uxn.dev[0x26] >> 4;
			rDX = rMX << 3;
			rDY = rMY << 2; return;
		case 0x28:
		case 0x29: rX = (emu.uxn.dev[0x28] << 8) | emu.uxn.dev[0x29], rX = twos(rX); return;
		case 0x2a:
		case 0x2b: rY = (emu.uxn.dev[0x2a] << 8) | emu.uxn.dev[0x2b], rY = twos(rY); return;
		case 0x2c:
		case 0x2d: rA = (emu.uxn.dev[0x2c] << 8) | emu.uxn.dev[0x2d]; return;
		case 0x2e: {
			let ctrl = emu.uxn.dev[0x2e];
			let color = ctrl & 0x3;
			let len = MAR2(this.width);
			let layer = ctrl & 0x40 ? this.layers.fg : this.layers.bg;
			/* fill mode */
			if(ctrl & 0x80) {
				let x1, y1, x2, y2, ax, bx, ay, by, hor, ver;
				if(ctrl & 0x10) x1 = MAR(0), x2 = MAR(rX);
				else x1 = MAR(rX), x2 = MAR(this.width);
				if(ctrl & 0x20) y1 = MAR(0), y2 = MAR(rY);
				else y1 = MAR(rY), y2 = MAR(this.height);
				hor = x2 - x1, ver = y2 - y1;
				for(ay = y1 * len, by = ay + ver * len; ay < by; ay += len)
					for(ax = ay + x1, bx = ax + hor; ax < bx; ax++)
						layer[ax] = color;
				this.change(x1, y1, x2, y2);
			}
			/* pixel mode */
			else {
				if(rX >= 0 && rY >= 0 && rX < len && rY < this.height)
					layer[MAR(rX) + MAR(rY) * len] = color;
				this.change(rX, rY, rX + 1, rY + 1);
				if(rMX) rX++;
				if(rMY) rY++;
			}
			return;
		}
		case 0x2f: {
			let ctrl = emu.uxn.dev[0x2f];
			let blend = ctrl & 0xf, opaque = blend % 5;
			let fx = ctrl & 0x10 ? -1 : 1, fy = ctrl & 0x20 ? -1 : 1;
			let qfx = fx > 0 ? 7 : 0, qfy = fy < 0 ? 7 : 0;
			let dxy = fy * rDX, dyx = fx * rDY;
			let wmar = MAR(this.width), wmar2 = MAR2(this.width);
			let hmar2 = MAR2(this.height);
			let i, x1, x2, y1, y2, ax, ay, qx, qy, x = rX, y = rY;
			let layer = ctrl & 0x40 ? this.layers.fg : this.layers.bg;
			if(ctrl & 0x80) {
				let addr_incr = rMA << 2;
				for(i = 0; i <= rML; i++, x += dyx, y += dxy, rA += addr_incr) {
					let xmar = MAR(x), ymar = MAR(y);
					let xmar2 = MAR2(x), ymar2 = MAR2(y);
					if(xmar < wmar && ymar2 < hmar2) {
						let sprite = emu.uxn.ram[rA];
						let by = ymar2 * wmar2;
						for(ay = ymar * wmar2, qy = qfy; ay < by; ay += wmar2, qy += fy) {
							let ch1 = sprite[qy], ch2 = sprite[qy + 8] << 1, bx = xmar2 + ay;
							for(ax = xmar + ay, qx = qfx; ax < bx; ax++, qx -= fx) {
								let color = ((ch1 >> qx) & 1) | ((ch2 >> qx) & 2);
								if(opaque || color) layer[ax] = blending[color][blend];
							}
						}
					}
				}
			} else {
				let addr_incr = rMA << 1;
				for(i = 0; i <= rML; i++, x += dyx, y += dxy, rA += addr_incr) {
					let xmar = MAR(x), ymar = MAR(y);
					let xmar2 = MAR2(x), ymar2 = MAR2(y);
					if(xmar < wmar && ymar2 < hmar2) {
						let sprite = emu.uxn.ram[rA];
						let by = ymar2 * wmar2;
						for(ay = ymar * wmar2, qy = qfy; ay < by; ay += wmar2, qy += fy) {
							let ch1 = sprite[qy], bx = xmar2 + ay;
							for(ax = xmar + ay, qx = qfx; ax < bx; ax++, qx -= fx) {
								let color = (ch1 >> qx) & 1;
								if(opaque || color) layer[ax] = blending[color][blend];
							}
						}
					}
				}
			}
			if(fx < 0)
				x1 = x, x2 = rX;
			else
				x1 = rX, x2 = x;
			if(fy < 0)
				y1 = y, y2 = rY;
			else
				y1 = rY, y2 = y;
			this.change(x1 - 8, y1 - 8, x2 + 8, y2 + 8);
			if(rMX) rX += rDX * fx;
			if(rMY) rY += rDY * fy;
			return;
		}
		}
	}

	/////////////////////////////////////////////////////////

	this.toggle_zoom = () => {
		this.set_zoom(this.zoom == 2 ? 1 : 2)
	}

	this.set_zoom = (zoom) => {
		this.el.style.width = (this.width * zoom) + "px"
		this.el.style.height = (this.height * zoom) + "px"
		this.bgCanvas.style.width = this.fgCanvas.style.width = (this.width * zoom) + "px"
		this.zoom = zoom
	}

	this.draw_pixel = (ctrl,x,y,move) => {
		const ctx = ctrl & 0x40 ? this.fgctx : this.bgctx
		const color = ctrl & 0x3
		const c = this.colors[color]
		const a = (color == 0 && (ctrl & 0x40)) ? 0 : 1
		if (a) {
			ctx.fillStyle = "rgba("+c.r.toString(10)+","+c.g.toString(10)+","+c.b.toString(10)+")"
		}
		// fill mode
		if(ctrl & 0x80) {
			let x2 = this.width
			let y2 = this.height
			if(ctrl & 0x10) x2 = x, x = 0
			if(ctrl & 0x20) y2 = y, y = 0
			a ? ctx.fillRect(x, y, x2 - x, y2 - y) : ctx.clearRect(x, y, x2 - x, y2 - y)
		}
		// pixel mode
		else {
			a? ctx.fillRect(x, y, 1, 1) : ctx.clearRect(x, y, 1, 1)
		}
		if (move & 0x1)
			poke16(emu.uxn.dev, 0x28, x + 1);
		if (move & 0x2)
			poke16(emu.uxn.dev, 0x2a, y + 1);
	}

	this.draw_sprite = (ctrl, x, y, move, ptr) => {
		const twobpp = !!(ctrl & 0x80);
		const length = move >> 4;
		const ctx = ctrl & 0x40 ? this.fgctx : this.bgctx;
		const color = ctrl & 0xf, opaque = color % 5;
		const width = ctx.canvas.width;
		const height = ctx.canvas.height;
		const flipx = (ctrl & 0x10), fx = flipx ? -1 : 1;
		const flipy = (ctrl & 0x20), fy = flipy ? -1 : 1;
		const dx = (move & 0x1) << 3, dxy = dx * fy;
		const dy = (move & 0x2) << 2, dyx = dy * fx;
		const addr_incr = (move & 0x4) << (1 + twobpp);
		for (let i = 0; i <= length; i++) {
			let x1 = x + dyx * i
			let y1 = y + dxy * i
			if(x1 >= 0x8000) x1 = -(0x10000 - x1)
			if(y1 >= 0x8000) y1 = -(0x10000 - y1)
			var imDat = ctx.getImageData(x1,y1, 8, 8);
			for (let v = 0; v < 8; v++) {
				let c = emu.uxn.ram[(ptr + v) & 0xffff] | (twobpp? (emu.uxn.ram[(ptr + v + 8) & 0xffff] << 8): 0);
				let v1 = (flipy ? 7 - v : v)
				for (let h = 7; h >= 0; --h, c >>= 1) {
					let ch = (c & 1) | ((c >> 7) & 2)
					if (opaque || ch) {
						let imdati = ((flipx ? 7 - h : h) + v1 * 8) * 4;
						let b = blending[ch][color]
						let c = this.colors[b]
						imDat.data[imdati] = c.r
						imDat.data[imdati+1] = c.g
						imDat.data[imdati+2] = c.b
						imDat.data[imdati+3] = (!b && (ctrl & 0x40)) ? 0 : 0xff // alpha
					}
				}
			}
			ctx.putImageData(imDat, x1, y1);
			ptr += addr_incr;
		}
		if(move & 0x1) {
			x = x + dx * fx;
			poke16(emu.uxn.dev, 0x28, x);
		}
		if(move & 0x2) {
			y = y + dy * fy;
			poke16(emu.uxn.dev, 0x2a, y);
		}
		if(move & 0x4) {
			poke16(emu.uxn.dev, 0x2c, ptr);
		}
	}

	this.on_resize = () => {
		let length = MAR2(this.width) * MAR2(this.height)
		this.layers.fg = new Uint8Array(length)
		this.layers.bg = new Uint8Array(length)
		
	}

	this.set_width = (w) => {
		if(this.width != w) {
			this.el.style.width = w + "px"
			this.fgctx.canvas.width = w;
			this.bgctx.canvas.width = w;
			this.width = w;
			this.on_resize()
		}
	}

	this.set_height = (h) => {
		if(this.height != h) { 
			this.el.style.height = h + "px"
			this.bgctx.canvas.height = h;
			this.fgctx.canvas.height = h;
			this.height = h;
			this.on_resize()
		}
	}

	this.set_size = (w, h) => {
		this.set_width(w)
		this.set_height(h)
	}

	this.update_palette = () => {
		let r = emu.uxn.dev[0x8] << 8 | emu.uxn.dev[0x9]
		let g = emu.uxn.dev[0xa] << 8 | emu.uxn.dev[0xb]
		let b = emu.uxn.dev[0xc] << 8 | emu.uxn.dev[0xd]
		for(let i = 0; i < 4; i++){
			let red = (r >> ((3 - i) * 4)) & 0xf, green = (g >> ((3 - i) * 4)) & 0xf, blue = (b >> ((3 - i) * 4)) & 0xf
			this.colors[i] = { r: red << 4 | red, g: green << 4 | green, b: blue << 4 | blue }
		}
		
	}
}
