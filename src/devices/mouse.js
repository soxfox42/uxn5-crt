'use strict'

function Mouse(emu) {
	this.dev = emu.uxn.dev + 0x90

	this.down = (state) => {
		emu.uxn.poke8(this.dev + 6, state)
		emu.uxn.eval(peek16(emu.uxn.ram, this.dev))
	}

	this.up = (state) => {
		emu.uxn.poke8(this.dev + 6, state)
		emu.uxn.eval(peek16(emu.uxn.ram, this.dev))
	}

	this.move = (x, y) => {
		emu.uxn.poke16(this.dev + 2, x)
		emu.uxn.poke16(this.dev + 4, y)
		emu.uxn.eval(peek16(emu.uxn.ram, this.dev))
	}
}
