#define GLSLIFY 1
#ifdef IS_TEXTURE
uniform sampler2D u_texture;varying vec3 v_color;varying vec3 v_colorMix;varying vec2 v_uv;
#else
uniform vec3 u_color;
#endif
void main(){
#ifdef IS_TEXTURE
float a=dot(v_colorMix,texture2D(u_texture,v_uv).rgb);gl_FragColor=vec4(v_color,a);
#else
gl_FragColor=vec4(u_color,1.);
#endif
}