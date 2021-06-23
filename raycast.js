"use strict";

function myOnMouseDown(ev){
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
    var nearestDisc = [-1, Infinity]; //disc index and distance
    for(let i = 0; i < game.discs.length; i++){
        var hit = boxHitTest(rayStartPoint, normalisedRayDir, game.discs[i].center, game.discs[i].width, game.discs[i].height);
        if(hit[0] && hit[1] < nearestDisc[1]){
            nearestDisc = [i, hit[1]];
        }
    }

    return game.discs[nearestDisc[0]];
    
            
}

function normaliseVector(vec){
    var magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    var normVec = [vec[0]/magnitude, vec[1]/magnitude, vec[2]/magnitude];
    return normVec;
}

function boxHitTest(rayStartPoint, rayNormalisedDir, discCenter, discWidth, discHeight) {
    var tmin = -Infinity;
    var tmax = Infinity;
    
    var a = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
    var h = [discWidth / 2, discHeight / 2, discWidth / 2];

    var eps = 0.000000001;
    var p = [discCenter[0] - rayStartPoint[0], discCenter[1] - rayStartPoint[1], discCenter[2] - rayStartPoint[2]];
    for(let i=0; i<3; i++) {
        let e = a[i][0] * p[0] + a[i][1] * p[1] + a[i][2] * p[2];
        let f =  a[i][0] * rayNormalisedDir[0] + a[i][1] * rayNormalisedDir[1] + a[i][2] * rayNormalisedDir[2];

        if(Math.abs(f) > eps) {
            let t1 = (e + h[i]) / f;
            let t2 = (e - h[i]) / f;
            if(t1 > t2) {
                let tmp = t1;
                t1 = t2;
                t2 = tmp;
            }
            if(t1 > tmin) tmin = t1;
            if(t2 < tmax) tmax = t2;
            if(tmin > tmax) return [false, 0];
            if(tmax < 0) return [false, 0];
        }else if((- e - h[i] > 0) || (- e + h[i] < 0)) return [false, 0];
    }
    if(tmin > 0) 
        return [true, tmin];
    return [true, tmax];
}