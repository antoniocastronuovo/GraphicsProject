 function setEventListners() {
    var move = document.getElementById("confirm_Move");
    move.addEventListener("click", (e) => {
        var moveFrom = document.getElementById("drop-down-from");
        var moveTo = document.getElementById("drop-down-to");
        displayAlert(false,"","");
        game.initMove(moveFrom.value,moveTo.value);
    }, false);

    var playBtn = document.getElementById("play_btn");
    playBtn.addEventListener("click", (e) => {
        var numOfDiscs = parseInt(document.getElementById("drop-down-difficulty").value);
        game = new Game(nodes.slice(1, numOfDiscs + 1));
        game.scaleMesurements(scaling);
    }, false);
    
    hideSameLocation();
};

function displayAlert(bool,type,text) {
    var alert = document.getElementById("alert");
    if(bool){
        alert.style.display = "block";
        alert.className = "alert alert-"+ type +" fade show mt-4";
        alert.textContent = text;
    }
    else
    alert.style.display = "none";
}

function setMouseListeners(){
    //Event handlers to rotate camera on mouse dragging
    var mouseState = false;
    var lastMouseX = -100, lastMouseY = -100;
    function doMouseDown(event) {
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;
        mouseState = true;
    }
    function doMouseUp(event) {
        lastMouseX = -100;
        lastMouseY = -100;
        mouseState = false;
    }
    function doMouseMove(event) {
        if(mouseState) {
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
        var nLookRadius = lookRadius + event.wheelDelta/1000.0;
        if((nLookRadius > 2.0) && (nLookRadius < 20.0)) {
            lookRadius = nLookRadius;
        }
    }

    var canvas = document.getElementById("gameCanvas");
    //Set mouse event handlers
    canvas.addEventListener("mousedown", doMouseDown, false);
	canvas.addEventListener("mouseup", doMouseUp, false);
	canvas.addEventListener("mousemove", doMouseMove, false);
	canvas.addEventListener("mousewheel", doMouseWheel, false);
}

function hideSameLocation(){
    var moveFrom = document.getElementById("drop-down-from");
    var moveTo = document.getElementById("drop-down-to");

    //set all the unfeasible options of the moveTo to invisible
    for (let  j = 0; j < moveTo.options.length ; j++) {
        if (moveTo.options[j].value === moveFrom.value) {
            moveTo.options[j].style.display = "none";
            break;
        }
    }

    //set all the unfeasible options of the moveFrom to invisible
    for (let  j = 0; j < moveFrom.options.length ; j++) {
        if (moveFrom.options[j].value === moveTo.value) {
            moveFrom.options[j].style.display = "none";
            break;
        }
    }

    moveFrom.addEventListener("change", (e) => {

        //set all the options of the moveTo to visible
        for(let j=0; j < moveFrom.options.length ;j++){
            moveTo.options[j].style.display= "block";
        }
        
        
        //set all the unfeasible options of the moveTo to invisible
        for (let  j = 0; j < moveTo.options.length ; j++) {
            if (moveTo.options[j].value === moveFrom.value) {
                moveTo.options[j].style.display = "none";
                break;
            }
        }
    });

    moveTo.addEventListener("change", (e) => {
                
        //set all the options of the moveFrom to visible
        for(let j=0; j < moveTo.options.length ;j++){
            moveFrom.options[j].style.display= "block";
        }
        
        //set all the unfeasible options of the moveFrom to invisible
        for (let  j = 0; j < moveFrom.options.length ; j++) {
            if (moveFrom.options[j].value === moveTo.value) {
                moveFrom.options[j].style.display = "none";
                break;
            }
        }
    });

}