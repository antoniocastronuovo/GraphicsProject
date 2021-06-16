"use strict";

function myOnMouseUp(ev){
    //These commented lines of code only work if the canvas is full screen
    /*console.log("ClientX "+ev.clientX+" ClientY "+ev.clientY);
    var normX = (2*ev.clientX)/ gl.canvas.width - 1;
    var normY = 1 - (2*ev.clientY) / gl.canvas.height;
    console.log("NormX "+normX+" NormY "+normY);*/

    //This is a way of calculating the coordinates of the click in the canvas taking into account its possible displacement in the page
    var top = 0.0, left = 0.0;
    var canvas = gl.canvas;
    while (canvas && canvas.tagName !== 'BODY') {
        top += canvas.offsetTop;
        left += canvas.offsetLeft;
        canvas = canvas.offsetParent;
    }
    console.log("left "+left+" top "+top);
    var x = ev.clientX - left;
    var y = ev.clientY - top;
        
    //Here we calculate the normalised device coordinates from the pixel coordinates of the canvas
    //console.log("ClientX "+x+" ClientY "+y);
    var normX = (2*x)/ gl.canvas.width - 1;
    var normY = 1 - (2*y) / gl.canvas.height;
    //console.log("NormX "+normX+" NormY "+normY);

    //We need to go through the transformation pipeline in the inverse order so we invert the matrices
    var projInv = utils.invertMatrix(perspectiveMatrix);
    var viewInv = utils.invertMatrix(viewMatrix);
    
    //Find the point (un)projected on the near plane, from clip space coords to eye coords
    //z = -1 makes it so the point is on the near plane
    //w = 1 is for the homogeneous coordinates in clip space
    var pointEyeCoords = utils.multiplyMatrixVector(projInv, [normX, normY, -1, 1]);
    //console.log("Point eye coords "+pointEyeCoords);

    //This finds the direction of the ray in eye space
    //Formally, to calculate the direction you would do dir = point - eyePos but since we are in eye space eyePos = [0,0,0] 
    //w = 0 is because this is not a point anymore but is considered as a direction
    var rayEyeCoords = [pointEyeCoords[0], pointEyeCoords[1], pointEyeCoords[2], 0];

    
    //We find the direction expressed in world coordinates by multipling with the inverse of the view matrix
    var rayDir = utils.multiplyMatrixVector(viewInv, rayEyeCoords);
    //console.log("Ray direction "+rayDir);
    var normalisedRayDir = normaliseVector(rayDir);
    //console.log("normalised ray dir "+normalisedRayDir);
    //The ray starts from the camera in world coordinates
    var rayStartPoint = [cx, cy, cz];
    
    //We iterate on all the objects in the scene to check for collisions
    //for(i = 0; i < objectsInScene.length; i++){
    for(let i = 0; i < game.discs.length; i++){
        //var hit = raySphereIntersection(rayStartPoint, normalisedRayDir, objectsInScene[i][0], objectsInScene[i][1]);
        var hit = hitTest(rayStartPoint, normalisedRayDir, game.discs[i].center, game.discs[i].width / 2);
        if(hit){
            console.log("hit disc number "+i) + 1;
            //console.log("hit sphere number "+i);
            game.discs[i].node.drawInfo.materialColor = [Math.random(), Math.random(), Math.random()];
        }
    }
}

function normaliseVector(vec){
    var magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    //console.log("Magnitude" + magnitude);
    var normVec = [vec[0]/magnitude, vec[1]/magnitude, vec[2]/magnitude];
    return normVec;
}

//This algorithm is taken from the book Real Time Rendering fourth edition
//function hit(rayStartPoint, rayNormalisedDir, discCenter, discWidth, discHeight) {
function hitTest(rayStartPoint, rayNormalisedDir, sphereCentre, sphereRadius){
    //var leftMin = [discCenter[0] - discWidth / 2, discCenter[1] - discHeight / 2, discCenter[2] + discWidth / 2];
    //var rightMax = [discCenter[0] + discWidth / 2, discCenter[1] + discHeight / 2, discCenter[2] - discWidth / 2];
    //Distance between sphere origin and origin of ray
    var l = [sphereCentre[0] - rayStartPoint[0], sphereCentre[1] - rayStartPoint[1], sphereCentre[2] - rayStartPoint[2]];
    var l_squared = l[0] * l[0] + l[1] * l[1] + l[2] * l[2]; //distanza tra centro sfera e fotocamera al quadrato
    //If this is true, the ray origin is inside the sphere so it collides with the sphere
    if(l_squared < (sphereRadius*sphereRadius)){
        console.log("ray origin inside sphere");
        return true;
    }
    //Projection of l onto the ray direction 
    var s = l[0] * rayNormalisedDir[0] + l[1] * rayNormalisedDir[1] + l[2] * rayNormalisedDir[2];
    //The spere is behind the ray origin so no intersection
    if(s < 0){
        console.log("sphere behind ray origin");
        return false;
    }
    //Squared distance from sphere centre and projection s with Pythagorean theorem
    var m_squared = l_squared - (s*s);
    //If this is true the ray will miss the sphere
    if(m_squared > (sphereRadius*sphereRadius)){
        console.log("m squared > r squared");
        return false;
    }
    //Now we can say that the ray will hit the sphere 
    console.log("hit");
    return true;
    
}

window.addEventListener("mouseup", myOnMouseUp);
