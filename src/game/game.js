var game = {
    data: {
        score : 0,
        top_score: 0,
        total_score: 0,
        steps: 0,
        life: 5,
        start: false,
        newHiScore: false,
        muted: true
    },

    resources: [
        // images
        {name: "bg0", type:"image", src: "./../../data/img/bg.png"},
        {name: "bg", type:"image", src: "./../../data/img/robi_tamim_bg.png"},
        // {name: "clumsy", type:"image", src: "./../../data/img/clumsy.png"},
        {name: "clumsy", type:"image", src: "./../../data/img/football1_transparent.png"},
        {name: "character", type:"image", src: "./../../data/img/character_transparent.png"},
        {name: "character_big", type:"image", src: "./../../data/img/character_transparent_big.png"},
        {name: "character_front", type:"image", src: "./../../data/img/front_small.png"},
        {name: "character_side1", type:"image", src: "./../../data/img/side1_small.png"},
        {name: "character_side2", type:"image", src: "./../../data/img/side2_small.png"},
        {name: "pipe", type:"image", src: "./../../data/img/pipe.png"},
        {name: "robi_pack", type:"image", src: "./../../data/img/robi_pack.png"},
        {name: "logo", type:"image", src: "./../../data/img/logo.png"},
        {name: "ground", type:"image", src: "./../../data/img/ground.png"},
        {name: "gameover", type:"image", src: "./../../data/img/gameover.png"},
        {name: "gameoverbg", type:"image", src: "./../../data/img/gameoverbg.png"},
        {name: "hit", type:"image", src: "./../../data/img/hit.png"},
        {name: "getready", type:"image", src: "./../../data/img/getready.png"},
        {name: "new", type:"image", src: "./../../data/img/new.png"},
        {name: "share", type:"image", src: "./../../data/img/share.png"},
        {name: "tweet", type:"image", src: "./../../data/img/tweet.png"},
        // sounds
        {name: "theme", type: "audio", src: "./../../data/bgm/"},
        {name: "hit", type: "audio", src: "./../../data/sfx/"},
        {name: "lose", type: "audio", src: "./../../data/sfx/"},
        {name: "wing", type: "audio", src: "./../../data/sfx/"},

    ],

    "onload": function() {

        const sendGetRequest = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                game.data.life = response.data.life;
                game.data.total_score = response.data.total_score;
                game.data.top_score = response.data.top_score;
                me.save.topSteps = response.data.top_score;
            } catch (err) {
                console.error(err);
            }
        };
        
        sendGetRequest();

        if (!me.video.init(900, 600, {
            wrapper: "screen",
            scale : "auto",
            scaleMethod: "fit",
        })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
        me.audio.init("mp3,ogg");
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    "loaded": function() {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.set(me.state.GAME_END, new game.GameEnd());
        me.state.set(me.state.GAME_OVER, new game.GameOverScreen());
        // me.state.set(me.state.GAME_PAUSE, new game.GamePause());
        // me.state.set(me.state.GAME_PAUSE, new game.PauseScreen());

        // me.state.add(me.state.PLAY, new PlayState());
        // me.state.add(me.state.PAUSE, new PauseState());

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        me.input.bindKey(me.input.KEY.M, "mute", true);
        me.input.bindPointer(me.input.KEY.SPACE);

        me.pool.register("clumsy", game.BirdEntity);
        me.pool.register("character", game.CharacterEntity);
        me.pool.register("character_front", game.CharacterFrontEntity);
        me.pool.register("character_side1", game.CharacterSide1Entity);
        me.pool.register("character_side2", game.CharacterSide2Entity);
        me.pool.register("pipe", game.PipeEntity, true);
        me.pool.register("robi_pack", game.RobiPackEntity, true);
        me.pool.register("hit", game.HitEntity, true);
        me.pool.register("ground", game.Ground, true);

        me.state.change(me.state.MENU);
    }
};

var switchCharacter = 0;

// game.PauseModal = me.Renderable.extend({
//     init: function() {
//       this._super(me.Renderable, 'init', [0, 0, me.video.renderer.getWidth(), me.video.renderer.getHeight()]);
//     //   this._super(me.Renderable, 'init', [0, 0, 500, 500]);
//       this.isPersistent = true;
//       this.modalOpacity = 0.8;
//       this.z = Infinity;
//     },
  
//     draw: function(renderer) {
//       renderer.setColor('#000000');
//       renderer.fillRect(0, 0, this.width, this.height);
//       renderer.setOpacity(this.modalOpacity);
//     }
// });

// var pauseModal = new game.PauseModal();

