'use strict'

function Emu () {

	this.buffer = ""

	let opcodes = [
		"LIT", "INC", "POP", "DUP", "NIP", "SWP", "OVR", "ROT",
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

	this.onStep = (pc, instr) => {
		// console.log(getname(instr), pc)
	}

	this.dei = (port) => {

	}

	this.deo = (port, val) => {
		if(port == 0x18) {
			if(val == 0x0a){
				console.log(this.buffer)
				this.buffer = ""
			}
			else{
				this.buffer += String.fromCharCode(val)
			}
		}
	}

}
