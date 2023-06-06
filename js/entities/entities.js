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