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
            // width: "100%",
            // height: "100%",
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