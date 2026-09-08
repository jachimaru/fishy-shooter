const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 800;
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = canvas.width;
collisionCanvas.height = canvas.height;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener('mousedown', mouseDownHandler);
document.addEventListener('mouseup', mouseUpHandler);
document.addEventListener('auxclick', mouseAuxHandler);
canvas.addEventListener('mousemove', mouseMoveHandler);
document.addEventListener('click', mouseClickHandler);

//level variables
let currentLevel = 1;
let currentLevelBGM = Math.floor(Math.random() * 5) + 1;
let levelModifier = 1 + ((currentLevel - 1) * 0.25);
let waveModifier = 1.25

//helper variables
let timeToNextFrame = 0;
let lastTime = 0;
let randomX = Math.floor(Math.random() * (canvas.width - 50));
let randomY = Math.floor(Math.random() * (canvas.height - 50));
let gameState = 'starting' // starting, playing, waveComplete, gameOver
let spawnStarted = false;
let waveOverlayTimer = 3000;
let countdownNumber = 3;
let levelComplete = false;
let waveCompleteEndTime = 0;
let waveOverlayStart = 0
let mouthChosen = false;
let movementChosen = false;
let initializeGame = false;
let hitSFX = new Audio('assets/sfx/hit.wav');
let selectSFX = new Audio('assets/sfx/select.wav');
let cooldownSFX = new Audio('assets/sfx/cooldown.wav');
let pauseSFX = new Audio('assets/sfx/pause.wav');
let gameoverBGM = new Audio(`assets/bgm/Crab's Diner.wav`)

//ui variables
let currentWave = 1;
let wavesThisLevel = Math.floor(3 + (currentLevel > 1 ? waveModifier : 0));
let enemiesDefeated = 0;
let enemiesThisWave = 5 + ((currentLevel - 1) * 0.25);
let enemiesNextWave = Math.floor(enemiesThisWave * 1.2)
let abilityIcon; //for ability icon class and initialize function
let shootIcon;
let dashImage = 'dash.png';
let flipTurnImage = 'flipturn.png';
let rollImage = 'roll.png';
let bulletImage = 'bullet.png'
let laserImage = 'laser.png'
let biteImage = 'bite.png'
let moveAbilityX = 75;
let moveAbilityY = 725;
let shootAbilityX = 25;
let shootAbilityY = 725;

//player variables
let startingX = canvas.width / 2;
let startingY = canvas.height / 2;
let moveSpeed = 3 * (currentLevel > 1 ? levelModifier : 1);
let killCount = 0;
let playerHealth = Math.floor(10 * (currentLevel > 1 ? healthModifier : 1));
let healthModifier = 1.5;
let knockbackForce = 25;
let invulnTimer = 1500;
let nextInvuln = 0;
let isInvuln = false;
let blinkRate = 20;

//dash variables (for jet Propulsion)
let jetChosen = false;
let dashCooldown = 3000;
let dashModifier = 2;
let dashDistance = 20;
let canDash = false; //turns true if player chooses jet propulsion
let jetTurnSpeed = 0.025
let jetMoveSpeed = 4;

//flipTurn variables (for Flagella)
let flagellaChosen = false;
let canFlipTurn = false;
let flipCooldown = 3000;
let flipModifier = 1.5;
let flipDistance = 10;

//dodgeRoll vairables (for Fins)
let finsChosen = false;
let finDegree = 0.1;
let finTurnSpeed = 0.1;
let finMoveSpeed = 2;
let rollPivotDistance = 200;
let rollAngle = 50;
let rollDistance = rollAngle * Math.PI / 180;
let canRoll = false;
let rollCooldown = 3000;

//turning variables
let degree = 0.5;
let rotation = (degree * Math.PI) / 180;
let angle = 0;
let turnSpeed = 0.05;

//player bullet variables
let filterMouth = true;
let bulletSpeed = 1.75;
let bulletRadius = 20;
let bulletDistance = 200;
let bulletDamage = 1;
let bulletForgiveness = 10; //increases hitbox of bullets.
let bulletSpawnTimer = null;
let nextShootTime = 0;
let bulletCooldown = 400;

//player laser variables
let proboscusMouth = false;
let laserSpeed = 5;
let laserWidth = 20;
let laserDistance = 500;
let laserDuration = 400;
let laserDamage = 1;
let laserSpawnTimer = null;
let nextLaserTime = 0;
let laserCooldown = 1000;
let laserShot = false;

//player bite variables
let mandibleMouth = false;
let biteSpeed = 9;
let biteRadius = 20;
let biteDistance = 50;
let biteDamage = 3;
let biteSpawnTimer = null;
let nextBiteTime = 0;
let biteCooldown = 600;

//controls
let moveRight = ['ArrowRight', 'KeyD'];
let moveLeft = ['ArrowLeft', 'KeyA'];
let moveUp = ['ArrowUp', 'KeyW'];
let moveDown = ['ArrowDown', 'KeyS'];
let shootButton = 0; //main mouse button
let dashButton = [1, 'Space']; //middle mouse button
let pauseButton = 'KeyP';
let gameReset = 'Enter';
let mouseX = 0;
let mouseY = 0;

