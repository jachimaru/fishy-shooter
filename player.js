import { state } from './state.js';
import { input } from './input.js';
import { dashSFX, hitSFX, cooldownSFX } from './audio.js';
//player variables

export let playerStats = {
    moveSpeed: 3 * (state.currentLevel > 1 ? state.levelModifier : 1),
    killCount: 0,
    currentHealth: 10,
    healthModifier: 1.25,
    get maxHealth() {
        return Math.floor(10 * (state.currentLevel > 1 ? this.healthModifier : 1))
    },
    knockbackForce: 25,
    invulnTimer: 1500,
    nextInvuln: 0,
    isInvuln: false,
    blinkRate: 20,
    degree: 0.5,
    get rotation() {
        return (this.degree * Math.PI) / 180
    },
    angle: 0,
    turnSpeed: 0.05,
    laserShot: false,
};

export let dash = {
    chosen: false,
    cooldown: 3000,
    modifier: 2,
    distance: 20,
    canDash: false, //turns true if player chooses jet propulsion
    turnSpeed: 0.03,
    moveSpeed: 4,
};

export let flipTurn = {
    chosen: false,
    canFlipTurn: false,
    modifier: 1.5,
    distance: 10,
    cooldown: 3000,
};

export let fins = {
    chosen: false,
    canRoll: false,
    degree: 0.1,
    turnSpeed: 0.07,
    moveSpeed: 2,
    pivotDistance: 200,
    angle: 50,
    get distance() {
        return this.angle * Math.PI / 180;
    },
    cooldown: 3000,
};

let _canvas;
let _ctx;
let _startingX;
let _startingY;
let _player;

export class targetReticle{
    constructor(distance){
        this.width = 20;
        this.height = 20;
        this.distance = distance;
        this.x = (_player.centerX + (Math.sin(_player.angle) * this.distance)) - (this.width / 2)
        this.y = (_player.centerY - (Math.cos(_player.angle) * this.distance)) - (this.height / 2)
        this.angle = _player.angle;
        this.image = new Image();
        this.image.src = 'assets/graphics/target.png'
    }
    update(){
        this.x = (_player.centerX + (Math.sin(_player.angle) * this.distance)) - (this.width / 2)
        this.y = (_player.centerY - (Math.cos(_player.angle) * this.distance)) - (this.height / 2)
        this.angle = _player.angle;
    }
    draw(){
        _ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

export class Player {
    constructor(x, y){
        this.height = 50;
        this.width = 50;
        this.x = _startingX;
        this.y = _startingY;
        this.angle = playerStats.angle;
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.image = new Image();
        this.image.src = 'assets/graphics/fish.png'
        this.centerX = (this.x + this.width) - 25
        this.centerY = (this.y + this.height) - 25
        this.moveX = Math.cos(this.angle) * playerStats.moveSpeed;
        this.moveY = Math.sin(this.angle) * playerStats.moveSpeed;
        this.nextMoveTime = 0;
    }
    update(){
        if (performance.now() >= playerStats.nextInvuln) playerStats.isInvuln = false;

        if (playerStats.currentHealth <= 0) {
            state.gameState = 'gameOver';
        }
        //movement logic
        if (input.rightPressed && !input.leftPressed && !playerStats.laserShot) {
            if (!fins.chosen){
                this.angle += playerStats.turnSpeed;
            } else if (fins.chosen){
                this.angle += fins.turnSpeed;
            }
        } else if (input.leftPressed && !input.rightPressed && !playerStats.laserShot) {
            if (!fins.chosen){
                this.angle -= playerStats.turnSpeed;
            } else if (fins.chosen){
                this.angle -= fins.turnSpeed;
            }
        }

        this.moveX = Math.sin(this.angle) * playerStats.moveSpeed;
        this.moveY = -Math.cos(this.angle) * playerStats.moveSpeed;

        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);

        
        if (input.downPressed && dash.chosen && !playerStats.laserShot) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < _canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < _canvas.height - this.height) {
                this.y -= this.moveY / dash.modifier;
                this.x -= this.moveX / dash.modifier;
                this.centerX -= this.moveX / dash.modifier;
                this.centerY -= this.moveY / dash.modifier;
            }
        } 
        
