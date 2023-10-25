'use strict'

function Mouse(emu) {
	this.dev = emu.uxn.dev + 0x90

	this.handle_mouse = (x, y, buttons) => {
		emu.uxn.poke16(this.dev + 2, x);
		emu.uxn.poke16(this.dev + 4, y);
		emu.uxn.poke8(this.dev + 6, buttons);
		emu.uxn.eval(emu.uxn.peek16(this.dev))
	}
}
