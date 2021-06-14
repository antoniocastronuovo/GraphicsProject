 function setEventListners() {
    var move = document.getElementById("confirm_Move");
    move.addEventListener("click", (e) => {
        var moveFrom = document.getElementById("drop-down-from");
        var moveTo = document.getElementById("drop-down-to");
        displayAlert(false);
        game.initMove(moveFrom.value,moveTo.value);
    }, false);

    var playBtn = document.getElementById("play_btn");
    playBtn.addEventListener("click", (e) => {
        var numOfDiscs = parseInt(document.getElementById("drop-down-difficulty").value);
        game = new Game(nodes.slice(1, numOfDiscs + 1));
        game.scaleMesurements(scaling);
    }, false);
};

function displayAlert(bool) {
    var alert = document.getElementById("alert");
    if(bool){
        alert.style.display = "block";
    }
    else
    alert.style.display = "none";
}