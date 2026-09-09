import { input } from './input.js';
import { state } from './state.js';
export let abilityIcon; //for ability icon class and initialize function
export let shootIcon;
export let dashImage = 'assets/graphic/dash.png';
export let flipTurnImage = 'assets/graphic/flipturn.png';
export let rollImage = 'assets/graphic/roll.png';
export let bulletImage = 'assets/graphic/bullet.png'
export let laserImage = 'assets/graphic/laser.png'
export let biteImage = 'assets/graphic/bite.png'
export let moveAbilityX = 75;
export let moveAbilityY = 725;
export let shootAbilityX = 25;
export let shootAbilityY = 725;
export let mouthSelect;
export let moveSelect;
export let countdownNumber = 3;

let _canvas;
let _ctx;

export class SelectionScreen{
    constructor(options, title){
        this.options = options;
        this.hoveredOption = null;
        this.y = _canvas.height/2;
        this.size = 100;
        this.title = title;
        this.selectedOption = null;
    }
    update(){
        if (input.mouseX >= this.options[0].x
            && input.mouseX <= this.options[0].x + this.size
            && input.mouseY >= this.y
            && input.mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 0
        } else if (input.mouseX >= this.options[1].x
            && input.mouseX <= this.options[1].x + this.size
            && input.mouseY >= this.y
            && input.mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 1
        } else if (input.mouseX >= this.options[2].x
            && input.mouseX <= this.options[2].x + this.size
            && input.mouseY >= this.y
            && input.mouseY <= this.y + this.size
        ) {
            this.hoveredOption = 2
        } else {
            this.hoveredOption = null;
        }
    }
    draw(){
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        this.drawBackground();
        this.drawOptions();
        this.drawTooltip();
    }
    drawBackground(){
        //just a fill background and text.
        _ctx.fillStyle = '#260d83'
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        _ctx.font = '48px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText(this.title, _canvas.width/2, 300);
    }
    drawOptions(){
        this.options.forEach(option => {
            const image = new Image();
            image.src = option.image;
            _ctx.drawImage(image, option.x, this.y);
            _ctx.font = '24px Bagel Fat One';
            _ctx.fillStyle = 'white';
            _ctx.textAlign = 'center';
            _ctx.fillText(option.name, option.x + this.size/2, this.y - 10);
        })
    }
    drawTooltip(){
        //draw tooltip directly under the option clicked. X value should be this.options[n].x. Y should be this.y + 120. (20 pixels below the image)
        if (this.hoveredOption === null || this.hoveredOption === undefined || !this.options[this.hoveredOption]) {
        return; 
        }
        const option = this.options[this.hoveredOption];
        _ctx.fillStyle = '#ffffff65'
        _ctx.fillRect(option.x - 75, this.y + 120, this.size * 2.5, this.size * 1.5)
        _ctx.font = '18px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText(option.abilityName, option.x + this.size / 2, this.y + 140);
        _ctx.fillText(`Speed: ${option.speed}`, option.x + this.size / 2, this.y + 164);
        if (!state.mouthChosen) {
            _ctx.fillText(`Damage: ${option.damage}`, option.x + this.size / 2, this.y + 188);
        } else if (!state.movementChosen){
            _ctx.fillText(`Turning: ${option.maneuverability}`, option.x + this.size / 2, this.y + 188);
        }
        _ctx.fillText(`Distance: ${option.distance}`, option.x + this.size / 2, this.y + 212);
        _ctx.fillText(`Notes`, option.x + this.size / 2, this.y + 236);
        _ctx.fillText(option.abilityDescription, option.x + this.size / 2, this.y + 260);
    }
};

export class AbilityIcon {
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
        _ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
        _ctx.globalAlpha = progress;
        _ctx.fillStyle = 'black';
        _ctx.beginPath()
        _ctx.moveTo(this.centerX, this.centerY)
        _ctx.arc(this.centerX, this.centerY, this.radius, this.startAngle, endAngle)
        _ctx.globalAlpha = 0.6;
        _ctx.fill();
        _ctx.globalAlpha = 1;
    }
};

export function setAbilityIcon(icon) {
    abilityIcon = icon;
}

export function setShootIcon(icon) {
    shootIcon = icon;
}

export function setCountdown(countdown) {
    countdownNumber = countdown;
}

export function initUI(canvas, ctx) {
    _ctx = ctx;
    _canvas = canvas;
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
    ];
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
    ];
    mouthSelect = new SelectionScreen(attackOptions, 'Choose an Attack Ability.');
    moveSelect = new SelectionScreen(moveOptions, 'Choose a Movement Ability.');

}

export function drawStartScreen(player, bullets) {
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _ctx.font = '64px Bagel Fat One';
    _ctx.fillStyle = 'white';
    _ctx.textAlign = 'center';
    _ctx.fillText('FISHY SHOOTER', _canvas.width / 2, 64);
    _ctx.font = '48px Bagel Fat One';
    _ctx.fillText(`Press Enter to start game.`, _canvas.width / 2, _canvas.height / 2 + 48);
    player.draw(_ctx);
    player.update();
    [...bullets].forEach(object => object.update());
    [...bullets].forEach(object => object.draw(_ctx));
}

export function drawUI(playerHealth){
    if (!input.isPaused) {
        shootIcon.draw();
        abilityIcon.draw();
        _ctx.font = '24px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText(`Health: ${playerHealth}`, 70, 25);
        _ctx.fillText(`Wave: ${state.currentWave} / ${Math.floor(state.wavesThisLevel)}`, _canvas.width - 75, 25)
        _ctx.fillText(`Enemies Defeated: ${state.enemiesDefeated} / ${state.enemiesThisWave}`, _canvas.width / 2, 25);
        _ctx.fillText(`Level: ${state.currentLevel}`, _canvas.width - 60, _canvas.height - 25);
    } else if (input.isPaused) {
        drawPause();
    } 
    if (state.gameState === 'gameOver') {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height)
        _ctx.font = '48px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText(`Game Over!`, _canvas.width / 2, _canvas.height / 2);
        _ctx.font = '24px Bagel Fat One';
        _ctx.fillText(`press Enter to reset`, _canvas.width / 2, _canvas.height / 2 + 48)
    }
    if (state.gameState === 'waveComplete') {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height)
        _ctx.font = '48px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText(countdownNumber, _canvas.width / 2,  _canvas.height / 2)
    }
    if (state.gameState === 'levelComplete') {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        _ctx.font = '48px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText('Level Complete!', _canvas.width / 2, _canvas.height / 2);
        _ctx.font = '24px Bagel Fat One';
        _ctx.fillText(`press Enter to proceed to next level.`, _canvas.width / 2, _canvas.height / 2 + 48);
    }
}

export function drawPause() {
    if (state.gameState === 'playing')
        {_ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        _ctx.font = '48px Bagel Fat One';
        _ctx.fillStyle = 'white';
        _ctx.textAlign = 'center';
        _ctx.fillText('Game Paused', _canvas.width / 2, _canvas.height / 2);
        _ctx.font = '24px Bagel Fat One';
        _ctx.fillText(`press 'P' to unpause.`, _canvas.width / 2, _canvas.height / 2 + 48);
    }
}