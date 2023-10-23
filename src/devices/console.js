'use strict'

function Console(emu)
{
	this.write_el = null
	this.error_el = null

	this.write = (char) => {
		this.write_el.innerHTML += String.fromCharCode(char)
	}

	this.error = (char) => {
		this.error_el.innerHTML += String.fromCharCode(char)
	}

	this.input = (char) => {
		// Get vector
		let vec = emu.uxn.peek16(emu.uxn.dev + 0x10)
		// Set char
		emu.uxn.poke8(emu.uxn.dev + 0x12, char)
		if(!vec)
			console.warn("No console vector")
		emu.uxn.eval(vec)
	}
}