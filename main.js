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

var mesh;

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

    var objStr = await utils.get_objstr(assetDir + "disc1.obj");
    mesh = new OBJ.Mesh(objStr);
    
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

    //Get attribute positions
    var positionAttributeLocation = gl.getAttribLocation(program, "inPosition");  
    gl.enableVertexAttribArray(positionAttributeLocation);
    var normalAttributeLocation = gl.getAttribLocation(program, "inNormal");  
    gl.enableVertexAttribArray(normalAttributeLocation);
    
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var materialDiffColorHandle = gl.getUniformLocation(program, 'mDiffColor');
    var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
    var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');

    OBJ.initMeshBuffers(gl, mesh);

    //Initilize perspective matrix
    worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(normalAttributeLocation, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    drawScene();

    function drawScene() {
        //Update transformation matrices
        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
    
        //Bind vertex array
        //gl.bindVertexArray(vao);
    
        //Calculate World-View-Projection matrices
        var VWPmatrix = utils.multiplyMatrices(projectionMatrix, worldMatrix);
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(VWPmatrix));
    
        //Send uniforms to GPU
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(worldMatrix));
        gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
        gl.uniform3fv(lightColorHandle,  directionalLightColor);
        gl.uniform3fv(lightDirectionHandle,  directionalLight);
    
        //Draw elements
        //gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        //This function says: browser, I need to perform an animation so call
        //this function every time you need to refresh a frame
        window.requestAnimationFrame(drawScene);
    }
}



window.onload = init;