var program;
var gl;
var shaderDir; 
var baseDir;
var assetDir;

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 0.0;
var angle = 0.0;

var lookRadius = 10.0;

//Transformation matrices
var projectionMatrix, perspectiveMatrix, viewMatrix, worldMatrix;

var mesh, meshes;

//Event handlers to rotate camera on mouse dragging
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;
function doMouseDown(event) {
    console.log("mousedown");
	lastMouseX = event.pageX;
	lastMouseY = event.pageY;
	mouseState = true;
}
function doMouseUp(event) {
    console.log("mouseup");
	lastMouseX = -100;
	lastMouseY = -100;
	mouseState = false;
}
function doMouseMove(event) {
	if(mouseState) {
        console.log("mousemove");
		var dx = event.pageX - lastMouseX;
		var dy = lastMouseY - event.pageY;
		lastMouseX = event.pageX;
		lastMouseY = event.pageY;
		
		if((dx != 0) || (dy != 0)) {
			angle = angle + 0.5 * dx;
			elevation = elevation + 0.5 * dy;
		}
	}
}
function doMouseWheel(event) {
    console.log("mousewheel");
	var nLookRadius = lookRadius + event.wheelDelta/1000.0;
	if((nLookRadius > 2.0) && (nLookRadius < 20.0)) {
		lookRadius = nLookRadius;
	}
}

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

    //Set mouse event handlers
    canvas.addEventListener("mousedown", doMouseDown, false);
	canvas.addEventListener("mouseup", doMouseUp, false);
	canvas.addEventListener("mousemove", doMouseMove, false);
	canvas.addEventListener("mousewheel", doMouseWheel, false);

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

    meshes = [];
    //The next line must be done in init, since it is an async function, load mesh using OBJ loader library
    var objStr = await utils.get_objstr(assetDir + "base.obj");
    meshes[0] = new OBJ.Mesh(objStr);
    OBJ.initMeshBuffers(gl, meshes[0]);
    for(let i=1; i<8; i++) {
        //The next line must be done in init, since it is an async function, load mesh using OBJ loader library
        objStr = await utils.get_objstr(assetDir + "disc" + i + ".obj");
        meshes[i] = new OBJ.Mesh(objStr);
        OBJ.initMeshBuffers(gl, meshes[i]);
    }

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

    //Define material color
    var cubeMaterialColor = [0.5, 0.5, 0.5];

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

    worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3);
    
    // Create a texture.
    var texture = gl.createTexture();

    // Asynchronously load an image
    imgtx = new Image();
    imgtx.src = assetDir + "cycles_tower_of_hanoi_BaseColor.png";      
    imgtx.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);		
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); //WebGL has inverted uv coordinates
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
	



    drawScene();

    function drawScene() {
        //Update transformation matrices
        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
    
        //Calculate World-View-Projection matrices
        var VWPmatrix = utils.multiplyMatrices(projectionMatrix, worldMatrix);
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(VWPmatrix));
    
        //Send uniforms to GPU
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(worldMatrix));
        gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
        gl.uniform3fv(lightColorHandle,  directionalLightColor);
        gl.uniform3fv(lightDirectionHandle,  directionalLight);


        drawMeshes();
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgtx);	

        //This function says: browser, I need to perform an animation so call
        //this function every time you need to refresh a frame
        window.requestAnimationFrame(drawScene);
    }

    function drawMeshes() {
        for(let i=0; i<8; i++) {
            //This must be done for each object mesh
            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[i].vertexBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, meshes[i].vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[i].normalBuffer);
            gl.vertexAttribPointer(normalAttributeLocation, meshes[i].normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[i].textureBuffer);
            gl.vertexAttribPointer(uvAttributeLocation, meshes[i].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes[i].indexBuffer);
            
            //Draw elements
            gl.drawElements(gl.TRIANGLES, meshes[i].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }

}



window.onload = init;