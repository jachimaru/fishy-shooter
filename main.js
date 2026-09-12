import { setLevelBGM, levelBGM, startBGM, finishSFX, hitSFX, selectSFX, pauseSFX, gameoverBGM } from './audio.js';
import { initInput, input, moveRight, moveLeft, moveUp, moveDown, dashButton, pauseButton, gameReset, shootButton } from './input.js';
import { state, spawningState } from './state.js';
import { initUI, setAbilityIcon, setShootIcon, setCountdown, dashImage, flipTurnImage, rollImage, bulletImage, laserImage, biteImage, moveAbilityX, moveAbilityY, shootAbilityX, shootAbilityY, mouthSelect, moveSelect, countdownNumber, SelectionScreen, AbilityIcon, drawPause, drawStartScreen, drawUI } from './ui.js';
import { initPlayer, targetReticle, Player, triggerDash, playerStats, dash, flipTurn, fins, setPlayer } from './player.js';
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 800;
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = canvas.width;
collisionCanvas.height = canvas.height;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener('mousedown', mouseDownHandler);
document.addEventListener('mouseup', mouseUpHandler);
document.addEventListener('auxclick', mouseAuxHandler);
document.addEventListener('click', mouseClickHandler);

initInput(canvas);
initUI(canvas, ctx);
initPlayer(canvas, ctx);
let player = new Player();
setPlayer(player);

//level variables
let currentLevelBGM = Math.floor(Math.random() * 5) + 1;

//helper variables
let timeToNextFrame = 0;
let lastTime = 0;
let randomX = Math.floor(Math.random() * (canvas.width - 50));
let randomY = Math.floor(Math.random() * (canvas.height - 50));
let waveOverlayTimer = 3000;
let waveCompleteEndTime = 0;
let waveOverlayStart = 0

//player bullet variables
let filterMouth = true;
let bulletSpeed = 1.75;
let bulletRadius = 20;
let bulletDistance = 200;
let bulletDamage = 2;
let bulletForgiveness = 10; //increases hitbox of bullets.
let bulletSpawnTimer = null;
let nextShootTime = 0;
let bulletCooldown = 400;

//player laser variables
let proboscusMouth = false;
let laserSpeed = 10;
let laserWidth = 20;
let laserDistance = 500;
let laserDuration = 400;
let laserDamage = 1;
let laserSpawnTimer = null;
let nextLaserTime = 0;
let laserCooldown = 750;

//player bite variables
let mandibleMouth = false;
let biteSpeed = 9;
let biteRadius = 20;
let biteDistance = 50;
let biteDamage = 3;
let biteSpawnTimer = null;
let nextBiteTime = 0;
let biteCooldown = 600;

//enemy handling
let isShooting = false;


function keyDownHandler(event) {
    if (moveRight.includes(event.code)) {
        input.rightPressed = true;
    } else if (moveLeft.includes(event.code)) {
        input.leftPressed = true;
    }
    if (moveDown.includes(event.code)) {
        input.downPressed = true;
    } else if (moveUp.includes(event.code)) {
        input.upPressed = true;
    }
    if (dashButton.includes(event.code)) {
        triggerDash();
    }
    if (event.code === pauseButton && !input.isPaused) {
        input.isPaused = true;
        pauseSFX.play();
        levelBGM.volume -= levelBGM.volume / 2;
        input.pauseStartTime = performance.now();
    } else if (event.code === pauseButton && input.isPaused) {
        input.isPaused = false;
        levelBGM.volume += levelBGM.volume;
        let pauseDuration = performance.now() - input.pauseStartTime;
        player.nextMoveTime += pauseDuration;
        playerStats.nextInvuln += pauseDuration;
        enemies.forEach(enemy => {
            enemy.nextMoveTime += pauseDuration;
            enemy.nextShootTime += pauseDuration;
            enemy.nextBulletTime += pauseDuration;
        })
    }
    if (event.code === gameReset && state.gameState === 'gameOver'){
        resetGame();
    } else if (event.code === gameReset && state.gameState === 'starting'){
        filterMouth = false;
        state.gameState = 'playing';
    }
    if (event.code === gameReset && state.levelComplete) {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        goToNextLevel();
    }
}


function mouseDownHandler(event) {
    event.preventDefault();
    if (state.movementChosen || state.gameState === 'starting') {
        if (event.button === 0) {
            if (filterMouth) {
                acidBubbles();
            
            }
            if (proboscusMouth) {
                pressureStream();
            }
            if (mandibleMouth) {
                biteAttack();
            }
            
        }
    }
}

function mouseUpHandler(event) {
    if (event.button === shootButton) {
        clearInterval(bulletSpawnTimer)
        clearInterval(laserSpawnTimer)
    }
}

