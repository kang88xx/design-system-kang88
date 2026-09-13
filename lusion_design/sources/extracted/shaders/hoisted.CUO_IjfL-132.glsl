#define GLSLIFY 1
attribute vec2 instancedPos;attribute vec2 instancedInfo;uniform vec2 u_tankOffset;uniform vec2 u_tankSize;uniform vec2 u_tankActualSize;uniform vec2 u_renderScale;uniform float u_radius;uniform float u_opacity;
#include <ufxVert>
#ifdef IS_TEXTURE
attribute vec4 instanceColorShape;varying vec3 v_color;varying vec3 v_colorMix;varying vec2 v_uv;
#endif
void main(){float angle=instancedInfo.x;float s=sin(angle);float c=cos(angle);mat2 m=mat2(c,-s,s,c);vec3 basePos=vec3((instancedPos-u_tankOffset)/u_tankActualSize-vec2(.5),0.0);basePos.y=-basePos.y;basePos.xy*=u_renderScale*2.;float particleSize=1.;
#ifdef IS_TEXTURE
float colorFract=fract(instanceColorShape.w/3.);v_color=instanceColorShape.rgb;v_colorMix=vec3(colorFract<0.25 ? 1. : 0.,abs(colorFract-.5)<0.25 ? 1. : 0.,colorFract>0.75 ? 1. : 0.);v_uv=uv;v_uv.x=(v_uv.x+floor(instanceColorShape.w/3.))/8.;
#else
particleSize+=min(1.,abs(instancedInfo.y)*0.01);
#endif
vec3 screenPos=getScreenPosition(basePos);screenPos.xy+=(m*position.xy)*u_radius*particleSize*u_renderScale.x*2.*u_opacity;gl_Position=projectionMatrix*modelViewMatrix*vec4(screenPos,1.0);}