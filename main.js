"use strict";

var program;
var gl;
var shaderDir; 
var baseDir;
var assetDir;

var spotLightDirection = [0.0, 1.0, 0.0];
var spotLightColor = [0.0, 1.0, 0.0];
var positionSpot = [4.53, 10.0, 0.0];
var targetSpot = 5;
var decay = 2;
var coneInSpot = 0.5; //% wrt cone out
var coneOutSpot = 30; //this is in degree

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = -20.0; //0.0 to see perpendicular
var angle = 0.0;

var lookRadius = 15.0;
var scaling = 0.3;
var deltaFactor = 375;

//Transformation matrices
var projectionMatrix, perspectiveMatrix, viewMatrix, worldMatrix, WVPmatrix;

//The objects collections
var nodes = [];

//textures
var tableTexture;
var generalTexture;

//The game
var game;
var initNumberOfDiscs = 4;
var maxNumberOfDiscs = 7;
/* Init function: get canvas, compile and link shaders */
async function init(){
    //Find the location of the directory
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "shaders/";
    assetDir = baseDir + "assets/";

    //Init canvas and context gl
    var canvas = document.getElementById("gameCanvas");
    gl = canvas.getContext("webgl2"); //the context [03-5]
    //Remember: canvas has origin in the center and goes from -1 to 1 both x and y
    if (!gl) { //If cannot load GL, write error
        document.write("GL context not opened");
        return;
    }

    setMouseListeners();
    setEventListners();

    //Clear the canvas and enable depth testing
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    /*await wait since the asynchronous funtion loadFiles is completed and when 
     * it is completed use the callback function passed as second argument.
     * Function createShader and createProgram do what we have seen in 03*/
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
      var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]); //create vertex shader
      var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]); //create fragment shader
      program = utils.createProgram(gl, vertexShader, fragmentShader); //create program global var
    });
    gl.useProgram(program);

    
    /* INIT OBJECTS */ 
    //The next line must be done in init, since it is an async function, load mesh using OBJ loader library
    var objStr = await utils.get_objstr(assetDir + "uploads_files_821916_Table.obj");
    var tmpMesh = new OBJ.Mesh(objStr);
    OBJ.initMeshBuffers(gl, tmpMesh);

    var tableNode = new Node();
    tableNode.worldMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(0.0, -12.3274, 0.0), utils.MakeScaleMatrix(0.15));
    tableNode.initMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(0.0, -12.3274, 0.0), utils.MakeScaleMatrix(0.15));
    tableNode.drawInfo = {
        materialColor: [0.8, 0.8, 0.8],
        mesh: tmpMesh,
    }
    nodes[0] = tableNode;

    var objStr = await utils.get_objstr(assetDir + "base.obj");
    var tmpMesh = new OBJ.Mesh(objStr);
    OBJ.initMeshBuffers(gl, tmpMesh);

    var baseNode = new Node();
    baseNode.worldMatrix = utils.MakeScaleMatrix(scaling);
    baseNode.initMatrix = utils.MakeScaleMatrix(scaling);
    baseNode.drawInfo = {
        materialColor: [1.0, 1.0, 1.0],
        mesh: tmpMesh,
    }
    nodes[1] = baseNode;
    
    for(let i = 2; i < maxNumberOfDiscs + 2; i++) {
        //The next line must be done in init, since it is an async function, load mesh using OBJ loader library
        objStr = await utils.get_objstr(assetDir + "disc" + (i - 1) + ".obj");
        tmpMesh = new OBJ.Mesh(objStr);
        OBJ.initMeshBuffers(gl, tmpMesh);

        var diffColor = [1.0, 1.0, 1.0];
        nodes[i] = new Node();
        nodes[i].worldMatrix = utils.MakeScaleMatrix(scaling);
        nodes[i].initMatrix = utils.MakeScaleMatrix(scaling);
        nodes[i].drawInfo = {
            materialColor: diffColor,
            mesh: tmpMesh,
        }
        nodes[i].setParent(nodes[1]);
    }

    
    //Create the game
    var discNodes = nodes.slice(2);
    game = new Game(discNodes.slice(0, initNumberOfDiscs));
    game.scaleMesurements(scaling);

    main();
}