//control switches
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let shootPressed = false;
let dashPressed = false;
let isPaused = false;

//Pause handling
let pauseStartTime = 0;

//enemy handling
let spawnTimer = 3000;
let enemyMax = 3;
let enemiesSpawned = 0;
let isShooting = false;

//selection variables
const attackOptions = [
    {
        name: 'Filter Feeder',
        image: bulletImage,
        speed: 2,
        damage: 2,
        distance: 2,
        x: 100,
        abilityName: 'Acid Bubbles',
        abilityDescription: 'Can shoot while moving.'
    },
    {
        name: 'Proboscus',
        image: laserImage,
        speed: 1,
        damage: 1,
        distance: 3,
        x: canvas.width/2 - 50,
        abilityName: 'Pressure Stream',
        abilityDescription: 'Cannot mve while shooting.'
    },
    {
        name: 'Mandibles',
        image: biteImage,
        speed: 3,
        damage: 3,
        distance: 1,
        x: canvas.width - 200,
        abilityName: 'Bite',
        abilityDescription: 'Restores health on kill.'
    }
]

const moveOptions = [
    {
        name: 'Tentacles',
        image: flipTurnImage,
        speed: 2,
        maneuverability: 2,
        distance: 2,
        x: 100,
        abilityName: 'Flip Turn',
        abilityDescription: 'Turn 180 degrees.'
    },
    {
        name: 'Jet Propulsion',
        image: dashImage,
        speed: 3,
        maneuverability: 1,
        distance: 3,
        x: canvas.width/2 -50,
        abilityName: 'Jet Dash',
        abilityDescription: 'Dash forward at high speed.'
    },
    {
        name: 'Fins',
        image: rollImage,
        speed: 1,
        maneuverability: 3,
        distance: 1,
        x: canvas.width - 200,
        abilityName: 'Side Roll',
        abilityDescription: 'Rotate to the side.'
    }
]

function keyDownHandler(event) {
    if (moveRight.includes(event.code)) {
        rightPressed = true;
    } else if (moveLeft.includes(event.code)) {
        leftPressed = true;
    }
    if (moveDown.includes(event.code)) {
        downPressed = true;
    } else if (moveUp.includes(event.code)) {
        upPressed = true;
    }
    if (dashButton.includes(event.code)) {
        triggerDash();
    }
    if (event.code === pauseButton && !isPaused) {
        isPaused = true;
        pauseSFX.play();
        levelBGM.volume -= levelBGM.volume / 2;
        pauseStartTime = performance.now();
    } else if (event.code === pauseButton && isPaused) {
        isPaused = false;
        levelBGM.volume += levelBGM.volume;
        let pauseDuration = performance.now() - pauseStartTime;
        player.nextMoveTime += pauseDuration;
        nextInvuln += pauseDuration;
        enemies.forEach(enemy => {
            enemy.nextMoveTime += pauseDuration;
            enemy.nextShootTime += pauseDuration;
            enemy.nextBulletTime += pauseDuration;
        })
    }
    if (event.code === gameReset && gameState === 'gameOver'){
        resetGame();
    } else if (event.code === gameReset && gameState === 'starting'){
        filterMouth = false;
        gameState = 'playing';
    }
    if (event.code === gameReset && levelComplete) {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        goToNextLevel();
    }
}

function keyUpHandler(event) {
    if (moveRight.includes(event.code)) {
        rightPressed = false;
    } else if (moveLeft.includes(event.code)) {
        leftPressed = false;
    }
    if (moveDown.includes(event.code)) {
        downPressed = false;
    } else if (moveUp.includes(event.code)) {
        upPressed = false;
    }
}