game.BirdEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = 'clumsy';
        settings.width = 85;
        settings.height = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.maxAngleRotation = Number.prototype.degToRad(-30);
        this.maxAngleRotationDown = Number.prototype.degToRad(35);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Ellipse(5, 5, 71, 51));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        this.currentAngle = 0;
        this.angleTween = new me.Tween(this);
        this.angleTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.paused = false;

        this.gravityForce = 0.2;
    },

    update: function(dt) {
        // if(this.paused) return;
        var that = this;
        this.pos.x = 100;
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        
        this.renderable.currentTransform.identity();
        
        if (me.input.isKeyPressed('fly')) {
            switchCharacter = 1;
            me.audio.play('wing');
            this.gravityForce = 0.2;
            var currentPos = this.pos.y;

            this.angleTween.stop();
            this.flyTween.stop();

            // this.flyTween.to({y: currentPos - 72}, 50);
            this.flyTween.to({y: currentPos - 72}, 50);
            this.flyTween.start();

            this.angleTween.to({currentAngle: that.maxAngleRotation}, 50).onComplete(function(angle) {
                that.renderable.currentTransform.rotate(that.maxAngleRotation);
            })
            this.angleTween.start();
        }
        else {
            this.gravityForce += 0.2;
            this.pos.y += me.timer.tick * this.gravityForce;
            this.currentAngle += Number.prototype.degToRad(3);
            if (this.currentAngle >= this.maxAngleRotationDown) {
                this.renderable.currentTransform.identity();
                this.currentAngle = this.maxAngleRotationDown;
            }
        }
        
        this.renderable.currentTransform.rotate(this.currentAngle);
        me.Rect.prototype.updateBounds.apply(this);

        if(game.data.life <= 0){
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }

        var hitSky = -80; // bird height + 20px
        
        if (this.pos.y <= hitSky || this.collided) {

            const sendPatchRequest = async () => {
                try {
                    const response = await axios.patch('http://127.0.0.1:8000/api/players/1', 
                    {
                        score: game.data.steps,
                        life: game.data.life,
                        top_score: me.save.topSteps,
                        // top_score: game.data.top_score
                    });

                } catch (err) {
                    console.error(err);
                }
            };
            
            sendPatchRequest();

            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }

        if(this.paused) {
            // saved_game = me.game;
            // console.log(me.game.world);
            
            // console.log("collision with robi pack");
            // console.log(this.paused);
            
            // STATE_PAUSE
            // me.state.change(me.state.pause);
            // me.state.set(me.state.pause);

            // this.pauseGame();
            // alert("Game paused!");

            // var pauseModal = new PauseModal();
            // me.game.world.addChild(new game.RobiPackGenerator(), 0);

            // me.game.world.addChild(pauseModal);
            // pauseModal.modalOpacity = 0.8;
            // pauseModal.visible = true;
            // game.pause();
            this.showCollisionModal();

            if(this.paused) {
                this.paused = false;
            }
            // console.log(this.paused);
            // return;
        }
        
        me.collision.check(this);
        return true;
    },

    onCollision: function(response) {
        var obj = response.b;
        
        if (obj.type === 'pipe' || obj.type === 'ground') {
            me.device.vibrate(500);
            this.collided = true;
            game.data.life--;
        }
        else if (obj.type === 'robi_pack') {
            // console.log("collision with robi pack")
            me.device.vibrate(500);
            this.paused = true;
        }
        // remove the hit box
        if (obj.type === 'hit') {
            me.game.world.removeChildNow(obj);
            game.data.steps++;
            game.data.score++;
            me.audio.play('hit');
        }
    },

    endAnimation: function() {
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.pos.y;
        this.endTween = new me.Tween(this.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.currentTransform.identity();
        this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
        var finalPos = me.game.viewport.height - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER);
            });
        this.endTween.start();
    },

    endGame: function() {
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.pos.y;
        this.endTween = new me.Tween(this.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.currentTransform.identity();
        this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
        var finalPos = me.game.viewport.height - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_END);
            });
        this.endTween.start();
    },
    
    pauseGame: function() {
        // me.game.pause();
        if(this.paused) {
            this.paused = false;
        }
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.pos.y;
        this.endTween = new me.Tween(this.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.currentTransform.identity();
        this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
        var finalPos = me.game.viewport.height - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_PAUSE);
            });
        this.endTween.start();
    },

    showCollisionModal: function() {
        var modal = document.getElementById("myModal");
        modal.style.display = "block";
        // modal.dataset.backdrop = "static";
        // modal.dataset.keyboard = "false";

        this.paused = true;

        var closeButton = document.getElementsByClassName("close")[0];
        closeButton.onclick = function () {
            modal.style.display = "none";
            // overlay.style.display = "block";
            this.paused = false;
        }
    }

    // resumeGame: function() {
    //     if (this.paused) {
    //         this.paused = false;
            
    //         // Remove the pause modal from the game world
    //         me.game.world.removeChild(pauseModal);
            
    //         // Hide the pause modal
    //         pauseModal.visible = false;
            
    //         // Resume the game loop
    //         me.state.resume();
            
    //         // Hide additional UI elements or perform any other actions
            
    //     }
    // }
});

