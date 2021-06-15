#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec2 uvFS;

out vec4 outColor;

uniform vec3 mDiffColor; //material diffuse color 
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color 

uniform sampler2D u_texture; //texture

void main() {

  vec3 nNormal = normalize(fsNormal);
  vec3 lambertColor = mDiffColor * lightColor * dot(-lightDirection,nNormal);
  
  vec4 texelColor = texture(u_texture, uvFS); 
  //outColor = texture(u_texture, uvFS);
  outColor = vec4(clamp(lambertColor * texelColor.rgb, 0.00, 1.0), texelColor.a);
  
  //outColor = vec4(1.0, 0.0, 0.0, 1.0);
}