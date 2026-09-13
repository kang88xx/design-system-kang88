#define GLSLIFY 1
attribute float centroidY;uniform mat4 u_shadowViewMatrixCamera;uniform mat4 u_shadowProjectionMatrixCamera;uniform mat4 u_shadowModelMatrixCamera;uniform vec3 u_shadowProjPosition;varying vec3 v_worldPosition;
#include <ufxVert>
varying vec2 v_uv;void main(){vec3 basePos=getBasePosition(position);vec3 screenPos=getScreenPosition(basePos);gl_Position=projectionMatrix*modelViewMatrix*vec4(screenPos,1.0);v_uv=padUv(uv);vec4 worldPosition=modelMatrix*vec4(position,1.0);v_worldPosition=worldPosition.xyz;}