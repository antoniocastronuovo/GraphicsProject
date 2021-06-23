#version 300 es

in vec3 inPosition;
in vec3 inNormal;

in vec2 a_uv;

out vec2 uvFS;
out vec3 fsNormal;
out vec3 fsPosition;

uniform mat4 matrix;      //VWP matrix
uniform mat4 nMatrix;     //matrix to transform normals
uniform mat4 pMatrix;     //matrix to transform positions

void main() {
  fsNormal = mat3(nMatrix) * inNormal; 
  //Transform position from object space to world space
  fsPosition = (pMatrix * vec4(inPosition, 1.0)).xyz;
  gl_Position = matrix * vec4(inPosition, 1.0);

  uvFS=a_uv;
}