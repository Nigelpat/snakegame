/* Snake Arcade — Phaser 3
   Features:
   - Main Menu, Settings, Leaderboard, Game, Pause (overlay), GameOver
   - Difficulty: Easy / Normal / Hard (affects speed & scoring)
   - Wall Wrap toggle
   - Bonus Fruit (+10)
   - ESC to pause (Resume / Main Menu / Quit)
   - Local high score + top-5 leaderboard via localStorage
*/

const WIDTH = 800, HEIGHT = 600, BLOCK = 20;
const STORAGE_KEYS = {
  SETTINGS: 'snake_settings_v1',
  HIGH: 'snake_highscore_v1',
  LB: 'snake_leaderboard_v1'
};

const defaultSettings = { difficulty: 'Normal', volume: 0.7, wrap: false };

function loadSettings(){
  try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS))||{}) }; }
  catch { return { ...defaultSettings }; }
}
function saveSettings(s){ localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s)); }
function loadHigh(){ return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH) || '0', 10); }
function saveHigh(v){ localStorage.setItem(STORAGE_KEYS.HIGH, String(v)); }
function loadLB(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEYS.LB))||[]; } catch{ return []; } }
function saveLB(lb){ localStorage.setItem(STORAGE_KEYS.LB, JSON.stringify(lb)); }
function pushLB(name, score){
  const lb = loadLB();
  lb.push({name, score, time: new Date().toISOString().slice(0,19).replace('T',' ')});
  lb.sort((a,b)=> b.score - a.score);
  saveLB(lb.slice(0,5));
}

// Boot
class Boot extends Phaser.Scene{
  constructor(){ super('Boot'); }
  preload(){
    this.make.graphics({x:0,y:0,add:false}).fillStyle(0xff3b47).fillCircle(16,16,12).generateTexture('food', 32, 32);
    this.make.graphics({x:0,y:0,add:false}).fillStyle(0xffd54a).fillCircle(16,16,12).generateTexture('bonus', 32, 32);
    this.make.graphics({x:0,y:0,add:false}).fillStyle(0x00aa55).fillRect(0,0,20,20).generateTexture('seg', 20,20);
    this.make.graphics({x:0,y:0,add:false}).fillStyle(0x2af598).fillRect(0,0,20,20).generateTexture('head', 20,20);
  }
  create(){
    window.addEventListener('snake:start', ()=> this.scene.start('Game'));
    window.addEventListener('snake:settings', ()=> this.scene.start('Settings'));
    window.addEventListener('snake:leaderboard', ()=> this.scene.start('Leaderboard'));
    this.scene.start('MainMenu');
  }
}

// Main Menu
class MainMenu extends Phaser.Scene{
  constructor(){ super('MainMenu'); }
  create(){
    this.cameras.main.setBackgroundColor('#141a33');
    this.add.text(WIDTH/2, 120, 'SNAKE ARCADE', {fontFamily:'JetBrains Mono', fontSize:'48px', color:'#ffffff'}).setOrigin(0.5);

    const items = ['Start Game', 'Settings', 'Leaderboard', 'Quit'];
    let sel = 0;

    const buttons = items.map((label, i)=>{
      const y = 230 + i*70;
      const rect = this.add.rectangle(WIDTH/2, y, 280, 50, 0x3c4478, 0.9)
        .setStrokeStyle(1, 0xffffff, 0.2)
        .setInteractive({useHandCursor:true});
      this.add.text(WIDTH/2, y, label, {fontFamily:'JetBrains Mono', fontSize:'20px', color:'#ffffff'}).setOrigin(0.5);
      rect.on('pointerover', ()=> sel = i);
      rect.on('pointerdown', ()=> activate(i));
      return rect;
    });

    const activate = (i)=>{
      const choice = items[i];
      if(choice==='Start Game') this.scene.start('Game');
      else if(choice==='Settings') this.scene.start('Settings');
      else if(choice==='Leaderboard') this.scene.start('Leaderboard');
      else if(choice==='Quit') window.location.href = 'about:blank';
    };

    this.input.keyboard.on('keydown', (e)=>{
      if(['ArrowDown','s','S'].includes(e.key)) sel = (sel+1)%items.length;
      if(['ArrowUp','w','W'].includes(e.key)) sel = (sel-1+items.length)%items.length;
      if(['Enter',' '].includes(e.key)) activate(sel);
    });

    this.events.on('update', ()=>{
      buttons.forEach((r,i)=> r.fillColor = (i===sel)? 0x7381ff : 0x3c4478);
    });
  }
}

