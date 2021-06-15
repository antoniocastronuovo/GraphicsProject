"use strict";

var program;
var gl;
var shaderDir; 
var baseDir;
var assetDir;

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = -30.0;
var angle = 0.0;

var lookRadius = 10.0;
var scaling = 0.3;

//Transformation matrices
var projectionMatrix, perspectiveMatrix, viewMatrix, worldMatrix, WVPmatrix;

//The objects collections
var nodes = [];

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

    setMouseListeners()
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
    nodes[0] = baseNode;
    
    for(let i = 1; i < maxNumberOfDiscs + 1; i++) {
        //The next line must be done in init, since it is an async function, load mesh using OBJ loader library
        objStr = await utils.get_objstr(assetDir + "disc" + i + ".obj");
        tmpMesh = new OBJ.Mesh(objStr);
        OBJ.initMeshBuffers(gl, tmpMesh);

        //var diffColor = (i % 2 === 0) ? [0.3, 0.3, 0.3] : [1.0, 0.0, 0.0];
        var diffColor = [1.0, 1.0, 1.0];
        nodes[i] = new Node();
        nodes[i].worldMatrix = utils.MakeScaleMatrix(scaling);
        nodes[i].initMatrix = utils.MakeScaleMatrix(scaling);
        nodes[i].drawInfo = {
            materialColor: diffColor,
            mesh: tmpMesh,
        }
        nodes[i].setParent(nodes[0]);
    }

    //Create the game
    var discNodes = nodes.slice(1);
    game = new Game(discNodes.slice(0, initNumberOfDiscs));
    game.scaleMesurements(scaling);

    main();
}

function main() {    
    //Define directional light
    var dirLightAlpha = -utils.degToRad(60);
    var dirLightBeta  = -utils.degToRad(120);

    var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
                Math.sin(dirLightAlpha),
                Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
                ];
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
    var materialDiffColorHandle = gl.getUniformLocation(program, 'mDiffColor');
    var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
    var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    
    // Create a texture.
    var texture = gl.createTexture();
    // use texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // bind to the TEXTURE_2D bind point of texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Asynchronously load an image
    var imgtx = new Image();
    //imgtx.src = assetDir + "cycles_tower_of_hanoi_BaseColor.png";      
    imgtx.src = assetDir + "woodTexture.jpg";      
    //imgtx.src = assetDir + "moonTexture.jpg";  
    //imgtx.src = assetDir + "blackGoldMarbleTexture.jpg";      
    imgtx.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);		
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); //WebGL has inverted uv coordinates
        //Define how textures are interpolated whenever their size needs to be incremented or diminished
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D); //smallest copies of the texture
        //Load the image data in the texture object (in the GPU)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	
    }

    


    drawScene();

    function drawScene() {
        game.move();

        //Update transformation matrices
        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
    
        //Send uniforms of lights to GPU
        gl.uniform3fv(lightColorHandle,  directionalLightColor); //light color
        gl.uniform3fv(lightDirectionHandle,  directionalLight); //light direction

        drawObjects();

        //This function says: browser, I need to perform an animation so call
        //this function every time you need to refresh a frame
        window.requestAnimationFrame(drawScene);
    }

    function drawObjects() {
        nodes.slice(0, game.numberOfDiscs + 1).forEach(node => {
            //Calculate World-View-Projection matrix
            WVPmatrix = utils.multiplyMatrices(projectionMatrix, node.worldMatrix);
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(WVPmatrix));
            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(node.worldMatrix));
        
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

window.addEventListener("load", e => {
    init();
}, false);