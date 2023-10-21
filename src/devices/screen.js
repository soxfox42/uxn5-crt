'use strict'


function Screen(emu)
{
	this.colors = {};

	function rgbToHex(r, g, b) {
		return "#" + r.toString(16) + g.toString(16) + b.toString(16);
	}

	this.pixel = (x,y,color) => {
		emulator.screen.ctx.fillStyle = this.colors[color]
    	emulator.screen.ctx.fillRect(x, y, 1, 1)
	}

	this.update_palette = () => {
		let r1 = emu.uxn.ram[emu.uxn.dev + 0x8]
		let r2 = emu.uxn.ram[emu.uxn.dev + 0x9]
		let g1 = emu.uxn.ram[emu.uxn.dev + 0xa]
		let g2 = emu.uxn.ram[emu.uxn.dev + 0xb]
		let b1 = emu.uxn.ram[emu.uxn.dev + 0xc]
		let b2 = emu.uxn.ram[emu.uxn.dev + 0xd]
		this.colors[0] = rgbToHex(r1 >> 4, g1 >> 4, b1 >> 4)
		this.colors[1] = rgbToHex(r1 & 0xf, g1 & 0xf, b1 & 0xf)
		this.colors[2] = rgbToHex(r2 >> 4, g2 >> 4, b2 >> 4)
		this.colors[3] = rgbToHex(r2 & 0xf, g2 & 0xf, b2 & 0xf)
		console.log(this.colors)
	}
}