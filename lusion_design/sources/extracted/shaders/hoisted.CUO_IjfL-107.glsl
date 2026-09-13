
						uniform sampler2D u_texture;
						varying vec2 v_uv;
						void main () {
							vec2 uv = v_uv * 0.5;
							gl_FragColor = vec4(
								texture2D(u_texture, uv).g,
								texture2D(u_texture, uv + vec2(.5, 0.)).g,
								texture2D(u_texture, uv + vec2(0., .5)).g,
								texture2D(u_texture, uv + vec2(.5, .5)).g
							);
						}