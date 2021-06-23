#version 300 es

in vec3 inPosition; //Vertex position
in vec3 inNormal; //Normal direction

in vec2 a_uv; //UV coordinate of the vertex

out vec2 uvFS; //UV to pass to fs
out vec3 fsNormal; //normals to pass to fs
out vec3 fsPosition; //transformed vertex pos

uniform mat4 matrix;      //VWP matrix
uniform mat4 nMatrix;     //matrix to transform normals
uniform mat4 pMatrix;     //matrix to transform positions

void main() {
  //Transform the normals and pass it to the fragment shader
  fsNormal = mat3(nMatrix) * inNormal; 
  
  //Transform position from object space to world space
  fsPosition = (pMatrix * vec4(inPosition, 1.0)).xyz;
  
  //Texture UV coordinates to pass to the fragment shader 
  uvFS = a_uv;

  //The clip-space output position of the current vertex
  gl_Position = matrix * vec4(inPosition, 1.0);

  
}