let bullets = [];


const enemyPresets = {
    normal: {health: 2, moveSpeed: 2, image: 'assets/graphics/normal.png', moveInterval: 2000, range: 200, bulletInterval: 400, bulletAmount: 1, bulletWaves: 2, shootInterval: 4000, bulletTravel: bulletDistance, damage: 1}, //normal shooting pattern and movement.
    barracuda: {health: 1, moveSpeed: 6, image: 'assets/graphics/barracuda.png', moveInterval: 2000, range: 600, bulletInterval: 0, bulletAmount: 0, bulletWaves: 0, shootInterval: 0, bulletTravel: 0, damage: 5}, //fast, charges, no shooting.
    puffer: {health: 4, moveSpeed: 1, image: 'assets/graphics/puffer.png', moveInterval: 3000, range: 100, bulletInterval: 800, bulletAmount: 8, bulletWaves: 3, shootInterval: 4000, bulletTravel: 300, damage: 1}, //doesn't move, turns to player and shoots when within distance
}

const bulletPresets = {
    normal: {damage: 1, moveSpeed: 4, image: 'assets/graphics/bubble.png'},
    puffer: {damage: 2, moveSpeed: 1.5, image: 'assets/graphics/needle.png'},
}
let enemies = [];
let enemyBullets = [];

class Bullet {
    constructor() {
        this.type = 'bullet';
        this.width = 20;
        this.height = 20;
        this.damage = bulletDamage;
        this.x = player.centerX - this.width/2
        this.y = player.centerY - this.height/2
        this.moveSpeed = (3 * (state.currentLevel > 1 ? state.levelModifier : 1)) * bulletSpeed;
        this.radius = bulletRadius;
        this.image = new Image()
        this.image.src = 'assets/graphics/bubble.png'
        this.angle = player.angle;
        this.moveX = player.moveX;
        this.moveY = player.moveY;
        this.distance = bulletDistance;
        this.markedForDeletion = false;
        this.startX = player.centerX;
        this.startY = player.centerY;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
    update(){
        this.x += this.moveX * bulletSpeed;
        this.y += this.moveY * bulletSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        if (this.distanceX >= this.distance || this.distanceY >= this.distance) this.markedForDeletion = true
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) this.markedForDeletion = true;
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) this.markedForDeletion = true;
    }
    draw(ctx){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
}

class Laser {
    constructor() {
        this.type = 'laser'
        this.width = laserWidth;
        this.height = laserWidth;
        this.radius = laserWidth;
        this.length = 0;
        this.damage = laserDamage;
        this.duration = laserDuration;
        this.x = player.centerX - this.width/2
        this.y = player.centerY - this.height/2
        this.moveSpeed = player.moveSpeed * laserSpeed;
        this.image = new Image()
        this.image.src = 'assets/graphics/beam.png'
        this.angle = player.angle;
        this.moveX = player.moveX;
        this.moveY = player.moveY;
        this.distance = laserDistance;
        this.markedForDeletion = false;
        this.startX = player.centerX;
        this.startY = player.centerY;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
        this.dx = player.centerX - this.centerX;
        this.dy = player.centerY - this.centerY;
        this.currentDistance = Math.floor(Math.sqrt(this.dx * this.dx + this.dy * this.dy))
    }
    update(){
        this.x += this.moveX * laserSpeed;
        this.y += this.moveY * laserSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.dx = player.centerX - this.centerX;
        this.dy = player.centerY - this.centerY;
        console.log(this.dx, this.dy)
        this.currentDistance = Math.floor(Math.sqrt(this.dx * this.dx + this.dy * this.dy));
        console.log(this.currentDistance)
        if (this.currentDistance >= this.distance) {
            this.markedForDeletion = true;
            playerStats.laserShot = false;
        }
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) {
            this.markedForDeletion = true;
            playerStats.laserShot = false;
        }
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) {
            this.markedForDeletion = true;
            playerStats.laserShot = false;
        }
    }
    draw(ctx){
        ctx.save();
        ctx.moveTo(player.centerX, player.centerY);
        ctx.lineTo(this.centerX, this.centerY);
        ctx.lineWidth = (laserWidth / 2) - 4;
        ctx.strokeStyle = '#85F0EB'
        ctx.stroke();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
        ctx.beginPath();
        
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);

    }
}