        if (input.downPressed && !playerStats.laserShot) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < _canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < _canvas.height - this.height) {  
                this.y -= this.moveY;
                this.x -= this.moveX;
                this.centerX -= this.moveX;
                this.centerY -= this.moveY;
        }} else if (input.upPressed && !playerStats.laserShot) {
            if ((this.x + this.moveX) > 0 
            && (this.x + this.moveX) < _canvas.width - this.width 
            && (this.y + this.moveY) > 0 
            && (this.y + this.moveY) < _canvas.height - this.height) {
                this.y += this.moveY;
                this.x += this.moveX;
                this.centerX += this.moveX;
                this.centerY += this.moveY;
        }}

        //movement skill timing logic
        if (dash.chosen && !playerStats.laserShot) {
            if (!dash.canDash) {
                if (performance.now() >= this.nextMoveTime){
                    dash.canDash = true;
                    cooldownSFX.play();
                }
            }
        }

        if (fins.chosen && !playerStats.laserShot) {
            if (!fins.canRoll) {
                if (performance.now() >= this.nextMoveTime){
                    fins.canRoll = true;
                    cooldownSFX.play();
                }
            }
        }

        if (flipTurn.chosen && !playerStats.laserShot) {
            if (!flipTurn.canFlipTurn) {
                if (performance.now() >= this.nextMoveTime){
                    flipTurn.canFlipTurn = true;
                    cooldownSFX.play();
                }
            }
        }


    }
    draw(){
        _ctx.save();
        _ctx.translate(this.centerX, this.centerY);
        _ctx.rotate(this.angle);
        _ctx.translate(-this.centerX, -this.centerY);
        _ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        _ctx.restore();
    }
    takeDamage(x, y, damage) {
        if (playerStats.isInvuln) return;
        playerStats.currentHealth -= Math.floor(damage);
        hitSFX.play();
        let dx = x - this.centerX;
        let dy = y - this.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance === 0) return;
        let towardX = dx / distance;
        let towardY = dy / distance;

        if ((this.x - towardX * playerStats.knockbackForce) > 0 
            && (this.x - towardX * playerStats.knockbackForce) < _canvas.width - this.width 
            && (this.y - towardY * playerStats.knockbackForce) > 0 
            && (this.y - towardY * playerStats.knockbackForce) < _canvas.height - this.height) {
            this.x -= towardX * playerStats.knockbackForce
            this.y -= towardY * playerStats.knockbackForce
            this.centerX = (this.x + this.width) - 25;
            this.centerY = (this.y + this.height) - 25;
        }

        playerStats.isInvuln = true;
        playerStats.nextInvuln = performance.now() + playerStats.invulnTimer;
    }
}

export function setPlayer(player) {
    _player = player;
}

export function initPlayer(canvas, ctx) {
    _ctx = ctx;
    _canvas = canvas
    _startingX = canvas.width / 2;
    _startingY = canvas.height / 2;
}

