'use strict'

function Mouse(emu) {
	this.dev = emu.uxn.dev + 0x90

	this.down = (mask) => {
		emu.uxn.poke8(this.dev + 6, mask)
		emu.uxn.eval(emu.uxn.peek16(this.dev))
	}

	this.up = (mask) => {
		emu.uxn.poke8(this.dev + 6, mask)
		emu.uxn.eval(emu.uxn.peek16(this.dev))
	}

	this.move = (x, y) => {
		emu.uxn.poke16(this.dev + 2, x)
		emu.uxn.poke16(this.dev + 4, y)
		emu.uxn.eval(emu.uxn.peek16(this.dev))
	}
}