class Bite {
    constructor() {
        this.type = 'bite';
        this.width = 20;
        this.height = 20;
        this.damage = biteDamage;
        this.x = player.centerX - this.width/2
        this.y = player.centerY - this.height/2
        this.moveSpeed = (3 * (state.currentLevel > 1 ? state.levelModifier : 1)) * biteSpeed;
        this.radius = biteRadius;
        this.image = new Image()
        this.image.src = 'assets/graphics/bite.png'
        this.angle = player.angle;
        this.moveX = player.moveX;
        this.moveY = player.moveY;
        this.distance = biteDistance;
        this.markedForDeletion = false;
        this.startX = player.centerX;
        this.startY = player.centerY;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
    update(){
        this.x += this.moveX * biteSpeed;
        this.y += this.moveY * biteSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        if (this.distanceX >= this.distance || this.distanceY >= this.distance) {
            this.markedForDeletion = true;
            playerStats.isInvuln = false;
        }
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) {
            this.markedForDeletion = true;
            playerStats.isInvuln = false;
        }
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) {
            this.markedForDeletion = true;
            playerStats.isInvuln = false;
        }
    }
    draw(ctx){
        // ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
}

class EnemyBullet {
    constructor(x, y, bulletTravel, type, angle, moveX, moveY) {
        const preset = bulletPresets[type] || bulletPresets.normal

        this.width = 20;
        this.height = 20;
        this.x = x
        this.y = y
        this.damage = Math.floor(preset.damage * (state.currentLevel > 1 ? state.levelModifier : 1));
        this.moveSpeed = preset.moveSpeed * (state.currentLevel > 1 ? state.levelModifier : 1);
        this.radius = bulletRadius;
        this.image = new Image()
        this.image.src = preset.image;
        this.angle = angle;
        this.moveX = moveX;
        this.moveY = moveY;
        this.bulletTravel = bulletTravel;
        this.markedForDeletion = false;
        this.startX = this.x;
        this.startY = this.y;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
    update(){
        this.x += this.moveX * this.moveSpeed;
        this.y += this.moveY * this.moveSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        if (this.distanceX >= this.bulletTravel || this.distanceY >= this.bulletTravel) this.markedForDeletion = true
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) this.markedForDeletion = true;
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) this.markedForDeletion = true;
    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
}

