'use strict'

function System(emu)
{
	this.expansion = (addr) => {
		let operation = emu.uxn.ram[addr]
		// fill
		if(operation == 0){
			let length = peek16(emu.uxn.ram, addr + 1);
			let dst_page = peek16(emu.uxn.ram, addr + 3);
			let dst_addr = peek16(emu.uxn.ram, addr + 5);
			let value = emu.uxn.ram[addr + 7]
			let dst = dst_page * 0x10000;
			for(let i = 0; i < length; i++)
				emu.uxn.ram[dst + ((dst_addr + i) & 0xffff)] = value;
		}
		console.log(operation)
	}
}
