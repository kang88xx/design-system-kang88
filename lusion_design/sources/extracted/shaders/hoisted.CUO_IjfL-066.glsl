#define GLSLIFY 1
varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-.5)*2.;gl_FragColor.rgb=v_color;gl_FragColor.a=smoothstep(1.,1.-fwidth(d),d);}