function mouseDownHandler(event) {
    event.preventDefault();
    if (movementChosen || gameState === 'starting') {
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
    if (event.button === 0) {
        clearInterval(bulletSpawnTimer)
        clearInterval(laserSpawnTimer)
    }
}

function mouseMoveHandler(event) {
    mouseX = event.offsetX;
    mouseY = event.offsetY;
}

function drawPause() {
    if (gameState === 'playing')
        {ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Paused', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Bagel Fat One';
        ctx.fillText(`press 'P' to unpause.`, canvas.width / 2, canvas.height / 2 + 48);
    }
}

class targetReticle{
    constructor(){
        this.width = 20;
        this.height = 20;
        if (filterMouth) {
            this.distance = bulletDistance;
        } else if (proboscusMouth) {
            this.distance = laserDistance / 2;
        } else if (mandibleMouth) {
            this.distance = biteDistance;
        }
        this.x = (player.centerX + (Math.sin(player.angle) * this.distance)) - (this.width / 2)
        this.y = (player.centerY - (Math.cos(player.angle) * this.distance)) - (this.height / 2)
        this.angle = player.angle;
        this.image = new Image();
        this.image.src = 'target.png'
    }
    update(){
        this.x = (player.centerX + (Math.sin(player.angle) * this.distance)) - (this.width / 2)
        this.y = (player.centerY - (Math.cos(player.angle) * this.distance)) - (this.height / 2)
        this.angle = player.angle;
    }
    draw(ctx){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class SelectionScreen{
    constructor(options, title){
        this.options = options;
        this.hoveredOption = null;
        this.y = canvas.height/2;
        this.size = 100;
        this.title = title;
        this.selectedOption = null;
    }
    update(){
        if (mouseX >= this.options[0].x
            && mouseX <= this.options[0].x + this.size
            && mouseY >= this.y
            && mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 0
        } else if (mouseX >= this.options[1].x
            && mouseX <= this.options[1].x + this.size
            && mouseY >= this.y
            && mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 1
        } else if (mouseX >= this.options[2].x
            && mouseX <= this.options[2].x + this.size
            && mouseY >= this.y
            && mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 2
        } else {
            this.hoveredOption = null;
        }
    }
    draw(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawBackground();
        this.drawOptions();
        this.drawTooltip();
    }
    drawBackground(){
        //just a fill background and text.
        ctx.fillStyle = '#260d83'
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, canvas.width/2, 300);
    }
    drawOptions(){
        this.options.forEach(option => {
            const image = new Image();
            image.src = option.image;
            ctx.drawImage(image, option.x, this.y);
            ctx.font = '24px Bagel Fat One';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(option.name, option.x + this.size/2, this.y - 10);
        })
    }
    drawTooltip(){
        //draw tooltip directly under the option clicked. X value should be this.options[n].x. Y should be this.y + 120. (20 pixels below the image)
        if (this.hoveredOption === null || this.hoveredOption === undefined || !this.options[this.hoveredOption]) {
        return; 
        }
        const option = this.options[this.hoveredOption];
        ctx.fillStyle = '#ffffff65'
        ctx.fillRect(option.x - 75, this.y + 120, this.size * 2.5, this.size * 1.5)
        ctx.font = '18px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(option.abilityName, option.x + this.size / 2, this.y + 140);
        ctx.fillText(`Speed: ${option.speed}`, option.x + this.size / 2, this.y + 164);
        if (!mouthChosen) {
            ctx.fillText(`Damage: ${option.damage}`, option.x + this.size / 2, this.y + 188);
        } else if (!movementChosen){
            ctx.fillText(`Turning: ${option.maneuverability}`, option.x + this.size / 2, this.y + 188);
        }
        ctx.fillText(`Distance: ${option.distance}`, option.x + this.size / 2, this.y + 212);
        ctx.fillText(`Notes`, option.x + this.size / 2, this.y + 236);
        ctx.fillText(option.abilityDescription, option.x + this.size / 2, this.y + 260);
    }
}

let mouthSelect = new SelectionScreen(attackOptions, 'Choose an Attack Ability.')
let moveSelect = new SelectionScreen(moveOptions, 'Choose a Movement Ability.')

class AbilityIcon {
    constructor(x, y, image, progressFunction){
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = image;
        this.width = 50;
        this.height = 50;
        this.getProgress = progressFunction;
        this.centerX = this.x + 25;
        this.centerY = this.y + 25;
        this.startAngle = -Math.PI / 2;
        this.radius = this.width / 2;
    }
    update(){

    }
    draw(){
        let progress = Math.max(0, Math.min(1, this.getProgress()));
        let endAngle = -Math.PI / 2 + (2 * Math.PI * progress)
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
        ctx.globalAlpha = progress;
        ctx.fillStyle = 'black';
        ctx.beginPath()
        ctx.moveTo(this.centerX, this.centerY)
        ctx.arc(this.centerX, this.centerY, this.radius, this.startAngle, endAngle)
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(x, y){
        this.height = 50;
        this.width = 50;
        this.x = startingX;
        this.y = startingY;
        this.angle = angle;
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.image = new Image();
        this.image.src = 'fish.png'
        this.centerX = (this.x + this.width) - 25
        this.centerY = (this.y + this.height) - 25
        this.moveX = Math.cos(this.angle) * moveSpeed;
        this.moveY = Math.sin(this.angle) * moveSpeed;
        this.nextMoveTime = 0;
    }
    update(){
        if (performance.now() >= nextInvuln) isInvuln = false;

        if (playerHealth <= 0) {
            gameState = 'gameOver';
        }
        //movement logic
        if (rightPressed && !leftPressed && !laserShot) {
            if (!finsChosen){
                this.angle += turnSpeed;
            } else if (finsChosen){
                this.angle += finTurnSpeed;
            }
        } else if (leftPressed && !rightPressed && !laserShot) {
            if (!finsChosen){
                this.angle -= turnSpeed;
            } else if (finsChosen){
                this.angle -= finTurnSpeed;
            }
        }

        this.moveX = Math.sin(this.angle) * moveSpeed;
        this.moveY = -Math.cos(this.angle) * moveSpeed;

        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);

        
        if (downPressed && jetChosen && !laserShot) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < canvas.height - this.height) {
                this.y -= this.moveY / dashModifier;
                this.x -= this.moveX / dashModifier;
                this.centerX -= this.moveX / dashModifier;
                this.centerY -= this.moveY / dashModifier;
            }
        } 
        
        if (downPressed && !laserShot) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < canvas.height - this.height) {  
                this.y -= this.moveY;
                this.x -= this.moveX;
                this.centerX -= this.moveX;
                this.centerY -= this.moveY;
        }} else if (upPressed && !laserShot) {
            if ((this.x + this.moveX) > 0 
            && (this.x + this.moveX) < canvas.width - this.width 
            && (this.y + this.moveY) > 0 
            && (this.y + this.moveY) < canvas.height - this.height) {
                this.y += this.moveY;
                this.x += this.moveX;
                this.centerX += this.moveX;
                this.centerY += this.moveY;
        }}

        //movement skill timing logic
        if (jetChosen && !laserShot) {
            if (!canDash) {
                if (performance.now() >= this.nextMoveTime){
                    canDash = true;
                    cooldownSFX.play();
                }
            }
        }

        if (finsChosen && !laserShot) {
            if (!canRoll) {
                if (performance.now() >= this.nextMoveTime){
                    canRoll = true;
                    cooldownSFX.play();
                }
            }
        }

        if (flagellaChosen && !laserShot) {
            if (!canFlipTurn) {
                if (performance.now() >= this.nextMoveTime){
                    canFlipTurn = true;
                    cooldownSFX.play();
                }
            }
        }


    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    takeDamage(x, y, damage) {
        if (isInvuln) return;
        playerHealth -= Math.floor(damage);
        hitSFX.play();
        let dx = x - this.centerX;
        let dy = y - this.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance === 0) return;
        let towardX = dx / distance;
        let towardY = dy / distance;

        if ((this.x - towardX * knockbackForce) > 0 
            && (this.x - towardX * knockbackForce) < canvas.width - this.width 
            && (this.y - towardY * knockbackForce) > 0 
            && (this.y - towardY * knockbackForce) < canvas.height - this.height) {
            this.x -= towardX * knockbackForce
            this.y -= towardY * knockbackForce
            this.centerX = (this.x + this.width) - 25;
            this.centerY = (this.y + this.height) - 25;
        }

        isInvuln = true;
        nextInvuln = performance.now() + invulnTimer;
    }
}

