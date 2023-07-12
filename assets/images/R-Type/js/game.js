let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 320,
    physics: {
        default: 'arcade'
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
};

var game = new Phaser.Game(config);
//images 
let startImage, rTypeImage, spaceImage, gameOverImage;
let playerShip, enemy, groundEnemy,bossImage;
//other
let playerSpeed, enemySpeed, missileSpeed; 
let explosionSound;
let explosionAnim;
let gameState;

function init() {
    shipSpeed = 100;
    enemySpeed = 100;
    missileSpeed = 100;
    playerSpeed = 100;
    speedBulletMultiplier = 100;
    gameState = "startScreen"
}

function preload() {
    this.load.image('player','./assets/images/ship.png');
    this.load.image('enemy','./assets/images/ennemy.png');
    this.load.image('boss','./assets/images/boss.gif');
    this.load.image('missile','./assets/images/star2.png');
    this.load.image('groundEnemy','./assets/images/groundennemy.png');
    this.load.image('start','./assets/images/Play.png');
    this.load.image('rType','./assets/images/R-Type.png');
    this.load.image('space','./assets/images/space.png');
    this.load.image('gameOver','./assets/images/groundennemy.png');
    
    //charger le spritesheet
    this.load.spritesheet('exAnim', './assets/animations/explosion.png',
        { frameWidth: 128,
        frameHeight: 128 }); // c'est une fonction
    
    this.load.audio('explosionSound', './assets/audio/explosion.wav');

    //loader le fichier JSON pour les tiles qu'on a fait sut Tiled
    this.load.image('tiles', './assets/images/tiles.png');
    this.load.tilemapTiledJSON('backgroundMap','./assets/tiled/level2.json'); 
}

function create() {

    //ma map est mis en premier
    const map = this.make.tilemap({ key: 'backgroundMap' });
    var sciti = map.addTilesetImage('Sci-Fi', 'tiles', 16, 16, 0, 0); //nom_sur_tile, nom_du_load, sizz_tile, ecart_tile
    var layer = map.createStaticLayer(0, sciti, 0, 0);
    layer.setCollisionBetween(1, 15000); //les premiers 1150 tiles sont collidable

    //je place mon playership mais je ne le fais pas avancer
    playerShip = this.physics.add.image(200,200,'player');

    // pour pas que le ship depasse les bords de la camera (gauche et droite, en bas on a bloqué avec du decord)
    if (playerShip.x > this.cameras.main.scrollX + config.width) playerShip.x = this.cameras.main.scrollX + config.width - 8;

    if (playerShip.x < this.cameras.main.scrollX) playerShip.x = this.cameras.main.scrollX;

    // j'ajoute 50 missile
    missiles = this.physics.add.group({
        defaultKey: 'missile',
        maxSize: 10
        });
    
    //pour pouvoir shooter des missiles avec la barre espace
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    enemy = this.physics.add.image(config.width + 40, Phaser.Math.Between(70, config.height - 70), 'enemy')
    
    //tween toujours dans le create: pour faire tourner l'enemy
    let tweenPanel = this.tweens.add({
        targets: enemy, // objet cible
        // y: 100,
        // scaleY: 1.2,
        angle: 360,
        duration: 2000,
        ease: 'linear', // power2 c'est doucement au debut et vite apres
        yoyo : false,
        loop: -1, //-1 pour toujours
        paused: false
    });
    
    groundEnemy = this.physics.add.image(config.width /2, config.height - 40, 'groundEnemy');
    
    bullets = this.physics.add.group({
        defaultKey: 'missile',
        maxSize: 21 // car mon timer se repete 20 + 1 x
    });
 
    //le boss mais il ne prend pas les balles, il faut le toucher à un endroit specifique (le point rouge)
    bossImage = this.add.image(this.cameras.main.scrollX + 2400 + config.width - 140, config.height/2, 'boss')
    bossImage.setMovable(true);
    

    let explosionAnimation = this.anims.create({
        key: 'explode', //des fois il y a plusieurs animations donc c'est facile
        frames: this.anims.generateFrameNumbers('exAnim'),
        frameRate: 20, //ms entre chaque frame
        repeat: 0,
        hideOnComplete: true 
    });
    
    //creation de colliders dans mon create
    this.physics.add.collider(enemy, missiles, collisionEnemyMissile,null, this); // avec n'importe quel missile (groupe)
    this.physics.add.collider(playerShip, bullets, collisionPlayerBullet,null, this); 
    //this.physics.add.collider(playerShip, layer, collisionPlayerShipLayer,null, this); 
    this.physics.add.collider(bossImage, missile, collisionBossMissile,null, this); 

    explosionSound = this.sound.add('explosionSound');
    
    //startgame with:
    spaceImage = this.add.image(config.width / 2, config.height / 2, 'space');
    rTypeImage = this.add.image(config.width / 2, config.height /3, 'rType');
    startImage = this.add.image(config.width / 2, config.height* 2/3, 'start').setInteractive();
    startImage.setScale(0.5);
    startImage.on('pointerdown', ()=>{ // a la place d'une fonction complete
        startImage.setVisible(false);
        spaceImage.setVisible(false);
        rTypeImage.setVisible(false);
        gameState = "scrollGame";
        //faire démarrer le player et enemy
        playerShip.setVelocity(playerSpeed,0);
        enemy.setVelocity(-enemySpeed,0);
        //le ground enemy va shooter seulement quand on demarre la jeu
        var timerGroundEnemyShoot = this.time.addEvent({
            delay: 1000,
            callback: goundEnemyShootBullet,
            callbackScope: this,
            repeat: 9 // nombre de bullets lancées: ca le fait 10 x car on ne compte pas la premiere
        });
        
    })
}

