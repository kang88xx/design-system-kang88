#define GLSLIFY 1
varying vec3 v_viewPosition;varying vec3 v_worldPosition;varying vec3 v_viewNormal;varying vec2 v_uv;varying vec3 v_localPosition;uniform sampler2D u_earthTexture;uniform vec3 u_bgColor;uniform vec3 u_atmosphereColor;
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define saturate( a ) clamp( a, 0.0, 1.0 )
float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}
#include <getBlueNoise>
void main(){vec3 bn=getBlueNoise(gl_FragCoord.xy);float faceDirection=gl_FrontFacing ? 1.0 :-1.0;vec3 earthMap=texture2D(u_earthTexture,v_uv).rgb;gl_FragColor.rgb=earthMap;gl_FragColor.a=0.0;}