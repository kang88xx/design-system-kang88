#define GLSLIFY 1
void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z+=0.002/gl_Position.w;}