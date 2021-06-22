#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec2 uvFS;
in vec3 fsPosition;

out vec4 outColor;

uniform vec3 mDiffColor; //material diffuse color 
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color 
uniform vec3 lightDirectionSpot1;
uniform vec3 lightDirectionSpot2;
uniform vec3 lightDirectionSpot3;
uniform vec3 lightColorSpot1;
uniform vec3 lightColorSpot2;
uniform vec3 lightColorSpot3;
uniform float spotConeOut;
uniform float spotConeIn;
uniform float targetDistance;
uniform float decay;
uniform vec3 positionSpot;

uniform sampler2D u_texture; //texture

void main() {

  

  vec3 nNormal = normalize(fsNormal);

  float cosOut = cos(radians(spotConeOut / 2.0));
	float cosIn = cos(radians(spotConeOut*spotConeIn / 2.0));
  
  vec3 spotLight1 = lightColorSpot1 * pow(targetDistance/length(positionSpot-fsPosition),decay) 
                    * clamp((dot(normalize(positionSpot-fsPosition),lightDirectionSpot1)-cosOut)/(cosIn-cosOut),0.0,1.0);
  /*vec4 LAcontr = clamp(dot(lightDirectionSpot1, nNormal),0.0,1.0) * lightColorSpot1;
	vec4 LBcontr = clamp(dot(lightDirectionSpot2, nNormal),0.0,1.0) * lightColorSpot2;
	vec4 LCcontr = clamp(dot(lightDirectionSpot3, nNormal),0.0,1.0) * lightColorSpot3;
*/
  vec3 lambertColor = mDiffColor * lightColor * dot(-lightDirection,nNormal);
  
  vec4 texelColor = texture(u_texture, uvFS); 
  outColor = vec4(clamp(lambertColor*texelColor.rgb + (spotLight1), 0.00, 1.0), texelColor.a);
  
}