export function triggerDash() {
        if (playerStats.laserShot) return
        if (dash.canDash && dash.chosen) {
            if (input.upPressed) {
                if ((_player.x + _player.moveX * dash.distance) > 0 
                    && (_player.x + _player.moveX * dash.distance) < _canvas.width - _player.width 
                    && (_player.y + _player.moveY * dash.distance) > 0 
                    && (_player.y + _player.moveY * dash.distance) < _canvas.height - _player.height) {
                    dashSFX.play();
                    _player.y += (_player.moveY * dash.modifier) * dash.distance;
                    _player.x += (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerX += (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerY += (_player.moveY * dash.modifier) * dash.distance;
                }
            } else if (input.downPressed) {
                if ((_player.x - _player.moveX * dash.distance) > 0 
                    && (_player.x - _player.moveX * dash.distance) < _canvas.width - _player.width 
                    && (_player.y - _player.moveY * dash.distance) > 0 
                    && (_player.y - _player.moveY * dash.distance) < _canvas.height - _player.height) {
                    dashSFX.play();
                    _player.y -= (_player.moveY * dash.modifier) * dash.distance;
                    _player.x -= (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerX -= (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerY -= (_player.moveY * dash.modifier) * dash.distance;
                }
            } else {
                if ((_player.x + _player.moveX * dash.distance) > 0 
                    && (_player.x + _player.moveX * dash.distance) < _canvas.width - _player.width 
                    && (_player.y + _player.moveY * dash.distance) > 0 
                    && (_player.y + _player.moveY * dash.distance) < _canvas.height - _player.height) {
                    dashSFX.play();
                    _player.y += (_player.moveY * dash.modifier) * dash.distance;
                    _player.x += (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerX += (_player.moveX * dash.modifier) * dash.distance;
                    _player.centerY += (_player.moveY * dash.modifier) * dash.distance;
                }
            }
            dash.canDash = false;
            _player.nextMoveTime = performance.now() + dash.cooldown;
        }
        if (flipTurn.canFlipTurn && flipTurn.chosen) {
            if (input.upPressed || input.downPressed) {
                if ((_player.x - _player.moveX * flipTurn.distance) > 0 
                    && (_player.x - _player.moveX * flipTurn.distance) < _canvas.width - _player.width 
                    && (_player.y - _player.moveY * flipTurn.distance) > 0 
                    && (_player.y - _player.moveY * flipTurn.distance) < _canvas.height - _player.height) {
                    dashSFX.play();
                    _player.y -= (_player.moveY * flipTurn.modifier) * flipTurn.distance;
                    _player.x -= (_player.moveX * flipTurn.modifier) * flipTurn.distance;
                    _player.centerX -= (_player.moveX * flipTurn.modifier) * flipTurn.distance;
                    _player.centerY -= (_player.moveY * flipTurn.modifier) * flipTurn.distance;
                    _player.angle += Math.PI;
                    _player.moveX = Math.sin(_player.angle) * playerStats.moveSpeed;
                    _player.moveY = Math.cos(_player.angle) * playerStats.moveSpeed;
                }
            } else {
                if ((_player.x - _player.moveX * flipTurn.distance) > 0 
                    && (_player.x - _player.moveX * flipTurn.distance) < _canvas.width - _player.width 
                    && (_player.y - _player.moveY * flipTurn.distance) > 0 
                    && (_player.y - _player.moveY * flipTurn.distance) < _canvas.height - _player.height) {
                    dashSFX.play();
                    _player.y -= (_player.moveY * flipTurn.modifier) * flipTurn.distance;
                    _player.x -= (_player.moveX * flipTurn.modifier) * flipTurn.distance;
                    _player.centerX -= (_player.moveX * flipTurn.modifier) * flipTurn.distance;
                    _player.centerY -= (_player.moveY * flipTurn.modifier) * flipTurn.distance;
                    _player.angle += Math.PI;
                    _player.moveX = Math.sin(_player.angle) * playerStats.moveSpeed;
                    _player.moveY = Math.cos(_player.angle) * playerStats.moveSpeed;
                }
            }
            flipTurn.canFlipTurn = false;
            _player.nextMoveTime = performance.now() + dash.cooldown;
        }
        if (fins.canRoll && fins.chosen) {
            if (input.upPressed) {
                let pivotX = _player.centerX + (Math.sin(_player.angle) * fins.pivotDistance);
                let pivotY = _player.centerY - (Math.cos(_player.angle) * fins.pivotDistance);
                let dx = _player.centerX - pivotX;
                let dy = _player.centerY - pivotY;
                let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
                if (distance === 0) return;
                let towardX = dx / distance;
                let towardY = dy / distance;
                let newX = towardX * Math.cos(-fins.distance) - towardY * Math.sin(-fins.distance);
                let newY = towardX * Math.sin(-fins.distance) + towardY * Math.cos(-fins.distance);
                let playerX = pivotX + (newX * distance);
                let playerY = pivotY + (newY * distance);
                if (playerX > _player.width / 2
                    && playerX < _canvas.width - _player.width / 2
                    && playerY > _player.height / 2
                    && playerY < _canvas.height - _player.height / 2) {
                    dashSFX.play();
                    _player.angle -= fins.distance;
                    _player.centerX = playerX
                    _player.centerY = playerY
                    _player.x = playerX - _player.width / 2;
                    _player.y = playerY - _player.height / 2;
                    
                }
            } else if (input.downPressed) {
                let pivotX = _player.centerX + (Math.sin(_player.angle) * fins.pivotDistance);
                let pivotY = _player.centerY - (Math.cos(_player.angle) * fins.pivotDistance);
                let dx = _player.centerX - pivotX;
                let dy = _player.centerY - pivotY;
                let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
                if (distance === 0) return;
                let towardX = dx / distance;
                let towardY = dy / distance;
                let newX = towardX * Math.cos(fins.distance) - towardY * Math.sin(fins.distance);
                let newY = towardX * Math.sin(fins.distance) + towardY * Math.cos(fins.distance);
                let playerX = pivotX + (newX * distance);
                let playerY = pivotY + (newY * distance);
                if (playerX > _player.width / 2
                    && playerX < _canvas.width - _player.width / 2
                    && playerY > _player.height / 2
                    && playerY < _canvas.height - _player.height / 2) {
                    dashSFX.play();
                    _player.angle += fins.distance;
                    _player.centerX = playerX
                    _player.centerY = playerY
                    _player.x = playerX - _player.width / 2;
                    _player.y = playerY - _player.height / 2;
                }
            } else {
                let pivotX = _player.centerX + (Math.sin(_player.angle) * fins.pivotDistance);
                let pivotY = _player.centerY - (Math.cos(_player.angle) * fins.pivotDistance);
                let dx = _player.centerX - pivotX;
                let dy = _player.centerY - pivotY;
                let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
                if (distance === 0) return;
                let towardX = dx / distance;
                let towardY = dy / distance;
                let newX = towardX * Math.cos(-fins.distance) - towardY * Math.sin(-fins.distance);
                let newY = towardX * Math.sin(-fins.distance) + towardY * Math.cos(-fins.distance);
                let playerX = pivotX + (newX * distance);
                let playerY = pivotY + (newY * distance);
                if (playerX > _player.width / 2
                    && playerX < _canvas.width - _player.width / 2
                    && playerY > _player.height / 2
                    && playerY < _canvas.height - _player.height / 2) {
                    dashSFX.play();
                    
                    _player.angle -= fins.distance;
                    _player.centerX = playerX
                    _player.centerY = playerY
                    _player.x = playerX - _player.width / 2;
                    _player.y = playerY - _player.height / 2;
                }
            }
            fins.canRoll = false;
            _player.nextMoveTime = performance.now() + dash.cooldown;
        }
    }