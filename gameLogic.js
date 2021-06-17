"use strict";

function Game(_discNodes) {
    this.rods = [];
    this.discs = [];
    this.rodsDistance = 15.1;
    this.numberOfDiscs = _discNodes.length;

    //Variable to handle the movement
    this.movingSpeed = 0.4;
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.maxAltitude = 17.0;
    this.currentAltitude = 0.0;
    this.finalAltitude = 0.0;
    this.currentShift = 0.0;
    this.movingDisc = null;
    this.shiftDistance = 0.0;
    this.discIsMoving = false;
    this.fromRod = 0;
    this.toRod = 0;

    //Init rods and discs
    this.rods[0] = new Rod(1, 0 , [-15.151,7.8,0.0]);
    this.rods[1] = new Rod(2, this.rodsDistance,[0.0,7.8,0.0]);
    this.rods[2] = new Rod(3, this.rodsDistance * 2,[15.151,7.8,0.0]);

    this.discs[0] = new Disc(7, 2.34198, 14.076, [-15.151, 3.0816, 0.0], _discNodes[0]);
    this.discs[1] = new Disc(6, 1.99068, 11.9646, [-15.151, 5.248, 0.0], _discNodes[1]);
    this.discs[2] = new Disc(5, 1.69208, 10.1699, [-15.151, 7.0938, 0.0], _discNodes[2]);
    if(_discNodes.length > 3) this.discs[3] = new Disc(4, 1.43827, 8.64442, [-15.151, 8.6616, 0.0], _discNodes[3]);
    if(_discNodes.length > 4) this.discs[4] = new Disc(3, 1.22253, 7.34776, [-15.151, 9.994, 0.0], _discNodes[4]);
    if(_discNodes.length > 5) this.discs[5] = new Disc(2, 1.22253, 6.2456, [-15.151, 11.226, 0.0], _discNodes[5]);
    if(_discNodes.length > 6) this.discs[6] = new Disc(1, 1.03915, 5.30876, [-15.151, 12.367, 0.0], _discNodes[6]);

    this.rods[0].discs = this.discs.slice(); //add discs to the first rod

}

function Disc(_size, _height, _width, _center, _node) {
    this.size = _size;
    this.height = _height;
    this.width = _width;
    this.center = _center;
    this.node = _node;
    
}

function Rod(_number, _position,_center) {
    this.number = _number;
    this.position = _position;
    this.center = _center;
    this.width = 5;
    this.height = 17;
    this.discs = [];
}

Rod.prototype.getDiscStackHeight = function() {
    var sum = 0.0;
    this.discs.forEach(disc => {
        sum += disc.height;
    });
    return sum;
}

Game.prototype.initMove = function(_fromRod, _toRod, _startMovement = true) {
    //Set game variables
    this.fromRod = _fromRod;
    this.toRod = _toRod;
    this.startMovement = _startMovement;

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
            if(this.startMovement){
                this.discIsMoving = true;
                this.isMovingUp = true;
                this.shiftDistance = Math.abs(this.fromRod - this.toRod) * this.rodsDistance;
            }
            //Update discs positions
            this.rods[this.fromRod - 1].discs.pop();
            this.rods[this.toRod - 1].discs.push(this.movingDisc);
    }else{
        displayAlert(true,"danger","Remeber that you can move discs only on bigger ones");
    }
}