let player = new Player();
let bullets = [];


const enemyPresets = {
    normal: {health: 2, moveSpeed: 2, image: 'normal.png', moveInterval: 2000, range: 200, bulletInterval: 400, bulletAmount: 1, bulletWaves: 3, shootInterval: 4000, bulletTravel: bulletDistance, damage: 1}, //normal shooting pattern and movement.
    barracuda: {health: 1, moveSpeed: 6, image: 'barracuda.png', moveInterval: 2000, range: 600, bulletInterval: 0, bulletAmount: 0, bulletWaves: 0, shootInterval: 0, bulletTravel: 0, damage: 5}, //fast, charges, no shooting.
    puffer: {health: 4, moveSpeed: 1, image: 'puffer.png', moveInterval: 3000, range: 100, bulletInterval: 800, bulletAmount: 8, bulletWaves: 4, shootInterval: 4000, bulletTravel: 300, damage: 1}, //doesn't move, turns to player and shoots when within distance
}

const bulletPresets = {
    normal: {damage: 1, moveSpeed: 4, image: 'bubble.png'},
    puffer: {damage: 2, moveSpeed: 1.5, image: 'needle.png'},
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
        this.moveSpeed = (3 * (currentLevel > 1 ? levelModifier : 1)) * bulletSpeed;
        this.radius = bulletRadius;
        this.image = new Image()
        this.image.src = 'bubble.png'
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
        this.height = 20;
        this.radius = 20;
        this.length = 0;
        this.damage = laserDamage;
        this.duration = laserDuration;
        this.x = player.centerX - this.width/2
        this.y = player.centerY - this.height/2
        this.moveSpeed = player.moveSpeed * laserSpeed;
        this.image = new Image()
        this.image.src = 'beam.png'
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
            laserShot = false;
        }
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) {
            this.markedForDeletion = true;
            laserShot = false;
        }
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) {
            this.markedForDeletion = true;
            laserShot = false;
        }
    }
    draw(ctx){
        ctx.save();
        ctx.moveTo(player.centerX, player.centerY);
        ctx.lineTo(this.centerX, this.centerY);
        ctx.lineWidth = 6;
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
        this.moveSpeed = (3 * (currentLevel > 1 ? levelModifier : 1)) * biteSpeed;
        this.radius = biteRadius;
        this.image = new Image()
        this.image.src = 'bite.png'
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
            isInvuln = false;
        }
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) {
            this.markedForDeletion = true;
            isInvuln = false;
        }
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) {
            this.markedForDeletion = true;
            isInvuln = false;
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
        this.damage = Math.floor(preset.damage * (currentLevel > 1 ? levelModifier : 1));
        this.moveSpeed = preset.moveSpeed * (currentLevel > 1 ? levelModifier : 1);
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
        this.health = preset.health * (currentLevel > 1 ? levelModifier : 1);
        this.moveSpeed = preset.moveSpeed * (currentLevel > 1 ? levelModifier : 1);
        this.moveInterval = preset.moveInterval; 
        this.range = preset.range;
        this.bulletInterval = preset.bulletInterval;
        this.bulletAmount = preset.bulletAmount;
        this.bulletWaves = preset.bulletWaves * (currentLevel > 1 ? levelModifier : 1);
        this.bulletTravel = preset.bulletTravel;
        this.shootInterval = preset.shootInterval;
        this.nextBulletTime = 0;
        this.nextShootTime = 0;
        this.wavesFired = 0;
        this.damage = preset.damage * (currentLevel > 1 ? levelModifier : 1);

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
            enemiesDefeated += 1;
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
        if (type === 'bite' && this.health <= 0) playerHealth = Math.min(playerHealth + 1, Math.floor(10 * (currentLevel > 1 ? healthModifier : 1)))
        this.hitTimer = this.flashDuration;
        let dx = x - this.centerX;
        let dy = y - this.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance === 0) return;
        let towardX = dx / distance;
        let towardY = dy / distance;

        if ((this.x - towardX * knockbackForce) > 0 
            && (this.x - towardX * knockbackForce) < canvas.width - this.width 
            && (this.y - towardY * knockbackForce) > 0 
            && (this.y - towardY * knockbackForce) < canvas.height - this.height) {
            this.x -= towardX * knockbackForce
            this.y -= towardY * knockbackForce
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
        laserShot = true;
        let laserSFX = new Audio('assets/sfx/laser.wav')
        laserSFX.play();
        let lastAngle = player.angle
        let laserStopTime = 0;
        if (laserShot && laserStopTime <= laserDuration) {
            let bullet = new Laser;
            bullet.angle = lastAngle
            bullets.push(bullet)
            bullet.draw(ctx);
        }
        laserStopTime = performance.now() + nextLaserTime;
        nextShootTime = performance.now() + laserCooldown;
        for (enemy of enemies) {
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
            isInvuln = true
            player.moveX = Math.sin(player.angle) * biteDistance - 10;
            player.moveY = -Math.cos(player.angle) * biteDistance - 10;
            player.y += player.moveY;
            player.x += player.moveX;
            player.centerX += player.moveX;
            player.centerY += player.moveY;
        }
    }
}