game.CharacterEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        // settings.image = 'character';
        // settings.image = 'character_big';
        settings.image = 'character_front';
        // settings.width = 85;
        // settings.width = 191;
        settings.width = 87;
        // settings.height = 120;
        // settings.height = 270;
        settings.height = 270;  
        
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.maxAngleRotation = Number.prototype.degToRad(-30);
        this.maxAngleRotationDown = Number.prototype.degToRad(35);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Ellipse(5, 5, 71, 51));

        // this.collided = false;

        // added from birdEntity

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        this.currentAngle = 0;
        this.angleTween = new me.Tween(this);
        this.angleTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.gravityForce = 0.2;
    },

    update: function(dt) {
        // if(this.paused) return;
        var that = this;
        this.pos.x = 10;
        // this.pos.x = -30;
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }

        this.renderable.currentTransform.identity();
        if(switchCharacter == 1) {
            // var settings = {};
            // settings.image = 'character_side1';
            // settings.width = 87;
            // settings.height = 270;
            // this._super(me.Entity, 'init', [10, me.game.viewport.height/2 + 100, settings]);
            this.character = null;
            this.character = me.pool.pull("character", 120, me.game.viewport.height/2 + 100);
            this.character_side1 = me.pool.pull("character_side1", 120, me.game.viewport.height/2 + 100);
            
            // me.game.world.removeChild(this);
            // me.game.world.addChild(this.character_side1, 11);

            // this.character = me.pool.pull("character_side2", 10, me.game.viewport.height/2 + 100);

            switchCharacter = 0;
        }

        // if (me.input.isKeyPressed('fly')) {
        //     me.audio.play('wing');
        //     this.gravityForce = 0.2;
        //     var currentPos = this.pos.y;

        //     this.angleTween.stop();
        //     this.flyTween.stop();

        //     this.flyTween.to({y: currentPos - 72}, 50);
        //     this.flyTween.start();

        //     this.angleTween.to({currentAngle: that.maxAngleRotation}, 50).onComplete(function(angle) {
        //         that.renderable.currentTransform.rotate(that.maxAngleRotation);
        //     })
        //     this.angleTween.start();
        // } else {
            // this.gravityForce += 0.2;
            // this.pos.y += me.timer.tick * this.gravityForce;
            // this.currentAngle += Number.prototype.degToRad(3);
            // if (this.currentAngle >= this.maxAngleRotationDown) {
            //     this.renderable.currentTransform.identity();
            //     this.currentAngle = this.maxAngleRotationDown;
            // }
        // }

        this.renderable.currentTransform.rotate(this.currentAngle);
        me.Rect.prototype.updateBounds.apply(this);

        return true;
    },

});

game.CharacterSide1Entity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = 'character_side1';
        settings.width = 87;
        settings.height = 270;  
        
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.maxAngleRotation = Number.prototype.degToRad(-30);
        this.maxAngleRotationDown = Number.prototype.degToRad(35);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Ellipse(5, 5, 71, 51));

        // this.collided = false;

        // added from birdEntity

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        this.currentAngle = 0;
        this.angleTween = new me.Tween(this);
        this.angleTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.gravityForce = 0.2;
    },

    update: function(dt) {
        var that = this;
        this.pos.x = 10;
        // this.pos.x = -30;
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }

        this.renderable.currentTransform.identity();
        if(switchCharacter == 1) {
            
            var settings = {};
            settings.image = 'character_side1';
            settings.width = 87;
            settings.height = 270;
            // this.character = null;
            // this._super(me.Entity, 'init', [10, me.game.viewport.height/2 + 100, settings]);
            // this.character = me.pool.pull("character_side1", 120, me.game.viewport.height/2 + 100);
            // me.game.world.addChild(this.character, 11);

            // this.character = me.pool.pull("character_side2", 10, me.game.viewport.height/2 + 100);

            switchCharacter = 0;
        }

        if (me.input.isKeyPressed('fly')) {
            me.audio.play('wing');
            this.gravityForce = 0.2;
            var currentPos = this.pos.y;

            this.angleTween.stop();
            this.flyTween.stop();

            this.flyTween.to({y: currentPos - 72}, 50);
            this.flyTween.start();

            this.angleTween.to({currentAngle: that.maxAngleRotation}, 50).onComplete(function(angle) {
                that.renderable.currentTransform.rotate(that.maxAngleRotation);
            })
            this.angleTween.start();
        } else {
            // this.gravityForce += 0.2;
            // this.pos.y += me.timer.tick * this.gravityForce;
            // this.currentAngle += Number.prototype.degToRad(3);
            // if (this.currentAngle >= this.maxAngleRotationDown) {
            //     this.renderable.currentTransform.identity();
            //     this.currentAngle = this.maxAngleRotationDown;
            // }
        }

        this.renderable.currentTransform.rotate(this.currentAngle);
        me.Rect.prototype.updateBounds.apply(this);

        return true;
    },

});

