'use strict'


function rgbhex(color) {
	return "#" + color.r.toString(16) + color.g.toString(16) + color.b.toString(16);
}

const blending = [
	[0, 0, 0, 0, 1, 0, 1, 1, 2, 2, 0, 2, 3, 3, 3, 0],
	[0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
	[1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1],
	[2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2]];

function Screen(emu)
{
	this.colors = [];

	this.draw_pixel = (x,y,color) => {
		emulator.screen.ctx.fillStyle = rgbhex(this.colors[color])
		emulator.screen.ctx.fillRect(x, y, 1, 1)
	}

	// TODO cleanup
	this.draw_sprite = (ctrl, x, y, ptr, move) => {
		const twobpp = !!(ctrl & 0x80);
		const length = move >> 4;
		// Layer TOOD ctrl & 0x40 (everything on 1 layer currently)
		const color = ctrl & 0xf;
		const width = emulator.screen.ctx.canvas.width;
		const height = emulator.screen.ctx.canvas.height;
		const opaque = color % 5;
		const flipx = (ctrl & 0x10);
		const fx = flipx ? -1 : 1;
		const flipy = (ctrl & 0x20);
		const fy = flipy ? -1 : 1;

		const dx = (move & 0x1) << 3;
		const dxy = dx * fy;
		const dy = (move & 0x2) << 2;
		const dyx = dy * fx;
		const addr_incr = (move & 0x4) << (1 + twobpp);
		for (let i = 0; i <= length; i++) {
			let x1 = x + dyx * i;
			let y1 = y + dxy * i;
			var imDat = emulator.screen.ctx.createImageData(8, 8);
			for (let v = 0; v < 8; v++ ) {
				let c = emu.uxn.ram[(ptr + v) & 0xffff] | (twobpp? (emu.uxn.ram[(ptr + v + 8) * 0xffff] << 8): 0);
				let v1 = (flipy? 7 - v : v);
				for (let h = 7; h >= 0; --h) {
					let ch = (c & 1) | ((c >> 7) & 2);
					if (opaque || ch) {
						let h1 = (flipx? 7 - h : h);
						if (x < width && y < height) {
							let imdati = (h1 + v1 * 8) * 4;
							let c = this.colors[blending[ch][color]]
							imDat.data[imdati] = c.r << 4;
							imDat.data[imdati+1] = c.g << 4; 
							imDat.data[imdati+2] = c.b << 4;
							imDat.data[imdati+3] = 255; // a
						}
					}
					c = c >> 1;
				}
			}		
			emulator.screen.ctx.putImageData(imDat, x1, y1);
			ptr += addr_incr;
		}
		if(move & 0x1) {
			x = x + dx * fx;
			emu.uxn.poke16(emu.uxn.dev + 0x28, x);
		}
		if(move & 0x2) {
			y = y + dy * fy;
			emu.uxn.poke16(emu.uxn.dev + 0x2a, y);
		}
		if(move & 0x4) {
			emu.uxn.poke16(emu.uxn.dev + 0x2c, ptr);
		}
	}

	this.update_palette = () => {
		let r1 = emu.uxn.ram[emu.uxn.dev + 0x8]
		let r2 = emu.uxn.ram[emu.uxn.dev + 0x9]
		let g1 = emu.uxn.ram[emu.uxn.dev + 0xa]
		let g2 = emu.uxn.ram[emu.uxn.dev + 0xb]
		let b1 = emu.uxn.ram[emu.uxn.dev + 0xc]
		let b2 = emu.uxn.ram[emu.uxn.dev + 0xd]
		this.colors[0] = {r: r1 >> 4, g: g1 >> 4, b: b1 >> 4}
		this.colors[1] = {r: r1 & 0xf, g: g1 & 0xf, b: b1 & 0xf}
		this.colors[2] = {r: r2 >> 4, g: g2 >> 4, b: b2 >> 4}
		this.colors[3] = {r: r2 & 0xf, g: g2 & 0xf, b: b2 & 0xf}
		console.log(this.colors)
	}
}