function triggerDash() {
    if (laserShot) return
    let dashSFX = new Audio('assets/sfx/dodge.wav')
    if (canDash && jetChosen) {
        if (upPressed) {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                dashSFX.play();
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        } else if (downPressed) {
            if ((player.x - player.moveX * dashDistance) > 0 
                && (player.x - player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y - player.moveY * dashDistance) > 0 
                && (player.y - player.moveY * dashDistance) < canvas.height - player.height) {
                dashSFX.play();
                player.y -= (player.moveY * dashModifier) * dashDistance;
                player.x -= (player.moveX * dashModifier) * dashDistance;
                player.centerX -= (player.moveX * dashModifier) * dashDistance;
                player.centerY -= (player.moveY * dashModifier) * dashDistance;
            }
        } else {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                dashSFX.play();
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        }
        canDash = false;
        player.nextMoveTime = performance.now() + dashCooldown;
    }
    if (canFlipTurn && flagellaChosen) {
        if (upPressed || downPressed) {
            if ((player.x - player.moveX * flipDistance) > 0 
                && (player.x - player.moveX * flipDistance) < canvas.width - player.width 
                && (player.y - player.moveY * flipDistance) > 0 
                && (player.y - player.moveY * flipDistance) < canvas.height - player.height) {
                dashSFX.play();
                player.y -= (player.moveY * flipModifier) * flipDistance;
                player.x -= (player.moveX * flipModifier) * flipDistance;
                player.centerX -= (player.moveX * flipModifier) * flipDistance;
                player.centerY -= (player.moveY * flipModifier) * flipDistance;
                player.angle += Math.PI;
                player.moveX = Math.sin(player.angle) * moveSpeed;
                player.moveY = Math.cos(player.angle) * moveSpeed;
            }
        } else {
            if ((player.x - player.moveX * flipDistance) > 0 
                && (player.x - player.moveX * flipDistance) < canvas.width - player.width 
                && (player.y - player.moveY * flipDistance) > 0 
                && (player.y - player.moveY * flipDistance) < canvas.height - player.height) {
                dashSFX.play();
                player.y -= (player.moveY * flipModifier) * flipDistance;
                player.x -= (player.moveX * flipModifier) * flipDistance;
                player.centerX -= (player.moveX * flipModifier) * flipDistance;
                player.centerY -= (player.moveY * flipModifier) * flipDistance;
                player.angle += Math.PI;
                player.moveX = Math.sin(player.angle) * moveSpeed;
                player.moveY = Math.cos(player.angle) * moveSpeed;
            }
        }
        canFlipTurn = false;
        player.nextMoveTime = performance.now() + dashCooldown;
    }
    if (canRoll && finsChosen) {
        if (upPressed) {
            let pivotX = player.centerX + (Math.sin(player.angle) * rollPivotDistance);
            let pivotY = player.centerY - (Math.cos(player.angle) * rollPivotDistance);
            let dx = player.centerX - pivotX;
            let dy = player.centerY - pivotY;
            let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (distance === 0) return;
            let towardX = dx / distance;
            let towardY = dy / distance;
            let newX = towardX * Math.cos(-rollDistance) - towardY * Math.sin(-rollDistance);
            let newY = towardX * Math.sin(-rollDistance) + towardY * Math.cos(-rollDistance);
            let playerX = pivotX + (newX * distance);
            let playerY = pivotY + (newY * distance);
            if (playerX > player.width / 2
                && playerX < canvas.width - player.width / 2
                && playerY > player.height / 2
                && playerY < canvas.height - player.height / 2) {
                dashSFX.play();
                player.angle -= rollDistance;
                player.centerX = playerX
                player.centerY = playerY
                player.x = playerX - player.width / 2;
                player.y = playerY - player.height / 2;
                
            }
        } else if (downPressed) {
            let pivotX = player.centerX + (Math.sin(player.angle) * rollPivotDistance);
            let pivotY = player.centerY - (Math.cos(player.angle) * rollPivotDistance);
            let dx = player.centerX - pivotX;
            let dy = player.centerY - pivotY;
            let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (distance === 0) return;
            let towardX = dx / distance;
            let towardY = dy / distance;
            let newX = towardX * Math.cos(rollDistance) - towardY * Math.sin(rollDistance);
            let newY = towardX * Math.sin(rollDistance) + towardY * Math.cos(rollDistance);
            let playerX = pivotX + (newX * distance);
            let playerY = pivotY + (newY * distance);
            if (playerX > player.width / 2
                && playerX < canvas.width - player.width / 2
                && playerY > player.height / 2
                && playerY < canvas.height - player.height / 2) {
                dashSFX.play();
                player.angle += rollDistance;
                player.centerX = playerX
                player.centerY = playerY
                player.x = playerX - player.width / 2;
                player.y = playerY - player.height / 2;
            }
        } else {
            let pivotX = player.centerX + (Math.sin(player.angle) * rollPivotDistance);
            let pivotY = player.centerY - (Math.cos(player.angle) * rollPivotDistance);
            let dx = player.centerX - pivotX;
            let dy = player.centerY - pivotY;
            let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (distance === 0) return;
            let towardX = dx / distance;
            let towardY = dy / distance;
            let newX = towardX * Math.cos(-rollDistance) - towardY * Math.sin(-rollDistance);
            let newY = towardX * Math.sin(-rollDistance) + towardY * Math.cos(-rollDistance);
            let playerX = pivotX + (newX * distance);
            let playerY = pivotY + (newY * distance);
            if (playerX > player.width / 2
                && playerX < canvas.width - player.width / 2
                && playerY > player.height / 2
                && playerY < canvas.height - player.height / 2) {
                dashSFX.play();
                
                player.angle -= rollDistance;
                player.centerX = playerX
                player.centerY = playerY
                player.x = playerX - player.width / 2;
                player.y = playerY - player.height / 2;
            }
        }
        canRoll = false;
        player.nextMoveTime = performance.now() + dashCooldown;
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
        mouthChosen = true;
    } else if (event.button === 0 && mouthSelect.hoveredOption === 1) {
        selectSFX.play()
        proboscusMouth = true;
        mouthChosen = true;
    } else if (event.button === 0 && mouthSelect.hoveredOption === 2) {
        selectSFX.play()
        mandibleMouth = true;
        mouthChosen = true;
    } 
    if (event.button === 0 && moveSelect.hoveredOption === 0) {
        selectSFX.play()
        flagellaChosen = true;
        movementChosen = true;
        initializeGame = true;
    } else if (event.button === 0 && moveSelect.hoveredOption === 1) {
        selectSFX.play()
        jetChosen = true;
        movementChosen = true;
        initializeGame = true;
    } else if (event.button === 0 && moveSelect.hoveredOption === 2) {
        selectSFX.play()
        finsChosen = true;
        movementChosen = true;
        initializeGame = true;
    }
}