game.PipeEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height= 1664;
        settings.framewidth = 148;
        settings.frameheight = 1664;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'pipe';
    },

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        me.Rect.prototype.updateBounds.apply(this);
        this._super(me.Entity, 'update', [dt]);
        return true;
    },

});

game.PipeGenerator = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, me.game.viewport.width, me.game.viewport.height, 92]);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = 1240;
        this.posX = me.game.viewport.width;
    },

    update: function(dt) {
        if (this.generate++ % this.pipeFrequency == 0) {
            var posY = Number.prototype.random(me.video.renderer.getHeight() - 100, 200);
            var posY2 = posY - me.game.viewport.height - this.pipeHoleSize;
            var pipe1 = new me.pool.pull('pipe', this.posX, posY);
            var pipe2 = new me.pool.pull('pipe', this.posX, posY2);
            var hitPos = posY - 100;
            var hit = new me.pool.pull("hit", this.posX, hitPos);
            pipe1.renderable.currentTransform.scaleY(-1);
            me.game.world.addChild(pipe1, 10);
            me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);
        }
        this._super(me.Entity, "update", [dt]);
    },

});

game.RobiPackEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('robi_pack');
        settings.width = 50;
        settings.height = 72;
        settings.framewidth = 50;
        settings.frameheight = 72;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'robi_pack';
    },

    update: function(dt) {
        if(!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if(this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        me.Rect.prototype.updateBounds.apply(this);
        this._super(me.Entity, 'update', [dt]);
        return true;
    },
})

game.RobiPackGenerator = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, me.game.viewport.width, me.game.viewport.height, 92]);
        this.alwaysUpdate = true;
        this.generate = 0;
        // this.robiPackFrequency = 92*Number.prototype.random(1, 4);
        this.robiPackFrequency = 92;
        this.robiPackHoleSize = 1240;
        this.posX = me.game.viewport.width + 250;
    },

    update: function(dt) {
        if(this.generate++ % this.robiPackFrequency == 0) {
            var posY = Number.prototype.random(me.video.renderer.getHeight() - 200, 50);
            var posY2 = posY - me.game.viewport.height - this.robiPackHoleSize;
            var robi_pack = new me.pool.pull('robi_pack', this.posX, posY);
            var hitPos = posY - 100;   
            // console.log(hitPos); 
            var hit = new me.pool.pull("hit", this.posX, hitPos);
            robi_pack.renderable.currentTransform.scaleY(-1);
            me.game.world.addChild(robi_pack, 10);
            // me.game.world.addChild(robi_pack2, 10);
            me.game.world.addChild(hit, 11);
        }
        this._super(me.Entity, "update", [dt]);
    },
})

game.HitEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.framewidth = 148;
        settings.frameheight = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.updateTime = false;
        this.renderable.alpha = 0;
        this.body.accel.set(-5, 0);
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Rect(0, 0, settings.width - 30, settings.height - 30));
        this.type = 'hit';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.accel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        me.Rect.prototype.updateBounds.apply(this);
        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

game.Ground = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 96;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.type = 'ground';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.renderable.width) {
            this.pos.x = me.video.renderer.getWidth() - 10;
        }
        me.Rect.prototype.updateBounds.apply(this);
        return this._super(me.Entity, 'update', [dt]);
    },

});

game.HUD = game.HUD || {};

game.HUD.Container = me.Container.extend({
    init: function() {
        this._super(me.Container, 'init');
        // persistent across level change
        this.isPersistent = true;

        // non collidable
        this.collidable = false;

        // make sure our object is always draw first
        this.z = Infinity;

        // give a name
        this.name = "HUD";

        // add our child score object at the top left corner
        this.addChild(new game.HUD.ScoreItem(5, 5));
    }
});

