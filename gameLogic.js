"use strict";

function Game(_discNodes) {
    this.rods = [];
    this.discs = [];
    this.rodsDistance = 15.0;

    //Variable to handle the movement
    this.movingSpeed = 0.2;
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.maxAltitude = 20.0;
    this.currentAltitude = 0.0;
    this.currentShift = 0.0;
    this.movingDisc = null;

    //Init rods and discs
    this.rods[0] = new Rod(1, 0);
    this.rods[1] = new Rod(2, this.rodsDistance);
    this.rods[2] = new Rod(3, this.rodsDistance * 2);


    for(let i=0; i<_discNodes.length; i++){
        this.discs[i] = new Disc(i + 1, _discNodes[i]);
    }
    this.rods[0].discs = this.discs; //add discs to the first rod

}

function Disc(_size, _node) {
    this.size = _size;
    this.node = _node;
}

function Rod(_number, _position) {
    this.number = _number;
    this.position = _position;
    this.discs = [];
}

/*Game.prototype.initMove(fromRod, toRod) {
    if(this.rod[fromRod - 1].discs[this.rod[fromRod - 1].discs.length])
}*/

Game.prototype.move = function(fromRod, toRod) {
    var oldWorldMatrix = this.discs[0].node.worldMatrix;
    var movementMatrix = utils.identityMatrix();
    var shiftDistance = Math.abs(fromRod - toRod) * this.rodsDistance;

    if(this.isMovingUp) {
        console.log("UP");
        if(this.currentAltitude < this.maxAltitude) {
            movementMatrix = utils.MakeTranslateMatrix(0.0, this.movingSpeed, 0.0);
            this.currentAltitude += this.movingSpeed;
        }else{
            this.isMovingUp = false;
            (fromRod < toRod) ? this.isMovingRight = true : this.isMovingLeft = true;
        }
    }else if(this.isMovingRight) {
        console.log("RIGHT");
        if(this.currentShift < shiftDistance) {
            movementMatrix = utils.MakeTranslateMatrix(this.movingSpeed, 0.0, 0.0);
            this.currentShift += this.movingSpeed;
        }else{
            this.isMovingRight = false;
            this.isMovingDown = true;
            this.currentShift = 0.0;
        }
    }else if(this.isMovingLeft) {
        console.log("LEFT");
        if(this.currentShift < shiftDistance) {
            movementMatrix = utils.MakeTranslateMatrix(- this.movingSpeed, 0.0, 0.0);
            this.currentShift += this.movingSpeed;
        }else{
            this.isMovingLeft = false;
            this.isMovingDown = true;
        }
    }else if(this.isMovingDown) {
        console.log("DOWN");
        if(this.currentAltitude > 0.0) {
            movementMatrix = utils.MakeTranslateMatrix(0.0, - this.movingSpeed, 0.0);
            this.currentAltitude -= this.movingSpeed;
        }else{
            this.isMovingDown = false;
            this.currentAltitude = 0.0;
        }
    }else {
        console.log("NO MOVING");
    }
    
    var newWorldMatrix = utils.multiplyMatrices(movementMatrix, oldWorldMatrix);
    this.discs[0].node.updateWorldMatrix(newWorldMatrix);
}

Game.prototype.scaleMesurements = function(scaling) {
    this.movingSpeed *= scaling;
    this.maxAltitude *= scaling;
    this.rodsDistance *= scaling;
}
