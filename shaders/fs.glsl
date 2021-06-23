#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec2 uvFS;
in vec3 fsPosition;

out vec4 outColor;

uniform vec3 mDiffColor; //material diffuse color 
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color

uniform vec3 ambientLightUpColor;		  // For hemispheric ambient, this is the color on the top
uniform vec3 ambientLightLowColor;	  // For hemispheric ambient, this is the bottom color


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
uniform vec3 eyeDir;

uniform sampler2D u_texture; //texture

//Compute lambert diffuse color
vec3 diffuseBRDF(vec3 matDiffuseColor, vec3 lColor, vec3 lDir, vec3 normalVec) {
  vec4 texColor = texture(u_texture, uvFS);
  return texColor.rgb * matDiffuseColor * lColor * clamp(dot(-lDir, normalVec), 0.0, 1.0);
}

vec3 specularBRDF(vec3 lightDir, vec3 lightColor, vec3 normalVec, vec3 eyeDirVec) {
  vec3 refVec = -reflect(lightDir, normalVec);
  vec3 specular = pow(clamp(dot(eyeDirVec, refVec), 0.0, 1.0), 128.0) * lightColor;
  return specular;
}

vec3 createSpotLight(vec3 lightColor, vec3 lightPos, vec3 lightDir, float target, float decay, float ConeIn, float ConeOut) {
  vec3 spotLight = lightColor * pow((target / length(lightPos - fsPosition)), decay) * 
		clamp((dot(normalize(lightPos - fsPosition), lightDir) - cos(radians(ConeOut/2.0)))/(cos(radians(ConeOut*ConeIn/2.0))-cos(radians(ConeOut/2.0))), 0.0, 1.0);
  return spotLight;
} 

vec3 hemisphericAmbient(vec3 upColor,vec3 downColor,vec3 upDir,vec3 normal){
  vec3 hemispheric = ((dot(normal,upDir)+1.0)/2.0*upColor +(1.0-dot(normal,upDir))/2.0*downColor);
  return hemispheric;
}

void main() {

  vec3 nNormal = normalize(fsNormal);
  
  vec3 spotLight = createSpotLight(lightColorSpot1, positionSpot, lightDirectionSpot1, targetDistance, decay, spotConeIn, spotConeOut);  
  vec3 diffuse = diffuseBRDF(mDiffColor, lightColor, lightDirection, nNormal);
  
  vec3 myEyeDir = normalize(vec3(0.0, -5.130302, -14.095389));
  
  vec3 specular = specularBRDF(lightDirection, vec3(0.76, 0.58, 0.40), nNormal, myEyeDir);
  
  vec4 texelColor = texture(u_texture, uvFS); 

  vec4 hemisphericAmbient = hemisphericAmbient(ambientLightUpColor,ambientLightLowColor,vec3(0.0,1.0,0.0),nNormal);

  outColor = vec4(clamp(diffuse + specular + spotLight + hemisphericAmbient, 0.0, 1.0), texelColor.a);
}
