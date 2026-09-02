/**
 * Audio Lab - Visualization Engine
 */

(function (global) {
    'use strict';

    const AudioLabViz = {
        gl: null,
        canvas: null,
        program: null,
        animationFrameId: null,
        uniforms: {},
        time: 0,
        analyser: null,
        dataArray: null,
        waveArray: null,

        vertexShaderSource: `#version 300 es
            in vec2 a_position;
            out vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `,

        fragmentShaderSource: `#version 300 es
            precision highp float;
            in vec2 v_uv;
            out vec4 fragColor;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_bass;
            uniform float u_mid;
            uniform float u_treble;
            uniform float u_volume;

            // Neon Palette
            vec3 neonColor(float t) {
                vec3 a = vec3(0.1, 0.5, 0.8);
                vec3 b = vec3(0.5, 0.8, 0.9);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.0, 0.33, 0.67);
                return a + b * cos(6.28318 * (c * t + d + vec3(u_time * 0.1, 0.1, 0.2)));
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

                // Audio warping & dynamic pulsing
                float dist = length(uv);
                float angle = atan(uv.y, uv.x);

                float pulse = u_bass * 1.5 + 0.2;
                float waves = sin(angle * 6.0 + u_time * 2.0 + u_treble * 5.0) * (0.05 + u_mid * 0.15);
                float ring = abs(dist - (0.35 + waves * pulse));

                // Glow intensity
                float glow = 0.015 / (ring + 0.005);
                glow += (0.008 / (abs(dist - 0.15) + 0.005)) * (u_bass + 0.5);

                // Multi-harmonic beams
                float rays = max(0.0, sin(angle * 12.0 - u_time * 3.0 + u_volume * 4.0));
                rays *= smoothstep(0.5, 0.05, dist);

                vec3 col = neonColor(dist + angle / 6.28 + u_time * 0.2) * (glow + rays * (u_mid + 0.5));

                // Dark vignetting
                col *= smoothstep(1.2, 0.2, dist);

                // Subtle deep blue space background
                col += vec3(0.02, 0.05, 0.12) * (1.0 - dist);

                fragColor = vec4(col, 1.0);
            }
        `,

        init(canvasElement, analyserNode) {
            this.canvas = canvasElement;
            this.analyser = analyserNode;

            if (!this.canvas) return;

            // Handle Resize
            this.resize();
            window.addEventListener('resize', () => this.resize());

            // Initialize WebGL2
            this.gl = this.canvas.getContext('webgl2');
            if (!this.gl) {
                console.warn('WebGL2 not supported, falling back to experimental-webgl or 2D');
                this.init2DFallback();
                return;
            }

            this.initShaders();
            this.initBuffers();

            if (this.analyser) {
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
                this.waveArray = new Uint8Array(bufferLength);
            }

            this.startLoop();
        },

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = (rect.width || 800) * dpr;
            this.canvas.height = 360 * dpr;

            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        },

        createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        },

        initShaders() {
            const gl = this.gl;
            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, this.vertexShaderSource);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderSource);

            this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(this.program));
                return;
            }

            gl.useProgram(this.program);

            // Get Uniform Locations
            this.uniforms.u_time = gl.getUniformLocation(this.program, 'u_time');
            this.uniforms.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');
            this.uniforms.u_bass = gl.getUniformLocation(this.program, 'u_bass');
            this.uniforms.u_mid = gl.getUniformLocation(this.program, 'u_mid');
            this.uniforms.u_treble = gl.getUniformLocation(this.program, 'u_treble');
            this.uniforms.u_volume = gl.getUniformLocation(this.program, 'u_volume');
        },

        initBuffers() {
            const gl = this.gl;
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

            // Fullscreen quad
            const positions = new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

            const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        },

        startLoop() {
            const render = () => {
                this.time += 0.016;
                this.draw();
                this.animationFrameId = requestAnimationFrame(render);
            };
            this.animationFrameId = requestAnimationFrame(render);
        },

        draw() {
            if (!this.gl || !this.program) return;
            const gl = this.gl;

            let bass = 0.1, mid = 0.1, treble = 0.1, volume = 0.1;

            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);

                const len = this.dataArray.length;
                let bSum = 0, mSum = 0, tSum = 0, allSum = 0;

                const bLimit = Math.floor(len * 0.08);
                const mLimit = Math.floor(len * 0.35);

                for (let i = 0; i < len; i++) {
                    const val = this.dataArray[i] / 255.0;
                    allSum += val;
                    if (i < bLimit) bSum += val;
                    else if (i < mLimit) mSum += val;
                    else tSum += val;
                }

                bass = bSum / (bLimit || 1);
                mid = mSum / ((mLimit - bLimit) || 1);
                treble = tSum / ((len - mLimit) || 1);
                volume = allSum / len;
            }

            gl.useProgram(this.program);
            gl.uniform1f(this.uniforms.u_time, this.time);
            gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
            gl.uniform1f(this.uniforms.u_bass, bass);
            gl.uniform1f(this.uniforms.u_mid, mid);
            gl.uniform1f(this.uniforms.u_treble, treble);
            gl.uniform1f(this.uniforms.u_volume, volume);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },

        init2DFallback() {
            const ctx = this.canvas.getContext('2d');
            if (!ctx) return;

            const render2D = () => {
                ctx.fillStyle = 'rgba(7, 13, 24, 0.2)';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                if (this.analyser && this.dataArray) {
                    this.analyser.getByteFrequencyData(this.dataArray);
                    const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
                    let x = 0;

                    for (let i = 0; i < this.dataArray.length; i++) {
                        const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
                        ctx.fillStyle = `hsl(${i * 2 + 190}, 90%, 55%)`;
                        ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
                        x += barWidth + 1;
                    }
                }
                this.animationFrameId = requestAnimationFrame(render2D);
            };
            this.animationFrameId = requestAnimationFrame(render2D);
        },

        destroy() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }
    };

    global.AudioLabViz = AudioLabViz;
})(window);