class Enemy {
    constructor(type, x, y){
        const preset = enemyPresets[type] || enemyPresets.normal

        this.type = type;
        this.health = preset.health * (state.currentLevel > 1 ? state.levelModifier : 1);
        this.moveSpeed = preset.moveSpeed * (state.currentLevel > 1 ? state.levelModifier : 1);
        this.moveInterval = preset.moveInterval; 
        this.range = preset.range;
        this.bulletInterval = preset.bulletInterval;
        this.bulletAmount = preset.bulletAmount;
        this.bulletWaves = preset.bulletWaves * (state.currentLevel > 1 ? state.levelModifier : 1);
        this.bulletTravel = preset.bulletTravel;
        this.shootInterval = preset.shootInterval;
        this.nextBulletTime = 0;
        this.nextShootTime = 0;
        this.wavesFired = 0;
        this.damage = preset.damage * (state.currentLevel > 1 ? state.levelModifier : 1);

        this.state = this.type === 'puffer' ? 'shooting' : 'patrolling'; //patrolling, attacking, shooting

        this.width = 50;
        this.height = 50;
        this.x = x;
        this.y = y;
        this.centerX = (this.x + this.width) - 25;
        this.centerY = (this.y + this.height) - 25;
        this.targetX = player.centerX;
        this.targetY = player.centerY;
        this.dx = this.targetX - this.centerX;
        this.dy = this.targetY - this.centerY;
        this.angle = (Math.atan2(this.dy, this.dx)) + (Math.PI / 2);
        this.facingAngle = (Math.atan2(this.dy, this.dx)); //For bullet calculations
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.image = new Image();
        this.image.src = preset.image;
        this.moveX = Math.cos(this.angle) * this.moveSpeed;
        this.moveY = Math.sin(this.angle) * this.moveSpeed;
        this.nextMoveTime = this.moveInterval;
        this.distance = Math.floor(Math.sqrt(this.dx * this.dx + this.dy * this.dy));
        this.towardX = this.dx / this.distance;
        this.towardY = this.dy / this.distance;
        this.randomX = Math.floor(Math.random() * (canvas.width - 50));
        this.randomY = Math.floor(Math.random() * (canvas.height - 50));
        this.hitTimer = 0;
        this.flashDuration = 6;

        this.isAlive = true;
        this.isMoving = false;
        this.inRange = false;
        this.inShootRange = false;
        this.isShooting = false;
        this.isPatrolling = false;
        this.isDamaged = false;
    }
    update(){
        // this.dx = this.targetX - this.centerX;
        // this.dy = this.targetY - this.centerY;

        //health check
        if (this.health <= 0) {
            state.enemiesDefeated += 1;
            this.isAlive = false;
        }

        this.updateRangeChecks();

        if (this.state === 'attacking') {
            if (this.type !== 'barracuda') {
                this.turnTowardPlayer();
            }
            this.updateAttacking();
        }
        if (this.state === 'shooting') {
            this.turnTowardPlayer();
            this.updateShooting();
        }
        if (this.state === 'patrolling' && this.type !== 'puffer') this.updatePatrolling();

    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop'
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalCompositeOperation = 'source-over';
            this.hitTimer -= 1;
        }
        ctx.restore();
    }
    moveTowardPlayer(){
        if ((this.x - this.towardX) > 0 
        && (this.x - this.towardX) < canvas.width - this.width 
        && (this.y - this.towardY) > 0 
        && (this.y - this.towardY) < canvas.height - this.height) {
            let dx = this.targetX - this.centerX;
            let dy = this.targetY - this.centerY;
            this.angle = (Math.atan2(dy, dx)) + (Math.PI / 2);
            this.facingAngle = (Math.atan2(this.dy, this.dx));
            this.distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (this.distance === 0) return;
            this.towardX = dx / this.distance;
            this.towardY = dy / this.distance;

            if ((this.distance < 100 && this.type === 'normal') || (this.distance < 10 && this.type === 'barracuda')) {
                this.inRange = false;
            } else if ((this.distance >= 100 && this.type === 'normal') || (this.distance >= 10 && this.type === 'barracuda')) {
                if (this.type === 'barracuda') {
                    let bulletSFX = new Audio('assets/sfx/barracuda.wav')
                    bulletSFX.play();
                }
                this.x += this.towardX * this.moveSpeed;
                this.y += this.towardY * this.moveSpeed;
                this.centerX = (this.x + this.width) - 25;
                this.centerY = (this.y + this.height) - 25;
            } 
        } else {
            this.nextMoveTime = performance.now() + this.moveInterval;
        }
    }
    turnTowardPlayer(){
        this.targetX = player.centerX;
        this.targetY = player.centerY;
        this.dx = this.targetX - this.centerX;
        this.dy = this.targetY - this.centerY;
        this.angle = (Math.atan2(this.dy, this.dx)) + (Math.PI / 2);
        this.facingAngle = (Math.atan2(this.dy, this.dx));
    }
    shootBullet(){
        this.turnTowardPlayer()
        if (this.wavesFired === 0) {
            if (this.type === 'normal') {
                let bulletSFX = new Audio('assets/sfx/normal.wav')
                bulletSFX.play();
            } else if (this.type === 'puffer') {
                let bulletSFX = new Audio('assets/sfx/puffer.wav')
                bulletSFX.play();
            }
        }
        let dx = this.targetX - this.centerX;
        let dy = this.targetY - this.centerY;
        let angle = (Math.atan2(dy, dx))// + (Math.PI / 2);
        this.distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        this.towardX = dx / this.distance;
        this.towardY = dy / this.distance;
        if (this.bulletAmount === 1) {
            let bullet = new EnemyBullet(this.centerX - 10, this.centerY - 10, this.bulletTravel, this.type, angle, this.towardX, this.towardY);
            enemyBullets.push(bullet)
            bullet.draw(ctx)
        } else {
            for (let i = 0; i < this.bulletAmount; i++) {
                angle = ((2 * Math.PI / this.bulletAmount) * i) + this.facingAngle;
                this.towardX = Math.cos(angle);
                this.towardY = Math.sin(angle);
                let bullet = new EnemyBullet(this.centerX - 10, this.centerY - 10, this.bulletTravel, this.type, angle, this.towardX, this.towardY);
                enemyBullets.push(bullet)
                bullet.draw(ctx)
                
            }
        }
        this.wavesFired += 1
        this.nextBulletTime = performance.now() + this.bulletInterval
        if (this.wavesFired >= this.bulletWaves) {
            this.wavesFired = 0;
            this.nextShootTime = performance.now() + this.shootInterval;
            if (this.type !== 'puffer') this.state = 'patrolling'
        }
    }
    updateRangeChecks(){
        this.dx = player.centerX - this.centerX;
        this.dy = player.centerY - this.centerY;
        this.inRange = Math.abs(this.dx) <= this.range && Math.abs(this.dy) <= this.range;
        this.inShootRange = Math.abs(this.dx) <= this.bulletTravel && Math.abs(this.dy) <= this.bulletTravel;
    }
    updatePatrolling(){
        //transition to shooting
        if (this.inShootRange && this.type !== 'barracuda') {
            this.state = 'shooting';
            return;
        }
        //transition to attacking
        if ((this.inRange || this.type === 'barracuda') && this.type !== 'puffer') {
            this.state = 'attacking';
            return;
        }
        //pick a target
        if (performance.now() >= this.nextMoveTime) {
            this.randomX = Math.floor(Math.random() * (canvas.width - 50));
            this.randomY = Math.floor(Math.random() * (canvas.height - 50));
            this.targetX = this.randomX;
            this.targetY = this.randomY;
            this.nextMoveTime = performance.now() + this.moveInterval
        }
        this.moveTowardPlayer();
    }
    updateShooting(){
        //transition to patrolling
        if (!this.inShootRange && this.wavesFired === 0){
            if (this.type === 'puffer') return;
            this.state = 'patrolling';
            return;
        }
        if (performance.now() < this.nextShootTime) {
            return;
        }
        if (performance.now() >= this.nextBulletTime) {
            this.shootBullet();
        }
    }
    updateAttacking(){
        //transition to patrolling
        if (!this.inRange){
            this.state = 'patrolling';
            return;
        }
        //transition to shooting
        if (this.inShootRange && this.type !== 'barracuda') {
            this.state = 'shooting';
            return;
        }
        //chase player
        if (performance.now() >= this.nextMoveTime) {
            this.targetX = player.centerX;
            this.targetY = player.centerY;
            this.nextMoveTime = performance.now() + this.moveInterval
        }
        this.moveTowardPlayer();
        
    }
    takeDamage(x, y, damage, type){
        if (this.isDamaged === true && proboscusMouth) return;
        this.health -= Math.ceil(damage);
        hitSFX.play();
        if (type === 'bite' && this.health <= 0) playerStats.currentHealth = Math.min(playerStats.currentHealth + 1, Math.floor(10 * (state.currentLevel > 1 ? playerStats.healthModifier : 1)))
        this.hitTimer = this.flashDuration;
        let dx = x - this.centerX;
        let dy = y - this.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance === 0) return;
        let towardX = dx / distance;
        let towardY = dy / distance;

        if ((this.x - towardX * playerStats.knockbackForce) > 0 
            && (this.x - towardX * playerStats.knockbackForce) < canvas.width - this.width 
            && (this.y - towardY * playerStats.knockbackForce) > 0 
            && (this.y - towardY * playerStats.knockbackForce) < canvas.height - this.height) {
            this.x -= towardX * playerStats.knockbackForce
            this.y -= towardY * playerStats.knockbackForce
            this.centerX = (this.x + this.width) - 25;
            this.centerY = (this.y + this.height) - 25;
        }

        if (proboscusMouth) this.isDamaged = true;
    }
}