Game.prototype.move = function() {
    if(this.discIsMoving) { 
        var oldWorldMatrix = this.movingDisc.node.worldMatrix;
        var translationMatrix = utils.identityMatrix();
        var deltaShift;
        var dx = 0.0, dy = 0.0, dz = 0.0;

        if(this.isMovingUp) {
            console.log("UP");
            if(this.currentAltitude < this.maxAltitude) {
                deltaShift = (this.currentAltitude + this.movingSpeed <= this.maxAltitude) ? this.movingSpeed : (this.maxAltitude - this.currentAltitude);
                translationMatrix = utils.MakeTranslateMatrix(0.0, deltaShift, 0.0);
                dy = deltaShift;
                this.currentAltitude += deltaShift;
            }else{ //Up shift is finished, now go either left or right
                this.isMovingUp = false;
                (this.fromRod < this.toRod) ? this.isMovingRight = true : this.isMovingLeft = true;
            }
        }else if(this.isMovingRight) {
            console.log("RIGHT");
            if(this.currentShift < this.shiftDistance) {
                deltaShift = (this.currentShift + this.movingSpeed <= this.shiftDistance) ? this.movingSpeed : (this.shiftDistance - this.currentShift);
                translationMatrix = utils.MakeTranslateMatrix(deltaShift, 0.0, 0.0);
                dx = deltaShift;
                this.currentShift += deltaShift;
            }else{ //Right shift is finished, now go down
                this.isMovingRight = false;
                this.isMovingDown = true;
                this.currentShift = 0.0;
            }
        }else if(this.isMovingLeft) {
            console.log("LEFT");
            if(this.currentShift < this.shiftDistance) {
                deltaShift = (this.currentShift + this.movingSpeed <= this.shiftDistance) ? this.movingSpeed : (this.shiftDistance - this.currentShift);
                translationMatrix = utils.MakeTranslateMatrix(- deltaShift, 0.0, 0.0);
                dx = -deltaShift;
                this.currentShift += deltaShift;
            }else{ //Left shift is finished, now go down
                this.isMovingLeft = false;
                this.isMovingDown = true;
                this.currentShift = 0.0;
            }
        }else if(this.isMovingDown) {
            console.log("DOWN");
            if(this.currentAltitude > this.finalAltitude) {
                deltaShift = (this.currentAltitude - this.movingSpeed >= this.finalAltitude) ? this.movingSpeed : (this.currentAltitude - this.finalAltitude);
                translationMatrix = utils.MakeTranslateMatrix(0.0, - deltaShift, 0.0);
                dy = -deltaShift;
                this.currentAltitude -= deltaShift;
            }else{ //Movement is finished
                this.isMovingDown = false;
                this.currentAltitude = 0.0;
                this.discIsMoving = false;
                this.shiftDistance = 0.0;
                this.fromRod = 0;
                this.toRod = 0;

                //Check win
                this.checkWin();
            }
        }else {
            console.log("NO MOVING");
        }

        var newWorldMatrix = utils.multiplyMatrices(translationMatrix, oldWorldMatrix);
        this.movingDisc.node.updateWorldMatrix(newWorldMatrix);
        this.movingDisc.center = [this.movingDisc.center[0] + dx, this.movingDisc.center[1] + dy, this.movingDisc.center[2] + dz];
    }
}

Game.prototype.scaleMesurements = function(scaling) {
    this.movingSpeed *= scaling;
    this.maxAltitude *= scaling;
    this.rodsDistance *= scaling;
    this.rods.forEach(rod => {
        rod.center[0] *= scaling;
        rod.center[1] *= scaling;
        rod.center[2] *= scaling;
        rod.width *= scaling;
        rod.height *= scaling;
    })
    this.discs.forEach(disc => {
        disc.height *= scaling;
        disc.width *= scaling;
        disc.center[0] *= scaling;
        disc.center[1] *= scaling;
        disc.center[2] *= scaling;
    });
}

Game.prototype.checkWin = function() {
    if(this.rods[2].discs.length == this.discs.length){ //Win
        displayAlert(true,"success","You Won");
    }//else continue the game
}

/*Game.prototype.getSolution = function () {
    var solution = [], rods = [];
    rods[0] = this.rods[0].discs.slice();
    rods[1] = this.rods[1].discs.slice();
    rods[2] = this.rods[2].discs.slice();
    
    function hanoi(n, destination) {
        if(n == 1) {
            var rodIndex = findDiscRodPosition(1); //find smallest disc
            if(rodIndex != destination) {
                rods[destination - 1].push(rods[rodIndex - 1].pop());
                solution.push([rodIndex, destination]);
            }
        }else if(n > 1){
            var rodIndex = findDiscRodPosition(n - 1);
            if(rodIndex != destination) {
                var tmpRod; //helper rod
                for(let i = 1; i<= 3; i++) {
                    if(rodIndex != i && destination != i) {
                        tmpRod = i;
                        break;
                    }
                }

                hanoi(n - 1, temporary);
                rods[destination - 1].push(rods[rodIndex - 1].pop());
                solution.push([rodIndex, destination]);
            }
            //move all n-1 smaller discs to destination rod, too
            hanoi(n - 1, destination);
        }
    }

    function findDiscRodPosition(discSize) {
        for(let i=0; i<3; i++){}
            rods[i].forEach(disc => {
                if(disc.size == discSize)
                    return i + 1; 
            });
        }
        return -1;
    }

    return hanoi(this.discs.length, 3);
}*/