game.HUD.ScoreItem = me.Renderable.extend({
    init: function(x, y) {
        this._super(me.Renderable, "init", [x, y, 10, 10]);

        // local copy of the global score
        // this.stepsFont = new me.Font('gamefont', 80, '#000', 'center');

        this.font = new me.Font('gamefont', 40, 'red', 'left');
        this.steps = 'Steps: ' + game.data.steps.toString();
        this.score = 'Score: ' + game.data.score.toString();
        this.life= 'Life: ' + game.data.life.toString();

        // make sure we use screen coordinates
        this.floating = true;
    },

    draw: function (renderer) {
        if (game.data.start && me.state.isCurrent(me.state.PLAY)) {
            
            this.font.draw(renderer, 'Life: ' + game.data.life.toString(), me.game.viewport.width/2 - 200, 10);
            this.font.draw(renderer, 'Score: ' + game.data.steps.toString(), me.game.viewport.width/2 + 50, 10);
            // this.font.draw(renderer, 'Score: ' + game.data.score.toString(), me.game.viewport.width/2 + 50, 10);
        }

        // if (game.data.start && me.state.isCurrent(me.state.PLAY))
        //     this.stepsFont.draw(renderer, game.data.steps, me.game.viewport.width/2, 10);

    }

});

var BackgroundLayer = me.ImageLayer.extend({
    init: function(image, z, speed) {
        var settings = {};
        settings.name = image;
        settings.width = 900;
        settings.height = 600;
        settings.image = image;
        settings.z = z;
        settings.ratio = 1;
        // call parent constructor
        this._super(me.ImageLayer, 'init', [0, 0, settings]);
    },

    update: function() {
        if (me.input.isKeyPressed('mute')) {
            game.data.muted = !game.data.muted;
            if (game.data.muted){
                me.audio.disable();
            }else{
                me.audio.enable();
            }
        }

        // if(me.input.isKeyPressed('fly')) {
        //     var settings = {};
        //     settings.name = 'bg0';
        //     settings.width = 900;
        //     settings.height = 600;
        //     settings.image = image;
        //     settings.z = z;
        //     settings.ratio = 1;
        // }

        return true;
    }
});

game.TitleScreen = me.ScreenObject.extend({
    init: function(){
        this._super(me.ScreenObject, 'init');
        this.font = null;
        this.ground1 = null;
        this.ground2 = null;
        this.logo = null;
    },

    onResetEvent: function() {
        me.audio.stop("theme");
        game.data.newHiScore = false;

        me.game.world.addChild(new BackgroundLayer('bg', 1));
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", true);
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        const sendGetRequest = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                game.data.life = response.data.life;
            } catch (err) {
                console.error(err);
            }
        };
        
        sendGetRequest();

        this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
            if (action === "enter") {
                if(game.data.life <= 0) {
                    me.state.change(me.state.GAME_END);
                }
                else {
                    me.state.change(me.state.PLAY);
                }
            }
        });

        //logo
        this.logo = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 20,
            {image: 'logo'}
        );
        me.game.world.addChild(this.logo, 10);

        var that = this;
        var logoTween = me.pool.pull("me.Tween", this.logo.pos)
            .to({y: me.game.viewport.height/2 - 100}, 1000)
            .easing(me.Tween.Easing.Exponential.InOut).start();

        this.ground1 = me.pool.pull("ground", 0, me.video.renderer.getHeight() - 96);
        this.ground2 = me.pool.pull("ground", me.video.renderer.getWidth(),
                                    me.video.renderer.getHeight() - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        me.game.world.addChild(new (me.Renderable.extend ({
            // constructor
            init: function() {
                // size does not matter, it's just to avoid having a zero size
                // renderable
                this._super(me.Renderable, 'init', [0, 0, 100, 100]);
                this.text = me.device.touch ? '\t\t\t\t\t\t\t\t\t\t\t\t\t\tRed.Digital Limited\nTap to start' : 'PRESS SPACE OR CLICK LEFT MOUSE BUTTON OR TOUCHPAD TO START \n\t\t\t\t\t\t\t\t\t\t\t\t\t\tPRESS "M" TO MUTE SOUND';
                this.font = new me.Font('gamefont', 20, '#000');
            },
            draw: function (renderer) {
                var measure = this.font.measureText(renderer, this.text);
                var xpos = me.game.viewport.width/2 - measure.width/2;
                var ypos = me.game.viewport.height/2 + 50;
                this.font.draw(renderer, this.text, xpos, ypos);
            }
        })), 12);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        me.game.world.removeChild(this.logo);
        this.logo = null;
    }
});