function acidBubbles() {
    if (performance.now() >= nextShootTime) {
        let bubbleSFX = new Audio('assets/sfx/bubble.wav')
        bubbleSFX.play();
        let bullet = new Bullet;
        bullets.push(bullet)
        bullet.draw(ctx);
        nextShootTime = performance.now() + bulletCooldown;
        bulletSpawnTimer = setInterval(function () {
            let bullet = new Bullet;
            bullets.push(bullet)
            bullet.draw(ctx);
            bubbleSFX.play();
            nextShootTime = performance.now() + bulletCooldown;
        }, bulletCooldown)
    }
}

function pressureStream() {
    if (performance.now() >= nextShootTime) {
        playerStats.laserShot = true;
        let laserSFX = new Audio('assets/sfx/laser.wav')
        laserSFX.play();
        let lastAngle = player.angle
        let laserStopTime = 0;
        if (playerStats.laserShot && laserStopTime <= laserDuration) {
            let bullet = new Laser;
            bullet.angle = lastAngle
            bullets.push(bullet)
            bullet.draw(ctx);
        }
        laserStopTime = performance.now() + nextLaserTime;
        nextShootTime = performance.now() + laserCooldown;
        for (let enemy of enemies) {
            enemy.isDamaged = false;
        }
        
    }
}

function biteAttack() {
    if (performance.now() >= nextBiteTime) {
        let pathX = Math.sin(player.angle) * biteDistance - 10;
        let pathY = -Math.cos(player.angle) * biteDistance - 10;
        if ((player.x + pathX) > 0 
        && (player.x + pathX) < canvas.width - player.width 
        && (player.y + pathY) > 0 
        && (player.y + pathY) < canvas.height - player.height) {
            let biteSFX = new Audio('assets/sfx/bite.wav')
            biteSFX.play();
            let bullet = new Bite;
                bullets.push(bullet)
                bullet.draw(ctx);
                nextBiteTime = performance.now() + biteCooldown;
            playerStats.isInvuln = true
            player.moveX = Math.sin(player.angle) * biteDistance - 10;
            player.moveY = -Math.cos(player.angle) * biteDistance - 10;
            player.y += player.moveY;
            player.x += player.moveX;
            player.centerX += player.moveX;
            player.centerY += player.moveY;
        }
    }
}

