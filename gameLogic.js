"use strict";

function Game(_discNodes) {
    this.rods = [];
    this.discs = [];
    this.rodsDistance = 15.1;

    //Variable to handle the movement
    this.movingSpeed = 0.4;
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.maxAltitude = 20.0;
    this.currentAltitude = 0.0;
    this.finalAltitude = 0.0;
    this.currentShift = 0.0;
    this.movingDisc = null;
    this.shiftDistance = 0.0;
    this.discIsMoving = false;
    this.fromRod = 0;
    this.toRod = 0;

    //Init rods and discs
    this.rods[0] = new Rod(1, 0);
    this.rods[1] = new Rod(2, this.rodsDistance);
    this.rods[2] = new Rod(3, this.rodsDistance * 2);

    this.discs[0] = new Disc(7, 2.34198, _discNodes[0]);
    this.discs[1] = new Disc(6, 1.99068, _discNodes[1]);
    this.discs[2] = new Disc(5, 1.69208, _discNodes[2]);
    this.discs[3] = new Disc(4, 1.43827, _discNodes[3]);
    this.discs[4] = new Disc(3, 1.22253, _discNodes[4]);
    this.discs[5] = new Disc(2, 1.22253, _discNodes[5]);
    this.discs[6] = new Disc(1, 1.03915, _discNodes[6]);

    this.rods[0].discs = this.discs; //add discs to the first rod

}

function Disc(_size, _height, _node,) {
    this.size = _size;
    this.height = _height;
    this.node = _node;
    
}

function Rod(_number, _position) {
    this.number = _number;
    this.position = _position;
    this.discs = [];
}

Rod.prototype.getDiscStackHeight = function() {
    var sum = 0.0;
    this.discs.forEach(disc => {
        sum += disc.height;
    });
    return sum;
}

Game.prototype.initMove = function(_fromRod, _toRod) {
    //Set game variables
    this.fromRod = _fromRod;
    this.toRod = _toRod;

    var lastDiscFrom = null;
    if(this.rods[this.fromRod - 1].discs.length > 0)
        lastDiscFrom = this.rods[this.fromRod - 1].discs[this.rods[this.fromRod - 1].discs.length - 1];
    var lastDiscTo = null;
    if(this.rods[this.toRod - 1].discs.length > 0)
        lastDiscTo = this.rods[this.toRod - 1].discs[this.rods[this.toRod - 1].discs.length - 1];
    
    //Check wheater move is ok
    if((lastDiscFrom !== null && lastDiscTo == null) || 
        (lastDiscFrom !== null && lastDiscTo != null && lastDiscFrom.size < lastDiscTo.size)) {
            //Set movement variables
            this.currentAltitude = this.rods[this.fromRod - 1].getDiscStackHeight();
            this.finalAltitude = this.rods[this.toRod - 1].getDiscStackHeight() + lastDiscFrom.height;
            this.movingDisc = lastDiscFrom;
            this.discIsMoving = true;
            this.isMovingUp = true;
            this.shiftDistance = Math.abs(this.fromRod - this.toRod) * this.rodsDistance;
            //Update discs positions
            this.rods[this.fromRod - 1].discs.pop();
            this.rods[this.toRod - 1].discs.push(this.movingDisc);
    }else{
        console.log("FORBIDDEN MOVE");
    }
}

Game.prototype.move = function() {
    if(this.discIsMoving){
        var oldWorldMatrix = this.movingDisc.node.worldMatrix;
        var movementMatrix = utils.identityMatrix();
        //var shiftDistance = Math.abs(fromRod - toRod) * this.rodsDistance;

        if(this.isMovingUp) {
            console.log("UP");
            if(this.currentAltitude < this.maxAltitude) {
                movementMatrix = utils.MakeTranslateMatrix(0.0, this.movingSpeed, 0.0);
                this.currentAltitude += this.movingSpeed;
            }else{ //Up shift is finished, now go either left or right
                this.isMovingUp = false;
                (this.fromRod < this.toRod) ? this.isMovingRight = true : this.isMovingLeft = true;
            }
        }else if(this.isMovingRight) {
            console.log("RIGHT");
            if(this.currentShift < this.shiftDistance) {
                movementMatrix = utils.MakeTranslateMatrix(this.movingSpeed, 0.0, 0.0);
                this.currentShift += this.movingSpeed;
            }else{ //Right shift is finished, now go down
                this.isMovingRight = false;
                this.isMovingDown = true;
                this.currentShift = 0.0;
            }
        }else if(this.isMovingLeft) {
            console.log("LEFT");
            if(this.currentShift < this.shiftDistance) {
                movementMatrix = utils.MakeTranslateMatrix(- this.movingSpeed, 0.0, 0.0);
                this.currentShift += this.movingSpeed;
            }else{ //Left shift is finished, now go down
                this.isMovingLeft = false;
                this.isMovingDown = true;
                this.currentShift = 0.0;
            }
        }else if(this.isMovingDown) {
            console.log("DOWN");
            if(this.currentAltitude > this.finalAltitude) {
                movementMatrix = utils.MakeTranslateMatrix(0.0, - this.movingSpeed, 0.0);
                this.currentAltitude -= this.movingSpeed;
            }else{ //Movement is finished
                this.isMovingDown = false;
                this.currentAltitude = 0.0;
                this.discIsMoving = false;
                this.shiftDistance = 0.0;
                this.fromRod = 0;
                this.toRod = 0;
            }
        }else {
            console.log("NO MOVING");
        }
        
        var newWorldMatrix = utils.multiplyMatrices(movementMatrix, oldWorldMatrix);
        this.movingDisc.node.updateWorldMatrix(newWorldMatrix);
    }
}

Game.prototype.scaleMesurements = function(scaling) {
    this.movingSpeed *= scaling;
    this.maxAltitude *= scaling;
    this.rodsDistance *= scaling;
    this.discs.forEach(disc => {
        disc.height *= scaling;
    });
}