game.PlayScreen = me.ScreenObject.extend({
    init: function() {
        this.paused = false; // Flag to track game pause state
        this.pauseModalShown = false; // Flag to track whether the pause modal is shown

        // Bind the pause key
        me.input.bindKey(me.input.KEY.P, "pause");

        me.audio.play("theme", true);
        // lower audio volume on firefox browser
        var vol = me.device.ua.indexOf("Firefox") !== -1 ? 0.3 : 0.5;
        me.audio.setVolume(vol);
        this._super(me.ScreenObject, 'init');
    },

    update: function() {
        if (me.input.isKeyPressed("pause") && !this.pauseModalShown) {
            this.togglePause();
        }

        if (this.paused) {
            return true;
        }

        return true;
    },

    togglePause: function() {
        if (this.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    },

    pauseGame: function() {
        this.paused = true;
        this.pauseModalShown = true;

        me.timer.pause();
    },

    resumeGame: function() {
        this.paused = false;
        this.pauseModalShown = false;

        me.timer.resume();
    },

    onResetEvent: function() {
        // if(this.paused) return;
        me.game.reset();
        me.audio.stop("theme");
        if (!game.data.muted){
            me.audio.play("theme", true);
        }

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);

        const sendGetRequest = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                game.data.life = response.data.life;
            } catch (err) {
                console.error(err);
            }
        };
        
        sendGetRequest();

        game.data.score = 0;
        game.data.steps = 0;
        game.data.start = false;
        game.data.newHiscore = false;

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width, me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD, 11);

        this.bird = me.pool.pull("clumsy", 60, me.game.viewport.height/2 - 100);
        me.game.world.addChild(this.bird, 10);

        if(switchCharacter == 0) {
            this.character = me.pool.pull("character", 120, me.game.viewport.height/2 + 100);
            // me.game.world.removeChild(this.character_side1);
            me.game.world.addChild(this.character, 11);
        }

        if(switchCharacter == 1) {
            this.character_side1 = me.pool.pull("character_side1", 120, me.game.viewport.height/2 + 100);
            // this.character = me.pool.pull("character_side1", 120, me.game.viewport.height/2 + 100);
            me.game.world.addChild(this.character_side1, 11);
            // me.game.world.addChild(this.character, 11);
        }

        //inputs
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.SPACE);

        this.getReady = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'getready'}
        );
        me.game.world.addChild(this.getReady, 11);

        var that = this;
        var fadeOut = new me.Tween(this.getReady).to({alpha: 0}, 2000)
            .easing(me.Tween.Easing.Linear.None)
            .onComplete(function() {
                game.data.start = true;
                me.game.world.addChild(new game.PipeGenerator(), 0);
                me.game.world.addChild(new game.RobiPackGenerator(), 0);
                me.game.world.removeChild(that.getReady);
            }).start();
    },

    onDestroyEvent: function() {
        me.audio.stopTrack('theme');
        // free the stored instance
        this.HUD = null;
        this.bird = null;
        this.character = null;
        this.ground1 = null;
        this.ground2 = null;
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);

        // Unbind the pause key
        me.input.unbindKey(me.input.KEY.P);
    }
});