function mouseAuxHandler(event) {
    event.preventDefault();
    if (dashButton.includes(event.code) || event.button === 1) {
        triggerDash();
    }
}

function mouseClickHandler(event) {
    if (event.button === 0 && mouthSelect.hoveredOption === 0) {
        selectSFX.play()
        filterMouth = true;
        state.mouthChosen = true;
    } else if (event.button === 0 && mouthSelect.hoveredOption === 1) {
        selectSFX.play()
        proboscusMouth = true;
        state.mouthChosen = true;
    } else if (event.button === 0 && mouthSelect.hoveredOption === 2) {
        selectSFX.play()
        mandibleMouth = true;
        state.mouthChosen = true;
    } 
    if (event.button === 0 && moveSelect.hoveredOption === 0) {
        selectSFX.play()
        flipTurn.chosen = true;
        state.movementChosen = true;
        state.initializeGame = true;
    } else if (event.button === 0 && moveSelect.hoveredOption === 1) {
        selectSFX.play()
        dash.chosen = true;
        state.movementChosen = true;
        state.initializeGame = true;
    } else if (event.button === 0 && moveSelect.hoveredOption === 2) {
        selectSFX.play()
        fins.chosen = true;
        state.movementChosen = true;
        state.initializeGame = true;
    }
}

function enemySpawner(){
    if (spawningState.enemiesSpawned >= state.enemiesThisWave) return
    if (performance.now() >= spawningState.spawnTimer && enemies.length < spawningState.enemyMax) {
        let randEnemy = Math.floor(Math.random() * 3);
        randomX = Math.floor(Math.random() * (canvas.width - 50));
        randomY = Math.floor(Math.random() * (canvas.height - 50));
        let enemyChoice = '';
        if (randEnemy === 0) {
            enemyChoice = 'normal';
        } else if (randEnemy === 1 && ((enemies.length > 3 || spawningState.enemiesSpawned > 4) && state.currentLevel >= 3)) {
            enemyChoice = 'barracuda';
        } else if (randEnemy === 2 && ((enemies.length > 1 || spawningState.enemiesSpawned > 2) && state.currentLevel >= 2)) {
            enemyChoice = 'puffer';
        } else {
            enemyChoice = 'normal';
        }
        let dx = (randomX + 25) - player.centerX;
        let dy = (randomY + 25) - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance >= 220) {
            let enemy = new Enemy(enemyChoice, randomX, randomY);
            spawningState.enemiesSpawned += 1;
            enemies.push(enemy);
            enemy.draw(ctx);
            spawningState.spawnStarted = true;
        }
    }
}

function checkPlayerBullets(){
    //check if player's bullets hit an enemy and subtract damage from health
    for (let bullet of bullets) {
        for (let enemy of enemies) {
            let dx = bullet.centerX - enemy.centerX;
            let dy = bullet.centerY - enemy.centerY;
            let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (bullet.type === 'bullet' && distance < bullet.radius + bulletForgiveness) {
                bullet.markedForDeletion = true;
                enemy.takeDamage(bullet.centerX, bullet.centerY, bulletDamage, bullet.type);
            }
            if (bullet.type === 'laser' && distance < bullet.radius + bulletForgiveness) {
                enemy.takeDamage(bullet.centerX, bullet.centerY, laserDamage, bullet.type);
            }
            if (bullet.type === 'bite' && distance < bullet.radius + bulletForgiveness) {
                enemy.takeDamage(bullet.centerX, bullet.centerY, biteDamage, bullet.type);
            }
        }
    }
}

function checkEnemyBullets(){
    for (let bullet of enemyBullets) {
        let dx = bullet.centerX - player.centerX;
        let dy = bullet.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance < bullet.radius) {
            bullet.markedForDeletion = true;
            if (playerStats.isInvuln) return
            player.takeDamage(bullet.centerX, bullet.centerY, bullet.damage);
        }
    }
}

function checkCollision(){
    for (let enemy of enemies) {
        let dx = enemy.centerX - player.centerX;
        let dy = enemy.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance <= player.width / 2) {
            if (playerStats.isInvuln) return;
            player.takeDamage(enemy.centerX, enemy.centerY, enemy.damage);
        }
    }
}

