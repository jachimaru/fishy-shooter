export const startBGM = new Audio('assets/bgm/Whale Waltz.ogg')
export const finishSFX = new Audio('assets/sfx/countdown finish.wav')
export const dashSFX = new Audio('assets/sfx/dodge.wav')
export const hitSFX = new Audio('assets/sfx/hit.wav');
export const selectSFX = new Audio('assets/sfx/select.wav');
export const cooldownSFX = new Audio('assets/sfx/cooldown.wav');
export const pauseSFX = new Audio('assets/sfx/pause.wav');
export const gameoverBGM = new Audio(`assets/bgm/Crab's Diner.ogg`)
export let levelBGM = new Audio(`assets/bgm/level1.ogg`)

export function setLevelBGM(level) {
    levelBGM = new Audio(`assets/bgm/level${level}.ogg`);
}