game.GameOverScreen = me.ScreenObject.extend({
    init: function() {
        this.savedData = null;
        this.handler = null;
    },

    onResetEvent: function() {
        //save section
        this.savedData = {
            score: game.data.score,
            steps: game.data.steps,
            life: game.data.life
            // topSteps: game.data.topSteps
        };
        me.save.add(this.savedData);

        // if (!me.save.topSteps) me.save.add({topSteps: game.data.steps});
        if (game.data.steps > me.save.topSteps) {
            me.save.topSteps = game.data.steps;
            game.data.newHiScore = true;
        }

        const sendPatchRequest = async () => {
            try {
                const response = await axios.patch('http://127.0.0.1:8000/api/players/1', 
                {
                    top_score: me.save.topSteps,
                    life: game.data.life
                });

            } catch (err) {
                console.error(err);
            }
        };
        
        sendPatchRequest();

        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", false)
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter") {
                    me.state.change(me.state.MENU);
                }
            });

        me.game.world.addChild(new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 100,
            {image: 'gameover'}
        ), 12);

        var gameOverBG = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'gameoverbg'}
        );
        me.game.world.addChild(gameOverBG, 10);

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        // ground
        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width,
            me.video.renderer.getHeight() - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        // add the dialog with the game information
        if (game.data.newHiScore) {
            var newRect = new me.Sprite(
                gameOverBG.width/2,
                gameOverBG.height/2,
                {image: 'new'}
            );
            me.game.world.addChild(newRect, 12);
        }

        this.dialog = new (me.Renderable.extend({
            // constructor
            init: function() {
                this._super(me.Renderable, 'init',
                    [0, 0, me.game.viewport.width/2, me.game.viewport.height/2]
                );
                this.font = new me.Font('gamefont', 40, 'black', 'left');

                const sendGetRequest = async () => {
                    try {
                        const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                        game.data.score = response.data.score;
                        game.data.life = response.data.life;
                    } catch (err) {
                        console.error(err);
                    }
                };
                
                sendGetRequest();

                this.steps = 'Score: ' + game.data.steps.toString();
                this.topSteps= 'Highest Score: ' + me.save.topSteps.toString();
                this.life= 'Life: ' + game.data.life.toString();
            },

            draw: function (renderer) {
                var stepsText = this.font.measureText(renderer, this.steps);
                var topStepsText = this.font.measureText(renderer, this.topSteps);
                var scoreText = this.font.measureText(renderer, this.score);
                var lifeText = this.font.measureText(renderer, this.life);

                //steps
                this.font.draw(
                    renderer,
                    this.steps,
                    me.game.viewport.width/2 - stepsText.width/2 - 60,
                    me.game.viewport.height/2
                );

                //top score
                this.font.draw(
                    renderer,
                    this.topSteps,
                    me.game.viewport.width/2 - stepsText.width/2 - 60,
                    me.game.viewport.height/2 + 50
                );
                
                //Remaining lives
                this.font.draw(
                    renderer,
                    this.life,
                    me.game.viewport.width/2 - stepsText.width/2 - 60,
                    me.game.viewport.height/2 + 100
                );
            }
        }));
        me.game.world.addChild(this.dialog, 12);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.font = null;
        me.audio.stop("theme");
    }
});

game.GameEnd = me.ScreenObject.extend({
    init: function() {
        this.savedData = null;
        this.handler = null;
    },

    onResetEvent: function() {
        //save section
        this.savedData = {
            score: game.data.score,
            steps: game.data.steps,
            life: game.data.life
            // topSteps: game.data.topSteps
        };
        me.save.add(this.savedData);

        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", false)
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter") {
                    me.state.change(me.state.MENU);
                }
            });

        me.game.world.addChild(new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 100,
            {image: 'gameover'}
        ), 12);

        var gameOverBG = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'gameoverbg'}
        );
        me.game.world.addChild(gameOverBG, 10);

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        // ground
        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width,
            me.video.renderer.getHeight() - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        // add the dialog with the game information
        if (game.data.newHiScore) {
            var newRect = new me.Sprite(
                gameOverBG.width/2,
                gameOverBG.height/2,
                {image: 'new'}
            );
            me.game.world.addChild(newRect, 12);
        }

        this.dialog = new (me.Renderable.extend({
            // constructor
            init: function() {
                this._super(me.Renderable, 'init',
                    [0, 0, me.game.viewport.width/2, me.game.viewport.height/2]
                );
                this.font = new me.Font('gamefont', 40, 'black', 'left');

                const sendGetRequest = async () => {
                    try {
                        const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                        game.data.score = response.data.score;
                        game.data.life = response.data.life;
                    } catch (err) {
                        console.error(err);
                    }
                };
                
                sendGetRequest();

                this.steps = 'Score: ' + game.data.steps.toString();
                this.topSteps= 'Highest Score: ' + me.save.topSteps.toString();
                this.life= 'You have no lives Left!';
            },

            draw: function (renderer) {
                var stepsText = this.font.measureText(renderer, this.steps);
                var topStepsText = this.font.measureText(renderer, this.topSteps);
                var scoreText = this.font.measureText(renderer, this.score);
                var lifeText = this.font.measureText(renderer, this.life);

                //steps
                this.font.draw(
                    renderer,
                    this.steps,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2
                );

                //top score
                this.font.draw(
                    renderer,
                    this.topSteps,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2 + 50
                );
                
                //Remaining lives
                this.font.draw(
                    renderer,
                    this.life,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2 + 100
                );
            }
        }));
        me.game.world.addChild(this.dialog, 12);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.font = null;
        me.audio.stop("theme");
    }
});