function enemySpawner(){
    if (enemiesSpawned >= enemiesThisWave) return
    if (performance.now() >= spawnTimer && enemies.length < enemyMax) {
        let randEnemy = Math.floor(Math.random() * 3);
        randomX = Math.floor(Math.random() * (canvas.width - 50));
        randomY = Math.floor(Math.random() * (canvas.height - 50));
        let enemyChoice = '';
        if (randEnemy === 0) {
            enemyChoice = 'normal';
        } else if (randEnemy === 1 && ((enemies.length > 3 || enemiesSpawned > 4) && currentLevel >= 3)) {
            enemyChoice = 'barracuda';
        } else if (randEnemy === 2 && ((enemies.length > 1 || enemiesSpawned > 2) && currentLevel >= 2)) {
            enemyChoice = 'puffer';
        } else {
            enemyChoice = 'normal';
        }
        let dx = (randomX + 25) - player.centerX;
        let dy = (randomY + 25) - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance >= 220) {
            let enemy = new Enemy(enemyChoice, randomX, randomY);
            enemiesSpawned += 1;
            enemies.push(enemy);
            enemy.draw(ctx);
            spawnStarted = true;
        }
    }
}

function checkPlayerBullets(){
    //check if player's bullets hit an enemy and subtract damage from health
    for (bullet of bullets) {
        for (enemy of enemies) {
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
    for (bullet of enemyBullets) {
        let dx = bullet.centerX - player.centerX;
        let dy = bullet.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance < bullet.radius) {
            bullet.markedForDeletion = true;
            if (isInvuln) return
            player.takeDamage(bullet.centerX, bullet.centerY, bullet.damage);
        }
    }
}

function checkCollision(){
    for (enemy of enemies) {
        let dx = enemy.centerX - player.centerX;
        let dy = enemy.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance <= player.width / 2) {
            if (isInvuln) return;
            player.takeDamage(enemy.centerX, enemy.centerY, enemy.damage);
        }
    }
}

