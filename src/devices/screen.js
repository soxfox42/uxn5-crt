'use strict'

function Screen(emu)
{
	const blending = [
		[0, 0, 0, 0, 1, 0, 1, 1, 2, 2, 0, 2, 3, 3, 3, 0],
		[0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
		[1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1],
		[2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2]];

	this.zoom = 1
	this.width = 512
	this.height = 320
	this.colors = [{r: 0, g: 0, b:0}];
	
	this.init = () => {
		this.el = document.getElementById("screen")
		this.bgCanvas = new OffscreenCanvas(100, 100);
		this.fgCanvas = new OffscreenCanvas(100, 100);
		this.renderCanvas = document.getElementById("canvas");
		this.bgctx = this.bgCanvas.getContext("2d", {"willReadFrequently": true})
		this.fgctx = this.fgCanvas.getContext("2d", {"willReadFrequently": true})
		this.renderctx = this.renderCanvas.getContext("webgl");
		(async () => {
			const response = await fetch("/shader.glsl");
			this.crt_fragment_source = await response.text();
			this.init_gl();
		})()
		if (emu.embed) { this.set_size(window.innerWidth, window.innerHeight) }
		else{ this.set_size(512, 320) }
	}

	this.toggle_zoom = () => {
		this.set_zoom(this.zoom == 2 ? 1 : 2)
	}

	this.set_zoom = (zoom) => {
		this.el.style.width = (this.width * zoom) + "px"
		this.el.style.height = (this.height * zoom) + "px"
		this.renderCanvas.style.width = (this.width * zoom) + "px"
		this.renderCanvas.width = this.width * zoom;
		this.renderCanvas.height = this.height * zoom;
		this.zoom = zoom
	}

	this.blank_screen = () => {
		const c = this.colors[0]
		this.bgctx.fillStyle = "rgba("+c.r.toString(10)+","+c.g.toString(10)+","+c.b.toString(10)+")"
		this.bgctx.fillRect(0, 0, this.width, this.height)
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

	this.set_width = (w) => {
		this.el.style.width = w + "px"
		this.fgctx.canvas.width = w;
		this.bgctx.canvas.width = w;
		this.renderctx.canvas.width = w;
		this.width = w;
		this.blank_screen()
	}

	this.set_height = (h) => {
		this.el.style.height = h + "px"
		this.bgctx.canvas.height = h;
		this.fgctx.canvas.height = h;
		this.renderctx.canvas.height = h;
		this.height = h;
		this.blank_screen()
	}

	this.set_size = (w, h) => {
		this.set_width(w)
		this.set_height(h)
	}

	this.dei = (port) => {
		switch (port) {
			case 0x22: return this.width >> 8;
			case 0x23: return this.width & 0xff;
			case 0x24: return this.height >> 8;
			case 0x25: return this.height & 0xff;
			default: return emu.uxn.dev[port];
		}
	}

	this.update_palette = () => {
		let r = emu.uxn.dev[0x8] << 8 | emu.uxn.dev[0x9]
		let g = emu.uxn.dev[0xa] << 8 | emu.uxn.dev[0xb]
		let b = emu.uxn.dev[0xc] << 8 | emu.uxn.dev[0xd]
		for(let i = 0; i < 4; i++){
			let red = (r >> ((3 - i) * 4)) & 0xf, green = (g >> ((3 - i) * 4)) & 0xf, blue = (b >> ((3 - i) * 4)) & 0xf
			this.colors[i] = { r: red << 4 | red, g: green << 4 | green, b: blue << 4 | blue }
		}
		this.blank_screen()
	}

	this.init_gl = () => {
		/** @type {WebGLRenderingContext} */
		const gl = this.renderctx;

		const compileShader = (type, source) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				throw new Error("Shader failed: " + gl.getShaderInfoLog(shader));
			}
			return shader;
		};

		const compileProgram = (vert, frag) => {
			const program = gl.createProgram();
			gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vert));
			gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, frag));
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				throw new Error("Shader program failed: " + gl.getProgramInfoLog(program));
			}

			const info = {
				program,
				attribs: {
					aPosition: gl.getAttribLocation(program, "aPosition"),
				},
				uniforms: {},
			};

			const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
			for (let i = 0; i < uniformCount; i++) {
				const uniform = gl.getActiveUniform(program, i);
				info.uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
			}

			return info;
		};

		const vertexSource = `
			precision mediump float;
			attribute vec4 aPosition;
			varying vec2 vTexCoord;
			void main() {
				vTexCoord = aPosition.xy * vec2(0.5, -0.5) + 0.5;
				gl_Position = aPosition;
			}
		`;

		const basicFragmentSource = `
			precision mediump float;
			varying vec2 vTexCoord;
			uniform sampler2D uTextureFG;
			uniform sampler2D uTextureBG;
			void main() {
				vec4 fg = texture2D(uTextureFG, vTexCoord);
				vec4 bg = texture2D(uTextureBG, vTexCoord);
				gl_FragColor = mix(bg, fg, fg.a);
			}
		`;

		this.basic_shader = compileProgram(vertexSource, basicFragmentSource);
		this.crt_shader = compileProgram(vertexSource, this.crt_fragment_source);
		this.shader = this.basic_shader;

		this.vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0
		]), gl.STATIC_DRAW);

		this.textures = {
			fg: gl.createTexture(),
			bg: gl.createTexture(),
		};

		[this.textures.fg, this.textures.bg].forEach(tex => {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		});

		this.gl_ready = true;
	}

	this.flip = () => {
		if (!this.gl_ready) return;

		/** @type {WebGLRenderingContext} */
		const gl = this.renderctx;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(this.shader.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.vertexAttribPointer(this.shader.attribs.aPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.shader.attribs.aPosition);

		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, this.textures.bg);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.bgctx.canvas)
		gl.uniform1i(this.shader.uniforms.uTextureBG, 0);

		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.textures.fg);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fgctx.canvas)
		gl.uniform1i(this.shader.uniforms.uTextureFG, 1);

		gl.uniform3f(this.shader.uniforms.iResolution, gl.canvas.width, gl.canvas.height, 1);
		gl.uniform1f(this.shader.uniforms.resolutionDownScale, 1);
		gl.uniform1f(this.shader.uniforms.hardScan, -8);
		gl.uniform1f(this.shader.uniforms.hardPix, -3);
		gl.uniform2f(this.shader.uniforms.warp, 1 / 32, 1 / 24);
		gl.uniform1f(this.shader.uniforms.maskDark, 0.5);
		gl.uniform1f(this.shader.uniforms.maskLight, 1.5);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	this.toggle_crt = () => {
		if (this.shader === this.basic_shader) {
			this.shader = this.crt_shader;
		} else {
			this.shader = this.basic_shader;
		}
	}
}
