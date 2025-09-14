// === Variabili globali ===
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let livello = 1;
let gravita = 0.5;
let tasti = {};
let particelle = [];

let player = {
  x: 100,
  y: 100,
  larghezza: 40,
  altezza: 40,
  velocitaX: 0,
  velocitaY: 0,
  velocita: 3,
  salto: -10,
  aTerra: false,
  hp: 100,
  invincibile: 0,
  boost: 0,
  star: 0
};

let piattaforme = [];
let nemici = [];
let oggetti = [];
let cure = [];
let powerups = [];
let stelle = [];
let boss = null;
let proiettili = [];

// === Input tastiera ===
document.addEventListener('keydown', e => tasti[e.key] = true);
document.addEventListener('keyup', e => tasti[e.key] = false);

// === Funzione collisione rettangoli ===
function colpisce(a, b) {
  return a.x < b.x + b.larghezza &&
         a.x + a.larghezza > b.x &&
         a.y < b.y + b.altezza &&
         a.y + a.altezza > b.y;
}

// === Particelle ===
function creaParticelle(x, y) {
  for (let i = 0; i < 25; i++) {
    particelle.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: Math.random() * 4 + 2,
      alpha: 1,
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255)
    });
  }
}

// === Disegno ===
function disegna() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Piattaforme
  ctx.fillStyle = 'sienna';
  piattaforme.forEach(p => ctx.fillRect(p.x, p.y, p.larghezza, p.altezza));

  // Nemici
  ctx.fillStyle = 'red';
  nemici.forEach(n => ctx.fillRect(n.x, n.y, n.larghezza, n.altezza));

  // Oggetti
  ctx.fillStyle = 'limegreen';
  oggetti.forEach(o => ctx.fillRect(o.x, o.y, o.larghezza, o.altezza));

  // Cure
  ctx.fillStyle = 'darkgreen';
  cure.forEach(c => ctx.fillRect(c.x, c.y, c.larghezza, c.altezza));

  // Power-up velocità
  ctx.fillStyle = 'gold';
  powerups.forEach(pu => ctx.fillRect(pu.x, pu.y, pu.larghezza, pu.altezza));

  // Stelle invincibilità
  ctx.fillStyle = 'white';
  stelle.forEach(s => ctx.fillRect(s.x, s.y, s.larghezza, s.altezza));

  // Boss
  if (boss) {
    ctx.fillStyle = 'darkred';
    ctx.fillRect(boss.x, boss.y, boss.larghezza, boss.altezza);

    // Barra vita Boss
    ctx.fillStyle = 'black';
    ctx.fillText("Boss:", 10, 80);
    ctx.fillStyle = 'red';
    ctx.fillRect(60, 68, 200, 15);
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(60, 68, (boss.hp / boss.hpMax) * 200, 15);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(60, 68, 200, 15);
  }

  // Proiettili boss
  ctx.fillStyle = 'darkorange';
  proiettili.forEach(p => ctx.fillRect(p.x, p.y, p.size, p.size));

  // Player
  if (player.star > 0) {
    ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`; // lampeggia
  } else if (player.boost > 0) {
    ctx.fillStyle = 'orange';
  } else {
    ctx.fillStyle = (player.invincibile % 20 < 10) ? 'blue' : 'transparent';
  }
  ctx.fillRect(player.x, player.y, player.larghezza, player.altezza);

  // Particelle
  particelle.forEach(p => {
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  // HUD
  ctx.fillStyle = 'black';
  ctx.font = "16px Arial";
  ctx.fillText("Livello: " + livello, 10, 20);

  // Barra vita player
  ctx.fillText("Vita:", 10, 50);
  ctx.fillStyle = 'red';
  ctx.fillRect(60, 38, 100, 15);
  ctx.fillStyle = 'limegreen';
  ctx.fillRect(60, 38, player.hp, 15);
  ctx.strokeStyle = 'black';
  ctx.strokeRect(60, 38, 100, 15);

  if (player.boost > 0) {
    ctx.fillStyle = 'orange';
    ctx.fillText("⚡ Boost!", 500, 20);
  }
  if (player.star > 0) {
    ctx.fillStyle = 'purple';
    ctx.fillText("⭐ Invincibile!", 500, 40);
  }
}

// === Aggiornamento logica ===
function aggiorna() {
  let velocitaBase = player.boost > 0 ? player.velocita * 2 : player.velocita;

  // Movimento player
  if (tasti["ArrowLeft"] || tasti["a"]) player.velocitaX = -velocitaBase;
  else if (tasti["ArrowRight"] || tasti["d"]) player.velocitaX = velocitaBase;
  else player.velocitaX = 0;

  if ((tasti["ArrowUp"] || tasti["w"]) && player.aTerra) {
    player.velocitaY = player.salto;
    player.aTerra = false;
  }

  // Gravità
  player.velocitaY += gravita;

  // Posizione player
  player.x += player.velocitaX;
  player.y += player.velocitaY;

  // Collisioni con piattaforme
  player.aTerra = false;
  piattaforme.forEach(p => {
    if (player.x + player.larghezza > p.x &&
        player.x < p.x + p.larghezza &&
        player.y + player.altezza > p.y &&
        player.y + player.altezza < p.y + p.altezza &&
        player.velocitaY >= 0) {
      player.y = p.y - player.altezza;
      player.velocitaY = 0;
      player.aTerra = true;
    }
  });

  // Movimento nemici
  nemici.forEach(n => {
    let distanza = Math.abs(player.x - n.x);
    if (distanza < 150) {
      if (player.x < n.x) n.x -= n.speed;
      if (player.x > n.x) n.x += n.speed;
    } else {
      n.x += n.velocita;
      if (n.x < n.minX || n.x + n.larghezza > n.maxX) {
        n.velocita *= -1;
      }
    }
  });

  // Collisione con nemici
  nemici.forEach(n => {
    if (player.star <= 0 && player.invincibile <= 0 &&
        colpisce(player, n)) {
      player.hp -= 20;
      player.invincibile = 60;
      if (player.hp <= 0) {
        alert("💀 Game Over!");
        livello = 1;
        caricaLivello();
      }
    }
  });

  if (player.invincibile > 0) player.invincibile--;
  if (player.boost > 0) player.boost--;
  if (player.star > 0) player.star--;

  // Raccolta oggetti
  for (let i = oggetti.length - 1; i >= 0; i--) {
    let o = oggetti[i];
    if (colpisce(player, o)) {
      oggetti.splice(i, 1);
      creaParticelle(o.x, o.y);
    }
  }

  // Cure
  for (let i = cure.length - 1; i >= 0; i--) {
    let c = cure[i];
    if (colpisce(player, c)) {
      cure.splice(i, 1);
      player.hp = Math.min(100, player.hp + 20);
      creaParticelle(c.x, c.y);
    }
  }

  // Power-up velocità
  for (let i = powerups.length - 1; i >= 0; i--) {
    let pu = powerups[i];
    if (colpisce(player, pu)) {
      powerups.splice(i, 1);
      player.boost = 300;
      creaParticelle(pu.x, pu.y);
    }
  }

  // Stelle invincibilità
  for (let i = stelle.length - 1; i >= 0; i--) {
    let s = stelle[i];
    if (colpisce(player, s)) {
      stelle.splice(i, 1);
      player.star = 300;
      creaParticelle(s.x, s.y);
    }
  }

  // Boss
  if (boss) {
    boss.x += boss.velocita;
    if (boss.x < boss.minX || boss.x + boss.larghezza > boss.maxX) {
      boss.velocita *= -1;
    }

    boss.timer++;
    if (boss.timer % 100 === 0) {
      proiettili.push({
        x: boss.x + boss.larghezza / 2,
        y: boss.y + boss.altezza,
        size: 10,
        vy: 3
      });
    }

    if (colpisce(player, boss) && player.star <= 0 && player.invincibile <= 0) {
      player.hp -= 30;
      player.invincibile = 60;
      if (player.hp <= 0) {
        alert("💀 Game Over!");
        livello = 1;
        caricaLivello();
      }
    }

    // Colpire il boss saltandogli sopra
    if (player.velocitaY > 0 &&
        player.x + player.larghezza > boss.x &&
        player.x < boss.x + boss.larghezza &&
        player.y + player.altezza > boss.y &&
        player.y + player.altezza < boss.y + boss.altezza) {
      boss.hp -= 10;
      player.velocitaY = -8;
      if (boss.hp <= 0) {
        creaParticelle(boss.x + boss.larghezza/2, boss.y + boss.altezza/2);
        boss = null;
        alert("🎉 Hai sconfitto il BOSS e vinto il gioco!");
        livello = 1;
        caricaLivello();
      }
    }
  }

  // Proiettili
  for (let i = proiettili.length - 1; i >= 0; i--) {
    let p = proiettili[i];
    p.y += p.vy;
    if (player.star <= 0 && colpisce(player, p)) {
      proiettili.splice(i, 1);
      player.hp -= 15;
      player.invincibile = 40;
      if (player.hp <= 0) {
        alert("💀 Game Over!");
        livello = 1;
        caricaLivello();
      }
    }
    if (p.y > canvas.height) proiettili.splice(i, 1);
  }

  // Avanza livello
  if (oggetti.length === 0 && !boss) {
    livello++;
    caricaLivello();
  }

  // Aggiorna particelle
  particelle.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.02;
  });
  particelle = particelle.filter(p => p.alpha > 0);
}

// === Carica livelli ===
function caricaLivello() {
  piattaforme = [];
  nemici = [];
  oggetti = [];
  cure = [];
  powerups = [];
  stelle = [];
  boss = null;
  proiettili = [];
  particelle = [];
  player.x = 100;
  player.y = 100;
  player.velocitaY = 0;
  player.hp = 100;
  player.invincibile = 0;
  player.boost = 0;
  player.star = 0;

  switch (livello) {
    case 1:
      piattaforme.push({x: 50, y: 400, larghezza: 200, altezza: 20});
      piattaforme.push({x: 300, y: 300, larghezza: 150, altezza: 20});
      nemici.push({x: 200, y: 360, larghezza: 40, altezza: 40, velocita: 2, minX: 200, maxX: 350, speed: 1.5});
      oggetti.push({x: 330, y: 260, larghezza: 20, altezza: 20});
      cure.push({x: 120, y: 360, larghezza: 20, altezza: 20});
      break;

    case 2:
      piattaforme.push({x: 50, y: 420, larghezza: 150, altezza: 20});
      piattaforme.push({x: 250, y: 350, larghezza: 120, altezza: 20});
      piattaforme.push({x: 420, y: 250, larghezza: 150, altezza: 20});
      nemici.push({x: 260, y: 310, larghezza: 40, altezza: 40, velocita: 1.5, minX: 250, maxX: 370, speed: 2});
      nemici.push({x: 450, y: 210, larghezza: 40, altezza: 40, velocita: 2, minX: 420, maxX: 570, speed: 2});
      oggetti.push({x: 460, y: 190, larghezza: 20, altezza: 20});
      cure.push({x: 300, y: 320, larghezza: 20, altezza: 20});
      powerups.push({x: 200, y: 260, larghezza: 20, altezza: 20});
      stelle.push({x: 500, y: 200, larghezza: 20, altezza: 20});
      break;

    case 3: // Boss finale
      piattaforme.push({x: 0, y: 460, larghezza: 640, altezza: 20});
      boss = {
        x: 200, y: 340,
        larghezza: 120, altezza: 120,
        hp: 200, hpMax: 200,
        velocita: 2,
        minX: 50, maxX: 500,
        timer: 0
      };
      break;

    default:
      alert("🎉 Hai vinto!");
      livello = 1;
      caricaLivello();
  }
}

// === Loop principale ===
function loop() {
  aggiorna();
  disegna();
  requestAnimationFrame(loop);
}

// === Avvio ===
caricaLivello();
loop();
