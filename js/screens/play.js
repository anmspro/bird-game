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