game.GamePause = me.ScreenObject.extend({
    init: function() {
        this.savedData = null;
        this.handler = null;
    },

    onResetEvent: function() {
        //save section
        this.savedData = {
            score: game.data.score,
            steps: game.data.steps,
            life: game.data.life
            // topSteps: game.data.topSteps
        };
        me.save.add(this.savedData);

        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", false)
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter") {
                    me.state.change(me.state.MENU);
                }
            });

        me.game.world.addChild(new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 100,
            {image: 'gameover'}
        ), 12);

        var gameOverBG = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'gameoverbg'}
        );
        me.game.world.addChild(gameOverBG, 10);

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        // ground
        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width,
            me.video.renderer.getHeight() - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        // add the dialog with the game information
        if (game.data.newHiScore) {
            var newRect = new me.Sprite(
                gameOverBG.width/2,
                gameOverBG.height/2,
                {image: 'new'}
            );
            me.game.world.addChild(newRect, 12);
        }

        this.dialog = new (me.Renderable.extend({
            // constructor
            init: function() {
                this._super(me.Renderable, 'init',
                    [0, 0, me.game.viewport.width/2, me.game.viewport.height/2]
                );
                this.font = new me.Font('gamefont', 40, 'black', 'left');

                const sendGetRequest = async () => {
                    try {
                        const response = await axios.get('http://127.0.0.1:8000/api/players/1');
                        game.data.score = response.data.score;
                        game.data.life = response.data.life;
                    } catch (err) {
                        console.error(err);
                    }
                };
                
                sendGetRequest();

                this.steps = 'Game Pause: ' + game.data.steps.toString();
                this.topSteps= 'Highest Score: ' + me.save.topSteps.toString();
                this.life= 'You have no lives Left!';
            },

            draw: function (renderer) {
                var stepsText = this.font.measureText(renderer, this.steps);
                var topStepsText = this.font.measureText(renderer, this.topSteps);
                var scoreText = this.font.measureText(renderer, this.score);
                var lifeText = this.font.measureText(renderer, this.life);

                //steps
                this.font.draw(
                    renderer,
                    this.steps,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2
                );

                //top score
                this.font.draw(
                    renderer,
                    this.topSteps,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2 + 50
                );
                
                //Remaining lives
                this.font.draw(
                    renderer,
                    this.life,
                    me.game.viewport.width/2 - stepsText.width/2 - 140,
                    me.game.viewport.height/2 + 100
                );
            }
        }));
        me.game.world.addChild(this.dialog, 12);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.font = null;
        me.audio.stop("theme");
    }
});

// game.PauseScreen = me.ScreenObject.extend({
    // init: function() {
    //     this.handler = null;
    // },
    // onResetEvent: function() {
    //     me.input.bindKey(me.input.KEY.ENTER, "enter", true);
    //     me.input.bindKey(me.input.KEY.SPACE, "enter", false)
    //     me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

    //     this.handler = me.event.subscribe(me.event.KEYDOWN,
    //         function (action, keyCode, edge) {
    //             if (action === "enter") {
    //                 me.state.change(me.state.MENU);
    //             }
    //         });

    //     var gameOverBG = new me.Sprite(
    //         me.game.viewport.width/2,
    //         me.game.viewport.height/2,
    //         {image: 'gameoverbg'}
    //     );
    //     me.game.world.addChild(gameOverBG, 10);

    //     me.game.world.addChild(new BackgroundLayer('bg', 1));

    //     // ground
    //     this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
    //     this.ground2 = me.pool.pull('ground', me.game.viewport.width,
    //         me.video.renderer.getHeight() - 96);
    //     me.game.world.addChild(this.ground1, 11);
    //     me.game.world.addChild(this.ground2, 11);

    //     this.dialog = new (me.Renderable.extend({
    //         // constructor
    //         init: function() {
    //             this._super(me.Renderable, 'init',
    //                 [0, 0, me.game.viewport.width/2, me.game.viewport.height/2]
    //             );
    //             this.font = new me.Font('gamefont', 40, 'black', 'left');

    //             this.gamePause = 'Game Paused';
    //         },

    //         draw: function (renderer) {
    //             var gamePauseText = this.font.measureText(renderer, this.gamePause);

    //             this.font.draw(
    //                 renderer,
    //                 this.gamePause,
    //                 me.game.viewport.width/2 - gamePauseText.width/2 - 60,
    //                 me.game.viewport.height/2
    //             );
    //         }
    //     }));
    //     me.game.world.addChild(this.dialog, 12);
    // },

    // onDestroyEvent: function() {
    //     // unregister the event
    //     me.event.unsubscribe(this.handler);
    //     me.input.unbindKey(me.input.KEY.ENTER);
    //     me.input.unbindKey(me.input.KEY.SPACE);
    //     me.input.unbindPointer(me.input.pointer.LEFT);
    //     this.ground1 = null;
    //     this.ground2 = null;
    //     this.font = null;
    //     me.audio.stop("theme");
    // }
// });