function resetGame(){
    gameoverBGM.pause();
    gameoverBGM.currentTime = 0;
    mouthChosen = false;
    movementChosen = false;
    initializeGame = false;
    jetChosen = false;
    flagellaChosen = false;
    finsChosen = false;
    filterMouth = true;
    proboscusMouth = false;
    laserShot = false;
    levelComplete = false;
    mandibleMouth = false;
    mouthSelect.hoveredOption = null;
    mouthSelect.selectedOption = null;
    moveSelect.hoveredOption = null;
    moveSelect.selectedOption = null;
    currentLevel = 1
    currentWave = 1;
    wavesThisLevel = 3;
    enemiesDefeated = 0;
    enemiesThisWave = 5;
    enemiesNextWave = Math.floor(enemiesThisWave * 1.2)
    playerHealth = 10 * (currentLevel > 1 ? healthModifier : 1);
    spawnStarted = false;
    timeToNextFrame = 0;
    lastTime = 0;
    moveSpeed = 3;
    killCount = 0;
    playerHealth = 10;
    knockbackForce = 25;
    invulnTimer = 1500;
    nextInvuln = 0;
    isInvuln = false;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    dashCooldown = 3000;
    dashModifier = 2;
    dashDistance = 20;
    canDash = false;
    jetTurnSpeed = 0.025
    jetMoveSpeed = 4;
    canFlipTurn = false;
    flipCooldown = 3000;
    flipModifier = 1.5;
    flipDistance = 10;
    finDegree = 0.1;
    finTurnSpeed = 0.1;
    finMoveSpeed = 2;
    canRoll = false;
    rollCooldown = 3000;
    bulletSpeed = 1.75;
    bulletRadius = 20;
    bulletDistance = 200;
    bulletDamage = 1;
    nextShootTime = 0;
    bulletCooldown = 400;
    isShooting = false;
    spawnTimer = 3000;
    enemyMax = 3;
    enemiesSpawned = 0;
    player = new Player();
    gameState = 'starting'
}

function drawUI(){
    if (!isPaused) {
        shootIcon.draw();
        abilityIcon.draw();
        ctx.font = '24px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`Health: ${playerHealth}`, 70, 25);
        ctx.fillText(`Wave: ${currentWave} / ${Math.floor(wavesThisLevel)}`, canvas.width - 75, 25)
        ctx.fillText(`Enemies Defeated: ${enemiesDefeated} / ${enemiesThisWave}`, canvas.width / 2, 25);
        ctx.fillText(`Level: ${currentLevel}`, canvas.width - 60, canvas.height - 25);
    } else if (isPaused) {
        drawPause();
    } 
    if (gameState === 'gameOver') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.font = '48px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`Game Over!`, canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Bagel Fat One';
        ctx.fillText(`press Enter to reset`, canvas.width / 2, canvas.height / 2 + 48)
    }
    if (gameState === 'waveComplete') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.font = '48px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(countdownNumber, canvas.width / 2,  canvas.height / 2)
    }
    if (gameState === 'levelComplete') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Bagel Fat One';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Bagel Fat One';
        ctx.fillText(`press Enter to proceed to next level.`, canvas.width / 2, canvas.height / 2 + 48);
    }
}

function waveCompleteTransition(){
    laserShot = false;
    enemiesDefeated = 0;
    enemyBullets = [];
    currentWave += 1;
    enemiesThisWave = enemiesNextWave;
    player = new Player()
    waveCompleteEndTime = performance.now() + waveOverlayTimer;
    waveOverlayStart = performance.now();
    gameState = 'waveComplete';
}

function goToNextLevel(){
    currentLevel += 1;
    levelBGM = new Audio(`assets/bgm/level${currentLevelBGM}.wav`)
    currentWave = 1;
    enemiesDefeated = 0;
    levelModifier = 1 + ((currentLevel - 1) * 0.25);
    wavesThisLevel = Math.floor(3 + (currentLevel > 1 ? waveModifier : 0))
    playerHealth = Math.floor(10 * (currentLevel > 1 ? healthModifier : 1));
    enemiesNextWave = Math.floor(enemiesThisWave * 1.2)
    levelComplete = false;
    spawnStarted = false;
    timeToNextFrame = 0;
    lastTime = 0;
    killCount = 0;
    isInvuln = false;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    canDash = false;
    canFlipTurn = false;
    canRoll = false;
    nextShootTime = 0;
    isShooting = false;
    spawnTimer = 3000;
    enemyMax = 3;
    enemiesSpawned = 0;
    player = new Player();
    gameState = 'playing'
}

let previousNumber = 0;

