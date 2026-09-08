export const moveRight = ['ArrowRight', 'KeyD'];
export const moveLeft = ['ArrowLeft', 'KeyA'];
export const moveUp = ['ArrowUp', 'KeyW'];
export const moveDown = ['ArrowDown', 'KeyS'];
export const shootButton = 0; //main mouse button
export const dashButton = [1, 'Space']; //middle mouse button
export const pauseButton = 'KeyP';
export const gameReset = 'Enter';

export let input = {
    rightPressed: false,
    leftPressed: false,
    upPressed: false,
    downPressed: false,
    shootPressed: false,
    dashPressed: false,
    mouseX: 0,
    mouseY: 0,
  }

export function initInput(canvas) {
    function mouseMoveHandler(event) {
        input.mouseX = event.offsetX;
        input.mouseY = event.offsetY;
    }
    function keyUpHandler(event) {
        if (moveRight.includes(event.code)) {
            input.rightPressed = false;
        } else if (moveLeft.includes(event.code)) {
            input.leftPressed = false;
        }
        if (moveDown.includes(event.code)) {
            input.downPressed = false;
        } else if (moveUp.includes(event.code)) {
            input.upPressed = false;
        }
    }
    // document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    // document.addEventListener('mousedown', mouseDownHandler);
    // document.addEventListener('mouseup', mouseUpHandler);
    // document.addEventListener('auxclick', mouseAuxHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    // document.addEventListener('click', mouseClickHandler);

    
}