function resetGame(){
    gameoverBGM.pause();
    gameoverBGM.currentTime = 0;
    state.mouthChosen = false;
    state.movementChosen = false;
    state.initializeGame = false;
    dash.chosen = false;
    flipTurn.chosen = false;
    fins.chosen = false;
    filterMouth = true;
    proboscusMouth = false;
    playerStats.laserShot = false;
    state.levelComplete = false;
    mandibleMouth = false;
    mouthSelect.hoveredOption = null;
    mouthSelect.selectedOption = null;
    moveSelect.hoveredOption = null;
    moveSelect.selectedOption = null;
    state.currentLevel = 1
    state.currentWave = 1;
    state.wavesThisLevel = 3;
    state.enemiesDefeated = 0;
    state.enemiesThisWave = 5;
    state.enemiesNextWave = Math.floor(state.enemiesThisWave * 1.2)
    playerStats.currentHealth = 10 * (state.currentLevel > 1 ? playerStats.healthModifier : 1);
    spawningState.spawnStarted = false;
    timeToNextFrame = 0;
    lastTime = 0;
    playerStats.moveSpeed = 3;
    playerStats.killcount = 0;
    playerStats.knockbackForce = 25;
    playerStats.invulnTimer = 1500;
    playerStats.nextInvuln = 0;
    playerStats.isInvuln = false;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    dash.cooldown = 3000;
    dash.modifier = 2;
    dash.distance = 20;
    dash.canDash = false;
    dash.turnSpeed = 0.025
    dash.moveSpeed = 4;
    flipTurn.canFlipTurn = false;
    flipTurn.cooldown = 3000;
    flipTurn.modifier = 1.5;
    flipTurn.distance = 10;
    fins.degree = 0.1;
    fins.turnSpeed = 0.1;
    fins.moveSpeed = 2;
    fins.canRoll = false;
    fins.cooldown = 3000;
    bulletSpeed = 1.75;
    bulletRadius = 20;
    bulletDistance = 200;
    bulletDamage = 1;
    nextShootTime = 0;
    bulletCooldown = 400;
    isShooting = false;
    spawningState.spawnTimer = 3000;
    spawningState.enemyMax = 3;
    spawningState.enemiesSpawned = 0;
    player = new Player();
    setPlayer(player)
    state.gameState = 'starting'
}

function waveCompleteTransition(){
    playerStats.laserShot = false;
    state.enemiesDefeated = 0;
    enemyBullets = [];
    state.currentWave += 1;
    state.enemiesThisWave = state.enemiesNextWave;
    player = new Player()
    setPlayer(player)
    waveCompleteEndTime = performance.now() + waveOverlayTimer;
    waveOverlayStart = performance.now();
    state.gameState = 'waveComplete';
}

function goToNextLevel(){
    state.currentLevel += 1;
    setLevelBGM(currentLevelBGM);
    state.currentWave = 1;
    state.enemiesDefeated = 0;
    state.levelModifier = 1 + ((state.currentLevel - 1) * 0.25);
    state.wavesThisLevel = Math.floor(3 + (state.currentLevel > 1 ? state.waveModifier : 0))
    playerStats.currentHealth = Math.floor(10 * (state.currentLevel > 1 ? playerStats.healthModifier : 1));
    state.enemiesNextWave = Math.floor(state.enemiesThisWave * 1.2)
    state.levelComplete = false;
    spawningState.spawnStarted = false;
    timeToNextFrame = 0;
    lastTime = 0;
    playerStats.killcount = 0;
    playerStats.isInvuln = false;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    dash.canDash = false;
    flipTurn.canFlipTurn = false;
    fins.canRoll = false;
    nextShootTime = 0;
    isShooting = false;
    spawningState.spawnTimer = 3000;
    spawningState.enemyMax = 3;
    spawningState.enemiesSpawned = 0;
    player = new Player();
    setPlayer(player)
    state.gameState = 'playing'
}

let previousNumber = 0;



