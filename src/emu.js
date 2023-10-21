'use strict'

function Emu ()
{
	this.debug = 0
	this.uxn = new Uxn(this)
	this.console = new Console(this)
	this.screen = new Screen(this)

	let opcodes = [
		"LIT", "INC", "POP", "NIP", "SWP", "ROT", "DUP", "OVR",
		"EQU", "NEQ", "GTH", "LTH", "JMP", "JCN", "JSR", "STH",
		"LDZ", "STZ", "LDR", "STR", "LDA", "STA", "DEI", "DEO",
		"ADD", "SUB", "MUL", "DIV", "AND", "ORA", "EOR", "SFT",
		"BRK"]

	function getname(byte) {
		let m2 = !!(byte & 0x20) ? "2" : ""
		let mr = !!(byte & 0x40) ? "r" : ""
		let mk = !!(byte & 0x80) ? "k" : ""
		return opcodes[byte & 0x1f] + m2 + mk + mr
	}

	this.debugger = () => {
		if(!this.uxn.wst.ptr())
			console.log("Stack is clean")
		// Stack
		let buf = ""
		for (let i = 0; i < this.uxn.wst.ptr(); i++) {
			buf += this.uxn.wst.get(i).toString(16)+" "
		}
		console.warn(buf)
	}

	this.onStep = (pc, instr) => {
		if(this.debug)
			console.log(getname(instr), pc)
	}

	this.dei = (port) => {
		return this.uxn.getdev(port)
	}

	this.deo = (port, val) => {
		this.uxn.setdev(port, val)
		switch(port) {
		case 0x08:
		case 0x09:
		case 0x0a:
		case 0x0b:
		case 0x0c: 
		case 0x0d: this.screen.update_palette(); break;
		case 0x18: this.console.write(val); break;
		case 0x19: this.console.error(val); break;
		case 0x2e: 
			let x = this.uxn.peek16(this.uxn.dev + 0x28)
			let y = this.uxn.peek16(this.uxn.dev + 0x2a)
			let color = this.uxn.peek8(this.uxn.dev + 0x2e)
			this.screen.pixel(x,y,color);
			break;
		case 0x0f: console.warn("Program ended."); break;
		}
	}
}
