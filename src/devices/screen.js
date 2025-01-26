'use strict'

function Screen(emu)
{
	function MAR(x) { return x + 0x8; }
	function MAR2(x) { return x + 0x10; }
	function clamp(v,a,b) { if(v < a) return a; else if(v >= b) return b; else return v; }
	function twos(v) { if(v & 0x8000) return v - 0x10000; return v; }

	const blending = [
		[0, 0, 0, 0, 1, 0, 1, 1, 2, 2, 0, 2, 3, 3, 3, 0],
		[0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
		[1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1],
		[2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2]];

	this.pixels = 0
	this.scale = 1
	this.zoom = 1
	this.width = this.height = 0
	this.layers = {fg: 0, bg: 0};
	this.palette = new Uint8ClampedArray(12);
	this.x1 = this.y1 = this.x2 = this.y2 = 0
	this.vector = 0

	this.init = () => {
		this.display = document.getElementById("display");
		this.displayctx = this.display.getContext("webgl")
		this.display.addEventListener("pointermove", emu.mouse.on_move)
		this.display.addEventListener("pointerdown", emu.mouse.on_down)
		this.display.addEventListener("pointerup", emu.mouse.on_up)
		this.display.addEventListener("wheel", emu.mouse.on_scroll)
		window.addEventListener("keydown", emu.controller.on_keybutton)
		window.addEventListener("keyup", emu.controller.on_keybutton)
		this.set_zoom(1)
		this.resize(512, 320, 1);
		(async () => {
			const response = await fetch("/shader.glsl");
			this.crt_fragment_source = await response.text();
			this.init_gl();
		})();
	}

	this.changed = () => {
		this.x1 = clamp(this.x1, 0, this.width);
		this.y1 = clamp(this.y1, 0, this.height);
		this.x2 = clamp(this.x2, 0, this.width);
		this.y2 = clamp(this.y2, 0, this.height);
		return this.x2 > this.x1 && this.y2 > this.y1;
	}

	this.change = (x1, y1, x2, y2) => {
		if(x1 < this.x1) this.x1 = x1;
		if(y1 < this.y1) this.y1 = y1;
		if(x2 > this.x2) this.x2 = x2;
		if(y2 > this.y2) this.y2 = y2;
	}

	this.update_palette = () => {
		let i, sft, shift, cr,cg,cb;
		let r = emu.uxn.dev[0x8] << 8 | emu.uxn.dev[0x9]
		let g = emu.uxn.dev[0xa] << 8 | emu.uxn.dev[0xb]
		let b = emu.uxn.dev[0xc] << 8 | emu.uxn.dev[0xd]
		for(i = 0, sft = 12; i < 4; ++i, sft -= 4) {
			cr = (r >> sft) & 0xf,
			cg = (g >> sft) & 0xf,
			cb = (b >> sft) & 0xf;
			this.palette[i * 3 + 0] = cr | (cr << 4)
			this.palette[i * 3 + 1] = cg | (cg << 4)
			this.palette[i * 3 + 2] = cb | (cb << 4)
		}
		this.change(0, 0, this.width, this.height);
	}

	this.resize = (width, height, scale) => {
		width = clamp(width, 8, 0x800);
		height = clamp(height, 8, 0x800);
		scale = clamp(scale, 1, 3);
		/* on rescale */
		let length = width * height * 4 * scale * scale
		this.pixels = new Uint8ClampedArray(length)
		this.scale = scale;
		/* on resize */
		if(this.width != width || this.height != height) {
			let length = MAR2(width) * MAR2(height);
			this.layers.fg = new Uint8ClampedArray(length)
			this.layers.bg = new Uint8ClampedArray(length)
			this.width = width;
			this.height = height;
		}
		this.change(0, 0, width, height);
		console.log(`Resize requested: ${width}x${height}`)
		this.displayctx.canvas.width = width;
		this.displayctx.canvas.height = height;
		this.set_zoom(this.zoom)
	}

	let rX, rY, rA, rMX, rMY, rMA, rML, rDX, rDY;

	this.dei = (addr) => {
		switch(addr) {
		case 0x22: return this.width >> 8;
		case 0x23: return this.width;
		case 0x24: return this.height >> 8;
		case 0x25: return this.height;
		case 0x28: return rX >> 8;
		case 0x29: return rX;
		case 0x2a: return rY >> 8;
		case 0x2b: return rY;
		case 0x2c: return rA >> 8;
		case 0x2d: return rA;
		default: return emu.uxn.dev[addr];
		}
	}

	this.deo = (addr) => {
		switch(addr) {
		case 0x21: this.vector = emu.uxn.dev[0x20] << 8 | emu.uxn.dev[0x21]; return;
		case 0x23: this.resize(emu.uxn.dev[0x22] << 8 | emu.uxn.dev[0x23], this.height, this.scale); return;
		case 0x25: this.resize(this.width, emu.uxn.dev[0x24] << 8 | emu.uxn.dev[0x25], this.scale); return;
		case 0x26:
			rMX = emu.uxn.dev[0x26] & 0x1;
			rMY = emu.uxn.dev[0x26] & 0x2;
			rMA = emu.uxn.dev[0x26] & 0x4;
			rML = emu.uxn.dev[0x26] >> 4;
			rDX = rMX << 3;
			rDY = rMY << 2; return;
		case 0x28:
		case 0x29: rX = (emu.uxn.dev[0x28] << 8) | emu.uxn.dev[0x29], rX = twos(rX); return;
		case 0x2a:
		case 0x2b: rY = (emu.uxn.dev[0x2a] << 8) | emu.uxn.dev[0x2b], rY = twos(rY); return;
		case 0x2c:
		case 0x2d: rA = (emu.uxn.dev[0x2c] << 8) | emu.uxn.dev[0x2d]; return;
		case 0x2e: {
			let ctrl = emu.uxn.dev[0x2e];
			let color = ctrl & 0x3;
			let len = MAR2(this.width);
			let layer = ctrl & 0x40 ? this.layers.fg : this.layers.bg;
			/* fill mode */
			if(ctrl & 0x80) {
				let x1, y1, x2, y2, ax, bx, ay, by, hor, ver;
				if(ctrl & 0x10) x1 = MAR(0), x2 = MAR(rX);
				else x1 = MAR(rX), x2 = MAR(this.width);
				if(ctrl & 0x20) y1 = MAR(0), y2 = MAR(rY);
				else y1 = MAR(rY), y2 = MAR(this.height);
				hor = x2 - x1, ver = y2 - y1;
				for(ay = y1 * len, by = ay + ver * len; ay < by; ay += len)
					for(ax = ay + x1, bx = ax + hor; ax < bx; ax++)
						layer[ax] = color & 0xff
				this.change(x1, y1, x2, y2);
			}
			/* pixel mode */
			else {
				if(rX >= 0 && rY >= 0 && rX < len && rY < this.height)
					layer[MAR(rX) + MAR(rY) * len] = color;
				this.change(rX, rY, rX + 1, rY + 1);
				if(rMX) rX++;
				if(rMY) rY++;
			}
			return;
		}
		case 0x2f: {
			let ctrl = emu.uxn.dev[0x2f];
			let blend = ctrl & 0xf, opaque = blend % 5;
			let fx = ctrl & 0x10 ? -1 : 1, fy = ctrl & 0x20 ? -1 : 1;
			let qfx = fx > 0 ? 7 : 0, qfy = fy < 0 ? 7 : 0;
			let dxy = fy * rDX, dyx = fx * rDY;
			let wmar = MAR(this.width), wmar2 = MAR2(this.width);
			let hmar2 = MAR2(this.height);
			let i, x1, x2, y1, y2, ax, ay, qx, qy, x = rX, y = rY;
			let layer = ctrl & 0x40 ? this.layers.fg : this.layers.bg;
			if(ctrl & 0x80) {
				let addr_incr = rMA << 2;
				for(i = 0; i <= rML; i++, x += dyx, y += dxy, rA += addr_incr) {
					let xmar = MAR(x), ymar = MAR(y);
					let xmar2 = MAR2(x), ymar2 = MAR2(y);
					if(xmar < wmar && ymar2 < hmar2) {
						let by = ymar2 * wmar2;
						for(ay = ymar * wmar2, qy = qfy; ay < by; ay += wmar2, qy += fy) {
							let ch1 = emu.uxn.ram[rA + qy], ch2 = emu.uxn.ram[rA + qy + 8] << 1, bx = xmar2 + ay;
							for(ax = xmar + ay, qx = qfx; ax < bx; ax++, qx -= fx) {
								let color = ((ch1 >> qx) & 1) | ((ch2 >> qx) & 2);
								if(opaque || color) layer[ax] = blending[color][blend];
							}
						}
					}
				}
			} else {
				let addr_incr = rMA << 1;
				for(i = 0; i <= rML; i++, x += dyx, y += dxy, rA += addr_incr) {
					let xmar = MAR(x), ymar = MAR(y);
					let xmar2 = MAR2(x), ymar2 = MAR2(y);
					if(xmar < wmar && ymar2 < hmar2) {
						let by = ymar2 * wmar2;
						for(ay = ymar * wmar2, qy = qfy; ay < by; ay += wmar2, qy += fy) {
							let ch1 = emu.uxn.ram[rA + qy], bx = xmar2 + ay;
							for(ax = xmar + ay, qx = qfx; ax < bx; ax++, qx -= fx) {
								let color = (ch1 >> qx) & 1;
								if(opaque || color) layer[ax] = blending[color][blend];
							}
						}
					}
				}
			}
			if(fx < 0) x1 = x, x2 = rX;
			else x1 = rX, x2 = x;
			if(fy < 0) y1 = y, y2 = rY;
			else y1 = rY, y2 = y;
			this.change(x1 - 8, y1 - 8, x2 + 8, y2 + 8);
			if(rMX) rX += rDX * fx;
			if(rMY) rY += rDY * fy;
			return;
		}
		}
	}

	this.toggle_zoom = () => {
		this.set_zoom(this.zoom == 2 ? 1 : 2)
	}

	this.set_zoom = (zoom) => {
		this.zoom = zoom
		// Need to actually resize for the CRT shader
		this.display.width = this.width * this.zoom;
		this.display.height = this.height * this.zoom;
		this.display.style.width = `${(this.width * this.zoom)}px`
		this.display.style.height = `${(this.height * this.zoom)}px`

		this.change(0, 0, this.width, this.height);
		this.redraw();
	}

	this.init_gl = () => {
		/** @type {WebGLRenderingContext} */
		const gl = this.displayctx;

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
			uniform vec2 uxnResolution;
			void main() {
				vTexCoord = aPosition.xy * vec2(0.5, -0.5) + 0.5;

				// Account for margins
				vTexCoord *= uxnResolution;
				vTexCoord += vec2(8.0, 8.0);
				vTexCoord /= uxnResolution + vec2(16.0, 16.0);

				gl_Position = aPosition;
			}
		`;

		const basicFragmentSource = `
			precision mediump float;
			varying vec2 vTexCoord;
			uniform sampler2D uTextureFG;
			uniform sampler2D uTextureBG;
			uniform sampler2D uTexturePal;
			void main() {
				float fg = texture2D(uTextureFG, vTexCoord).r * 255.0;
				float bg = texture2D(uTextureBG, vTexCoord).r * 255.0;
				float pix = mix(bg, fg, step(0.5, fg));
				gl_FragColor = texture2D(uTexturePal, vec2(pix / 3.0, 0.0));
			}
		`;

		this.basic_shader = compileProgram(vertexSource, basicFragmentSource);
		this.crt_shader = compileProgram(vertexSource, this.crt_fragment_source);
		this.shader = this.crt_shader;

		this.vertex_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0
		]), gl.STATIC_DRAW);

		this.textures = {
			fg: gl.createTexture(),
			bg: gl.createTexture(),
			pal: gl.createTexture(),
		};

		Object.values(this.textures).forEach(tex => {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		});

		this.gl_ready = true;
	}

	this.redraw = () => {
		if (!this.gl_ready) return;
		if (!this.changed()) return;

		/** @type {WebGLRenderingContext} */
		const gl = this.displayctx;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(this.shader.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.vertexAttribPointer(this.shader.attribs.aPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.shader.attribs.aPosition);

		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, this.textures.bg);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MAR2(this.width), MAR2(this.height), 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.layers.bg);
		gl.uniform1i(this.shader.uniforms.uTextureBG, 0);

		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.textures.fg);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MAR2(this.width), MAR2(this.height), 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.layers.fg);
		gl.uniform1i(this.shader.uniforms.uTextureFG, 1);

		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, this.textures.pal);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 4, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, this.palette);
		gl.uniform1i(this.shader.uniforms.uTexturePal, 2);

		gl.uniform2f(this.shader.uniforms.uxnResolution, this.width, this.height);

		gl.uniform3f(this.shader.uniforms.iResolution, gl.canvas.width, gl.canvas.height, 1);
		gl.uniform1f(this.shader.uniforms.resolutionDownScale, 1);
		gl.uniform1f(this.shader.uniforms.hardScan, -8);
		gl.uniform1f(this.shader.uniforms.hardPix, -3);
		gl.uniform2f(this.shader.uniforms.warp, 1 / 32, 1 / 24);
		gl.uniform1f(this.shader.uniforms.maskDark, 0.5);
		gl.uniform1f(this.shader.uniforms.maskLight, 1.5);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		this.x1 = this.y1 = 9999;
		this.x2 = this.y2 = 0;
	}

	this.toggle_crt = () => {
		if (this.shader === this.basic_shader) {
			this.shader = this.crt_shader;
		} else {
			this.shader = this.basic_shader;
		}
		this.change(0, 0, this.width, this.height);
		this.redraw();
	}
}
