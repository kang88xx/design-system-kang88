#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_domXY;uniform vec2 u_domWH;uniform float u_opacity;uniform float u_parallax;uniform float u_time;uniform float u_dpr;uniform sampler2D u_screenPaintTexture;uniform vec2 u_resolution;uniform vec2 u_screenRTSize;uniform float u_activeRatio;uniform vec3 u_highlightColor;uniform vec3 u_bgColor;uniform vec2 u_mouseXY;uniform float u_borderRadius;uniform float u_parallaxRatio;uniform float u_isFullscreen;uniform int u_isVertical;varying vec2 v_uv;
#include <getBlueNoise>
float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}
#ifdef IS_TEXT
uniform vec3 u_textColor;uniform float u_textRatio;
#else
uniform float u_readyRatio;float sdRoundedBox(in vec2 p,in vec2 b,in vec4 r){r.xy=(p.x>0.0)?r.xy : r.zw;r.x=(p.y>0.0)?r.x  : r.y;vec2 q=abs(p)-b+r.x;return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r.x;}float getRoundedCornerMask(vec2 uv,vec4 radius){float d=sdRoundedBox((uv-.5)*u_domWH,u_domWH*0.5*mix(0.6,1.,max(u_isFullscreen,u_activeRatio)),radius.yzwx);return smoothstep(0.,0.-fwidth(d),d);}
#endif
void main(){vec3 blueNoises=getBlueNoise(gl_FragCoord.xy+vec2(43.,12.));
#ifdef IS_TEXT
vec4 image=texture2D(u_texture,v_uv);vec3 color=u_textColor;float mask=smoothstep(u_textRatio,u_textRatio-.5/255.,image.r*255./256.);float imageAlpha=image.g;color=mix(u_bgColor,color,(0.2+mask*0.8));
#else
vec2 uv=v_uv;uv-=0.5;uv*=mix(0.6,1.,u_activeRatio);if(u_isVertical==1){uv.y*=u_parallaxRatio;uv.y+=u_parallax*(1.-u_parallaxRatio);}else{uv.x*=u_parallaxRatio;uv.x+=u_parallax*(1.-u_parallaxRatio);}uv+=0.5;vec3 color=texture2D(u_texture,uv).rgb;float imageAlpha=getRoundedCornerMask(v_uv,vec4(u_borderRadius));color=mix(u_highlightColor,color,u_readyRatio);
#endif
imageAlpha*=u_opacity;gl_FragColor=vec4(color,imageAlpha);}