function updateAndDraw(){
    if (state.gameState === 'playing') {
        if (levelBGM.paused && !input.isPaused) levelBGM.play();
        [...bullets, ...enemyBullets, ...enemies].forEach(object => object.update());
        [...bullets, ...enemyBullets, ...enemies].forEach(object => object.draw(ctx));
        checkPlayerBullets();
        checkEnemyBullets();
        checkCollision();
        if (playerStats.isInvuln && Math.sin(performance.now() / playerStats.blinkRate) > 0) {
            player.draw();
        } else if (!playerStats.isInvuln) {
            player.draw();
        }
        player.update();
        let distance;
        if (filterMouth) {
            distance = bulletDistance;
        } else if (proboscusMouth) {
            distance = laserDistance / 2;
        } else if (mandibleMouth) {
            distance = biteDistance;
        }
        let target = new targetReticle(distance);
        target.update();
        target.draw();
        bullets = bullets.filter(object => !object.markedForDeletion);
        enemyBullets = enemyBullets.filter(object => !object.markedForDeletion);
        enemies = enemies.filter(object => object.isAlive);
        if (enemies.length === 0 && spawningState.spawnStarted && spawningState.enemiesSpawned === state.enemiesThisWave) {
            if (state.currentWave === state.wavesThisLevel) {
                state.levelComplete = true;
                state.gameState = 'levelComplete'
            } else {
                waveCompleteTransition();
            }
        }
    }
    if (state.gameState === 'waveComplete') {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        setCountdown(Math.ceil((waveCompleteEndTime - performance.now()) / 1000))
        if (previousNumber !== countdownNumber) {
            let countSFX = new Audio('assets/sfx/countdown.wav')
            countSFX.play();
            previousNumber = countdownNumber;
        }
        if (performance.now() >= waveCompleteEndTime) {
            let waveDuration = performance.now() - waveOverlayStart;
            finishSFX.play();
            player.nextMoveTime = 0;
            playerStats.nextInvuln = 0;
            enemies.forEach(enemy => {
                enemy.nextMoveTime += waveDuration;
                enemy.nextShootTime += waveDuration;
                enemy.nextBulletTime += waveDuration;
            })
        spawningState.spawnTimer = 3000;
        spawningState.enemiesSpawned = 0;
        spawningState.spawnStarted = false;
        enemies = [];
        bullets = [];
        state.gameState = 'playing'
        }
    }
    if (state.gameState === 'gameOver') {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        gameoverBGM.play();
    }
}

function animate(timestamp){
    if (state.gameState === 'starting') {
        startBGM.play();
        drawStartScreen(player, bullets);
    } else {
        if (!state.mouthChosen) {
            mouthSelect.draw();
            mouthSelect.update();
            requestAnimationFrame(animate);
            return
        }
        if (!state.movementChosen) {
            mouthSelect.hoveredOption = null;
            moveSelect.draw();
            moveSelect.update();
            requestAnimationFrame(animate);
            return;
        }
        if (state.initializeGame) {
            moveSelect.hoveredOption = null;
            startBGM.pause();
            startBGM.currentTime = 0;
            initialize();
            levelBGM.play();
            state.gameState = 'playing';
            state.initializeGame = false;
        }
        if (input.isPaused) {
            drawUI(playerStats.currentHealth);
            requestAnimationFrame(animate);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (state.gameState === 'playing') {
            let deltatime = timestamp - lastTime;
            lastTime = timestamp;
            timeToNextFrame += deltatime;
            if (timeToNextFrame > spawningState.spawnTimer){
                enemySpawner();
                timeToNextFrame = 0;
            }
        }
        updateAndDraw();
        drawUI(playerStats.currentHealth);
    }
    
    requestAnimationFrame(animate);
    
}

function initialize(){
    if (fins.chosen){
        playerStats.moveSpeed = fins.moveSpeed;
        playerStats.turnSpeed = fins.turnSpeed;
        setAbilityIcon(new AbilityIcon(moveAbilityX, moveAbilityY, rollImage, () => {
            return (player.nextMoveTime - performance.now()) / fins.cooldown;
        }));
    } else if (dash.chosen){
        playerStats.moveSpeed = dash.moveSpeed;
        playerStats.turnSpeed = dash.turnSpeed;
        setAbilityIcon(new AbilityIcon(moveAbilityX, moveAbilityY, dashImage, () => {
            return (player.nextMoveTime - performance.now()) / dash.cooldown;
        }));
    } else if (flipTurn.chosen){
        setAbilityIcon(new AbilityIcon(moveAbilityX, moveAbilityY, flipTurnImage, () => {
            return (player.nextMoveTime - performance.now()) / flipTurn.cooldown;
        }));
    }
    if (filterMouth){
        setShootIcon(new AbilityIcon(shootAbilityX, shootAbilityY, bulletImage, () => {
            return (nextShootTime - performance.now()) / bulletCooldown;
        }));
    } else if (proboscusMouth){
        setShootIcon(new AbilityIcon(shootAbilityX, shootAbilityY, laserImage, () => {
            return (nextShootTime - performance.now()) / laserCooldown;
        }));
    } else if (mandibleMouth){
        setShootIcon(new AbilityIcon(shootAbilityX, shootAbilityY, biteImage, () => {
            return (nextBiteTime - performance.now()) / biteCooldown;
        }));
    }
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.angle = playerStats.angle;
    player.directionX = Math.cos(player.angle);
    player.directionY = Math.sin(player.angle);
    player.centerX = (player.x + player.width) - 25
    player.centerY = (player.y + player.height) - 25
    player.moveX = Math.cos(player.angle) * playerStats.moveSpeed;
    player.moveY = Math.sin(player.angle) * playerStats.moveSpeed;
    player.nextMoveTime = 0;
}

animate(0);