// Settings
class Settings extends Phaser.Scene{
  constructor(){ super('Settings'); }
  create(){
    this.cameras.main.setBackgroundColor('#0f1a2f');
    const s = loadSettings();
    const diffs = ['Easy','Normal','Hard'];
    let sel = 0;

    this.add.text(WIDTH/2, 120, 'SETTINGS', {fontFamily:'JetBrains Mono', fontSize:'40px', color:'#ffffff'}).setOrigin(0.5);

    const rows = [
      ()=> `Difficulty: ${s.difficulty}`,
      ()=> `Volume: ${Math.round(s.volume*100)}%`,
      ()=> `Wall Wrap: ${s.wrap? 'ON':'OFF'}`,
      ()=> `Back`
    ];

    const rects = rows.map((fn,i)=>{
      const y = 220 + i*60;
      const r = this.add.rectangle(WIDTH/2, y, 360, 46, 0x2a335a, 0.9).setStrokeStyle(1, 0xffffff, 0.2).setInteractive({useHandCursor:true});
      const t = this.add.text(WIDTH/2, y, fn(), {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'}).setOrigin(0.5);
      r.on('pointerover', ()=> sel=i);
      r.on('pointerdown', ()=> clickRow(i));
      return {r,t,fn};
    });

    const updateRowTexts = ()=> rects.forEach(o=> o.t.setText(o.fn()));

    const clickRow = (i)=>{
      if(i===0){
        const idx = diffs.indexOf(s.difficulty);
        s.difficulty = diffs[(idx+1)%diffs.length];
      } else if(i===1){
        s.volume = Math.max(0, Math.min(1, s.volume + 0.1));
      } else if(i===2){
        s.wrap = !s.wrap;
      } else if(i===3){
        saveSettings(s);
        this.scene.start('MainMenu');
      }
      updateRowTexts();
    };

    this.input.keyboard.on('keydown', (e)=>{
      if(['ArrowDown','s','S'].includes(e.key)) sel = (sel+1)%rows.length;
      if(['ArrowUp','w','W'].includes(e.key)) sel = (sel-1+rows.length)%rows.length;
      if(['Enter',' '].includes(e.key)) clickRow(sel);
      if(e.key==='Escape'){ saveSettings(s); this.scene.start('MainMenu'); }
    });

    this.events.on('update', ()=>{
      rects.forEach((o,i)=> o.r.fillColor = (i===sel)? 0x7381ff : 0x2a335a );
    });
  }
}

// Leaderboard
class Leaderboard extends Phaser.Scene{
  constructor(){ super('Leaderboard'); }
  create(){
    this.cameras.main.setBackgroundColor('#1a1430');
    const lb = loadLB();
    this.add.text(WIDTH/2, 100, 'LEADERBOARD (Top 5)', {fontFamily:'JetBrains Mono', fontSize:'36px', color:'#ffffff'}).setOrigin(0.5);

    if(lb.length===0){
      this.add.text(WIDTH/2, 180, 'No scores yet.', {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#cbd1ff'}).setOrigin(0.5);
    }else{
      lb.forEach((row,i)=>{
        const y = 170 + i*48;
        this.add.text(WIDTH/2, y, `${i+1}. ${row.name} — ${row.score} (${row.time})`, {
          fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'
        }).setOrigin(0.5);
      });
    }

    const back = this.add.rectangle(WIDTH/2, 520, 240, 50, 0x3c4478, 0.9).setStrokeStyle(1, 0xffffff, 0.2).setInteractive({useHandCursor:true});
    this.add.text(WIDTH/2, 520, 'Back', {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'}).setOrigin(0.5);
    back.on('pointerdown', ()=> this.scene.start('MainMenu'));

    this.input.keyboard.on('keydown', (e)=> { if(['Escape','Enter',' '].includes(e.key)) this.scene.start('MainMenu'); });
  }
}

// Pause
class PauseOverlay extends Phaser.Scene{
  constructor(){ super({key:'PauseOverlay', active:false}); }
  create(){
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.45)');
    this.add.rectangle(WIDTH/2, HEIGHT/2, 420, 300, 0x0d1230, 0.95).setStrokeStyle(1, 0xffffff, 0.15);
    this.add.text(WIDTH/2, HEIGHT/2-100, 'PAUSED', {fontFamily:'JetBrains Mono', fontSize:'32px', color:'#ffffff'}).setOrigin(0.5);

    const items = ['Resume', 'Main Menu', 'Quit'];
    let sel = 0;
    const buttons = items.map((label,i)=>{
      const y = HEIGHT/2 - 20 + i*60;
      const r = this.add.rectangle(WIDTH/2, y, 260, 44, 0x3c4478, 0.95).setStrokeStyle(1,0xffffff,0.2).setInteractive({useHandCursor:true});
      const t = this.add.text(WIDTH/2, y, label, {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'}).setOrigin(0.5);
      r.on('pointerover', ()=> sel=i);
      r.on('pointerdown', ()=> choose(i));
      return {r,t};
    });

    const choose = (i)=>{
      const choice = items[i];
      if(choice==='Resume'){
        this.scene.stop();
        this.scene.resume('Game');
      }else if(choice==='Main Menu'){
        this.scene.stop('Game');
        this.scene.start('MainMenu');
      }else if(choice==='Quit'){
        window.location.href = 'about:blank';
      }
    };

    this.input.keyboard.on('keydown', (e)=>{
      if(['ArrowDown','s','S'].includes(e.key)) sel = (sel+1)%items.length;
      if(['ArrowUp','w','W'].includes(e.key)) sel = (sel-1+items.length)%items.length;
      if(['Enter',' '].includes(e.key)) choose(sel);
      if(e.key==='Escape'){ this.scene.stop(); this.scene.resume('Game'); }
    });

    this.events.on('update', ()=> buttons.forEach((b,i)=> b.r.fillColor = (i===sel)? 0x7381ff : 0x3c4478 ));
  }
}

// Game
class Game extends Phaser.Scene{
  constructor(){ super('Game'); }
  create(){
    this.cameras.main.setBackgroundColor('#1e2a48');
    const s = loadSettings();
    this.wrap = !!s.wrap;
    const diff = s.difficulty;
    let baseSpeed = 10, multiplier = 1;
    if(diff==='Easy'){ baseSpeed = 7; multiplier = 1; }
    else if(diff==='Normal'){ baseSpeed = 10; multiplier = 1; }
    else if(diff==='Hard'){ baseSpeed = 13; multiplier = 2; }
    this.multiplier = multiplier;
    this.stepMS = Math.max(50, 1000/baseSpeed);

    this.snake = [{x: 100, y: 100}];
    this.dir = 'RIGHT';
    this.score = 0;
    this.high = loadHigh();
    this.timer = 0;
    this.food = this.spawnFood();
    this.bonus = null;

    this.hudScore = this.add.text(10, 10, `Score: 0  High: ${this.high}`, {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'});
    this.hudHint  = this.add.text(WIDTH-230, 10, `Press ESC to pause`, {fontFamily:'JetBrains Mono', fontSize:'16px', color:'#cbd1ff'});

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ W:87, A:65, S:83, D:68 });
    this.input.keyboard.on('keydown-ESC', ()=>{ this.scene.pause(); this.scene.launch('PauseOverlay'); });

    this.render();
  }

  update(_, dt){
    this.timer += dt;
    if(this.timer >= this.stepMS){ this.timer = 0; this.tryMove(); }
  }

  tryMove(){
    if((this.cursors.left.isDown || this.keys.A.isDown) && this.dir!=='RIGHT') this.dir='LEFT';
    else if((this.cursors.right.isDown || this.keys.D.isDown) && this.dir!=='LEFT') this.dir='RIGHT';
    else if((this.cursors.up.isDown || this.keys.W.isDown) && this.dir!=='DOWN') this.dir='UP';
    else if((this.cursors.down.isDown || this.keys.S.isDown) && this.dir!=='UP') this.dir='DOWN';

    const head = {...this.snake[0]};
    if(this.dir==='LEFT') head.x -= BLOCK;
    if(this.dir==='RIGHT') head.x += BLOCK;
    if(this.dir==='UP') head.y -= BLOCK;
    if(this.dir==='DOWN') head.y += BLOCK;

    if(this.wrap){ head.x = (head.x+WIDTH)%WIDTH; head.y = (head.y+HEIGHT)%HEIGHT; }
    this.snake.unshift(head);

    if(head.x===this.food.x && head.y===this.food.y){
      this.score += 1 * this.multiplier;
      this.food = this.spawnFood();
      if(Phaser.Math.Between(1,12)===5) this.bonus = this.spawnFood();
    }
    else if(this.bonus && head.x===this.bonus.x && head.y===this.bonus.y){
      this.score += 10 * this.multiplier;
      this.snake.push({...this.snake[this.snake.length-1]});
      this.bonus = null;
    }
    else this.snake.pop();

    const hitWall = !this.wrap && (head.x<0 || head.x>=WIDTH || head.y<0 || head.y>=HEIGHT);
    const hitSelf = this.snake.slice(1).some(s=> s.x===head.x && s.y===head.y);
    if(hitWall || hitSelf){ this.gameOver(); return; }

    this.render();
  }

  spawnFood(){
    while(true){
      const x = Phaser.Math.Between(0, (WIDTH/BLOCK)-1)*BLOCK;
      const y = Phaser.Math.Between(0, (HEIGHT/BLOCK)-1)*BLOCK;
      if(!this.snake.some(seg => seg.x===x && seg.y===y)){ return {x, y}; }
    }
  }

  render(){
    this.children.removeAll();
    this.hudScore = this.add.text(10, 10, `Score: ${this.score}  High: ${this.high}`, {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'});
    this.hudHint  = this.add.text(WIDTH-230, 10, `Press ESC to pause`, {fontFamily:'JetBrains Mono', fontSize:'16px', color:'#cbd1ff'});
    this.add.image(this.food.x+10, this.food.y+10, 'food').setDisplaySize(20,20);
    if(this.bonus) this.add.image(this.bonus.x+10, this.bonus.y+10, 'bonus').setDisplaySize(20,20);
    this.snake.forEach((seg,i)=> this.add.image(seg.x+10, seg.y+10, i===0?'head':'seg').setDisplaySize(20,20));
  }

  gameOver(){
    if(this.score > this.high){ this.high = this.score; saveHigh(this.high); }
    this.scene.start('GameOver',{score:this.score, high:this.high});
  }
}

// Game Over Scene
class GameOver extends Phaser.Scene{
  constructor(){ super('GameOver'); }
  init(data){ this.finalScore=data.score; this.high=data.high; }
  create(){
    this.cameras.main.setBackgroundColor('#200c14');
    this.add.text(WIDTH/2, 140, 'GAME OVER', {fontFamily:'JetBrains Mono', fontSize:'46px', color:'#ff5050'}).setOrigin(0.5);
    this.add.text(WIDTH/2, 200, `Final Score: ${this.finalScore}`, {fontFamily:'JetBrains Mono', fontSize:'22px', color:'#ffffff'}).setOrigin(0.5);
    this.add.text(WIDTH/2, 240, `High Score: ${this.high}`, {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#cbd1ff'}).setOrigin(0.5);

    const box = this.add.rectangle(WIDTH/2, 320, 300, 50, 0x333355, 0.9).setStrokeStyle(1,0xffffff,0.3);
    this.nameText = this.add.text(WIDTH/2, 320, 'Enter your name...', {fontFamily:'JetBrains Mono', fontSize:'18px', color:'#ffffff'}).setOrigin(0.5);

    this.playerName = "";
    this.input.keyboard.on('keydown', (e)=>{
      if(e.key==="Backspace") this.playerName = this.playerName.slice(0,-1);
      else if(e.key==="Enter" && this.playerName.trim()!==""){ this.saveAndExit(); }
      else if(e.key.length===1 && this.playerName.length<12){ this.playerName+=e.key; }
      this.nameText.setText(this.playerName || "Enter your name...");
    });

    this.add.text(WIDTH/2, 400, 'Press Enter to submit', {fontFamily:'JetBrains Mono', fontSize:'16px', color:'#aaaaaa'}).setOrigin(0.5);
  }

  saveAndExit(){
    pushLB(this.playerName.trim(), this.finalScore);
    this.scene.start('MainMenu');
  }
}

// Config
const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#1b2140',
  parent: 'game-container',
  scene: [Boot, MainMenu, Settings, Leaderboard, Game, PauseOverlay, GameOver],
};
new Phaser.Game(config);