function updateAndDraw(){
    if (gameState === 'playing') {
        if (levelBGM.paused && !isPaused) levelBGM.play();
        [...bullets, ...enemyBullets, ...enemies].forEach(object => object.update());
        [...bullets, ...enemyBullets, ...enemies].forEach(object => object.draw(ctx));
        checkPlayerBullets();
        checkEnemyBullets();
        checkCollision();
        if (isInvuln && Math.sin(performance.now() / blinkRate) > 0) {
            player.draw(ctx);
        } else if (!isInvuln) {
            player.draw(ctx);
        }
        player.update();
        let target = new targetReticle()
        target.update()
        target.draw(ctx)
        bullets = bullets.filter(object => !object.markedForDeletion);
        enemyBullets = enemyBullets.filter(object => !object.markedForDeletion);
        enemies = enemies.filter(object => object.isAlive);
        if (enemies.length === 0 && spawnStarted && enemiesSpawned === enemiesThisWave) {
            if (currentWave === wavesThisLevel) {
                levelComplete = true;
                gameState = 'levelComplete'
            } else {
                waveCompleteTransition();
            }
        }
    }
    if (gameState === 'waveComplete') {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        countdownNumber = Math.ceil((waveCompleteEndTime - performance.now()) / 1000)
        if (previousNumber !== countdownNumber) {
            let countSFX = new Audio('assets/sfx/countdown.wav')
            countSFX.play();
            previousNumber = countdownNumber;
        }
        if (performance.now() >= waveCompleteEndTime) {
            let waveDuration = performance.now() - waveOverlayStart;
            let finishSFX = new Audio('assets/sfx/countdown finish.wav')
            finishSFX.play();
            player.nextMoveTime = 0;
            nextInvuln = 0;
            enemies.forEach(enemy => {
                enemy.nextMoveTime += waveDuration;
                enemy.nextShootTime += waveDuration;
                enemy.nextBulletTime += waveDuration;
            })
        spawnTimer = 3000;
        enemiesSpawned = 0;
        spawnStarted = false;
        enemies = [];
        bullets = [];
        gameState = 'playing'
        }
    }
    if (gameState === 'gameOver') {
        levelBGM.pause();
        levelBGM.currentTime = 0;
        gameoverBGM.play();
    }
}

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '64px Bagel Fat One';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('FISHY SHOOTER', canvas.width / 2, 64);
    ctx.font = '48px Bagel Fat One';
    ctx.fillText(`Press Enter to start game.`, canvas.width / 2, canvas.height / 2 + 48);
    player.draw(ctx);
    player.update();
    [...bullets].forEach(object => object.update());
    [...bullets].forEach(object => object.draw(ctx));
}

function animate(timestamp){
    if (gameState === 'starting') {
        startBGM.play();
        drawStartScreen();
    } else {
        if (!mouthChosen) {
            mouthSelect.draw();
            mouthSelect.update();
            requestAnimationFrame(animate);
            return
        }
        if (!movementChosen) {
            mouthSelect.hoveredOption = null;
            moveSelect.draw();
            moveSelect.update();
            requestAnimationFrame(animate);
            return;
        }
        if (initializeGame) {
            moveSelect.hoveredOption = null;
            startBGM.pause();
            startBGM.currentTime = 0;
            initialize();
            levelBGM.play();
            gameState = 'playing';
            initializeGame = false;
        }
        if (isPaused) {
            drawUI();
            requestAnimationFrame(animate);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gameState === 'playing') {
            let deltatime = timestamp - lastTime;
            lastTime = timestamp;
            timeToNextFrame += deltatime;
            if (timeToNextFrame > spawnTimer){
                enemySpawner();
                timeToNextFrame = 0;
            }
        }
        updateAndDraw();
        drawUI();
    }
    
    requestAnimationFrame(animate);
    
}

function initialize(){
    if (finsChosen){
        moveSpeed = finMoveSpeed;
        turnSpeed = finTurnSpeed;
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, rollImage, () => {
            return (player.nextMoveTime - performance.now()) / rollCooldown;
        });
    } else if (jetChosen){
        moveSpeed = jetMoveSpeed;
        turnSpeed = jetTurnSpeed;
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, dashImage, () => {
            return (player.nextMoveTime - performance.now()) / dashCooldown;
        });
    } else if (flagellaChosen){
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, flipTurnImage, () => {
            return (player.nextMoveTime - performance.now()) / flipCooldown;
        });
    }
    if (filterMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, bulletImage, () => {
            return (nextShootTime - performance.now()) / bulletCooldown;
        });
    } else if (proboscusMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, laserImage, () => {
            return (nextShootTime - performance.now()) / laserCooldown;
        });
    } else if (mandibleMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, biteImage, () => {
            return (nextBiteTime - performance.now()) / biteCooldown;
        });
    }
    player.x = startingX;
    player.y = startingY;
    player.angle = angle;
    player.directionX = Math.cos(player.angle);
    player.directionY = Math.sin(player.angle);
    player.centerX = (player.x + player.width) - 25
    player.centerY = (player.y + player.height) - 25
    player.moveX = Math.cos(player.angle) * moveSpeed;
    player.moveY = Math.sin(player.angle) * moveSpeed;
    player.nextMoveTime = 0;
}

let startBGM = new Audio('assets/bgm/Whale Waltz.wav')
let levelBGM = new Audio(`assets/bgm/level1.wav`)

animate(0)