function main() {    
    //Define directional light
    var directionalLight = utils.normalize([0.0, -0.5, -0.5], directionalLight);
    var directionalLightColor = [1.0, 1.0, 1.0];

    //Initilize perspective matrix
    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);

    //Links mesh attributes to shader attributes
    var positionAttributeLocation = gl.getAttribLocation(program, "inPosition");  
    gl.enableVertexAttribArray(positionAttributeLocation);
    var normalAttributeLocation = gl.getAttribLocation(program, "inNormal");  
    gl.enableVertexAttribArray(normalAttributeLocation);
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");  
    gl.enableVertexAttribArray(uvAttributeLocation);
    var textLocation = gl.getUniformLocation(program, "u_texture");

    
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var vertexMatrixPositionHandle = gl.getUniformLocation(program, "pMatrix");
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');

    var materialDiffColorHandle = gl.getUniformLocation(program, 'mDiffColor');
    var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
    var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
    
    var spotLightDirectionHandle = gl.getUniformLocation(program, 'spotLightDirection');
    var spotLightDirection2Handle = gl.getUniformLocation(program, 'lightDirectionSpot2');
    var spotLightDirection3Handle = gl.getUniformLocation(program, 'lightDirectionSpot3');

    var spotLightColorHandle = gl.getUniformLocation(program, 'spotLightColor');
    var spotLightColor2Handle = gl.getUniformLocation(program, 'lightColorSpot2');
    var spotLightColor3Handle = gl.getUniformLocation(program, 'lightColorSpot3');

    var coneOutHandle = gl.getUniformLocation(program, 'spotConeOut');
    var coneInHandle = gl.getUniformLocation(program, 'spotConeIn');

    var targetHandle = gl.getUniformLocation(program, 'target');
    var decayHandle = gl.getUniformLocation(program, 'decay');
    var spotLightPositionHandle = gl.getUniformLocation(program, 'spotLightPosition');
    var eyeDirHandle = gl.getUniformLocation(program, 'eyeDir');


    loadTexture(2);

    drawScene();

    function drawScene() {
        game.move();

        //Update transformation matrices
        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        
        viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
    
        //Update spot light position
        /*var spotLightMatrix = utils.multiplyMatrices(viewMatrix, utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0));
        var spotLightInvMatrix = utils.invertMatrix(utils.transposeMatrix(spotLightMatrix));
        var spotPos = utils.multiplyMatrixVector(spotLightMatrix, [positionSpot[0], positionSpot[1], positionSpot[2], 1]);
        var spotDir = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(spotLightInvMatrix), spotLightDirection);*/

        //Send uniforms of lights to GPU
        gl.uniform3fv(lightColorHandle,  directionalLightColor); //light color
        gl.uniform3fv(lightDirectionHandle,  directionalLight); //light direction

        gl.uniform3fv(spotLightDirectionHandle, spotLightDirection);
        gl.uniform3fv(spotLightColorHandle,spotLightColor);
        gl.uniform3fv(spotLightPositionHandle, positionSpot);


        gl.uniform3fv(eyeDirHandle,[0.0, 0.0, 0.0]);

        gl.uniform1f(targetHandle,targetSpot);
        gl.uniform1f(coneInHandle,coneInSpot);
        gl.uniform1f(coneOutHandle,coneOutSpot);
        gl.uniform1f(decayHandle,decay);

        drawObjects();

        //This function says: browser, I need to perform an animation so call
        //this function every time you need to refresh a frame
        window.requestAnimationFrame(drawScene);
    }

    function drawObjects() {
        var i = 0;
        nodes.slice(0, game.numberOfDiscs + 2).forEach(node => {
            if(i === 0) {
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, tableTexture);
            }else{
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, generalTexture);
            }
            i++;
            //Calculate World-View-Projection matrix
            WVPmatrix = utils.multiplyMatrices(projectionMatrix, node.worldMatrix);
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(WVPmatrix));
            
            gl.uniformMatrix4fv(vertexMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(node.worldMatrix));
            //gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(node.worldMatrix));
            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.invertMatrix(utils.transposeMatrix(node.worldMatrix)));
        
            //This must be done for each object mesh
            gl.bindBuffer(gl.ARRAY_BUFFER, node.drawInfo.mesh.vertexBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, node.drawInfo.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, node.drawInfo.mesh.normalBuffer);
            gl.vertexAttribPointer(normalAttributeLocation, node.drawInfo.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, node.drawInfo.mesh.textureBuffer); //Send UV coordinates
            gl.vertexAttribPointer(uvAttributeLocation, node.drawInfo.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.drawInfo.mesh.indexBuffer);

            //Set object diffuse color
            gl.uniform3fv(materialDiffColorHandle, node.drawInfo.materialColor);

            //Draw elements
            gl.drawElements(gl.TRIANGLES, node.drawInfo.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        });
    }

}

function loadTexture(textureIndex) {
    // Create a texture.
    generalTexture = gl.createTexture();
    // use texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // bind to the TEXTURE_2D bind point of texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, generalTexture);

    // Asynchronously load an image
    var imgtx = new Image();
    if(textureIndex == 1) imgtx.src = assetDir + "texture" + textureIndex + ".png";
    else imgtx.src = assetDir + "texture" + textureIndex + ".jpg";  

    imgtx.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, generalTexture);		
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); //WebGL has inverted uv coordinates
        //Define how textures are interpolated whenever their size needs to be incremented or diminished
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //gl.generateMipmap(gl.TEXTURE_2D); //smallest copies of the texture
        //Load the image data in the texture object (in the GPU)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	
    }     
}



window.addEventListener("load", e => {
    init();
}, false);