function update() {
    //********************************************************* */
    //START SCREEN ********************************************
    if (gameState === "startScreen") { // triple egal pour des string

        //on peut y ajouter quelque chose mais c'est pas obligé
    }

    //********************************************************* */
    //SCROLL GAME ********************************************
    
    if (gameState === "scrollGame") { 
        //scrolling de la camera, qui s'arrete a la fin du framescroll
        this.cameras.main.scrollX += 0.7; //a chaque frame, on avance d'un pixel
        
        //recupere ce que l'utilisateur tap au clavier
        cursors = this.input.keyboard.createCursorKeys(); 
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed,0); // si la fleche de droite est poussée (is down)
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed,0);
        if (cursors.up.isDown) playerShip.setVelocityY(-shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocityY(shipSpeed);
    
        if (Phaser.Input.Keyboard.JustDown(spacebar)){
            //alert()
            let missile = missiles.get();
            if (missile) { //si on a encore des missiles
               //alert()
                missile.setPosition(playerShip.x + 16, playerShip.y + 6);
                missile.setVelocity(playerSpeed + missileSpeed,0);
            }
        }
    
        //quand la position de la meteorite (enemy) sort de mon ecran, on respawn just en dehors de ma camera
        if (enemy.x < this.cameras.main.scrollX - 30) {
            enemy.setPosition(this.cameras.main.scrollX + config.width + 20, Phaser.Math.Between(70, config.height - 70));
        }
    
       //quand le player collide avec l'asteroid (enemy)
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            enemy.getBounds(), // pour obtenir les frontieres de l'objet enemy
            playerShip.getBounds())) {
                explosionAnim = this.add.sprite(playerShip.x, playerShip.y,'exAnim');
                explosionAnim.play('explode');
                
                //jouer le son de l'explosion
                explosionSound.play();
                
                //mettre les sprites loin quand il y a collision: REMPLACER CA PAR LE MENU OU UN SYSTEME DE POINTS
                playerShip.setPosition(1000,1000)
                playerShip.setVelocity(0,0);
            }

           if (this.cameras.main.scrollX >= 2400) gameState = "bossGame";
           
    }

    //********************************************************* */
    //BOSS GAME ********************************************


    if (gameState === "bossGame") { 
        //arreter de faire bouger automatiquement le ship
        playerShip.setVelocity(0,0);

        cursors = this.input.keyboard.createCursorKeys(); 
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed,0);
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed,0);
        if (cursors.up.isDown) playerShip.setVelocityY(-shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocityY(shipSpeed);
        
        if (Phaser.Input.Keyboard.JustDown(spacebar)){
            let missile = missiles.get();
            if (missile) { 
                missile.setPosition(playerShip.x + 16, playerShip.y + 6);
                missile.setVelocity(playerSpeed + missileSpeed,0);
            }
        }
        
       //si il me reste un enemy dans mon ecran, il doit pouvoir m'exploser meme si je suis deja dans le niveau boss
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            enemy.getBounds(), 
            playerShip.getBounds())) {
                explosionAnim = this.add.sprite(playerShip.x, playerShip.y,'exAnim');
                explosionAnim.play('explode');
                explosionSound.play();
                
                //mettre les sprites loin quand il y a collision: REMPLACER CA PAR LE MENU OU UN SYSTEME DE POINTS
                playerShip.setPosition(1000,1000)
                playerShip.setVelocity(0,0);
            }
    }

    //********************************************************* */
    //ENDSCREEN ********************************************


    if (gameState === "endGame") { 

    }


    
}

//quand je touche un enemy avec mon missile
function collisionEnemyMissile(_enemy, _missile) {
    // explosion if I shoot an enemy with a missile
    let explosionAnim = this.add.sprite(_enemy.x, _enemy.y,'exAnim');
    explosionAnim.play('explode'); 
    explosionSound.play();
    
    if (gameState == "scrollGame") {
        _enemy.setPosition(this.cameras.main.scrollX + config.width + 20, Phaser.Math.Between(70, config.height - 70));
        _enemy.setVelocity(-enemySpeed,0);
    }
    else _enemy.setVisible = false;
    
    _missile.destroy();
}
    

//quand je me fais shooter avec une bullet
function collisionPlayerBullet(_playerShip, _bullet) {
    
    _bullet.destroy();
    explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y,'exAnim');
    explosionAnim.play('explode'); 
    
    explosionSound.play();

    //je déplace mon player mais on fera autre chose après
    _playerShip.setPosition(1000,1000)
    _playerShip.setVelocity(0,0);
}

function goundEnemyShootBullet() {
    let bullet = bullets.get();
        if (bullet) { //si on a encore des bullets

            bullet.setPosition(groundEnemy.x, groundEnemy.y);
            
            //pour faire aller les bullets vers le spaceship
            
            shootX = playerShip.x - bullet.x;
            shootY = playerShip.y - bullet.y;
            
            vectorLength = Math.sqrt(shootX*shootX + shootY*shootY); // le fois prendre moins de temps de calcul que l'exposant
            
            bullet.setVelocity(speedBulletMultiplier * shootX / vectorLength, speedBulletMultiplier * shootY / vectorLength); // shootx est egal a 1, c'est trop lent, d'ou le speed ratio
}
            
}

function collisionPlayerShipLayer (_playerShip,_layer){
    explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y,'exAnim');
    explosionAnim.play('explode');
    _playerShip.setVisible(false);
    //jouer le son de l'explosion
    explosionSound.play();
}

function collisionBossMissile (_boss, _missile) {
    _missile.destroy();
    //retirer une vie au boss for ex ou une petite explostion
}