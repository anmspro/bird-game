var game={data:{score:0,top_score:0,total_score:0,steps:0,life:5,start:!1,newHiScore:!1,muted:!0},resources:[{name:"bg0",type:"image",src:"./../../data/img/bg.png"},{name:"bg",type:"image",src:"./../../data/img/robi_tamim_bg.png"},{name:"clumsy",type:"image",src:"./../../data/img/football1_transparent.png"},{name:"character",type:"image",src:"./../../data/img/character_transparent.png"},{name:"character_big",type:"image",src:"./../../data/img/character_transparent_big.png"},{name:"character_front",type:"image",src:"./../../data/img/front_small.png"},{name:"character_side1",type:"image",src:"./../../data/img/side1_small.png"},{name:"character_side2",type:"image",src:"./../../data/img/side2_small.png"},{name:"pipe",type:"image",src:"./../../data/img/pipe.png"},{name:"robi_pack",type:"image",src:"./../../data/img/robi_pack.png"},{name:"logo",type:"image",src:"./../../data/img/logo.png"},{name:"ground",type:"image",src:"./../../data/img/ground.png"},{name:"gameover",type:"image",src:"./../../data/img/gameover.png"},{name:"gameoverbg",type:"image",src:"./../../data/img/gameoverbg.png"},{name:"hit",type:"image",src:"./../../data/img/hit.png"},{name:"getready",type:"image",src:"./../../data/img/getready.png"},{name:"new",type:"image",src:"./../../data/img/new.png"},{name:"share",type:"image",src:"./../../data/img/share.png"},{name:"tweet",type:"image",src:"./../../data/img/tweet.png"},{name:"theme",type:"audio",src:"./../../data/bgm/"},{name:"hit",type:"audio",src:"./../../data/sfx/"},{name:"lose",type:"audio",src:"./../../data/sfx/"},{name:"wing",type:"audio",src:"./../../data/sfx/"}],onload:function(){(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.life=e.data.life,game.data.total_score=e.data.total_score,game.data.top_score=e.data.top_score,me.save.topSteps=e.data.top_score}catch(e){console.error(e)}})(),me.video.init(900,600,{wrapper:"screen",scale:"auto",scaleMethod:"fit"})?(me.audio.init("mp3,ogg"),me.loader.preload(game.resources,this.loaded.bind(this))):alert("Your browser does not support HTML5 canvas.")},loaded:function(){me.state.set(me.state.MENU,new game.TitleScreen),me.state.set(me.state.PLAY,new game.PlayScreen),me.state.set(me.state.GAME_END,new game.GameEnd),me.state.set(me.state.GAME_OVER,new game.GameOverScreen),me.input.bindKey(me.input.KEY.SPACE,"fly",!0),me.input.bindKey(me.input.KEY.M,"mute",!0),me.input.bindPointer(me.input.KEY.SPACE),me.pool.register("clumsy",game.BirdEntity),me.pool.register("character",game.CharacterEntity),me.pool.register("character_front",game.CharacterFrontEntity),me.pool.register("character_side1",game.CharacterSide1Entity),me.pool.register("character_side2",game.CharacterSide2Entity),me.pool.register("pipe",game.PipeEntity,!0),me.pool.register("robi_pack",game.RobiPackEntity,!0),me.pool.register("hit",game.HitEntity,!0),me.pool.register("ground",game.Ground,!0),me.state.change(me.state.MENU)}},switchCharacter=0;game.BirdEntity=me.Entity.extend({init:function(e,t){var i={image:"clumsy",width:85,height:60};this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=.2,this.maxAngleRotation=Number.prototype.degToRad(-30),this.maxAngleRotationDown=Number.prototype.degToRad(35),this.renderable.addAnimation("flying",[0,1,2]),this.renderable.addAnimation("idle",[0]),this.renderable.setCurrentAnimation("flying"),this.renderable.anchorPoint=new me.Vector2d(.1,.5),this.body.removeShapeAt(0),this.body.addShape(new me.Ellipse(5,5,71,51)),this.flyTween=new me.Tween(this.pos),this.flyTween.easing(me.Tween.Easing.Exponential.InOut),this.currentAngle=0,this.angleTween=new me.Tween(this),this.angleTween.easing(me.Tween.Easing.Exponential.InOut),this.endTween=null,this.collided=!1,this.paused=!1,this.gravityForce=.2},update:function(e){var t=this;if(this.pos.x=100,!game.data.start)return this._super(me.Entity,"update",[e]);if(this.renderable.currentTransform.identity(),me.input.isKeyPressed("fly")){switchCharacter=1,me.audio.play("wing"),this.gravityForce=.2;var i=this.pos.y;this.angleTween.stop(),this.flyTween.stop(),this.flyTween.to({y:i-72},50),this.flyTween.start(),this.angleTween.to({currentAngle:t.maxAngleRotation},50).onComplete(function(e){t.renderable.currentTransform.rotate(t.maxAngleRotation)}),this.angleTween.start()}else this.gravityForce+=.2,this.pos.y+=me.timer.tick*this.gravityForce,this.currentAngle+=Number.prototype.degToRad(3),this.currentAngle>=this.maxAngleRotationDown&&(this.renderable.currentTransform.identity(),this.currentAngle=this.maxAngleRotationDown);if(this.renderable.currentTransform.rotate(this.currentAngle),me.Rect.prototype.updateBounds.apply(this),game.data.life<=0)return game.data.start=!1,me.audio.play("lose"),this.endAnimation(),!1;if(this.pos.y<=-80||this.collided){return(async()=>{try{await axios.patch("http://127.0.0.1:8000/api/players/1",{score:game.data.steps,life:game.data.life,top_score:me.save.topSteps})}catch(e){console.error(e)}})(),game.data.start=!1,me.audio.play("lose"),this.endAnimation(),!1}return this.paused&&(this.showCollisionModal(),this.paused&&(this.paused=!1)),me.collision.check(this),!0},onCollision:function(e){var t=e.b;"pipe"===t.type||"ground"===t.type?(me.device.vibrate(500),this.collided=!0,game.data.life--):"robi_pack"===t.type&&(me.device.vibrate(500),this.paused=!0),"hit"===t.type&&(me.game.world.removeChildNow(t),game.data.steps++,game.data.score++,me.audio.play("hit"))},endAnimation:function(){me.game.viewport.fadeOut("#fff",100);var e=this.pos.y;this.endTween=new me.Tween(this.pos),this.endTween.easing(me.Tween.Easing.Exponential.InOut),this.flyTween.stop(),this.renderable.currentTransform.identity(),this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));var t=me.game.viewport.height-this.renderable.width/2-96;this.endTween.to({y:e},1e3).to({y:t},1e3).onComplete(function(){me.state.change(me.state.GAME_OVER)}),this.endTween.start()},endGame:function(){me.game.viewport.fadeOut("#fff",100);var e=this.pos.y;this.endTween=new me.Tween(this.pos),this.endTween.easing(me.Tween.Easing.Exponential.InOut),this.flyTween.stop(),this.renderable.currentTransform.identity(),this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));var t=me.game.viewport.height-this.renderable.width/2-96;this.endTween.to({y:e},1e3).to({y:t},1e3).onComplete(function(){me.state.change(me.state.GAME_END)}),this.endTween.start()},pauseGame:function(){this.paused&&(this.paused=!1),me.game.viewport.fadeOut("#fff",100);var e=this.pos.y;this.endTween=new me.Tween(this.pos),this.endTween.easing(me.Tween.Easing.Exponential.InOut),this.flyTween.stop(),this.renderable.currentTransform.identity(),this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));var t=me.game.viewport.height-this.renderable.width/2-96;this.endTween.to({y:e},1e3).to({y:t},1e3).onComplete(function(){me.state.change(me.state.GAME_PAUSE)}),this.endTween.start()},showCollisionModal:function(){var e=document.getElementById("myModal");e.style.display="block",this.paused=!0,document.getElementsByClassName("close")[0].onclick=function(){e.style.display="none",this.paused=!1}}}),game.CharacterEntity=me.Entity.extend({init:function(e,t){var i={image:"character_front",width:87,height:270};this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=.2,this.maxAngleRotation=Number.prototype.degToRad(-30),this.maxAngleRotationDown=Number.prototype.degToRad(35),this.renderable.addAnimation("flying",[0,1,2]),this.renderable.addAnimation("idle",[0]),this.renderable.setCurrentAnimation("flying"),this.renderable.anchorPoint=new me.Vector2d(.1,.5),this.body.removeShapeAt(0),this.body.addShape(new me.Ellipse(5,5,71,51)),this.flyTween=new me.Tween(this.pos),this.flyTween.easing(me.Tween.Easing.Exponential.InOut),this.currentAngle=0,this.angleTween=new me.Tween(this),this.angleTween.easing(me.Tween.Easing.Exponential.InOut),this.endTween=null,this.collided=!1,this.gravityForce=.2},update:function(e){return this.pos.x=10,game.data.start?(this.renderable.currentTransform.identity(),1==switchCharacter&&(this.character=null,this.character=me.pool.pull("character",120,me.game.viewport.height/2+100),this.character_side1=me.pool.pull("character_side1",120,me.game.viewport.height/2+100),switchCharacter=0),this.renderable.currentTransform.rotate(this.currentAngle),me.Rect.prototype.updateBounds.apply(this),!0):this._super(me.Entity,"update",[e])}}),game.CharacterSide1Entity=me.Entity.extend({init:function(e,t){var i={image:"character_side1",width:87,height:270};this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=.2,this.maxAngleRotation=Number.prototype.degToRad(-30),this.maxAngleRotationDown=Number.prototype.degToRad(35),this.renderable.addAnimation("flying",[0,1,2]),this.renderable.addAnimation("idle",[0]),this.renderable.setCurrentAnimation("flying"),this.renderable.anchorPoint=new me.Vector2d(.1,.5),this.body.removeShapeAt(0),this.body.addShape(new me.Ellipse(5,5,71,51)),this.flyTween=new me.Tween(this.pos),this.flyTween.easing(me.Tween.Easing.Exponential.InOut),this.currentAngle=0,this.angleTween=new me.Tween(this),this.angleTween.easing(me.Tween.Easing.Exponential.InOut),this.endTween=null,this.collided=!1,this.gravityForce=.2},update:function(e){var t=this;if(this.pos.x=10,!game.data.start)return this._super(me.Entity,"update",[e]);if(this.renderable.currentTransform.identity(),1==switchCharacter){switchCharacter=0}if(me.input.isKeyPressed("fly")){me.audio.play("wing"),this.gravityForce=.2;var i=this.pos.y;this.angleTween.stop(),this.flyTween.stop(),this.flyTween.to({y:i-72},50),this.flyTween.start(),this.angleTween.to({currentAngle:t.maxAngleRotation},50).onComplete(function(e){t.renderable.currentTransform.rotate(t.maxAngleRotation)}),this.angleTween.start()}return this.renderable.currentTransform.rotate(this.currentAngle),me.Rect.prototype.updateBounds.apply(this),!0}}),game.PipeEntity=me.Entity.extend({init:function(e,t){var i={};i.image=this.image=me.loader.getImage("pipe"),i.width=148,i.height=1664,i.framewidth=148,i.frameheight=1664,this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=0,this.body.vel.set(-5,0),this.type="pipe"},update:function(e){return game.data.start?(this.pos.add(this.body.vel),this.pos.x<-this.image.width&&me.game.world.removeChild(this),me.Rect.prototype.updateBounds.apply(this),this._super(me.Entity,"update",[e]),!0):this._super(me.Entity,"update",[e])}}),game.PipeGenerator=me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,me.game.viewport.width,me.game.viewport.height,92]),this.alwaysUpdate=!0,this.generate=0,this.pipeFrequency=92,this.pipeHoleSize=1240,this.posX=me.game.viewport.width},update:function(e){if(this.generate++%this.pipeFrequency==0){var t=Number.prototype.random(me.video.renderer.getHeight()-100,200),i=t-me.game.viewport.height-this.pipeHoleSize,a=new me.pool.pull("pipe",this.posX,t),n=new me.pool.pull("pipe",this.posX,i),r=t-100,s=new me.pool.pull("hit",this.posX,r);a.renderable.currentTransform.scaleY(-1),me.game.world.addChild(a,10),me.game.world.addChild(n,10),me.game.world.addChild(s,11)}this._super(me.Entity,"update",[e])}}),game.RobiPackEntity=me.Entity.extend({init:function(e,t){var i={};i.image=this.image=me.loader.getImage("robi_pack"),i.width=50,i.height=72,i.framewidth=50,i.frameheight=72,this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=0,this.body.vel.set(-5,0),this.type="robi_pack"},update:function(e){return game.data.start?(this.pos.add(this.body.vel),this.pos.x<-this.image.width&&me.game.world.removeChild(this),me.Rect.prototype.updateBounds.apply(this),this._super(me.Entity,"update",[e]),!0):this._super(me.Entity,"update",[e])}}),game.RobiPackGenerator=me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,me.game.viewport.width,me.game.viewport.height,92]),this.alwaysUpdate=!0,this.generate=0,this.robiPackFrequency=92,this.robiPackHoleSize=1240,this.posX=me.game.viewport.width+250},update:function(e){if(this.generate++%this.robiPackFrequency==0){var t=Number.prototype.random(me.video.renderer.getHeight()-200,50),i=(me.game.viewport.height,this.robiPackHoleSize,new me.pool.pull("robi_pack",this.posX,t)),a=t-100,n=new me.pool.pull("hit",this.posX,a);i.renderable.currentTransform.scaleY(-1),me.game.world.addChild(i,10),me.game.world.addChild(n,11)}this._super(me.Entity,"update",[e])}}),game.HitEntity=me.Entity.extend({init:function(e,t){var i={};i.image=this.image=me.loader.getImage("hit"),i.width=148,i.height=60,i.framewidth=148,i.frameheight=60,this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=0,this.updateTime=!1,this.renderable.alpha=0,this.body.accel.set(-5,0),this.body.removeShapeAt(0),this.body.addShape(new me.Rect(0,0,i.width-30,i.height-30)),this.type="hit"},update:function(e){return this.pos.add(this.body.accel),this.pos.x<-this.image.width&&me.game.world.removeChild(this),me.Rect.prototype.updateBounds.apply(this),this._super(me.Entity,"update",[e]),!0}}),game.Ground=me.Entity.extend({init:function(e,t){var i={};i.image=me.loader.getImage("ground"),i.width=900,i.height=96,this._super(me.Entity,"init",[e,t,i]),this.alwaysUpdate=!0,this.body.gravity=0,this.body.vel.set(-4,0),this.type="ground"},update:function(e){return this.pos.add(this.body.vel),this.pos.x<-this.renderable.width&&(this.pos.x=me.video.renderer.getWidth()-10),me.Rect.prototype.updateBounds.apply(this),this._super(me.Entity,"update",[e])}}),game.HUD=game.HUD||{},game.HUD.Container=me.Container.extend({init:function(){this._super(me.Container,"init"),this.isPersistent=!0,this.collidable=!1,this.z=1/0,this.name="HUD",this.addChild(new game.HUD.ScoreItem(5,5))}}),game.HUD.ScoreItem=me.Renderable.extend({init:function(e,t){this._super(me.Renderable,"init",[e,t,10,10]),this.font=new me.Font("gamefont",40,"red","left"),this.steps="Steps: "+game.data.steps.toString(),this.score="Score: "+game.data.score.toString(),this.life="Life: "+game.data.life.toString(),this.floating=!0},draw:function(e){game.data.start&&me.state.isCurrent(me.state.PLAY)&&(this.font.draw(e,"Life: "+game.data.life.toString(),me.game.viewport.width/2-200,10),this.font.draw(e,"Score: "+game.data.steps.toString(),me.game.viewport.width/2+50,10))}});var BackgroundLayer=me.ImageLayer.extend({init:function(e,t,i){var a={};a.name=e,a.width=900,a.height=600,a.image=e,a.z=t,a.ratio=1,this._super(me.ImageLayer,"init",[0,0,a])},update:function(){return me.input.isKeyPressed("mute")&&(game.data.muted=!game.data.muted,game.data.muted?me.audio.disable():me.audio.enable()),!0}});game.TitleScreen=me.ScreenObject.extend({init:function(){this._super(me.ScreenObject,"init"),this.font=null,this.ground1=null,this.ground2=null,this.logo=null},onResetEvent:function(){me.audio.stop("theme"),game.data.newHiScore=!1,me.game.world.addChild(new BackgroundLayer("bg",1)),me.input.bindKey(me.input.KEY.ENTER,"enter",!0),me.input.bindKey(me.input.KEY.SPACE,"enter",!0),me.input.bindPointer(me.input.pointer.LEFT,me.input.KEY.ENTER);(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.life=e.data.life}catch(e){console.error(e)}})(),this.handler=me.event.subscribe(me.event.KEYDOWN,function(e,t,i){"enter"===e&&(game.data.life<=0?me.state.change(me.state.GAME_END):me.state.change(me.state.PLAY))}),this.logo=new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2-20,{image:"logo"}),me.game.world.addChild(this.logo,10);me.pool.pull("me.Tween",this.logo.pos).to({y:me.game.viewport.height/2-100},1e3).easing(me.Tween.Easing.Exponential.InOut).start();this.ground1=me.pool.pull("ground",0,me.video.renderer.getHeight()-96),this.ground2=me.pool.pull("ground",me.video.renderer.getWidth(),me.video.renderer.getHeight()-96),me.game.world.addChild(this.ground1,11),me.game.world.addChild(this.ground2,11),me.game.world.addChild(new(me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,0,100,100]),this.text=me.device.touch?"\t\t\t\t\t\t\t\t\t\t\t\t\t\tRed.Digital Limited\nTap to start":'PRESS SPACE OR CLICK LEFT MOUSE BUTTON OR TOUCHPAD TO START \n\t\t\t\t\t\t\t\t\t\t\t\t\t\tPRESS "M" TO MUTE SOUND',this.font=new me.Font("gamefont",20,"#000")},draw:function(e){var t=this.font.measureText(e,this.text),i=me.game.viewport.width/2-t.width/2,a=me.game.viewport.height/2+50;this.font.draw(e,this.text,i,a)}})),12)},onDestroyEvent:function(){me.event.unsubscribe(this.handler),me.input.unbindKey(me.input.KEY.ENTER),me.input.unbindKey(me.input.KEY.SPACE),me.input.unbindPointer(me.input.pointer.LEFT),this.ground1=null,this.ground2=null,me.game.world.removeChild(this.logo),this.logo=null}}),game.PlayScreen=me.ScreenObject.extend({init:function(){this.paused=!1,this.pauseModalShown=!1,me.input.bindKey(me.input.KEY.P,"pause"),me.audio.play("theme",!0);var e=-1!==me.device.ua.indexOf("Firefox")?.3:.5;me.audio.setVolume(e),this._super(me.ScreenObject,"init")},update:function(){return me.input.isKeyPressed("pause")&&!this.pauseModalShown&&this.togglePause(),this.paused,!0},togglePause:function(){this.paused?this.resumeGame():this.pauseGame()},pauseGame:function(){this.paused=!0,this.pauseModalShown=!0,me.timer.pause()},resumeGame:function(){this.paused=!1,this.pauseModalShown=!1,me.timer.resume()},onResetEvent:function(){me.game.reset(),me.audio.stop("theme"),game.data.muted||me.audio.play("theme",!0),me.input.bindKey(me.input.KEY.SPACE,"fly",!0);(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.life=e.data.life}catch(e){console.error(e)}})(),game.data.score=0,game.data.steps=0,game.data.start=!1,game.data.newHiscore=!1,me.game.world.addChild(new BackgroundLayer("bg",1)),this.ground1=me.pool.pull("ground",0,me.game.viewport.height-96),this.ground2=me.pool.pull("ground",me.game.viewport.width,me.game.viewport.height-96),me.game.world.addChild(this.ground1,11),me.game.world.addChild(this.ground2,11),this.HUD=new game.HUD.Container,me.game.world.addChild(this.HUD,11),this.bird=me.pool.pull("clumsy",60,me.game.viewport.height/2-100),me.game.world.addChild(this.bird,10),0==switchCharacter&&(this.character=me.pool.pull("character",120,me.game.viewport.height/2+100),me.game.world.addChild(this.character,11)),1==switchCharacter&&(this.character_side1=me.pool.pull("character_side1",120,me.game.viewport.height/2+100),me.game.world.addChild(this.character_side1,11)),me.input.bindPointer(me.input.pointer.LEFT,me.input.KEY.SPACE),this.getReady=new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2,{image:"getready"}),me.game.world.addChild(this.getReady,11);var e=this;new me.Tween(this.getReady).to({alpha:0},2e3).easing(me.Tween.Easing.Linear.None).onComplete(function(){game.data.start=!0,me.game.world.addChild(new game.PipeGenerator,0),me.game.world.addChild(new game.RobiPackGenerator,0),me.game.world.removeChild(e.getReady)}).start()},onDestroyEvent:function(){me.audio.stopTrack("theme"),this.HUD=null,this.bird=null,this.character=null,this.ground1=null,this.ground2=null,me.input.unbindKey(me.input.KEY.SPACE),me.input.unbindPointer(me.input.pointer.LEFT),me.input.unbindKey(me.input.KEY.P)}}),game.GameOverScreen=me.ScreenObject.extend({init:function(){this.savedData=null,this.handler=null},onResetEvent:function(){this.savedData={score:game.data.score,steps:game.data.steps,life:game.data.life},me.save.add(this.savedData),game.data.steps>me.save.topSteps&&(me.save.topSteps=game.data.steps,game.data.newHiScore=!0);(async()=>{try{await axios.patch("http://127.0.0.1:8000/api/players/1",{top_score:me.save.topSteps,life:game.data.life})}catch(e){console.error(e)}})(),me.input.bindKey(me.input.KEY.ENTER,"enter",!0),me.input.bindKey(me.input.KEY.SPACE,"enter",!1),me.input.bindPointer(me.input.pointer.LEFT,me.input.KEY.ENTER),this.handler=me.event.subscribe(me.event.KEYDOWN,function(e,t,i){"enter"===e&&me.state.change(me.state.MENU)}),me.game.world.addChild(new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2-100,{image:"gameover"}),12);var e=new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2,{image:"gameoverbg"});if(me.game.world.addChild(e,10),me.game.world.addChild(new BackgroundLayer("bg",1)),this.ground1=me.pool.pull("ground",0,me.game.viewport.height-96),this.ground2=me.pool.pull("ground",me.game.viewport.width,me.video.renderer.getHeight()-96),me.game.world.addChild(this.ground1,11),me.game.world.addChild(this.ground2,11),game.data.newHiScore){var t=new me.Sprite(e.width/2,e.height/2,{image:"new"});me.game.world.addChild(t,12)}this.dialog=new(me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,0,me.game.viewport.width/2,me.game.viewport.height/2]),this.font=new me.Font("gamefont",40,"black","left");(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.score=e.data.score,game.data.life=e.data.life}catch(e){console.error(e)}})(),this.steps="Score: "+game.data.steps.toString(),this.topSteps="Highest Score: "+me.save.topSteps.toString(),this.life="Life: "+game.data.life.toString()},draw:function(e){var t=this.font.measureText(e,this.steps);this.font.measureText(e,this.topSteps),this.font.measureText(e,this.score),this.font.measureText(e,this.life);this.font.draw(e,this.steps,me.game.viewport.width/2-t.width/2-60,me.game.viewport.height/2),this.font.draw(e,this.topSteps,me.game.viewport.width/2-t.width/2-60,me.game.viewport.height/2+50),this.font.draw(e,this.life,me.game.viewport.width/2-t.width/2-60,me.game.viewport.height/2+100)}})),me.game.world.addChild(this.dialog,12)},onDestroyEvent:function(){me.event.unsubscribe(this.handler),me.input.unbindKey(me.input.KEY.ENTER),me.input.unbindKey(me.input.KEY.SPACE),me.input.unbindPointer(me.input.pointer.LEFT),this.ground1=null,this.ground2=null,this.font=null,me.audio.stop("theme")}}),game.GameEnd=me.ScreenObject.extend({init:function(){this.savedData=null,this.handler=null},onResetEvent:function(){this.savedData={score:game.data.score,steps:game.data.steps,life:game.data.life},me.save.add(this.savedData),me.input.bindKey(me.input.KEY.ENTER,"enter",!0),me.input.bindKey(me.input.KEY.SPACE,"enter",!1),me.input.bindPointer(me.input.pointer.LEFT,me.input.KEY.ENTER),this.handler=me.event.subscribe(me.event.KEYDOWN,function(e,t,i){"enter"===e&&me.state.change(me.state.MENU)}),me.game.world.addChild(new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2-100,{image:"gameover"}),12);var e=new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2,{image:"gameoverbg"});if(me.game.world.addChild(e,10),me.game.world.addChild(new BackgroundLayer("bg",1)),this.ground1=me.pool.pull("ground",0,me.game.viewport.height-96),this.ground2=me.pool.pull("ground",me.game.viewport.width,me.video.renderer.getHeight()-96),me.game.world.addChild(this.ground1,11),me.game.world.addChild(this.ground2,11),game.data.newHiScore){var t=new me.Sprite(e.width/2,e.height/2,{image:"new"});me.game.world.addChild(t,12)}this.dialog=new(me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,0,me.game.viewport.width/2,me.game.viewport.height/2]),this.font=new me.Font("gamefont",40,"black","left");(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.score=e.data.score,game.data.life=e.data.life}catch(e){console.error(e)}})(),this.steps="Score: "+game.data.steps.toString(),this.topSteps="Highest Score: "+me.save.topSteps.toString(),this.life="You have no lives Left!"},draw:function(e){var t=this.font.measureText(e,this.steps);this.font.measureText(e,this.topSteps),this.font.measureText(e,this.score),this.font.measureText(e,this.life);this.font.draw(e,this.steps,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2),this.font.draw(e,this.topSteps,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2+50),this.font.draw(e,this.life,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2+100)}})),me.game.world.addChild(this.dialog,12)},onDestroyEvent:function(){me.event.unsubscribe(this.handler),me.input.unbindKey(me.input.KEY.ENTER),me.input.unbindKey(me.input.KEY.SPACE),me.input.unbindPointer(me.input.pointer.LEFT),this.ground1=null,this.ground2=null,this.font=null,me.audio.stop("theme")}}),game.GamePause=me.ScreenObject.extend({init:function(){this.savedData=null,this.handler=null},onResetEvent:function(){this.savedData={score:game.data.score,steps:game.data.steps,life:game.data.life},me.save.add(this.savedData),me.input.bindKey(me.input.KEY.ENTER,"enter",!0),me.input.bindKey(me.input.KEY.SPACE,"enter",!1),me.input.bindPointer(me.input.pointer.LEFT,me.input.KEY.ENTER),this.handler=me.event.subscribe(me.event.KEYDOWN,function(e,t,i){"enter"===e&&me.state.change(me.state.MENU)}),me.game.world.addChild(new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2-100,{image:"gameover"}),12);var e=new me.Sprite(me.game.viewport.width/2,me.game.viewport.height/2,{image:"gameoverbg"});if(me.game.world.addChild(e,10),me.game.world.addChild(new BackgroundLayer("bg",1)),this.ground1=me.pool.pull("ground",0,me.game.viewport.height-96),this.ground2=me.pool.pull("ground",me.game.viewport.width,me.video.renderer.getHeight()-96),me.game.world.addChild(this.ground1,11),me.game.world.addChild(this.ground2,11),game.data.newHiScore){var t=new me.Sprite(e.width/2,e.height/2,{image:"new"});me.game.world.addChild(t,12)}this.dialog=new(me.Renderable.extend({init:function(){this._super(me.Renderable,"init",[0,0,me.game.viewport.width/2,me.game.viewport.height/2]),this.font=new me.Font("gamefont",40,"black","left");(async()=>{try{const e=await axios.get("http://127.0.0.1:8000/api/players/1");game.data.score=e.data.score,game.data.life=e.data.life}catch(e){console.error(e)}})(),this.steps="Game Pause: "+game.data.steps.toString(),this.topSteps="Highest Score: "+me.save.topSteps.toString(),this.life="You have no lives Left!"},draw:function(e){var t=this.font.measureText(e,this.steps);this.font.measureText(e,this.topSteps),this.font.measureText(e,this.score),this.font.measureText(e,this.life);this.font.draw(e,this.steps,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2),this.font.draw(e,this.topSteps,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2+50),this.font.draw(e,this.life,me.game.viewport.width/2-t.width/2-140,me.game.viewport.height/2+100)}})),me.game.world.addChild(this.dialog,12)},onDestroyEvent:function(){me.event.unsubscribe(this.handler),me.input.unbindKey(me.input.KEY.ENTER),me.input.unbindKey(me.input.KEY.SPACE),me.input.unbindPointer(me.input.pointer.LEFT),this.ground1=null,this.ground2=null,this.font=null,me.audio.stop("theme")}});