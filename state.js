export let state = {
    gameState: 'starting',
    currentLevel: 1,
    levelModifier: 1,
    waveModifier: 1.25,
    levelComplete: false,
    mouthChosen: false,
    movementChosen: false,
    initializeGame: false,
    currentWave: 1,
    wavesThisLevel: 3,
    enemiesDefeated: 0,
    enemiesThisWave: 5,
    enemiesNextWave: Math.floor(5 * 1.2),
  }

  export let spawningState = {
    spawnStarted: false,
    spawnTimer: 3000,
    enemyMax: 3,
    enemiesSpawned: 0,
  }