 function setEventListners() {
    var move = document.getElementById("confirm_Move");
    move.addEventListener("click", (e) => {
        var moveFrom = document.getElementById("drop-down-from");
        var moveTo = document.getElementById("drop-down-to");
        game.initMove(moveFrom.value,moveTo.value);
    }, false);
};