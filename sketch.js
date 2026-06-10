// =================================================================
// 🌾 AGROUNO PRO - ULTRA POLIDO COM SALVAMENTO, IA E SISTEMA "AGRO!"
// =================================================================

let estado = "menu"; // loading, menu, jogo, guia, fim, conquistas, loja, dificuldade, qtcartas, embaralhando
let cartaSelecionadaGuia = 0; 
let resultadoPartida = ""; 

// ⏳ TELA DE CARREGAMENTO
let tempoCarregamento = 0;
let duracaoCarregamento = 180; // ~3 segundos a 60fps

let cartasJogador = [];
let cartasBot = [];
let baralho = [];
let cartaMesa;

let larguraCarta = 110;
let alturaCarta = 160;

let mensagem = "Sua vez!";
let turnoJogador = true;
let particulas = [];
let pontos = 0;

// 💾 VARIÁVEIS DE PROGRESSO (CARREGADAS DO LOCALSTORAGE)
let ecoMoedas = 800; 
let skinEquipada = "padrao"; 
let skinSelecionadaLojaPreview = "padrao";
let inventarioSkins = ["padrao"]; 

let nuvens = []; 
let ventoGeral = 0; 

let animandoCarta = false;
let cartaAnimadaObj = null;
let cAnimX = 0, cAnimY = 0;
let cAlvoX = 0, cAlvoY = 0;
let callbackAnimacao = null;

let contadorSolar = 0;
let botUsouQueimada = false;
let notificacaoConquista = null;
let tempoNotificacao = 0;

let rodadasParaOEvento = 4; 
let climaAtual = "Estável"; 
let corFiltroClima; 

// 🎨 SELETOR DE COR DA RECICLAGEM
let mostraSeletorCor = false;
let callbackSeletorCor = null;

// 🎓 SISTEMA DE TUTORIAL INTERATIVO
let tutorialAtivo = false;
let tutorialPasso = 0;
let tutorialPulseFrame = 0;
let tutorialCartasSelecionadas = false; // jogador já clicou na carta guiada
let tutorialBotJogou = false;
let tutorialAgroFase = false; // fase especial do AGRO
let tutorialFimPasso = false;
// Passos do tutorial:
// 0 - Boas vindas / explicar o objetivo
// 1 - Sua mão de cartas — olhe suas cartas
// 2 - A carta do centro (pilha de descarte) — cor e número
// 3 - Jogar uma carta compatível
// 4 - O bot joga — observe
// 5 - Comprar carta do monte quando não tem jogada
// 6 - Carta especial: Queimada / bloqueio
// 7 - Carta especial: Chuva Forte / +2
// 8 - Coringa: Reciclagem — escolher cor
// 9 - AGRO! — grite quando tiver 1 carta
// 10 - Pontuação e troféus
// 11 - Parabéns — fim do tutorial

// 📢 SISTEMA "AGRO!"
let jogadorGritouAgro = false;
let botGritouAgro = false;
let tempoLimiteBotAgro = 0;
let contadorGritosAgro = 0; // acumulado entre partidas

// 🎯 DIFICULDADE
let dificuldade = "medio"; // facil, medio, dificil, radi

// 🃏 QUANTIDADE DE CARTAS NA MÃO
let quantidadeCartas = 7; // 7, 9 ou 12

// 🎬 ANIMAÇÃO DE EMBARALHAMENTO
let estadoEmbaralhar = "idle"; // idle, embaralhando, distribuindo, pronto
let frameEmbaralhar = 0;
let cartasDistribuidas = []; // { carta, x, y, alvo, progresso, para }
let totalCartasDistribuir = 0;
let indiceDistribuindo = 0;
let callbackAposEmbaralhar = null;

// 🖼️ CONTROLE DE CENÁRIOS
let cenarioAtual = 0; 

// 🔄 VARIÁVEIS DE ROLAGEM
let scrollManual = 0;
let maxScrollManual = 180; 
let scrollLoja = 0;
let maxScrollLoja = 650; 

// ⏱️ ESTATÍSTICAS DA PARTIDA
let tempoInicioPartida = 0;
let tempoTotalPartidaTexto = "00:00";
let totalCartasJogadasPartida = 0;

// 🔊 SISTEMA DE SONS (Web Audio API)
let audioCtx = null;

function iniciarAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function tocarSom(tipo) {
  try {
    iniciarAudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    let t = audioCtx.currentTime;

    if (tipo === "jogar") {
      // Carta jogada — click satisfatório
      o.type = "triangle";
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(780, t + 0.06);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t); o.stop(t + 0.18);
    } else if (tipo === "comprar") {
      // Comprar carta — som mais grave
      o.type = "sine";
      o.frequency.setValueAtTime(280, t);
      o.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    } else if (tipo === "agro") {
      // AGRO! — fanfarra curta
      let freqs = [440, 550, 660, 880];
      for (let i = 0; i < freqs.length; i++) {
        let oi = audioCtx.createOscillator();
        let gi = audioCtx.createGain();
        oi.connect(gi); gi.connect(audioCtx.destination);
        oi.type = "square";
        oi.frequency.setValueAtTime(freqs[i], t + i * 0.07);
        gi.gain.setValueAtTime(0.0, t + i * 0.07);
        gi.gain.linearRampToValueAtTime(0.12, t + i * 0.07 + 0.02);
        gi.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.12);
        oi.start(t + i * 0.07); oi.stop(t + i * 0.07 + 0.14);
      }
      return;
    } else if (tipo === "vitoria") {
      // Vitória — melodia ascendente animada
      let mel = [523, 659, 784, 1047];
      let dur = [0.12, 0.12, 0.12, 0.30];
      let acc = 0;
      for (let i = 0; i < mel.length; i++) {
        let oi = audioCtx.createOscillator();
        let gi = audioCtx.createGain();
        oi.connect(gi); gi.connect(audioCtx.destination);
        oi.type = "triangle";
        oi.frequency.setValueAtTime(mel[i], t + acc);
        gi.gain.setValueAtTime(0.0, t + acc);
        gi.gain.linearRampToValueAtTime(0.2, t + acc + 0.02);
        gi.gain.exponentialRampToValueAtTime(0.001, t + acc + dur[i]);
        oi.start(t + acc); oi.stop(t + acc + dur[i] + 0.05);
        acc += dur[i] * 0.85;
      }
      return;
    } else if (tipo === "derrota") {
      // Derrota — som descendente triste
      o.type = "sawtooth";
      o.frequency.setValueAtTime(380, t);
      o.frequency.exponentialRampToValueAtTime(160, t + 0.5);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      o.start(t); o.stop(t + 0.55);
    } else if (tipo === "bloqueio") {
      // Queimada/bloqueio — som de impacto grave
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.25);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    } else if (tipo === "chuva") {
      // Chuva forte +2 — som de respingo
      o.type = "sine";
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(300, t + 0.2);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.25);
    } else if (tipo === "conquista") {
      // Conquista desbloqueada — jingle brilhante
      let mel2 = [660, 880, 1100];
      for (let i = 0; i < mel2.length; i++) {
        let oi = audioCtx.createOscillator();
        let gi = audioCtx.createGain();
        oi.connect(gi); gi.connect(audioCtx.destination);
        oi.type = "triangle";
        oi.frequency.setValueAtTime(mel2[i], t + i * 0.1);
        gi.gain.setValueAtTime(0.0, t + i * 0.1);
        gi.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02);
        gi.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.18);
        oi.start(t + i * 0.1); oi.stop(t + i * 0.1 + 0.2);
      }
      return;
    } else if (tipo === "menu") {
      // Entrar no menu — som suave de boas-vindas
      o.type = "sine";
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(660, t + 0.15);
      g.gain.setValueAtTime(0.10, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    }
  } catch(e) {}
}

// 🎵 MÚSICA DE FUNDO — TRILHA CAMPESTRE
let musicaNodes = []; // nós ativos da música
let musicaTocando = false;
let musicaVolume = 0.18;
let musicaGainNode = null;
let musicaProximoTempo = 0;
let musicaLoopTimeout = null;

function iniciarMusica() {
  try {
    iniciarAudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (musicaTocando) return;
    musicaTocando = true;

    // Cria um nó de ganho mestre para a música
    musicaGainNode = audioCtx.createGain();
    musicaGainNode.gain.setValueAtTime(musicaVolume, audioCtx.currentTime);
    musicaGainNode.connect(audioCtx.destination);

    tocarLoopMusica();
  } catch(e) {}
}

function pararMusica() {
  try {
    if (!musicaTocando) return;
    musicaTocando = false;
    if (musicaLoopTimeout) clearTimeout(musicaLoopTimeout);
    if (musicaGainNode) {
      musicaGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        try { musicaGainNode.disconnect(); } catch(e) {}
        musicaGainNode = null;
        // Para todos os osciladores ativos
        for (let n of musicaNodes) { try { n.stop(); } catch(e) {} }
        musicaNodes = [];
      }, 600);
    }
  } catch(e) {}
}

// Toca uma "estrofe" da música campestre e agenda a próxima
let _musicaVariacao = 0;
function tocarLoopMusica() {
  if (!musicaTocando || !musicaGainNode) return;
  try {
    let t = audioCtx.currentTime;
    _musicaVariacao = (_musicaVariacao + 1) % 4;

    // === MELODIAS — alterna entre 4 variações para não enjoar ===
    let melodias = [
      // Variação 1 — tema principal campestre
      [
        { f: 392, dur: 0.5 }, { f: 440, dur: 0.25 }, { f: 494, dur: 0.25 },
        { f: 587, dur: 0.5 }, { f: 659, dur: 0.5 },  { f: 587, dur: 0.25 },
        { f: 494, dur: 0.25 }, { f: 440, dur: 0.5 }, { f: 392, dur: 1.0 },
      ],
      // Variação 2 — resposta melódica mais suave
      [
        { f: 494, dur: 0.4 }, { f: 440, dur: 0.4 }, { f: 392, dur: 0.4 },
        { f: 330, dur: 0.5 }, { f: 392, dur: 0.75 }, { f: 440, dur: 0.75 },
        { f: 494, dur: 1.2 },
      ],
      // Variação 3 — pausa + acorde ambiente (a música "respira")
      [], // só harmonia e baixo, sem melodia
      // Variação 4 — ornamento ascendente
      [
        { f: 330, dur: 0.25 }, { f: 392, dur: 0.25 }, { f: 440, dur: 0.25 },
        { f: 494, dur: 0.5 },  { f: 587, dur: 0.5 },  { f: 659, dur: 0.5 },
        { f: 587, dur: 0.25 }, { f: 494, dur: 0.5 }, { f: 440, dur: 0.75 },
      ],
    ];

    let melodia = melodias[_musicaVariacao];
    let acc = 0;
    for (let nota of melodia) {
      let om = audioCtx.createOscillator();
      let gm = audioCtx.createGain();
      om.connect(gm); gm.connect(musicaGainNode);
      om.type = "triangle";
      om.frequency.setValueAtTime(nota.f, t + acc);
      gm.gain.setValueAtTime(0.0, t + acc);
      gm.gain.linearRampToValueAtTime(0.5, t + acc + 0.04);
      gm.gain.exponentialRampToValueAtTime(0.001, t + acc + nota.dur * 0.85);
      om.start(t + acc);
      om.stop(t + acc + nota.dur);
      musicaNodes.push(om);
      acc += nota.dur;
    }

    // === BAIXO — só toca nas variações 1, 2 e 4 ===
    if (_musicaVariacao !== 2) {
      let baixo = [
        { f: 98,  dur: 1.0 }, { f: 110, dur: 1.0 },
        { f: 98,  dur: 1.0 }, { f: 110, dur: 1.5 },
      ];
      let accB = 0;
      for (let nota of baixo) {
        let ob = audioCtx.createOscillator();
        let gb = audioCtx.createGain();
        ob.connect(gb); gb.connect(musicaGainNode);
        ob.type = "sine";
        ob.frequency.setValueAtTime(nota.f, t + accB);
        gb.gain.setValueAtTime(0.0, t + accB);
        gb.gain.linearRampToValueAtTime(0.3, t + accB + 0.08);
        gb.gain.exponentialRampToValueAtTime(0.001, t + accB + nota.dur * 0.9);
        ob.start(t + accB);
        ob.stop(t + accB + nota.dur);
        musicaNodes.push(ob);
        accB += nota.dur;
      }
    }

    // === HARMONIA — acordes suaves ===
    let harmonia = [
      { fs: [294, 370, 440], t: 0.0,  dur: 1.8 },
      { fs: [330, 415, 494], t: 1.8,  dur: 1.8 },
      { fs: [294, 370, 440], t: 3.6,  dur: 1.8 },
    ];
    // Na variação 3 (pausa), harmonia mais suave
    let volHarm = _musicaVariacao === 2 ? 0.07 : 0.11;
    for (let acorde of harmonia) {
      for (let f of acorde.fs) {
        let oh = audioCtx.createOscillator();
        let gh = audioCtx.createGain();
        oh.connect(gh); gh.connect(musicaGainNode);
        oh.type = "sine";
        oh.frequency.setValueAtTime(f, t + acorde.t);
        gh.gain.setValueAtTime(0.0, t + acorde.t);
        gh.gain.linearRampToValueAtTime(volHarm, t + acorde.t + 0.18);
        gh.gain.exponentialRampToValueAtTime(0.001, t + acorde.t + acorde.dur * 0.9);
        oh.start(t + acorde.t);
        oh.stop(t + acorde.t + acorde.dur);
        musicaNodes.push(oh);
      }
    }

    // Duração desta variação
    let duracoes = [5.5, 5.0, 4.0, 5.5];
    let duracaoLoop = duracoes[_musicaVariacao];

    // Pausa extra na variação 3 (respiro musical)
    let pausaExtra = _musicaVariacao === 2 ? 1200 : 100;

    musicaLoopTimeout = setTimeout(() => {
      musicaNodes = [];
      tocarLoopMusica();
    }, duracaoLoop * 1000 + pausaExtra);

  } catch(e) {}
}

// Botão mute/unmute no HUD
let musicaMutada = false;
function alternarMusica() {
  if (musicaMutada) {
    musicaMutada = false;
    if (musicaGainNode) musicaGainNode.gain.setValueAtTime(musicaVolume, audioCtx.currentTime);
    else iniciarMusica();
  } else {
    musicaMutada = true;
    if (musicaGainNode) musicaGainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
  }
}

// 🎬 ANIMAÇÃO DE ENTRADA DO MENU
let menuAnimFrame = 0;
let menuAnimDuracao = 90; // ~1.5s a 60fps
let menuJaAnimou = false;
// Cartas que voam para o lugar na entrada do menu
let cartasMenuAnim = [
  { simbolo:"🌱", cor:"verde",   xFinal: -200, yFinal: -130, rot: -0.3,  xIni:  0, yIni: -500, mi: 0 }, // Reflorestamento
  { simbolo:"💧", cor:"azul",    xFinal:  200, yFinal: -130, rot:  0.25, xIni:  0, yIni: -500, mi: 1 }, // Gotejamento
  { simbolo:"☀️", cor:"amarelo", xFinal: -200, yFinal:  130, rot:  0.28, xIni: -600, yIni: 0, mi: 2  }, // Energia Solar
  { simbolo:"🔄", cor:"marrom",  xFinal:  200, yFinal:  130, rot: -0.22, xIni:  600, yIni: 0, mi: 3  }, // Rotação Culturas
];

// 🃏 BANCO DE DADOS DAS CARTAS
const modelos = [
  { cor:"verde", simbolo:"🌱", nome:"Reflorestamento", info:"Pilar Verde: Reduz CO2 e protege rios (+10 pts)" },
  { cor:"azul", simbolo:"💧", nome:"Gotejamento", info:"Pilar Azul: Irrigação eficiente na raiz (+10 pts)" },
  { cor:"amarelo", simbolo:"☀️", nome:"Energia Solar", info:"Pilar Solar: Gera energia limpa no campo (+10 pts)" },
  { cor:"marrom", simbolo:"🔄", nome:"Rotação Culturas", info:"Pilar Solo: Recupera nutrientes da terra (+10 pts)" },
  { cor:"especial", simbolo:"🔥", nome:"Queimada", efeito:"bloqueio", info:"Ataque: Oponente perde a vez por 1 rodada." },
  { cor:"chuva", simbolo:"🌧️+2", nome:"Chuva Forte", efeito:"mais2", info:"Ataque: Faz o oponente comprar +2 cartas. Cor gerada aleatoriamente!" },
  { cor:"especial", simbolo:"♻️", nome:"Reciclagem", efeito:"trocaCor", info:"Coringa: O bot ou você escolhem a melhor cor." }
];

// 🛍️ BANCO DE DADOS DAS SKINS
const listaSkinsLoja = [
  { id: "padrao", nome: "Estilo Clássico", preco: 0, raridade: "Comum", desc: "Visual limpo do AgroUNO original." },
  { id: "ventania", nome: "Eco-Ventania", preco: 50, raridade: "Comum", desc: "Tema de ventos, moinhos e folhas soltas." },
  { id: "solar", nome: "Fusão Solar", preco: 100, raridade: "Rara", desc: "Raios de luz animados e brilho dourado térmico." },
  { id: "labareda", nome: "Labareda", preco: 150, raridade: "Rara", desc: "Inspirada no perigo das queimadas agrícolas." },
  { id: "reciclagem", nome: "Reciclagem Ativa", preco: 200, raridade: "Épica", desc: "Bordas brilhantes e padrão ativo de setas ecológicas." },
  { id: "agua", nome: "Fluxo Hídrico", preco: 250, raridade: "Rara", desc: "Visual dinâmico de gotas d'água e reflexos fluidos." },
  { id: "ouro", nome: "Colheita Dourada", preco: 400, raridade: "Épica", desc: "Edição de luxo banhada a ouro sustentável com cintilação." },
  { id: "cyber", nome: "Cyber-Agro 2077", preco: 500, raridade: "Lendária", desc: "Neon pulsante e linhas cibernéticas de plantio tecnológico." },
  { id: "floresta", nome: "Mata Fechada", preco: 600, raridade: "Épica", desc: "Textura camuflada de conservação nativa biológica." },
  { id: "galaxia", nome: "Cosmos Biodegradável", preco: 800, raridade: "Lendária", desc: "Nebulosas vivas e estrelas animadas feitas de poeira estelar." }
];

// ��️ SISTEMA DE CONQUISTAS EXPANDIDO
let listaConquistas = [
  { id: "mestre_solar", titulo: "☀️ Mestre da Energia Clean", desc: "Jogou a carta de Energia Solar duas vezes na partida.", alcancada: false, recompensa: 40 },
  { id: "guarda_florestal", titulo: "🌳 Guarda Florestal", desc: "Ganhou a partida sem que o Bot conseguisse usar a Queimada.", alcancada: false, recompensa: 60 },
  { id: "eco_campeao", titulo: "🏆 Campeão Ecológico", desc: "Alcançou mais de 100 pontos de manejo na partida.", alcancada: false, recompensa: 50 },
  { id: "mestre_queimada", titulo: "🔥 Mestre da Queimada", desc: "Bloqueou o Bot jogando a carta Queimada.", alcancada: false, recompensa: 30 },
  { id: "senhor_reciclagem", titulo: "♻️ Senhor da Reciclagem", desc: "Venceu a partida utilizando a skin Reciclagem Ativa.", alcancada: false, recompensa: 70 },
  { id: "mestre_chuvas", titulo: "🌧️ Mestre das Chuvas", desc: "Comprou cartas sob o efeito de uma Tempestade Elétrica.", alcancada: false, recompensa: 50 },
  { id: "plantador_supremo", titulo: "🌱 Plantador Supremo", desc: "Venceu acumulando mais de 150 pontos na partida.", alcancada: false, recompensa: 100 },
  { id: "lenda_agrouno", titulo: "👑 Lenda AgroUNO", desc: "Acumule um saldo total de mais de 1200 EcoMoedas.", alcancada: false, recompensa: 150 },
  { id: "vencedor_radi", titulo: "💀 Sobrevivente RADI", desc: "Venceu uma partida na dificuldade RADI.", alcancada: false, recompensa: 200 },
  { id: "colecionar_skins", titulo: "🛍️ Colecionador Verde", desc: "Comprou 5 ou mais skins na loja.", alcancada: false, recompensa: 80 },
  { id: "partida_rapida", titulo: "⚡ Relâmpago Agrícola", desc: "Venceu uma partida em menos de 2 minutos.", alcancada: false, recompensa: 90 },
  { id: "grito_agro", titulo: "📢 Voz do Campo", desc: "Gritou AGRO! com sucesso 3 vezes em partidas.", alcancada: false, recompensa: 60 }
];

function setup(){
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica');
  corFiltroClima = color(0, 0);

  carregarDadosProgresso();

  for(let i = 0; i < 7; i++) {
    nuvens.push({ 
      x: random(width), 
      y: random(20, height * 0.25), 
      velocidade: random(0.2, 0.4), 
      tamanho: random(100, 140),
      opacidade: random(200, 240)
    });
  }
  iniciarPartida();
  estado = "loading";
}

function draw(){
  clear();
  ventoGeral += 0.02;
  
  if(estado == "loading"){
    desenharTelaCarregamento();
    return;
  }
  
  if (cenarioAtual === 0) desenharFundoTrigoRealista();
  else if (cenarioAtual === 1) desenharFundoMarRealista();
  else if (cenarioAtual === 2) desenharFundoMontanhasNeveMelhorado();
  else if (cenarioAtual === 3) desenharFundoFloresMelhorado();
  else if (cenarioAtual === 4) desenharFundoFazenda();
  
  renderizarFiltroVisualClima();
  desenharControlesInterfaceFixos();

  if(estado == "menu"){
    desenharMenu();
  } else if(estado == "jogo" || estado == "fim"){
    desenharMesa();
    desenharCartasBot(); 
    desenharCartasJogador();
    desenharHUD();
    desenharInterfaceAgro(); 
    desenharParticulas();
    if(mostraSeletorCor) desenharSeletorCor();
    
    atualizarTemporizadorAgroBot();

    if(animandoCarta) atualizarEfeitoDeslizar();
    if(estado == "fim") desenharTelaFimDoJogo();
    // Overlay do tutorial por cima de tudo
    if (tutorialAtivo) desenharOverlayTutorial();
    
    desenharPopUpConquista();
  } else if(estado == "guia") {
    desenharTelaGuia();
  } else if(estado == "dificuldade") {
    desenharTelaDificuldade();
  } else if(estado == "qtcartas") {
    desenharTelaQtCartas();
  } else if(estado == "embaralhando") {
    atualizarAnimacaoEmbaralhar();
    desenharAnimacaoEmbaralhar();
  } else if(estado == "regras") {
    desenharTelaRegras();
  } else if(estado == "conquistas") {
    desenharTelaConquistas();
  } else if(estado == "loja") {
    desenharTelaLoja();
  }
} 

function mouseWheel(event) {
  if (estado === "guia") {
    scrollManual += event.delta;
    scrollManual = constrain(scrollManual, 0, maxScrollManual);
  } else if (estado === "loja") {
    scrollLoja += event.delta;
    scrollLoja = constrain(scrollLoja, 0, maxScrollLoja);
  }
}

function salvarDadosProgresso() {
  try {
    localStorage.setItem("agrouno_moedas",      ecoMoedas);
    localStorage.setItem("agrouno_skin",         skinEquipada);
    localStorage.setItem("agrouno_inventario",   JSON.stringify(inventarioSkins));
    localStorage.setItem("agrouno_conquistas",   JSON.stringify(listaConquistas.map(c => ({ id: c.id, alcancada: c.alcancada }))));
    localStorage.setItem("agrouno_gritos_agro",  contadorGritosAgro);
    localStorage.setItem("agrouno_salvo",        "1"); // marcador de que já salvou
  } catch(e) {
    console.warn("AgroUNO: Não foi possível salvar no localStorage.", e);
  }
}

function carregarDadosProgresso() {
  try {
    if (localStorage.getItem("agrouno_salvo") === "1") {
      let moedas = localStorage.getItem("agrouno_moedas");
      if (moedas !== null) ecoMoedas = parseInt(moedas);

      let skin = localStorage.getItem("agrouno_skin");
      if (skin) skinEquipada = skin;

      let inv = localStorage.getItem("agrouno_inventario");
      if (inv) {
        let parsed = JSON.parse(inv);
        if (Array.isArray(parsed) && parsed.length > 0) inventarioSkins = parsed;
      }

      let conquistasSalvas = JSON.parse(localStorage.getItem("agrouno_conquistas") || "[]");
      if (conquistasSalvas) {
        for (let salva of conquistasSalvas) {
          let original = listaConquistas.find(x => x.id === salva.id);
          if (original) original.alcancada = salva.alcancada;
        }
      }

      let gritos = localStorage.getItem("agrouno_gritos_agro");
      if (gritos !== null) contadorGritosAgro = parseInt(gritos);

      console.log("AgroUNO: Progresso carregado! 🪙", ecoMoedas, "| 🎨", skinEquipada, "| 📦", inventarioSkins);
    } else {
      console.log("AgroUNO: Nenhum save encontrado — jogo novo.");
    }
  } catch(e) {
    console.warn("AgroUNO: Erro ao carregar progresso.", e);
  }
}

// =================================================================
// 🎨 CENÁRIOS ATUALIZADOS (MAIS BONITOS E LEVES)
// =================================================================

// 🌾 TRIGO — campo denso, 3 camadas de espigas, céu dourado rico
function desenharFundoTrigoRealista(){
  push(); rectMode(CORNER);

  // Céu gradiente amanhecer dourado profundo
  for(let y = 0; y < height * 0.46; y++) {
    let t = map(y, 0, height * 0.46, 0, 1);
    let cor = t < 0.4
      ? lerpColor(color(255, 140, 20), color(255, 195, 60), t / 0.4)
      : t < 0.7
        ? lerpColor(color(255, 195, 60), color(100, 185, 255), (t - 0.4) / 0.3)
        : lerpColor(color(100, 185, 255), color(175, 220, 255), (t - 0.7) / 0.3);
    stroke(cor); line(0, y, width, y);
  }
  noStroke();

  // Sol grande com múltiplos halos
  let solX = width * 0.76, solY = height * 0.13;
  for(let r = 240; r > 0; r -= 16) {
    fill(255, 215, 70, map(r, 240, 0, 1, 18)); circle(solX, solY, r);
  }
  stroke(255, 235, 110, 35); strokeWeight(2.5);
  for(let a = 0; a < 14; a++) {
    let ang = (a / 14) * TWO_PI + frameCount * 0.002;
    line(solX + cos(ang)*36, solY + sin(ang)*36, solX + cos(ang)*80, solY + sin(ang)*80);
  }
  noStroke();
  fill(255, 252, 195); circle(solX, solY, 48);
  fill(255, 255, 235); circle(solX, solY, 30);

  // Nuvens volumosas em 3 camadas
  for(let n of nuvens) {
    n.x += n.velocidade * 0.22; if(n.x > width + 200) n.x = -200;
    fill(255, 255, 255, n.opacidade * 0.65);
    ellipse(n.x, n.y, n.tamanho * 2.2, n.tamanho);
    ellipse(n.x - n.tamanho * 0.55, n.y + 6, n.tamanho * 1.3, n.tamanho * 0.75);
    ellipse(n.x + n.tamanho * 0.55, n.y + 6, n.tamanho * 1.3, n.tamanho * 0.75);
    ellipse(n.x, n.y - n.tamanho * 0.35, n.tamanho * 0.9, n.tamanho * 0.65);
  }

  // Colinas distantes — 3 camadas de profundidade
  fill(135, 175, 80, 160);
  beginShape(); vertex(0, height * 0.50);
  for(let x = 0; x <= width; x += 70) vertex(x, height * 0.40 + sin(x * 0.006) * 24);
  vertex(width, height * 0.50); endShape(CLOSE);

  fill(110, 155, 60, 180);
  beginShape(); vertex(0, height * 0.50);
  for(let x = 0; x <= width; x += 50) vertex(x, height * 0.44 + cos(x * 0.009 + 1) * 18);
  vertex(width, height * 0.50); endShape(CLOSE);

  fill(90, 135, 50, 200);
  beginShape(); vertex(0, height * 0.50);
  for(let x = 0; x <= width; x += 35) vertex(x, height * 0.47 + sin(x * 0.013 + 2) * 12);
  vertex(width, height * 0.50); endShape(CLOSE);

  // Solo com sulcos de plantio
  fill(100, 68, 32); rect(0, height * 0.50, width, height * 0.50);
  for(let sx = 0; sx < width; sx += 24) {
    fill(sx % 48 === 0 ? color(115, 80, 40) : color(88, 55, 22));
    rect(sx, height * 0.50, 12, height * 0.50);
  }

  let vento = ventoGeral;

  // Camada 1 — trigo distante (mais escuro, pequeno, fundo)
  fill(165, 125, 38, 180);
  beginShape(); vertex(0, height); vertex(0, height * 0.52);
  for(let x = 0; x <= width + 60; x += 20) {
    vertex(x + sin(vento * 0.7 + x * 0.022) * 6, height * 0.52 + sin(vento * 0.6 + x * 0.016) * 5);
  }
  vertex(width, height); endShape(CLOSE);

  // Camada 2 — trigo médio
  fill(210, 168, 52, 210);
  beginShape(); vertex(0, height); vertex(0, height * 0.49);
  for(let x = 0; x <= width + 60; x += 22) {
    vertex(x + sin(vento + x * 0.018) * 9, height * 0.49 + sin(vento * 0.9 + x * 0.014) * 8);
  }
  vertex(width, height); endShape(CLOSE);

  // Camada 3 — trigo dourado da frente
  fill(248, 200, 65);
  beginShape(); vertex(0, height); vertex(0, height * 0.46);
  for(let x = 0; x <= width + 60; x += 18) {
    vertex(x + sin(vento * 1.2 + x * 0.015) * 13, height * 0.46 + sin(vento + x * 0.012) * 11);
  }
  vertex(width, height); endShape(CLOSE);

  // Espigas densas — a cada 14px com haste e grãos detalhados
  noStroke();
  for(let i = 0; i < width; i += 14) {
    let oscBase = sin(vento * 1.3 + i * 0.038) * 13;
    let baseY = height * 0.48;
    let altoY = baseY - 52 - sin(i * 0.065) * 14;
    let altura = sin(i * 0.09 + 1) * 8;

    // Haste fina
    stroke(170, 130, 35); strokeWeight(1.2);
    line(i + oscBase * 0.25, baseY, i + oscBase, altoY + 7 + altura);

    // Folha lateral
    noStroke(); fill(140, 165, 45, 160);
    push(); translate(i + oscBase * 0.5, altoY + 25 + altura);
    rotate(0.5 + oscBase * 0.04); ellipse(0, 0, 16, 5); pop();

    // Grãos da espiga
    for(let g = 0; g < 6; g++) {
      let gy = altoY + g * 6.5 + altura;
      let brilho = 255 - g * 12;
      fill(brilho, brilho - 40, 40 + g * 6);
      ellipse(i + oscBase + sin(g * 0.9) * 2.5, gy, 5, 7.5);
    }
    // Aresta
    stroke(255, 238, 110, 140); strokeWeight(0.8);
    line(i + oscBase, altoY + altura, i + oscBase, altoY - 14 + altura);
  }

  // Borboletas e pássaros
  noStroke();
  for(let b = 0; b < 4; b++) {
    let bfx = (frameCount * (0.55 + b * 0.28) + b * 210) % (width + 80) - 40;
    let bfy = height * 0.30 + sin(frameCount * 0.038 + b * 1.8) * 35;
    let bat = sin(frameCount * 0.22 + b) * 0.5 + 0.5;
    fill(255, 195 + b * 15, 70, 210);
    push(); translate(bfx, bfy);
    ellipse(-7 * bat, -3, 14 * bat, 9); ellipse(7 * bat, -3, 14 * bat, 9);
    fill(70, 35, 8); rect(0, -2, 2, 11, 1); pop();
  }
  // Pássaro simples ao longe
  stroke(60, 40, 20); strokeWeight(1.5); noFill();
  let px = (frameCount * 0.4 + 100) % (width + 40) - 20;
  arc(px, height * 0.20, 20, 6, PI, 0);
  arc(px + 22, height * 0.20, 16, 5, PI, 0);

  pop();
}

// 🌳 FLORESTA TROPICAL — mata fechada, árvores altas, raios de luz, sombra e vida
function desenharFundoMarRealista() {
  push(); rectMode(CORNER);

  // Céu quase encoberto entre as copas — luz filtrada, verde profundo
  for (let y = 0; y < height * 0.38; y++) {
    let t = map(y, 0, height * 0.38, 0, 1);
    stroke(lerpColor(color(18, 65, 22), color(40, 110, 35), t)); line(0, y, width, y);
  }
  noStroke();

  // Raios de luz solar entrando pela copa
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    let rx = width * (0.08 + i * 0.14);
    let angulo = sin(i * 1.3) * 0.18;
    let alpha = 18 + sin(frameCount * 0.018 + i) * 8;
    fill(220, 255, 180, alpha);
    push(); translate(rx, 0); rotate(angulo);
    beginShape();
    vertex(-22, 0); vertex(22, 0);
    vertex(14 + i * 2, height * 0.82); vertex(-14 - i * 2, height * 0.82);
    endShape(CLOSE);
    pop();
  }
  drawingContext.restore();

  // Solo da floresta — camadas de terra, raízes e musgo
  for (let y = height * 0.38; y < height; y++) {
    let t = map(y, height * 0.38, height, 0, 1);
    stroke(lerpColor(color(22, 60, 18), color(14, 38, 10), t)); line(0, y, width, y);
  }
  noStroke();

  // Musgo e folhiço no chão
  for (let x = 0; x < width; x += 18) {
    let h2 = 14 + sin(x * 0.09 + 1.5) * 7;
    fill(20 + sin(x*0.07)*10, 75 + sin(x*0.12)*20, 15, 180);
    ellipse(x + random(-4,4), height - h2 * 0.5, 20 + random(6), h2);
  }

  // Função árvore de floresta tropical — tronco alto, copa densa, irregular
  function arvoreFlorest(ax, escala, ilum) {
    let baseY = height;
    let troncoH = (220 + random(-30,30)) * escala;
    let troncoW = (22 + random(-4,4)) * escala;
    let corTronco = ilum ? color(55, 32, 12) : color(35, 20, 8);
    // Tronco
    fill(corTronco);
    beginShape();
    vertex(ax - troncoW*0.5, baseY);
    vertex(ax - troncoW*0.38, baseY - troncoH * 0.6);
    vertex(ax - troncoW*0.28, baseY - troncoH);
    vertex(ax + troncoW*0.28, baseY - troncoH);
    vertex(ax + troncoW*0.38, baseY - troncoH * 0.6);
    vertex(ax + troncoW*0.5, baseY);
    endShape(CLOSE);
    // Raízes tabulares
    fill(lerpColor(corTronco, color(20,50,12), 0.4));
    for (let r = -1; r <= 1; r += 2) {
      beginShape();
      vertex(ax + r * troncoW*0.5, baseY);
      vertex(ax + r * troncoW*0.5, baseY - troncoH * 0.22);
      vertex(ax + r * (troncoW*0.5 + 28*escala), baseY);
      endShape(CLOSE);
    }
    // Copa em camadas — circular, exuberante
    let copaY = baseY - troncoH;
    let copaR = (90 + random(-12,12)) * escala;
    let g1 = ilum ? color(28, 118, 32) : color(18, 72, 20);
    let g2 = ilum ? color(40, 145, 38) : color(25, 95, 25);
    let g3 = ilum ? color(55, 175, 50) : color(32, 118, 30);
    // Sombra da copa
    fill(0, 40); ellipse(ax + 10, copaY + copaR*0.4, copaR*2.2, copaR*0.6);
    // Camadas da copa
    fill(g1); ellipse(ax - copaR*0.28, copaY + copaR*0.22, copaR*1.4, copaR*1.1);
    fill(g1); ellipse(ax + copaR*0.32, copaY + copaR*0.25, copaR*1.3, copaR*1.0);
    fill(g2); ellipse(ax, copaY - copaR*0.12, copaR*1.7, copaR*1.25);
    fill(g2); ellipse(ax - copaR*0.18, copaY - copaR*0.3, copaR*1.2, copaR*0.9);
    fill(g3); ellipse(ax + copaR*0.1, copaY - copaR*0.5, copaR*1.0, copaR*0.75);
    // Brilho topo (luz)
    if (ilum) { fill(180, 255, 140, 35); ellipse(ax - copaR*0.1, copaY - copaR*0.55, copaR*0.6, copaR*0.35); }
  }

  // Árvores fundo — pequenas, escuras
  randomSeed(42);
  for (let i = 0; i < 14; i++) {
    let ax = (i / 13) * (width + 60) - 30;
    arvoreFlorest(ax, 0.38 + sin(i*1.1)*0.07, false);
  }
  // Árvores meio
  randomSeed(77);
  for (let i = 0; i < 10; i++) {
    let ax = (i / 9) * (width + 80) - 40;
    arvoreFlorest(ax, 0.62 + sin(i*0.9)*0.10, i%3===0);
  }
  // Vegetação rasteira — samambaias e arbustos
  for (let x = 0; x < width; x += 38) {
    let vy = height - 30 - abs(sin(x*0.08))*30;
    fill(25 + sin(x*0.06)*10, 90 + sin(x*0.11)*25, 18, 210);
    // Samambaia
    push(); translate(x, vy);
    for (let f = 0; f < 6; f++) {
      rotate(radians(30));
      fill(22 + f*3, 85 + f*8, 18, 200);
      ellipse(18, 0, 28, 8);
    }
    pop();
  }
  // Árvores frente — grandes, com luz
  randomSeed(99);
  for (let i = 0; i < 7; i++) {
    let ax = (i / 6) * (width + 100) - 50;
    arvoreFlorest(ax, 0.90 + sin(i*1.4)*0.12, i%2===0);
  }

  // Pássaros voando (tucanos silhueta)
  fill(20, 15, 8, 180);
  for (let b = 0; b < 5; b++) {
    let bx = ((frameCount * (0.4 + b*0.15) + b * 180) % (width + 80)) - 40;
    let by = height * 0.06 + sin(b*1.7) * 28;
    push(); translate(bx, by);
    ellipse(0, 0, 14, 7);
    arc(-6, 0, 12, 9, PI, TWO_PI);
    arc(6, 0, 12, 9, PI, TWO_PI);
    pop();
  }

  noStroke();
  pop();
}

// ☕ CAFEZAL — produção de café paranaense, pés de café em fileiras, montanhas ao fundo
function desenharFundoMontanhasNeveMelhorado() {
  push(); rectMode(CORNER);

  // Céu ao amanhecer — laranja, rosa e azul celeste
  for (let y = 0; y < height * 0.52; y++) {
    let t = map(y, 0, height * 0.52, 0, 1);
    let cor;
    if (t < 0.35)      cor = lerpColor(color(255, 130, 40), color(255, 185, 100), t / 0.35);
    else if (t < 0.65) cor = lerpColor(color(255, 185, 100), color(180, 220, 255), (t-0.35)/0.30);
    else               cor = lerpColor(color(180, 220, 255), color(120, 185, 255), (t-0.65)/0.35);
    stroke(cor); line(0, y, width, y);
  }
  noStroke();

  // Sol nascendo no horizonte
  let solX = width * 0.72, solY = height * 0.44;
  for (let r = 240; r > 0; r -= 18) {
    fill(255, 210, 80, map(r, 240, 0, 2, 22)); circle(solX, solY, r);
  }
  fill(255, 248, 200); circle(solX, solY, 58);
  fill(255, 255, 240); circle(solX, solY, 36);

  // Nuvens suaves rosadas
  for (let n of nuvens) {
    n.x += n.velocidade * 0.15; if (n.x > width + 200) n.x = -200;
    let ts = n.tamanho * 0.85;
    fill(255, 200, 160, 50); ellipse(n.x + 6, n.y + 8, ts*2.2, ts*0.75);
    fill(255, 230, 210, n.opacidade * 0.75);
    ellipse(n.x, n.y, ts*2.2, ts);
    ellipse(n.x - ts*0.5, n.y + ts*0.1, ts*1.3, ts*0.78);
    ellipse(n.x + ts*0.5, n.y + ts*0.1, ts*1.3, ts*0.78);
    ellipse(n.x - ts*0.2, n.y - ts*0.38, ts*1.0, ts*0.65);
    ellipse(n.x + ts*0.2, n.y - ts*0.32, ts*0.85, ts*0.55);
  }

  // Montanhas ao fundo — azuladas, suaves
  fill(90, 125, 100, 180);
  beginShape(); vertex(0, height);
  vertex(0, height*0.42); vertex(width*0.15, height*0.28); vertex(width*0.30, height*0.38);
  vertex(width*0.48, height*0.22); vertex(width*0.65, height*0.35); vertex(width*0.80, height*0.24);
  vertex(width, height*0.32); vertex(width, height); endShape(CLOSE);

  fill(110, 148, 118, 200);
  beginShape(); vertex(0, height);
  vertex(0, height*0.48); vertex(width*0.12, height*0.36); vertex(width*0.28, height*0.44);
  vertex(width*0.45, height*0.30); vertex(width*0.60, height*0.42); vertex(width*0.75, height*0.32);
  vertex(width*0.90, height*0.40); vertex(width, height*0.36); vertex(width, height); endShape(CLOSE);

  // Solo das lavouras — terra avermelhada paranaense (terra roxa)
  for (let y = height * 0.52; y < height; y++) {
    let t = map(y, height*0.52, height, 0, 1);
    stroke(lerpColor(color(100, 45, 18), color(75, 30, 10), t)); line(0, y, width, y);
  }
  noStroke();

  // Fileiras de pés de café em perspectiva
  // Cada fileira: da esquerda à direita, ligeiramente inclinada, diminuindo no fundo
  function pesDeCafe(fx, fy, escala, ilum) {
    // Caule principal
    fill(ilum ? color(80, 48, 18) : color(55, 32, 10));
    rect(fx - 3*escala, fy - 38*escala, 6*escala, 38*escala, 2);
    // Galhos laterais em 3 pares
    for (let g = 0; g < 3; g++) {
      let gy = fy - (12 + g*12)*escala;
      fill(ilum ? color(70, 42, 14) : color(48, 28, 8));
      // Galho esquerdo
      push(); translate(fx - 3*escala, gy); rotate(radians(-30 - g*8));
      rect(0, -2*escala, 18*escala, 4*escala, 2); pop();
      // Galho direito
      push(); translate(fx + 3*escala, gy); rotate(radians(30 + g*8));
      rect(-18*escala, -2*escala, 18*escala, 4*escala, 2); pop();
      // Folhas nos galhos — elipses verdes brilhantes
      let cf = ilum ? color(35, 145, 40) : color(22, 100, 25);
      fill(cf);
      ellipse(fx - 18*escala, gy, 18*escala, 9*escala);
      ellipse(fx + 18*escala, gy, 18*escala, 9*escala);
    }
    // Copa superior arredondada
    let cf2 = ilum ? color(42, 165, 45) : color(28, 115, 30);
    fill(cf2); ellipse(fx, fy - 44*escala, 34*escala, 22*escala);
    // Frutos — bolinhas vermelhas e laranjas (café cereja)
    if (escala > 0.6) {
      for (let f = 0; f < 8; f++) {
        let fa = f * (TWO_PI/8);
        let fr = 10*escala;
        let fcor = f%3===0 ? color(220,50,20) : f%3===1 ? color(200,120,10) : color(180,40,10);
        fill(fcor);
        circle(fx + cos(fa)*fr, fy - (24 + sin(fa)*8)*escala, 5*escala);
      }
    }
    // Brilho folha
    if (ilum) { fill(200, 255, 160, 40); ellipse(fx, fy - 44*escala, 18*escala, 10*escala); }
  }

  // Grade de pés de café em perspectiva — fileiras se afastando
  let fileiras = 6;
  for (let fi = 0; fi < fileiras; fi++) {
    let t = fi / (fileiras - 1);
    let fy = height * (0.56 + t * 0.36);
    let escala = 0.38 + t * 0.58;
    let numPes = 9;
    for (let pi = 0; pi < numPes; pi++) {
      let fx = (pi / (numPes-1)) * (width + 60) - 30;
      // linhas de terra entre fileiras
      if (pi === 0) {
        stroke(lerpColor(color(85, 38, 14), color(60, 24, 6), t));
        strokeWeight(1.5);
        line(0, fy + 5*escala, width, fy + 5*escala);
        noStroke();
      }
      pesDeCafe(fx, fy, escala, fi % 2 === 0);
    }
  }

  // Trabalhadores (silhuetas simples) colhendo café
  for (let w = 0; w < 3; w++) {
    let wx = width * (0.18 + w * 0.32);
    let wy = height * (0.72 + w * 0.06);
    let ws = 0.55 + w * 0.12;
    fill(40, 22, 8, 220);
    // Corpo
    ellipse(wx, wy - 28*ws, 14*ws, 20*ws);     // cabeça
    rect(wx - 8*ws, wy - 18*ws, 16*ws, 22*ws, 3); // torso
    // Chapéu de palha
    fill(200, 160, 60, 220);
    ellipse(wx, wy - 36*ws, 22*ws, 7*ws);
    triangle(wx - 14*ws, wy - 33*ws, wx + 14*ws, wy - 33*ws, wx, wy - 46*ws);
    // Braço colhendo
    fill(40, 22, 8, 200);
    push(); translate(wx + 8*ws, wy - 14*ws); rotate(radians(-40 + sin(frameCount*0.04 + w)*15));
    rect(0, 0, 4*ws, 18*ws, 2); pop();
    // Cesto
    fill(160, 110, 40, 200);
    rect(wx - 10*ws, wy, 20*ws, 14*ws, 3);
    fill(140, 90, 30, 200); rect(wx - 10*ws, wy, 20*ws, 4*ws, 3);
  }

  // Névoa leve no horizonte
  fill(255, 230, 200, 35);
  rect(0, height*0.50, width, height*0.08);

  pop();
}


// 🌿 EUCALIPTOS — plantação densa estilo foto, troncos altos e retos, copa no topo, céu azul
function desenharFundoFloresMelhorado() {
  push(); rectMode(CORNER);

  // ── CÉU AZUL CLARO — dia sem sol visível ──
  for (let y = 0; y < height * 0.58; y++) {
    let t = map(y, 0, height * 0.58, 0, 1);
    stroke(lerpColor(color(72, 152, 220), color(172, 212, 242), t));
    line(0, y, width, y);
  }
  noStroke();

  // Nuvens brancas e fofas esparsas
  for (let n of nuvens) {
    n.x += n.velocidade * 0.08; if (n.x > width + 220) n.x = -220;
    let ts = n.tamanho * 0.9;
    fill(190, 205, 220, 35); ellipse(n.x + 5, n.y + 8, ts * 2.5, ts * 0.72);
    fill(255, 255, 255, n.opacidade * 0.94);
    ellipse(n.x, n.y, ts * 2.5, ts);
    ellipse(n.x - ts * 0.55, n.y + ts * 0.10, ts * 1.45, ts * 0.82);
    ellipse(n.x + ts * 0.55, n.y + ts * 0.10, ts * 1.42, ts * 0.80);
    fill(250, 252, 255, n.opacidade * 0.88);
    ellipse(n.x - ts * 0.20, n.y - ts * 0.38, ts * 1.12, ts * 0.70);
    ellipse(n.x + ts * 0.22, n.y - ts * 0.30, ts * 0.92, ts * 0.58);
  }

  // ── ESCURIDÃO DE FUNDO da floresta densa ──
  // Na foto: interior escuro entre os troncos, apenas troncos da frente bem visíveis
  fill(10, 22, 12);
  rect(0, height * 0.28, width, height * 0.72);

  // ── FUNÇÃO EUCALIPTO DE PLANTAÇÃO ──
  // Característica: tronco MUITO alto e reto, fino, sem galhos nos 75% inferiores,
  // copa densa e larga só nos 25% superiores. Casca clara, acinzentada.
  function eucaliptoPlantacao(ax, baseY, altH, largT, ilum) {
    let topY = baseY - altH;
    // Curvatura levíssima — eucaliptos de plantação são praticamente retos
    let curv = sin(ax * 0.018 + 1.2) * largT * 0.6;

    // === TRONCO ===
    // Casca do eucalipto: clara, esbranquiçada/acinzentada, com variações de tom
    // Iluminação lateral: lado esquerdo mais claro (sol vindo da esquerda como na foto)
    for (let tx = -largT; tx <= largT; tx++) {
      let bv = map(abs(tx), 0, largT, 0, 1);
      // Luz lateral: esquerda clara, direita em sombra
      let ilumFactor = tx < 0 ? map(tx, -largT, 0, 0.55, 1.0) : map(tx, 0, largT, 1.0, 0.38);
      let baseR, baseG, baseB;
      if (ilum) {
        baseR = 195; baseG = 180; baseB = 155;
      } else {
        baseR = 138; baseG = 125; baseB = 100;
      }
      let r = baseR * ilumFactor;
      let g = baseG * ilumFactor;
      let b = baseB * ilumFactor;
      stroke(r, g, b);
      strokeWeight(1);
      let xBase = ax + tx;
      let xTopo = ax + curv + tx * (1 - 0.18);
      line(xBase, baseY, xTopo, topY);
    }
    noStroke();

    // Textura de casca — fissuras finas verticais
    stroke(ilum ? color(105, 88, 65, 70) : color(62, 50, 35, 65));
    strokeWeight(0.4);
    for (let tf = 0; tf < 2; tf++) {
      let txf = ax - largT * 0.3 + tf * largT * 0.6;
      for (let seg = 0; seg < 5; seg++) {
        let sy0 = baseY - altH * (seg / 5 + random(0, 0.05));
        let sy1 = baseY - altH * ((seg + 1) / 5 - random(0, 0.05));
        line(txf + random(-0.8, 0.8), sy0, txf + curv * (seg / 5) + random(-0.8, 0.8), sy1);
      }
    }
    noStroke();

    // === COPA — densa, volumosa, arredondada, apenas no topo ===
    let copaBaseY = topY + altH * 0.06;
    let copaH     = altH * 0.28;
    let copaW     = largT * (ilum ? 11 : 9);
    let cx        = ax + curv;

    // Verde escuro profundo do eucalipto na foto
    let c1 = ilum ? color(28,  72, 32)  : color(16, 42, 18);   // escuro base
    let c2 = ilum ? color(42,  98, 46)  : color(25, 60, 28);   // meio
    let c3 = ilum ? color(58, 125, 62)  : color(35, 80, 40);   // claro
    let c4 = ilum ? color(80, 152, 75)  : color(46, 100, 50);  // brilho
    let c5 = ilum ? color(105, 175, 88) : color(58, 118, 58);  // luz solar

    // Galhos finos visíveis na transição tronco→copa
    stroke(ilum ? color(82, 58, 30) : color(52, 36, 18));
    strokeWeight(1.0);
    for (let gb = 0; gb < 5; gb++) {
      let gy  = copaBaseY - copaH * (0.05 + gb * 0.18);
      let lado = (gb % 2 === 0) ? 1 : -1;
      let ang = radians(lado * (22 + gb * 9));
      let gLen = copaW * (0.28 + gb * 0.06);
      line(cx, gy, cx + cos(ang) * gLen, gy + sin(ang) * gLen * 0.45);
    }
    noStroke();

    // Copa: camadas de trás para frente para dar profundidade volumosa
    // Camada mais escura de fundo — larga
    fill(c1);
    ellipse(cx - copaW*0.12, copaBaseY - copaH*0.32, copaW*1.15, copaH*0.90);
    ellipse(cx + copaW*0.16, copaBaseY - copaH*0.28, copaW*1.08, copaH*0.85);

    // Camada intermediária
    fill(c2);
    ellipse(cx,              copaBaseY - copaH*0.45, copaW*1.05, copaH*0.88);
    ellipse(cx - copaW*0.26, copaBaseY - copaH*0.38, copaW*0.78, copaH*0.72);
    ellipse(cx + copaW*0.26, copaBaseY - copaH*0.35, copaW*0.74, copaH*0.68);

    // Tufos frontais
    fill(c3);
    ellipse(cx + copaW*0.08, copaBaseY - copaH*0.56, copaW*0.85, copaH*0.76);
    ellipse(cx - copaW*0.18, copaBaseY - copaH*0.48, copaW*0.72, copaH*0.66);
    ellipse(cx + copaW*0.28, copaBaseY - copaH*0.42, copaW*0.60, copaH*0.55);

    // Topo com luz do céu
    fill(c4);
    ellipse(cx - copaW*0.04, copaBaseY - copaH*0.68, copaW*0.62, copaH*0.50);
    ellipse(cx + copaW*0.20, copaBaseY - copaH*0.62, copaW*0.52, copaH*0.44);

    // Brilho lateral (luz solar vindo da esquerda)
    if (ilum) {
      fill(c5);
      ellipse(cx - copaW*0.32, copaBaseY - copaH*0.52, copaW*0.40, copaH*0.40);
      fill(118, 192, 92, 55);
      ellipse(cx - copaW*0.35, copaBaseY - copaH*0.60, copaW*0.26, copaH*0.26);
    }

    // Folhas pendulares na borda — detalhe realista
    noStroke();
    for (let fp = 0; fp < 7; fp++) {
      let fpAng = radians(-105 + fp * 36 + random(-10, 10));
      let fpR   = copaW * (0.46 + random(0.05));
      let fpX   = cx + cos(fpAng) * fpR;
      let fpY   = copaBaseY - copaH*0.38 + sin(fpAng) * copaH * 0.36;
      push();
      translate(fpX, fpY);
      rotate(fpAng + HALF_PI + random(-0.35, 0.35));
      fill(lerpColor(c2, c3, random(1)));
      ellipse(0, 11*(altH/250), 4*(largT/4), 20*(altH/250));
      pop();
    }
  }

  // ── SILHUETAS DE TRONCOS DO FUNDO — muitos, escuros, próximos ──
  randomSeed(12);
  let numFundo = 60;
  for (let i = 0; i < numFundo; i++) {
    let ax    = (i / (numFundo - 1)) * (width + 30) - 15 + random(-5, 5);
    let baseY = height * (0.87 + random(-0.03, 0.03));
    let altH  = height * (0.64 + random(0, 0.12));
    let largT = random(1.0, 2.2);
    let alpha = random(80, 170);
    let topY  = baseY - altH;

    // Tronco escuro
    fill(20 + random(14), 16 + random(10), 10 + random(8), alpha);
    noStroke();
    beginShape();
    vertex(ax - largT, baseY);
    vertex(ax - largT*0.5, baseY - altH*0.5);
    vertex(ax - largT*0.3, topY);
    vertex(ax + largT*0.3, topY);
    vertex(ax + largT*0.5, baseY - altH*0.5);
    vertex(ax + largT, baseY);
    endShape(CLOSE);

    // Copa de fundo escura
    fill(18+random(10), 40+random(18), 20+random(10), alpha*0.80);
    let cW = largT * random(7, 12);
    let cH = altH  * random(0.22, 0.30);
    ellipse(ax, topY + cH*0.25, cW, cH);
    ellipse(ax - cW*0.24, topY + cH*0.32, cW*0.70, cH*0.76);
    ellipse(ax + cW*0.24, topY + cH*0.28, cW*0.68, cH*0.72);
  }

  // ── EUCALIPTOS DA CAMADA DO MEIO ──
  randomSeed(33);
  let numMeio = 26;
  for (let i = 0; i < numMeio; i++) {
    let ax    = (i / (numMeio-1)) * (width + 70) - 35 + random(-7, 7);
    let baseY = height * (0.89 + random(-0.02, 0.02));
    let altH  = height * (0.62 + random(0, 0.10));
    let largT = random(1.8, 3.2);
    eucaliptoPlantacao(ax, baseY, altH, largT, i % 3 === 0);
  }

  // ── EUCALIPTOS DO PRIMEIRO PLANO — os mais visíveis ──
  randomSeed(66);
  let numFrente = 14;
  for (let i = 0; i < numFrente; i++) {
    let ax    = (i / (numFrente-1)) * (width + 90) - 45 + random(-4, 4);
    let baseY = height * (0.97 + random(-0.01, 0.01));
    let altH  = height * (0.76 + random(0, 0.10));
    let largT = random(3.2, 5.8);
    eucaliptoPlantacao(ax, baseY, altH, largT, i % 2 === 0);
  }

  // ── CHÃO — terra avermelhada com grama curta (como na base da foto) ──
  noStroke();
  for (let y = height * 0.93; y < height; y++) {
    let t = map(y, height * 0.93, height, 0, 1);
    stroke(lerpColor(color(152, 105, 62), color(108, 72, 40), t));
    line(0, y, width, y);
  }
  noStroke();

  // Grama e folhiço na base
  randomSeed(55);
  for (let x = 0; x < width; x += 7) {
    let gy  = height * 0.93 + random(-2, 4);
    let gh  = random(5, 17);
    let gw  = random(1.5, 3.5);
    let corG = random(1) < 0.55
      ? color(72+random(-8,8), 98+random(-8,8), 36+random(-5,5), 210)
      : color(128+random(-10,10), 105+random(-10,10), 46+random(-5,5), 165);
    fill(corG); noStroke();
    triangle(x - gw, gy + gh, x + gw, gy + gh, x + random(-1.5, 1.5), gy);
    if (random(1) < 0.28) {
      fill(82+random(-8,8), 112+random(-8,8), 40+random(-5,5), 175);
      triangle(x - gw*0.55, gy + gh*0.5, x + gw*0.55, gy + gh*0.5, x + random(-1,1), gy - 4);
    }
  }

  noStroke();
  pop();
}



// 🚜 FAZENDA — celeiro, silo, cerca, trator, animais, horta, árvores frutíferas
function desenharFundoFazenda() {
  push(); rectMode(CORNER);

  // Céu de tarde quente
  for(let y = 0; y < height * 0.50; y++) {
    let t = map(y, 0, height * 0.50, 0, 1);
    stroke(lerpColor(color(255, 175, 60), color(140, 205, 255), t)); line(0, y, width, y);
  }
  noStroke();

  // Sol poente alaranjado
  let solX = width * 0.82, solY = height * 0.20;
  for(let r = 180; r > 0; r -= 16) {
    fill(255, 140, 30, map(r, 180, 0, 1, 16)); circle(solX, solY, r);
  }
  fill(255, 200, 80); circle(solX, solY, 50);
  fill(255, 230, 140); circle(solX, solY, 32);

  // Nuvens cor-de-pêssego
  for(let n of nuvens) {
    n.x += n.velocidade * 0.2; if(n.x > width + 160) n.x = -160;
    fill(255, 220, 180, n.opacidade * 0.8);
    ellipse(n.x, n.y, n.tamanho * 2, n.tamanho);
    ellipse(n.x - n.tamanho * 0.45, n.y + 5, n.tamanho * 1.2, n.tamanho * 0.8);
    ellipse(n.x + n.tamanho * 0.45, n.y + 5, n.tamanho * 1.2, n.tamanho * 0.8);
  }

  // Colinas verdes ao fundo
  fill(80, 130, 55, 180);
  beginShape(); vertex(0, height); vertex(0, height * 0.46);
  for(let x = 0; x <= width; x += 50) vertex(x, height * 0.46 + sin(x * 0.007) * 20);
  vertex(width, height); endShape(CLOSE);

  // Chão da fazenda — terra batida
  fill(155, 110, 60); rect(0, height * 0.50, width, height * 0.50);
  // Listras de terra arada
  fill(130, 90, 45);
  for(let lx = 0; lx < width; lx += 36) rect(lx, height * 0.50, 18, height * 0.50);

  // === GALPÃO / CELEIRO ===
  let celX = width * 0.62, celY = height * 0.38;
  // Sombra
  fill(60, 30, 10, 80); rect(celX + 8, celY + 8, 160, 120, 4);
  // Paredes
  fill(185, 55, 40); rect(celX, celY, 160, 120, 4);
  // Teto triangular vermelho-escuro
  fill(140, 30, 20);
  triangle(celX - 12, celY, celX + 172, celY, celX + 80, celY - 60);
  // Detalhe do teto (ripas)
  stroke(110, 20, 10); strokeWeight(1.5);
  for(let r = 0; r < 8; r++) {
    let rx = celX - 12 + r * 23;
    line(rx, celY, celX + 80, celY - 60);
  }
  noStroke();
  // Porta grande do celeiro
  fill(100, 60, 25); rect(celX + 55, celY + 50, 50, 70, 3);
  fill(120, 75, 35); rect(celX + 57, celY + 52, 22, 66, 2);
  fill(90, 50, 18); rect(celX + 83, celY + 52, 20, 66, 2);
  // Dobradiça
  fill(180, 160, 130); circle(celX + 79, celY + 60, 5); circle(celX + 79, celY + 110, 5);
  // Janela redonda no topo
  fill(160, 210, 255); circle(celX + 80, celY + 25, 26);
  fill(185, 55, 40); line(celX + 67, celY + 25, celX + 93, celY + 25);
  stroke(185, 55, 40); line(celX + 80, celY + 12, celX + 80, celY + 38); noStroke();
  // Chaminé
  fill(100, 70, 50); rect(celX + 130, celY - 70, 16, 30, 2);
  fill(60, 40, 30); rect(celX + 126, celY - 76, 24, 10, 3);
  // Fumaça saindo da chaminé
  for(let f = 0; f < 3; f++) {
    let fy = celY - 80 - f * 18 - (frameCount * 0.3 + f * 6) % 20;
    let fx = celX + 138 + sin(frameCount * 0.04 + f) * 5;
    fill(220, 200, 180, 100 - f * 30);
    circle(fx, fy, 12 + f * 4);
  }

  // === SILO METÁLICO ===
  let siloX = width * 0.53, siloY = height * 0.34;
  fill(170, 175, 180); rect(siloX, siloY, 38, 130, 4);
  // Topo arredondado
  fill(150, 155, 160); ellipse(siloX + 19, siloY, 38, 24);
  fill(190, 195, 200); ellipse(siloX + 19, siloY, 28, 16);
  // Listras horizontais do silo
  stroke(140, 145, 150); strokeWeight(1);
  for(let s = 0; s < 8; s++) line(siloX, siloY + s * 16, siloX + 38, siloY + s * 16);
  noStroke();

  // === MOINHO DE VENTO ===
  let mX = width * 0.30, mY = height * 0.42;
  fill(200, 185, 155); rect(mX - 5, mY, 10, 80, 2);
  fill(215, 200, 170); rect(mX - 12, mY + 50, 24, 30, 3);
  // Pás girando
  push(); translate(mX, mY + 10); rotate(frameCount * 0.025);
  fill(230, 215, 185);
  for(let p = 0; p < 4; p++) {
    push(); rotate(p * HALF_PI);
    rect(-4, -40, 8, 38, 3);
    pop();
  }
  fill(180, 160, 130); circle(0, 0, 12);
  pop();

  // === ÁRVORES FRUTÍFERAS ===
  function arvore(ax, ay, tipo) {
    // Tronco
    fill(100, 65, 30); noStroke();
    rect(ax - 5, ay, 10, 35, 2);
    // Copa
    if(tipo === "maca") {
      fill(40, 130, 50); circle(ax, ay - 10, 55); circle(ax - 20, ay + 5, 38); circle(ax + 20, ay + 5, 38);
      // Maçãs
      fill(220, 40, 40);
      randomSeed(ax);
      for(let f = 0; f < 5; f++) circle(ax + random(-18, 18), ay + random(-20, 10), 7);
    } else {
      fill(50, 150, 40); circle(ax, ay - 8, 50); circle(ax - 18, ay + 6, 34); circle(ax + 18, ay + 6, 34);
      // Laranjas
      fill(255, 140, 0);
      randomSeed(ax + 1);
      for(let f = 0; f < 4; f++) circle(ax + random(-15, 15), ay + random(-18, 8), 8);
    }
  }
  arvore(width * 0.08, height * 0.46, "maca");
  arvore(width * 0.16, height * 0.49, "laranja");
  arvore(width * 0.91, height * 0.47, "maca");

  // === HORTA COM CANTEIROS ===
  let hX = width * 0.38, hY = height * 0.66;
  fill(90, 55, 22); rect(hX, hY, 130, 80, 4);
  // Canteiros
  for(let c = 0; c < 3; c++) {
    fill(110, 75, 35); rect(hX + 8 + c * 40, hY + 8, 28, 64, 3);
    // Plantinhas no canteiro
    stroke(40, 140, 50); strokeWeight(1.5);
    for(let p = 0; p < 4; p++) {
      let px = hX + 14 + c * 40 + p * 6;
      let py = hY + 65;
      line(px, py, px + sin(ventoGeral + px) * 3, py - 18);
    }
  }
  noStroke();
  // Regador
  fill(80, 140, 190); rect(hX + 135, hY + 45, 22, 16, 3);
  fill(70, 120, 170); rect(hX + 155, hY + 50, 18, 4, 2);
  fill(100, 160, 210); ellipse(hX + 145, hY + 42, 14, 10);

  // === TRATOR DETALHADO ===
  let tX = width * 0.42 + sin(frameCount * 0.008) * 3;
  let tY = height * 0.58;
  
  // Sombra do trator
  fill(0, 50); noStroke();
  ellipse(tX + 38, tY + 42, 110, 16);
  
  // Implemento agrícola (grade/arado atrás)
  fill(80, 70, 50); noStroke();
  for(let d = 0; d < 4; d++) {
    rect(tX - 22 + d * 7, tY + 20, 3, 22, 1);
  }
  rect(tX - 24, tY + 20, 30, 4, 1);
  fill(100, 85, 60);
  rect(tX - 18, tY + 15, 22, 5, 1);

  // Corpo principal do trator (chassi baixo)
  fill(30, 115, 40); noStroke(); rect(tX, tY + 8, 72, 28, 5);
  // Corpo superior
  fill(35, 128, 45); rect(tX + 2, tY, 68, 30, 5);
  
  // Detalhes do chassi — parafusos e painéis
  fill(25, 100, 35); rect(tX + 4, tY + 10, 18, 24, 3);
  fill(40, 138, 52); rect(tX + 26, tY + 10, 12, 14, 2);
  
  // Capô do motor (frontal inclinado)
  fill(32, 120, 42);
  quad(tX + 50, tY, tX + 75, tY + 5, tX + 75, tY + 28, tX + 50, tY + 26);
  // Grade frontal metálica
  fill(50, 50, 45); rect(tX + 64, tY + 6, 14, 20, 2);
  stroke(80, 80, 70); strokeWeight(1);
  for(let g = 0; g < 4; g++) line(tX + 64, tY + 8 + g * 4, tX + 78, tY + 8 + g * 4);
  for(let g = 0; g < 3; g++) line(tX + 66 + g * 4, tY + 6, tX + 66 + g * 4, tY + 26);
  noStroke();
  // Farol
  fill(255, 240, 180, 220); circle(tX + 76, tY + 14, 9);
  fill(255, 255, 220); circle(tX + 76, tY + 14, 5);
  // Brilho do farol
  fill(255, 255, 200, 60);
  triangle(tX + 76, tY + 14, tX + 92, tY + 8, tX + 92, tY + 22);
  
  // Cabine principal
  fill(42, 138, 55); noStroke(); rect(tX + 16, tY - 30, 40, 34, 6);
  // Teto da cabine com borda
  fill(28, 100, 38); rect(tX + 12, tY - 34, 48, 10, 4);
  // Moldura da janela
  fill(20, 60, 28); rect(tX + 19, tY - 28, 34, 26, 4);
  // Vidro da cabine — reflexo realista
  fill(160, 225, 255, 185); rect(tX + 21, tY - 26, 30, 22, 3);
  // Reflexo diagonal no vidro
  fill(220, 245, 255, 80);
  triangle(tX + 22, tY - 26, tX + 36, tY - 26, tX + 22, tY - 10);
  // Limpador de para-brisa
  stroke(40, 40, 40, 160); strokeWeight(1.5);
  line(tX + 23, tY - 25, tX + 44, tY - 17);
  noStroke();
  // Janela lateral
  fill(130, 200, 240, 160); rect(tX + 54, tY - 22, 10, 16, 2);
  
  // Escapamento vertical com fumaça animada
  fill(70, 65, 50); noStroke(); rect(tX + 46, tY - 44, 7, 16, 3);
  fill(85, 78, 60); rect(tX + 44, tY - 48, 11, 6, 2);
  for(let f = 0; f < 3; f++) {
    let fy2 = tY - 54 - f * 14 - (frameCount * 0.5 + f * 7) % 18;
    let fOff = sin(frameCount * 0.06 + f * 1.4) * 5;
    fill(180, 175, 160, 110 - f * 32); 
    circle(tX + 50 + fOff, fy2, 9 + f * 3);
  }
  
  // Antena
  stroke(50, 50, 45); strokeWeight(1.2);
  line(tX + 56, tY - 34, tX + 58, tY - 50);
  fill(255, 60, 60); noStroke(); circle(tX + 58, tY - 51, 4);
  
  // Roda traseira grande
  fill(28, 25, 22); noStroke(); circle(tX + 14, tY + 38, 44);
  // Aro externo da roda traseira
  stroke(50, 46, 40); strokeWeight(2); noFill();
  circle(tX + 14, tY + 38, 44);
  // Sulcos do pneu traseiro
  noStroke(); fill(45, 40, 35);
  for(let r = 0; r < 8; r++) {
    push(); translate(tX + 14, tY + 38); rotate(r * QUARTER_PI + frameCount * 0.012);
    fill(18, 15, 12); rect(-2, -22, 5, 14, 1);
    fill(55, 50, 44); rect(-1, -21, 2, 12, 1);
    pop();
  }
  // Centro da roda traseira
  fill(110, 105, 95); noStroke(); circle(tX + 14, tY + 38, 18);
  fill(135, 130, 120); circle(tX + 14, tY + 38, 10);
  fill(160, 155, 145); circle(tX + 14, tY + 38, 5);
  // Parafusos da roda
  fill(90, 85, 75);
  for(let r = 0; r < 5; r++) {
    push(); translate(tX + 14, tY + 38); rotate(r * TWO_PI / 5 + frameCount * 0.012);
    circle(0, -7, 3); pop();
  }
  
  // Roda dianteira menor
  fill(28, 25, 22); noStroke(); circle(tX + 62, tY + 38, 30);
  stroke(50, 46, 40); strokeWeight(1.5); noFill();
  circle(tX + 62, tY + 38, 30);
  noStroke();
  for(let r = 0; r < 6; r++) {
    push(); translate(tX + 62, tY + 38); rotate(r * (TWO_PI / 6) + frameCount * 0.018);
    fill(18, 15, 12); rect(-1.5, -15, 4, 10, 1);
    pop();
  }
  fill(105, 100, 90); noStroke(); circle(tX + 62, tY + 38, 12);
  fill(130, 125, 115); circle(tX + 62, tY + 38, 6);
  fill(155, 150, 140); circle(tX + 62, tY + 38, 3);
  
  // Eixo traseiro visível
  fill(60, 55, 48); noStroke(); rect(tX + 6, tY + 30, 22, 6, 2);
  fill(75, 70, 60); rect(tX + 8, tY + 31, 18, 3, 1);

  // === GALINHAS ===
  noStroke();
  for(let g = 0; g < 4; g++) {
    let gx = width * 0.18 + g * 35 + sin(frameCount * 0.05 + g) * 8;
    let gy = height * 0.72 + cos(frameCount * 0.07 + g) * 3;
    // Corpo
    fill(240, 235, 220); ellipse(gx, gy, 18, 14);
    // Cabeça
    fill(240, 235, 220); circle(gx + 10, gy - 6, 10);
    // Crista
    fill(220, 50, 50); triangle(gx + 8, gy - 11, gx + 12, gy - 16, gx + 15, gy - 11);
    // Bico
    fill(240, 180, 30); triangle(gx + 14, gy - 7, gx + 19, gy - 5, gx + 14, gy - 4);
    // Olho
    fill(20); circle(gx + 13, gy - 7, 2.5);
    // Pernas
    stroke(220, 170, 30); strokeWeight(1.5);
    line(gx + 2, gy + 6, gx, gy + 14); line(gx - 4, gy + 6, gx - 6, gy + 14);
    noStroke();
  }

  // === CERCA DE MADEIRA ===
  fill(160, 110, 60);
  for(let cx = 0; cx < width; cx += 35) {
    rect(cx + 4, height * 0.60, 10, height * 0.40 + 4, 2);
    triangle(cx + 4, height * 0.60, cx + 14, height * 0.60, cx + 9, height * 0.56);
  }
  fill(140, 95, 48);
  rect(0, height * 0.65, width, 8, 2);
  rect(0, height * 0.72, width, 8, 2);

  // === CAMINHO DE TERRA ===
  fill(175, 135, 75);
  beginShape();
  vertex(width * 0.44, height * 0.50);
  vertex(width * 0.56, height * 0.50);
  vertex(width * 0.62, height);
  vertex(width * 0.38, height);
  endShape(CLOSE);
  // Trilhas do trator
  stroke(150, 110, 55); strokeWeight(2);
  line(width * 0.46, height * 0.50, width * 0.42, height);
  line(width * 0.54, height * 0.50, width * 0.58, height);
  noStroke();

  pop();
}

function renderizarFiltroVisualClima() {
  push(); rectMode(CORNER);
  if (climaAtual === "Onda de Calor") {
    fill(245, 110, 15, 30 + sin(frameCount * 0.05) * 8); rect(0, 0, width, height);
  } else if (climaAtual === "Chuva Abençoada") {
    fill(35, 110, 220, 25); rect(0, 0, width, height);
    stroke(175, 215, 255, 160); strokeWeight(1.5);
    for(let i=0; i<8; i++) {
      let rx = noise(frameCount * 0.01 + i) * width;
      let ry = (frameCount * 12 + i * 90) % height;
      line(rx, ry, rx - 6, ry + 18);
    }
  } else if (climaAtual === "🌪️ Ventania") {
    fill(200, 220, 210, 20); rect(0, 0, width, height);
    stroke(255, 255, 255, 90); strokeWeight(1);
    for(let i=0; i<5; i++) {
      let vy = noise(frameCount * 0.02 + i) * height;
      let vx = (frameCount * 18 + i * 200) % (width + 200) - 100;
      line(vx, vy, vx + 80, vy + sin(frameCount*0.1 + i)*10);
    }
  } else if (climaAtual === "❄️ Geada") {
    fill(190, 235, 255, 35); rect(0, 0, width, height);
    noStroke(); fill(255, 255, 255, 140);
    for(let i=0; i<15; i++) {
      circle(noise(i*2 + frameCount*0.002)*width, (frameCount*1.5 + i*45)%height, random(2, 5));
    }
  } else if (climaAtual === "⚡ Tempestade Elétrica") {
    let flash = (frameCount % 75 < 3) ? 190 : 40;
    fill(15, 20, 45, flash); rect(0, 0, width, height);
    if(frameCount % 75 === 1) {
      stroke(255, 255, 240); strokeWeight(3);
      let tx = random(width*0.2, width*0.8);
      line(tx, 0, tx + 40, height*0.3); line(tx + 40, height*0.3, tx - 10, height*0.6); line(tx - 10, height*0.6, tx + 50, height);
    }
  } else if (climaAtual === "🌈 Clima Perfeito") {
    for(let r=0; r<6; r++){
      noFill(); stroke(color(255 - r*30, 100 + r*25, 150 + r*15, 25));
      strokeWeight(4); arc(width*0.5, height*0.3, 400 + r*8, 400 + r*8, PI, TWO_PI);
    }
  }
  pop();
}

function desenharControlesInterfaceFixos() {
  // Botão cenário fica em y=80 para não sobrepor o botão VOLTAR (y=35) das telas internas
  desenharBotao(90, 80, 140, 40, "🖼️ CENÁRIO", color(45, 55, 70), color(70, 85, 110));
}

function desenharTelaLoja() {
  push(); fill(12, 18, 14, 195); rectMode(CORNER); rect(0, 0, width, height);
  desenharBotao(80, 35, 140, 42, "⬅ VOLTAR", color(170, 50, 50), color(210, 65, 65));

  textAlign(CENTER, TOP); fill(100, 240, 120); textSize(32); textStyle(BOLD);
  text("MERCADO DE RECOMPENSAS AMBIENTAIS", width / 2, 30);
  fill(255, 215, 0); textSize(17); text("Seu saldo: 🪙 " + ecoMoedas, width / 2, 75);

  push();
  let startX = 200; let startY = 190 - scrollLoja; rectMode(CENTER);
  for(let i = 0; i < listaSkinsLoja.length; i++) {
    let item = listaSkinsLoja[i];
    let col = i % 2; let linha = floor(i / 2);
    let cardX = startX + (col * 240); let cardY = startY + (linha * 175);

    if(cardY > 120 && cardY < height - 60) {
      let selecionado = (skinSelecionadaLojaPreview === item.id);
      let corRaridade = color(120);
      if(item.raridade === "Rara") corRaridade = color(30, 144, 255);
      if(item.raridade === "Épica") corRaridade = color(155, 50, 205);
      if(item.raridade === "Lendária") corRaridade = color(255, 140, 0);

      fill(24, 32, 26, 245); stroke(selecionado ? color(100, 255, 120) : corRaridade);
      strokeWeight(selecionado ? 3 : 1.5); rect(cardX, cardY, 215, 150, 14);
      
      noStroke(); fill(corRaridade); rect(cardX, cardY - 62, 90, 14, 4);
      fill(255); textSize(9); textStyle(BOLD); textAlign(CENTER, CENTER); text(item.raridade.toUpperCase(), cardX, cardY - 62);

      fill(255); textSize(13); textStyle(BOLD); text(item.nome, cardX, cardY - 40);
      fill(190, 205, 190); textSize(10); textStyle(NORMAL); text(item.desc, cardX, cardY - 8, 195, 45);

      if(skinEquipada === item.id) {
        desenharBotao(cardX, cardY + 46, 150, 28, "EQUIPADO", color(45, 150, 80), color(45, 150, 80));
      } else if(inventarioSkins.includes(item.id)) {
        desenharBotao(cardX, cardY + 46, 150, 28, "EQUIPAR", color(50, 110, 180), color(60, 130, 215));
      } else {
        desenharBotao(cardX, cardY + 46, 150, 28, "🪙 " + item.preco, color(180, 70, 60), color(210, 85, 75));
      }
    }
  }
  pop();

  let barraX = width - 25;
  fill(30, 45, 35); rect(barraX, height/2, 10, height * 0.7, 5);
  let indicadorLojaY = map(scrollLoja, 0, maxScrollLoja, height/2 - height*0.32, height/2 + height*0.32);
  fill(100, 255, 120); rect(barraX, indicadorLojaY, 14, 45, 7);

  let painelX = width - 180; let painelY = height / 2 + 30;
  fill(20, 28, 22, 240); stroke(80, 130, 95); strokeWeight(2); rect(painelX, painelY, 310, 460, 20);
  noStroke(); fill(130, 245, 145); textSize(14); textStyle(BOLD); textAlign(CENTER, CENTER);
  text("PRÉVIA EM TEMPO REAL", painelX, painelY - 200);

  let itemFocoObj = listaSkinsLoja.find(x => x.id === skinSelecionadaLojaPreview) || listaSkinsLoja[0];
  push(); translate(painelX, painelY - 20); scale(1.6);
  let cMock = { cor: "verde", simbolo: "🌱", nome: "Reflorestamento", info: "Pilar Verde: Protege o ecossistema campo" };
  let bkp = skinEquipada; skinEquipada = itemFocoObj.id; desenharCarta(cMock, 0, 0, false, false); skinEquipada = bkp;
  pop();
  pop();
}


// ═══════════════════════════════════════════════════════════════
// 🎓 SISTEMA DE TUTORIAL INTERATIVO — AGROUNO
// ═══════════════════════════════════════════════════════════════

// Configuração de cada passo do tutorial
const TUTORIAL_PASSOS = [
  {
    titulo: "🌾 Bem-vindo ao AgroUNO!",
    texto: "Este é um jogo de cartas inspirado na agroecologia.\nSeu objetivo é ser o primeiro a se livrar de todas as cartas da mão.\nVamos aprender juntos como jogar!",
    destaque: null, // nenhuma seta
    acao: "botao", // avança com botão
    botaoTxt: "Vamos começar! ➡"
  },
  {
    titulo: "🃏 Sua mão de cartas",
    texto: "Essas são as suas cartas na parte de baixo da tela.\nCada carta tem uma COR e um NÚMERO ou EFEITO.\nVocê só pode jogar cartas que combinam com a carta do centro!",
    destaque: "mao",
    acao: "botao",
    botaoTxt: "Entendi! ➡"
  },
  {
    titulo: "🎯 A carta do centro",
    texto: "Essa é a carta da pilha de DESCARTE.\nVocê deve jogar uma carta que tenha a mesma COR\nou o mesmo NÚMERO que esta carta.",
    destaque: "mesa",
    acao: "botao",
    botaoTxt: "Entendi! ➡"
  },
  {
    titulo: "✅ Jogue uma carta!",
    texto: "Agora é sua vez! Clique em uma carta da sua mão\nque tenha a mesma cor ou número da carta do centro.\nCartas iluminadas estão disponíveis para jogar.",
    destaque: "mao",
    acao: "jogarcarta",
    botaoTxt: null
  },
  {
    titulo: "🤖 Vez do Oponente",
    texto: "Agora o Bot (oponente) vai jogar.\nObserve a carta que ele descarta na pilha central.\nQuando terminar será sua vez novamente.",
    destaque: "bot",
    acao: "botao",
    botaoTxt: "Observar ➡"
  },
  {
    titulo: "📦 Monte de Compra",
    texto: "Quando você não tiver nenhuma carta compatível,\nclique no MONTE (pilha fechada à esquerda) para comprar uma carta.\nSe a carta comprada for compatível, você pode jogá-la!",
    destaque: "monte",
    acao: "botao",
    botaoTxt: "Entendi! ➡"
  },
  {
    titulo: "🔥 Carta Especial: Queimada",
    texto: "A carta QUEIMADA faz o oponente PULAR a vez dele!\nÉ uma carta de ataque — use com estratégia.\nIcone: 🔥 chamas. Cor: Roxa.",
    destaque: "especial_queimada",
    acao: "botao",
    botaoTxt: "Legal! ➡"
  },
  {
    titulo: "🌧️ Carta Especial: Chuva Forte",
    texto: "A carta CHUVA FORTE faz o oponente comprar +2 cartas!\nMuito útil quando ele está prestes a ganhar.\nIcone: ☁️ nuvem. A cor é sorteada aleatoriamente.",
    destaque: "especial_chuva",
    acao: "botao",
    botaoTxt: "Entendi! ➡"
  },
  {
    titulo: "♻️ Coringa: Reciclagem",
    texto: "A carta RECICLAGEM é um CORINGA — pode ser jogada em qualquer momento!\nApós jogá-la, você escolhe a cor que a pilha passa a ter.\nUse quando estiver em apuros!",
    destaque: "especial_coringa",
    acao: "botao",
    botaoTxt: "Ótimo! ➡"
  },
  {
    titulo: "📢 AGRO! — O Grito do Campo!",
    texto: "Quando você tiver apenas 1 carta na mão,\nprecisa clicar no botão AGRO! antes do oponente perceber.\nSe esquecer, o oponente pode te denunciar e você compra +2!",
    destaque: "agro",
    acao: "botao",
    botaoTxt: "Vou lembrar! ➡"
  },
  {
    titulo: "🏆 Pontuação e Troféus",
    texto: "Ao vencer, você ganha TROFÉUS para desbloquear skins na loja.\nQuanto mais rápido vencer e mais especiais usar, mais pontos!\nSalve seus recordes e colecione conquistas.",
    destaque: null,
    acao: "botao",
    botaoTxt: "Incrível! ➡"
  },
  {
    titulo: "🌿 Você está pronto!",
    texto: "Parabéns! Você aprendeu tudo sobre o AgroUNO!\nLembre-se: combine cores e números, use cartas especiais com sabedoria\ne grite AGRO! quando tiver 1 carta. Boa sorte no campo!",
    destaque: null,
    acao: "fim",
    botaoTxt: "🎮 Jogar Agora!"
  }
];

function iniciarTutorial() {
  tutorialAtivo = true;
  tutorialPasso = 0;
  tutorialPulseFrame = 0;
  tutorialCartasSelecionadas = false;
  tutorialBotJogou = false;
  tutorialAgroFase = false;
  tutorialFimPasso = false;
  // Iniciar uma partida simulada para o tutorial
  dificuldade = "facil";
  quantidadeCartas = 5;
  estado = "jogo";
  turnoJogador = true;
  iniciarNovaPartida();
  menuJaAnimou = true;
}

function desenharOverlayTutorial() {
  if (!tutorialAtivo) return;
  tutorialPulseFrame++;

  let passo = TUTORIAL_PASSOS[tutorialPasso];
  let pulse = (sin(tutorialPulseFrame * 0.12) + 1) * 0.5; // 0..1

  // ── DESTAQUE COM SETA ──
  if (passo.destaque) {
    let dx, dy, dw, dh;

    if (passo.destaque === "mao") {
      // Destaque na mão do jogador
      let nC = cartasJogador.length;
      let espaco = min(125, (width - 40) / max(nC, 1));
      dw = nC * espaco + larguraCarta;
      dh = alturaCarta + 30;
      dx = width / 2 - dw / 2;
      dy = height - dh - 10;
    } else if (passo.destaque === "mesa") {
      dx = width / 2 + 70 - larguraCarta / 2 - 10;
      dy = height / 2 - alturaCarta / 2 - 10;
      dw = larguraCarta + 20;
      dh = alturaCarta + 20;
    } else if (passo.destaque === "monte") {
      dx = width / 2 - 130 - larguraCarta / 2 - 10;
      dy = height / 2 - alturaCarta / 2 - 10;
      dw = larguraCarta + 20;
      dh = alturaCarta + 20;
    } else if (passo.destaque === "bot") {
      dx = width / 2 - 150;
      dy = 10;
      dw = 300;
      dh = alturaCarta + 20;
    } else if (passo.destaque === "agro") {
      dx = 20;
      dy = height / 2 - 60;
      dw = 140;
      dh = 110;
    } else if (passo.destaque === "especial_queimada" ||
               passo.destaque === "especial_chuva"    ||
               passo.destaque === "especial_coringa") {
      // Mostrar carta de exemplo no centro
      dx = width / 2 - larguraCarta / 2 - 10;
      dy = height / 2 - alturaCarta / 2 - 10;
      dw = larguraCarta + 20;
      dh = alturaCarta + 20;
    }

    // Escurecer tudo fora do destaque
    fill(0, 0, 0, 140);
    rectMode(CORNER);
    rect(0, 0, dx, height);
    rect(dx + dw, 0, width - dx - dw, height);
    rect(dx, 0, dw, dy);
    rect(dx, dy + dh, dw, height - dy - dh);

    // Borda pulsante dourada no destaque
    noFill();
    stroke(255, 215, 0, 180 + pulse * 75);
    strokeWeight(3 + pulse * 2);
    rectMode(CORNER);
    rect(dx, dy, dw, dh, 12);
    noStroke();

    // Seta apontando para o destaque
    let setaX = dx + dw / 2;
    let setaY = dy - 28 - pulse * 6;
    fill(255, 215, 0, 220);
    // Triângulo seta para baixo
    triangle(setaX - 18, setaY, setaX + 18, setaY, setaX, setaY + 24);

    // Carta especial de demonstração se for esse destaque
    if (passo.destaque === "especial_queimada") {
      let mock = { cor:"especial", simbolo:"🔥", nome:"Queimada", info:"Ataque: Oponente perde a vez por 1 rodada.", efeito:"bloqueio", valor:null };
      push(); translate(width/2, height/2); scale(1.05); desenharCarta(mock, 0, 0, false, false); pop();
    } else if (passo.destaque === "especial_chuva") {
      let mock = { cor:"especial", simbolo:"☁️", nome:"Chuva Forte", info:"Ataque: Faz o oponente comprar +2 cartas.", efeito:"mais2", valor:null };
      push(); translate(width/2, height/2); scale(1.05); desenharCarta(mock, 0, 0, false, false); pop();
    } else if (passo.destaque === "especial_coringa") {
      let mock = { cor:"especial", simbolo:"♻️", nome:"Reciclagem", info:"Coringa: Você escolhe a próxima cor.", efeito:"coringa", valor:null };
      push(); translate(width/2, height/2); scale(1.05); desenharCarta(mock, 0, 0, false, false); pop();
    }
  } else {
    // Sem destaque — escurecer tela inteira levemente
    fill(0, 0, 0, 100);
    rectMode(CORNER);
    rect(0, 0, width, height);
  }

  // ── PAINEL DO TUTORIAL ──
  let painelW = 520;
  let painelH = 210;
  let painelX = width / 2;
  let painelY = height / 2 + (passo.destaque === "mao" ? -160 : 170);
  // Evitar sair da tela
  painelY = constrain(painelY, painelH / 2 + 10, height - painelH / 2 - 10);

  push();
  translate(painelX, painelY);
  rectMode(CENTER);

  // Sombra do painel
  fill(0, 0, 0, 120);
  rect(6, 8, painelW, painelH, 18);

  // Painel fundo verde escuro com borda dourada
  for (let i = 0; i < 6; i++) {
    let t = i / 5;
    fill(lerpColor(color(12, 42, 16), color(28, 72, 32), t));
    rect(0, i * 2, painelW - i * 4, painelH - i * 3, 18 - i * 2);
  }
  noFill(); stroke(255, 215, 0, 200); strokeWeight(2.5);
  rect(0, 0, painelW, painelH, 18);
  noStroke();

  // Linha separadora dourada abaixo do título
  stroke(255, 215, 0, 120); strokeWeight(1);
  line(-painelW / 2 + 20, -painelH / 2 + 52, painelW / 2 - 20, -painelH / 2 + 52);
  noStroke();

  // Indicador de passo (bolhas)
  let total = TUTORIAL_PASSOS.length;
  for (let b = 0; b < total; b++) {
    let bx = (b - (total - 1) / 2) * 16;
    fill(b === tutorialPasso ? color(255, 215, 0) : color(255, 255, 255, 60));
    circle(bx, painelH / 2 - 16, b === tutorialPasso ? 9 : 5);
  }

  // Título
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(19);
  fill(255, 220, 50);
  text(passo.titulo, 0, -painelH / 2 + 30);

  // Texto explicativo
  textStyle(NORMAL);
  textSize(14);
  fill(230, 245, 225);
  textLeading(22);
  text(passo.texto, 0, -painelH / 2 + 95, painelW - 40, 100);

  // Botão de avançar (se não for ação de jogar carta)
  if (passo.acao !== "jogarcarta") {
    let bW = 200, bH = 40;
    let bY = painelH / 2 - 35;
    let hoverBtn = mouseX > painelX - bW / 2 && mouseX < painelX + bW / 2 &&
                   mouseY > painelY + bY - bH / 2 && mouseY < painelY + bY + bH / 2;
    let corBtn = hoverBtn ? color(255, 185, 30) : color(210, 140, 15);
    fill(0, 0, 0, 80); rect(3, bY + 3, bW, bH, 10);
    fill(corBtn); rect(0, bY, bW, bH, 10);
    fill(15, 30, 15); textStyle(BOLD); textSize(14);
    text(passo.botaoTxt, 0, bY);
  } else {
    // Indicação animada para clicar na carta
    fill(255, 220, 80, 180 + pulse * 75);
    textStyle(BOLD); textSize(13);
    text("👆 Clique em uma carta compatível na sua mão", 0, painelH / 2 - 35);
  }

  pop();
}

function tutorialMousePressed() {
  if (!tutorialAtivo) return false;
  let passo = TUTORIAL_PASSOS[tutorialPasso];
  let painelW = 520, painelH = 210;
  let painelX = width / 2;
  let painelY = height / 2 + (passo.destaque === "mao" ? -160 : 170);
  painelY = constrain(painelY, painelH / 2 + 10, height - painelH / 2 - 10);

  if (passo.acao === "botao" || passo.acao === "fim") {
    let bW = 200, bH = 40;
    let bY = painelY + painelH / 2 - 35;
    if (mouseX > painelX - bW / 2 && mouseX < painelX + bW / 2 &&
        mouseY > bY - bH / 2 && mouseY < bY + bH / 2) {
      if (passo.acao === "fim") {
        tutorialAtivo = false;
        estado = "menu";
        menuJaAnimou = false;
      } else {
        tutorialPasso++;
        tutorialPulseFrame = 0;
        // Passo 4: bot joga automaticamente
        if (tutorialPasso === 4) {
          setTimeout(() => {
            jogadaBot();
            tutorialPasso = 5;
          }, 1800);
        }
      }
      return true; // consumiu o clique
    }
  }
  // Passo 3: jogar carta — deixa o jogo processar normalmente
  if (passo.acao === "jogarcarta") {
    return false; // não consome — jogo processa
  }
  return false;
}

// Chamado pelo jogo quando o jogador jogar uma carta durante o tutorial
function tutorialNotificarCartaJogada() {
  if (!tutorialAtivo) return;
  if (tutorialPasso === 3) {
    // Jogou carta com sucesso — avançar para passo do bot
    tutorialPasso = 4;
    tutorialPulseFrame = 0;
  }
}

function desenharTelaGuia() {
  push(); fill(14, 25, 14, 195); rectMode(CORNER); rect(0, 0, width, height);
  textAlign(CENTER, TOP); fill(255, 220, 50); textSize(32); textStyle(BOLD); text("MANUAL ECO SUSTENTÁVEL", width / 2, 40);
  
  desenharBotao(80, 35, 140, 42, "⬅ VOLTAR", color(150, 50, 50), color(200, 70, 70));

  push();
  let menuX = 180; let menuY = 140 - scrollManual;
  for(let i = 0; i < modelos.length; i++) {
    let itemY = menuY + (i * 70);
    if (itemY > 100 && itemY < height - 100) {
      let sel = (cartaSelecionadaGuia === i); rectMode(CENTER);
      fill(sel ? color(255, 215, 40) : color(20, 45, 25, 200)); stroke(255, 30);
      rect(menuX, itemY, 240, 55, 12);
      noStroke(); fill(sel ? 0 : 255); textSize(14); textStyle(sel ? BOLD : NORMAL);
      text(modelos[i].nome, menuX, itemY);
    }
  }
  pop();

  let expoX = width / 2 + 120; let expoY = height / 2 - 40;
  let cartaFoco = modelos[cartaSelecionadaGuia];
  push(); translate(expoX, expoY - 30); scale(1.7); desenharCarta(cartaFoco, 0, 0, false, false); pop();
  rectMode(CENTER); fill(0, 220); stroke(255, 40); rect(expoX, expoY + 240, 500, 80, 15);
  noStroke(); fill(255); textSize(15); text(cartaFoco.info, expoX, expoY + 240, 460, 65);
  pop();
}

function desenharMesa() {
  push(); fill(0, 70); stroke(255, 20); rectMode(CENTER); rect(width / 2 - 40, height / 2, 540, 230, 40);
  
  let monteX = width / 2 - 130; let monteY = height / 2;
  let hMonte = mouseX > monteX-larguraCarta/2 && mouseX < monteX+larguraCarta/2 && mouseY > monteY-alturaCarta/2 && mouseY < monteY+alturaCarta/2;
  
  desenharCartaMonteFechadoRealista(monteX, (hMonte && turnoJogador && !animandoCarta) ? monteY - 10 : monteY, hMonte);
  desenharCarta(cartaMesa, width / 2 + 70, height / 2, false, false);
  
  desenharBotao(width - 140, height / 2, 200, 45, "🏳️ ABANDONAR", color(170, 45, 45), color(215, 60, 60));
  pop();
}

function desenharCartaMonteFechadoRealista(x, y, hover) {
  push(); translate(x, y); if(hover) scale(1.06);
  rectMode(CENTER);

  // Sombra
  fill(0, 70); rect(7, 9, larguraCarta, alturaCarta, 16);

  // Gradiente verde-campo profundo (cor predominante do AgroUNO)
  for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
    let t = map(i, -alturaCarta/2, alturaCarta/2, 0, 1);
    stroke(lerpColor(color(12, 45, 16), color(38, 105, 38), t));
    line(-larguraCarta/2 + 2, i, larguraCarta/2 - 2, i);
  }

  // Padrão geométrico de losangos dourados sutis
  stroke(200, 165, 40, 22); strokeWeight(0.8);
  for(let lx = -larguraCarta/2; lx < larguraCarta/2; lx += 18) {
    line(lx, -alturaCarta/2, lx + 18, alturaCarta/2);
    line(lx + 18, -alturaCarta/2, lx, alturaCarta/2);
  }

  // Borda externa dourada brilhante
  noFill(); stroke(210, 170, 40); strokeWeight(3.5);
  rect(0, 0, larguraCarta, alturaCarta, 16);
  // Borda interna fina
  stroke(245, 215, 80, 130); strokeWeight(1.2);
  rect(0, 0, larguraCarta - 9, alturaCarta - 9, 12);

  // Halo central
  noStroke();
  for(let r = 60; r > 0; r -= 12) {
    fill(40, 100, 45, map(r, 60, 0, 5, 30));
    circle(0, 0, r + 20);
  }

  // Escudo/brasão central
  fill(22, 58, 26, 220);
  beginShape();
  vertex(-28, -38); vertex(28, -38); vertex(36, -10);
  vertex(0, 28); vertex(-36, -10);
  endShape(CLOSE);
  stroke(200, 165, 40, 160); strokeWeight(1.5); noFill();
  beginShape();
  vertex(-28, -38); vertex(28, -38); vertex(36, -10);
  vertex(0, 28); vertex(-36, -10);
  endShape(CLOSE);

  // Ícone de espiga dentro do escudo
  noStroke(); fill(230, 195, 55);
  textStyle(BOLD); textAlign(CENTER, CENTER); textSize(26);
  text("🌾", 0, -6);

  // Nome "AgroUNO" em cima do escudo
  fill(235, 205, 60); textSize(11); textStyle(BOLD);
  text("A G R O U N O", 0, -54);

  // Linha decorativa acima e abaixo do nome
  stroke(200, 165, 40, 120); strokeWeight(1);
  line(-35, -46, 35, -46);
  line(-35, -62, 35, -62);

  // "COMPRAR" embaixo do escudo
  noStroke(); fill(180, 220, 170, 200); textSize(9); textStyle(BOLD);
  text("COMPRAR CARTA", 0, 44);
  stroke(180, 220, 170, 80); strokeWeight(0.8);
  line(-32, 50, 32, 50);

  // Cantos decorativos com espiga pequena
  noStroke(); fill(200, 165, 40, 180); textSize(10);
  text("🌾", -larguraCarta/2 + 14, -alturaCarta/2 + 14);
  text("🌾", larguraCarta/2 - 14, alturaCarta/2 - 14);

  pop();
}

function desenharCartasBot(){
  push();
  let maxExibidas = min(cartasBot.length, 12);
  let espacamento = cartasBot.length > 8 ? 60 : 100;
  let inX = width / 2 - ((maxExibidas - 1) * espacamento) / 2;
  
  for(let i = 0; i < maxExibidas; i++){
    let x = inX + i * espacamento;
    let y = 35;
    
    push(); translate(x, y); scale(0.65);
    rectMode(CENTER);

    // Sombra
    fill(0, 55); rect(5, 7, larguraCarta, alturaCarta, 16);

    // Gradiente verde-campo agro
    for(let j = -alturaCarta/2; j < alturaCarta/2; j++) {
      let t = map(j, -alturaCarta/2, alturaCarta/2, 0, 1);
      stroke(lerpColor(color(12, 45, 16), color(38, 105, 38), t));
      line(-larguraCarta/2 + 2, j, larguraCarta/2 - 2, j);
    }

    // Borda dourada dupla
    noFill(); stroke(180, 145, 35); strokeWeight(3);
    rect(0, 0, larguraCarta, alturaCarta, 16);
    stroke(220, 185, 60, 100); strokeWeight(1);
    rect(0, 0, larguraCarta - 8, alturaCarta - 8, 12);

    // Padrão losango sutil
    stroke(255, 255, 255, 10); strokeWeight(0.8);
    for(let lx = -larguraCarta/2; lx < larguraCarta/2; lx += 18) {
      line(lx, -alturaCarta/2, lx + 18, alturaCarta/2);
      line(lx + 18, -alturaCarta/2, lx, alturaCarta/2);
    }

    // Elipse central
    noStroke(); fill(20, 50, 25, 200); ellipse(0, -10, 78, 55);
    fill(255, 255, 255, 15); ellipse(0, -10, 62, 42);

    // Texto e ícone
    fill(220, 195, 55); textStyle(BOLD); textAlign(CENTER, CENTER);
    textSize(13); text("AgroUNO", 0, -18);
    textSize(22); text("🌾", 0, 4);

    pop();
  }
  
  if(cartasBot.length > 12) {
    fill(255); textSize(14); textStyle(BOLD); textAlign(LEFT, CENTER);
    text("+ " + (cartasBot.length - 12), inX + (12 * espacamento) + 20, 35);
  }
  pop();
}

function desenharInterfaceAgro() {
  if (estado !== "jogo") return;
  
  let temUmaCarta = (cartasJogador.length === 1 && !jogadorGritouAgro);
  // Botão AGRO fixo no canto esquerdo
  let agroX = 75;
  let agroY = height - 130;
  
  desenharBotaoAgro(agroX, agroY, temUmaCarta);
  
  if (cartasBot.length === 1 && !botGritouAgro) {
    desenharBotao(width / 2 + 380, height - 120, 150, 55, "🚨 DENUNCIAR\nBOT!", color(180, 40, 150), color(215, 60, 185));
  }
}

function desenharBotaoAgro(x, y, ativo) {
  push();
  
  let hover = ativo && dist(mouseX, mouseY, x, y) < 55;
  let escala = hover ? 1.08 : 1.0;
  let corFundo = ativo ? (hover ? color(220, 30, 30) : color(190, 20, 20)) : color(90, 90, 90);
  let corBorda = ativo ? color(255, 100, 100) : color(140, 140, 140);
  let corTexto = ativo ? color(255, 255, 255) : color(180, 180, 180);
  let bw = 110, bh = 44;
  
  translate(x, y);
  scale(escala);
  
  noStroke(); fill(0, 80);
  rectMode(CENTER); rect(4, 5, bw, bh, 12);
  
  fill(corFundo);
  stroke(corBorda); strokeWeight(ativo ? 2.5 : 1.5);
  rect(0, 0, bw, bh, 12);
  
  noStroke(); fill(255, ativo ? 40 : 18);
  rect(0, -bh/2 + 7, bw - 8, bh/2 - 4, 8);
  
  noStroke(); fill(corTexto);
  textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(ativo ? 16 : 14);
  text(ativo ? "📢 AGRO!" : "AGRO!", 0, 0);
  
  if (ativo) {
    let pulso = abs(sin(frameCount * 0.12)) * 70 + 20;
    noFill(); stroke(255, 180, 180, pulso); strokeWeight(4);
    rect(0, 0, bw + 8, bh + 8, 15);
  }
  
  pop();
}

// =================================================================
// 🃏 SISTEMA DE ESTILOS DAS CARTAS
// =================================================================

function desenharCarta(carta, x, y, hover, esconder) {
  if (!carta) return;
  push(); translate(x, y); 
  if(hover && estado == "jogo" && !animandoCarta) scale(1.08); 
  
  rectMode(CENTER); noStroke(); 
  fill(0, 65); rect(6, 9, larguraCarta, alturaCarta, 18);

  if(skinEquipada === "cyber") {
    // Fundo escuro com grade de circuitos
    fill(8, 14, 26); rect(0, 0, larguraCarta, alturaCarta, 16);
    let pulso = 130 + sin(frameCount * 0.12) * 100;
    // Linhas de circuito animadas
    stroke(0, 245, 255, 40); strokeWeight(1);
    line(-larguraCarta/2+8, -35, 0, -35); line(0, -35, 0, -20);
    line(0, 20, 0, 40); line(0, 40, larguraCarta/2-8, 40);
    line(-larguraCarta/2+8, 15, -20, 15); line(20, -50, 20, -35);
    // Nós de circuito piscando
    fill(0, 245, 255, pulso); noStroke();
    circle(0, -35, 5); circle(0, 40, 5); circle(-20, 15, 4); circle(20, -35, 4);
    // Borda neon pulsante dupla
    stroke(0, 245, 255, pulso); strokeWeight(2.5);
    noFill(); rect(0, 0, larguraCarta - 4, alturaCarta - 4, 14);
    stroke(0, 180, 255, pulso * 0.4); strokeWeight(6);
    rect(0, 0, larguraCarta - 4, alturaCarta - 4, 14);
    // Brilho deslizante diagonal
    let scan = (-alturaCarta/2) + (frameCount * 2) % (alturaCarta + 20);
    stroke(0, 245, 255, 60); strokeWeight(1.5);
    line(-larguraCarta/2, scan, larguraCarta/2, scan - 10);

  } else if(skinEquipada === "ventania") {
    // Fundo azul-cinza de céu ventoso com gradiente
    for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
      stroke(lerpColor(color(30,60,90), color(90,130,160), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
      line(-larguraCarta/2, i, larguraCarta/2, i);
    }
    noStroke();
    // Ventos curvos animados passando pela carta
    let t = frameCount * 0.04;
    stroke(255, 255, 255, 70); strokeWeight(1.5); noFill();
    for(let w = 0; w < 5; w++) {
      let wy = -55 + w * 28;
      let offset = (frameCount * 2.5 + w * 35) % (larguraCarta + 40) - larguraCarta/2 - 20;
      let comprimento = 25 + w * 8;
      beginShape();
      for(let s = 0; s < comprimento; s += 4) {
        vertex(offset + s, wy + sin(s * 0.18 + t + w) * 4);
      }
      endShape();
    }
    // Folhinhas voando
    noStroke();
    for(let f = 0; f < 4; f++) {
      let fx = ((frameCount * (1.5 + f*0.4) + f * 45) % (larguraCarta + 30)) - larguraCarta/2 - 5;
      let fy = -60 + f * 38 + sin(frameCount * 0.05 + f) * 6;
      fill(80, 180, 80, 180);
      push(); translate(fx, fy); rotate(frameCount * 0.04 + f); ellipse(0, 0, 7, 4); pop();
    }
    // Moinho de vento no canto
    fill(200, 210, 220, 120); noStroke();
    rect(-35, 45, 3, 14, 1);
    push(); translate(-35, 38); rotate(frameCount * 0.06);
    fill(220, 230, 240, 160);
    ellipse(6, 0, 12, 4); ellipse(-6, 0, 12, 4);
    ellipse(0, 6, 4, 12); ellipse(0, -6, 4, 12);
    pop();
    // Borda com brilho de vento
    stroke(200, 230, 255, 140); strokeWeight(2); noFill();
    rect(0, 0, larguraCarta - 4, alturaCarta - 4, 14);

  } else if(skinEquipada === "reciclagem") {
    // Fundo verde escuro
    fill(15, 45, 25); rect(0, 0, larguraCarta, alturaCarta, 16);
    // Setas de reciclagem girando no fundo
    let pulsoVerde = 160 + sin(frameCount * 0.15) * 80;
    push(); rotate(frameCount * 0.008);
    stroke(60, 200, 100, 35); strokeWeight(6); noFill();
    arc(0, 0, 70, 70, 0, TWO_PI * 0.65);
    arc(0, 0, 70, 70, TWO_PI * 0.7, TWO_PI * 0.98);
    pop();
    // Partículas de folhas subindo
    noStroke();
    for(let p = 0; p < 5; p++) {
      let py = alturaCarta/2 - ((frameCount * 0.8 + p * 32) % (alturaCarta + 10));
      let px = -30 + p * 14 + sin(frameCount * 0.05 + p) * 8;
      fill(60, 210, 100, 120 + p * 20);
      push(); translate(px, py); rotate(frameCount * 0.03 + p); ellipse(0, 0, 6, 4); pop();
    }
    // Borda pulsante
    stroke(80, 255, 130, pulsoVerde); strokeWeight(3);
    noFill(); rect(0, 0, larguraCarta - 4, alturaCarta - 4, 14);
    stroke(80, 255, 130, pulsoVerde * 0.3); strokeWeight(7);
    rect(0, 0, larguraCarta - 4, alturaCarta - 4, 14);
    noStroke(); fill(40, 95, 55, 80); textSize(20);
    textAlign(CENTER, CENTER); text("♻️", -28, -50); text("♻️", 28, 48);

  } else if(skinEquipada === "solar") {
    // Fundo quente com gradiente do sol
    for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
      stroke(lerpColor(color(80, 30, 5), color(200, 90, 10), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
      line(-larguraCarta/2, i, larguraCarta/2, i);
    }
    // Halo solar pulsante
    let brilho = abs(sin(frameCount * 0.06));
    noStroke();
    for(let r = 4; r > 0; r--) {
      fill(255, 180, 0, brilho * 18 * r);
      circle(0, 0, 30 + r * 12);
    }
    fill(255, 215, 0, 80 + brilho * 60); circle(0, 0, 22);
    // Raios girando
    push(); rotate(frameCount * 0.006);
    stroke(255, 215, 0, 55 + brilho * 60); strokeWeight(2);
    for(let r = 0; r < 8; r++) {
      push(); rotate(r * QUARTER_PI);
      line(0, 14, 0, 32);
      pop();
    }
    pop();
    // Borda dourada brilhante
    let gradBrilho = abs(sin(frameCount*0.08)) * 4;
    stroke(255, 200, 0); strokeWeight(1.5 + gradBrilho);
    noFill(); rect(0, 0, larguraCarta - 3, alturaCarta - 3, 14);

  } else if(skinEquipada === "agua") {
    // Fundo oceânico com ondas
    for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
      stroke(lerpColor(color(5, 35, 90), color(20, 100, 160), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
      line(-larguraCarta/2, i, larguraCarta/2, i);
    }
    // Ondas animadas
    noFill(); stroke(100, 200, 255, 60); strokeWeight(1.5);
    for(let w = 0; w < 4; w++) {
      let wy = -50 + w * 35;
      beginShape();
      for(let s = -larguraCarta/2; s <= larguraCarta/2; s += 5) {
        vertex(s, wy + sin((s + frameCount * 1.5) * 0.15 + w) * 5);
      }
      endShape();
    }
    // Bolhas subindo
    noStroke();
    for(let b = 0; b < 6; b++) {
      let by = alturaCarta/2 - ((frameCount * (0.6 + b*0.2) + b * 26) % (alturaCarta + 10));
      let bx = -38 + b * 16 + sin(frameCount * 0.04 + b) * 5;
      fill(160, 220, 255, 90 + b * 15);
      stroke(200, 240, 255, 120); strokeWeight(0.8);
      circle(bx, by, 4 + b * 1.2);
    }
    // Reflexo de luz
    noStroke(); fill(255, 255, 255, 25);
    ellipse(-15, -60, 20, 8);
    // Borda fluida
    stroke(80, 190, 255, 180); strokeWeight(2); noFill();
    rect(0, 0, larguraCarta-4, alturaCarta-4, 14);

  } else if(skinEquipada === "galaxia") {
    // Fundo do cosmos profundo
    fill(8, 5, 22); rect(0, 0, larguraCarta, alturaCarta, 16);
    // Nebulosa giratória
    for(let d = 0; d < 4; d++) {
      fill(80 + d*30, 20 + d*10, 180 + d*20, 18);
      let nx = sin(frameCount * 0.015 + d * 1.5) * 20;
      let ny = cos(frameCount * 0.01 + d) * 15;
      circle(nx, ny, 55 - d * 8);
    }
    // Estrelas piscando
    noStroke();
    for(let s = 0; s < 12; s++) {
      let brilhoEstrela = 100 + sin(frameCount * 0.08 + s * 1.7) * 100;
      fill(255, 255, 255, brilhoEstrela);
      let sx = noise(s * 10) * larguraCarta - larguraCarta/2;
      let sy = noise(s * 10 + 5) * alturaCarta - alturaCarta/2;
      circle(sx, sy, noise(s + frameCount * 0.01) > 0.5 ? 2.5 : 1.2);
    }
    // Via láctea diagonal
    stroke(180, 100, 255, 25); strokeWeight(8); noFill();
    line(-larguraCarta/2, alturaCarta/2, larguraCarta/2, -alturaCarta/2);
    // Borda galáctica
    stroke(140, 80, 255, 180 + sin(frameCount*0.1)*60); strokeWeight(2); noFill();
    rect(0, 0, larguraCarta-4, alturaCarta-4, 14);
    stroke(200, 120, 255, 50); strokeWeight(6);
    rect(0, 0, larguraCarta-4, alturaCarta-4, 14);

  } else if(skinEquipada === "ouro") {
    // Fundo dourado luxuoso
    for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
      stroke(lerpColor(color(90, 65, 10), color(180, 140, 25), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
      line(-larguraCarta/2, i, larguraCarta/2, i);
    }
    // Padrão de losangos dourados
    stroke(255, 215, 0, 30); strokeWeight(0.8); noFill();
    for(let gx = -larguraCarta/2; gx < larguraCarta/2; gx += 22) {
      for(let gy = -alturaCarta/2; gy < alturaCarta/2; gy += 22) {
        diamond(gx, gy, 8, 8);
      }
    }
    // Brilho deslizante duplo
    let bX = -larguraCarta + (frameCount * 2.5) % (larguraCarta * 2.5);
    stroke(255, 255, 200, 140); strokeWeight(5);
    line(bX, -alturaCarta/2, bX + 20, alturaCarta/2);
    stroke(255, 255, 255, 60); strokeWeight(2);
    line(bX + 8, -alturaCarta/2, bX + 28, alturaCarta/2);
    // Borda dupla dourada
    stroke(255, 223, 0); strokeWeight(3); noFill(); rect(0, 0, larguraCarta-4, alturaCarta-4, 14);
    stroke(255, 245, 160, 80); strokeWeight(1); rect(0, 0, larguraCarta-10, alturaCarta-10, 11);

  } else {
    let cBase = carta.cor === "verde" ? color(25,95,35) : carta.cor==="azul"? color(20,80,160) : carta.cor==="amarelo"? color(185,120,10) : carta.cor==="marrom"? color(100,60,25) : carta.cor==="especial"? color(105,35,130) : color(105,35,130);
    let cTopo = carta.cor === "verde" ? color(50,155,65) : carta.cor==="azul"? color(45,135,215) : carta.cor==="amarelo"? color(240,185,35) : carta.cor==="marrom"? color(145,95,50) : carta.cor==="especial"? color(150,60,180) : color(150,60,180);
    if(skinEquipada === "labareda") {
      // Fundo de brasa com chamas
      for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
        stroke(lerpColor(color(80,8,2), color(210,50,5), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
        line(-larguraCarta/2, i, larguraCarta/2, i);
      }
      // Chamas animadas na base
      noStroke();
      for(let f = 0; f < 6; f++) {
        let fx = -30 + f * 12;
        let fAltura = 18 + sin(frameCount * 0.12 + f * 1.1) * 10;
        fill(255, 80, 0, 120); triangle(fx, alturaCarta/2 - 5, fx - 8, alturaCarta/2 - 5 - fAltura, fx + 8, alturaCarta/2 - 5);
        fill(255, 150, 0, 100); triangle(fx, alturaCarta/2 - 5, fx - 5, alturaCarta/2 - 5 - fAltura*0.7, fx + 5, alturaCarta/2 - 5);
        fill(255, 220, 0, 80); triangle(fx, alturaCarta/2 - 5, fx - 2, alturaCarta/2 - 5 - fAltura*0.4, fx + 2, alturaCarta/2 - 5);
      }
      // Faíscas voando
      for(let s = 0; s < 5; s++) {
        let sy = alturaCarta/2 - ((frameCount * 1.2 + s * 28) % (alturaCarta + 15));
        let sx = -25 + s * 12 + sin(frameCount * 0.08 + s) * 10;
        fill(255, 200, 50, 180); circle(sx, sy, 2.5);
      }
      // Borda em brasa
      stroke(255, 100, 0, 160 + sin(frameCount*0.1)*80); strokeWeight(2.5); noFill();
      rect(0, 0, larguraCarta-4, alturaCarta-4, 14);
      noStroke(); fill(255, 30); rect(0, 0, larguraCarta - 8, alturaCarta - 8, 12);
    } else if(skinEquipada === "floresta") {
      // Fundo de mata fechada
      for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
        stroke(lerpColor(color(10,28,15), color(40,80,45), map(i, -alturaCarta/2, alturaCarta/2, 0, 1)));
        line(-larguraCarta/2, i, larguraCarta/2, i);
      }
      // Padrão de folhas no fundo
      noStroke();
      for(let f = 0; f < 8; f++) {
        let lx = noise(f * 5) * larguraCarta - larguraCarta/2;
        let ly2 = noise(f * 5 + 3) * alturaCarta - alturaCarta/2;
        fill(30, 90 + f*8, 35, 80);
        push(); translate(lx, ly2); rotate(noise(f + frameCount*0.003) * TWO_PI);
        ellipse(0, 0, 14, 7);
        pop();
      }
      // Vaga-lumes piscando
      for(let v = 0; v < 4; v++) {
        let brilhoV = abs(sin(frameCount * 0.06 + v * 2.1));
        fill(180, 255, 100, brilhoV * 200);
        let vx = noise(v * 8 + frameCount * 0.005) * larguraCarta - larguraCarta/2;
        let vy2 = noise(v * 8 + 10 + frameCount * 0.004) * alturaCarta - alturaCarta/2;
        circle(vx, vy2, 4);
        fill(180, 255, 100, brilhoV * 60); circle(vx, vy2, 10);
      }
      // Borda de bambu
      stroke(70, 140, 60, 180); strokeWeight(2.5); noFill();
      rect(0, 0, larguraCarta-4, alturaCarta-4, 14);
      noStroke(); fill(255, 30); rect(0, 0, larguraCarta - 8, alturaCarta - 8, 12);
    } else {
      for(let i = -alturaCarta/2; i < alturaCarta/2; i++) {
        stroke(lerpColor(cBase, cTopo, map(i, -alturaCarta/2, alturaCarta/2, 0, 1))); line(-larguraCarta/2, i, larguraCarta/2, i);
      }
      noStroke(); fill(255, 30); rect(0, 0, larguraCarta - 8, alturaCarta - 8, 12);
    }
  }

  if(carta.nome === "Reciclagem" && skinEquipada === "reciclagem") {
    stroke(0, 255, 100); strokeWeight(2.5); noFill(); rect(0, 0, larguraCarta - 8, alturaCarta - 8, 12);
  }

  noStroke(); fill(255, 35); circle(0, -25, 74);
  desenharIlustracaoAgroRealista(carta.nome);
  
  fill(255); textSize(11); textStyle(BOLD); textAlign(CENTER, CENTER); text(carta.nome, 0, 36);
  textSize(8); textStyle(NORMAL); fill(230); text(carta.info, 0, 56, larguraCarta-12, 35);
  fill(255); circle(-larguraCarta/2 + 16, -alturaCarta/2 + 16, 19);
  fill(0); textSize(10); textStyle(BOLD); text(carta.simbolo, -larguraCarta/2 + 16, -alturaCarta/2 + 16);
  pop();
}

function desenharIlustracaoAgroRealista(nomeCarta) {
  push(); translate(0, -25); rectMode(CENTER); noStroke();
  
  if (nomeCarta == "Reflorestamento") {
    fill(100, 65, 35); rect(0, 16, 6, 16, 2); fill(75, 45, 20); rect(-2, 18, 2, 10); 
    fill(40, 120, 55); circle(0, -2, 25); fill(60, 155, 75); circle(-7, -6, 16); circle(7, -4, 18); 
    fill(95, 195, 110); circle(2, -12, 14); fill(80, 185, 95);
    push(); translate(-18, 6); rotate(QUARTER_PI); ellipse(0, 0, 7, 4); pop();
    push(); translate(16, -10); rotate(-QUARTER_PI); ellipse(0, 0, 6, 3); pop();
  } 
  else if (nomeCarta == "Gotejamento") {
    fill(130, 140, 150); rect(0, -12, 50, 10, 2); fill(100, 110, 120); rect(0, -9, 50, 3); fill(50); rect(0, -7, 6, 4);
    fill(110, 200, 255); ellipse(0, 0, 5, 5); triangle(0, -4, -2.5, 0, 2.5, 0);
    ellipse(0, 10, 6, 6); triangle(0, 6, -3, 10, 3, 10); ellipse(0, 22, 7, 7); triangle(0, 17, -3.5, 22, 3.5, 22);
  } 
  else if (nomeCarta == "Energia Solar") {
    fill(255, 190, 25, 90); circle(0, -14, 28); fill(255, 225, 40); circle(0, -14, 18);
    fill(45, 60, 85); quad(-24, 22, 24, 22, 16, 5, -16, 5); stroke(100, 145, 210); strokeWeight(1.5);
    line(-24, 22, -16, 5); line(0, 22, 0, 5); line(24, 22, 16, 5); line(-19, 13, 19, 13); noStroke();
  } 
  else if (nomeCarta == "Rotação Culturas") {
    fill(90, 60, 35); ellipse(0, 10, 48, 22); stroke(65, 40, 20); strokeWeight(1.5); line(0, -1, 0, 21); 
    noStroke(); fill(75, 160, 50); push(); translate(-12, 8); ellipse(0, 0, 4, 7); pop();
    fill(50, 130, 40); push(); translate(10, 6); rect(0, 2, 2, 6); ellipse(-2, -1, 5, 4); ellipse(2, -2, 4, 5); pop();
    noFill(); stroke(135, 230, 145, 180); strokeWeight(2); arc(0, 5, 34, 18, PI, TWO_PI - QUARTER_PI); arc(0, 5, 34, 18, 0, PI - QUARTER_PI); noStroke();
  } 
  else if (nomeCarta == "Queimada") {
    fill(75, 40, 20); push(); translate(0, 16); rotate(0.2); rect(0, 0, 32, 5, 1); pop();
    push(); translate(0, 15); rotate(-0.25); rect(0, 0, 30, 4, 1); pop();
    fill(215, 40, 15); triangle(-20, 14, -5, -20, 10, 14); triangle(-5, 14, 12, -14, 22, 14);
    fill(245, 120, 10); triangle(-13, 14, -4, -8, 5, 14); fill(255, 225, 50); triangle(-7, 14, 0, 2, 7, 14);
  } 
  else if (nomeCarta == "Chuva Forte") {
    fill(65, 75, 85); ellipse(10, -8, 24, 20); ellipse(-2, -14, 28, 24); fill(45, 52, 60); ellipse(-12, -4, 25, 20); ellipse(2, -5, 26, 22); 
    stroke(130, 195, 255, 210); strokeWeight(2); line(-16, 12, -21, 26); line(-6, 14, -11, 28); line(4, 12, -1, 26); noStroke();
  } 
  else if (nomeCarta == "Reciclagem") {
    strokeWeight(3.5); stroke(45, 175, 85); noFill();
    arc(0, -4, 24, 24, PI + QUARTER_PI, TWO_PI - QUARTER_PI); arc(8, 6, 24, 24, QUARTER_PI, PI - QUARTER_PI); arc(-8, 6, 24, 24, PI - HALF_PI + 0.3, PI + 0.3);
    noStroke(); fill(45, 175, 85);
    push(); translate(9, -11); rotate(0.4); triangle(0, -4, -4, 3, 4, 3); pop();
    push(); translate(7, 16); rotate(2.3); triangle(0, -4, -4, 3, 4, 3); pop();
    push(); translate(-14, -2); rotate(-1.7); triangle(0, -4, -4, 3, 4, 3); pop();
  }
  pop();
}

// =================================================================
// 🧠 INTELIGÊNCIA ARTIFICIAL AVANÇADA (BOT INTELIGENTE)
// =================================================================

function jogadaBot(){ 
  if(estado !== "jogo" || turnoJogador || animandoCarta) return;

  // Delay extra no fácil para dar sensação de "pensando devagar"
  let delayExtra = dificuldade === "facil" ? 400 : dificuldade === "medio" ? 0 : 0;
  if(delayExtra > 0) { setTimeout(() => jogadaBotExecutar(), delayExtra); return; }
  jogadaBotExecutar();
}

function jogadaBotExecutar() {
  if(estado !== "jogo" || turnoJogador || animandoCarta) return;

  let indicesJogaveis = [];
  for(let i = 0; i < cartasBot.length; i++) {
    let c = cartasBot[i];
    if(c.cor === cartaMesa.cor || c.simbolo === cartaMesa.simbolo || c.cor === "especial" || c.cor === "chuva" || cartaMesa.cor === "especial" || cartaMesa.cor === "chuva") {
      indicesJogaveis.push(i);
    }
  }

  if(indicesJogaveis.length > 0) {
    let melhorIndex;

    if(dificuldade === "facil") {
      // ===================== FÁCIL =====================
      // Joga aleatório, nunca prioriza ataques, às vezes erra o AGRO
      melhorIndex = indicesJogaveis[floor(random(indicesJogaveis.length))];
      // 40% de chance de não gritar AGRO mesmo quando deveria
      if(cartasBot.length === 2) {
        botGritouAgro = random(1) < 0.40;
        if(!botGritouAgro) tempoLimiteBotAgro = millis() + random(4000, 8000);
      }

    } else if(dificuldade === "medio") {
      // ===================== MÉDIO =====================
      // Prioriza ataque só quando jogador está com poucas cartas
      melhorIndex = indicesJogaveis[0];
      if(cartasJogador.length <= 3) {
        let ataqueIdx = indicesJogaveis.find(idx => cartasBot[idx].efeito === "bloqueio" || cartasBot[idx].efeito === "mais2");
        if(ataqueIdx !== undefined) melhorIndex = ataqueIdx;
      } else {
        let especialIdx = indicesJogaveis.find(idx => cartasBot[idx].cor === "especial");
        if(especialIdx !== undefined) melhorIndex = especialIdx;
      }

    } else if(dificuldade === "dificil") {
      // ===================== DIFÍCIL =====================
      // Sempre prioriza: 1) atacar se jogador tem <=4 cartas, 2) coringa, 3) carta que deixa menos cartas na cor errada
      melhorIndex = indicesJogaveis[0];
      if(cartasJogador.length <= 4) {
        let ataqueIdx = indicesJogaveis.find(idx => cartasBot[idx].efeito === "mais2");
        if(ataqueIdx !== undefined) { melhorIndex = ataqueIdx; }
        else {
          let bloqIdx = indicesJogaveis.find(idx => cartasBot[idx].efeito === "bloqueio");
          if(bloqIdx !== undefined) melhorIndex = bloqIdx;
        }
      }
      if(melhorIndex === indicesJogaveis[0]) {
        // Escolhe a cor que o bot tem mais cartas para manter vantagem
        let contagemCores = { verde: 0, azul: 0, amarelo: 0, marrom: 0 };
        for(let cb of cartasBot) if(contagemCores[cb.cor] !== undefined) contagemCores[cb.cor]++;
        let melhorCor = Object.keys(contagemCores).reduce((a, b) => contagemCores[a] > contagemCores[b] ? a : b);
        let corIdx = indicesJogaveis.find(idx => cartasBot[idx].cor === melhorCor);
        if(corIdx !== undefined) melhorIndex = corIdx;
        // Coringa é reservado para virar para a cor mais vantajosa
        let corigaIdx = indicesJogaveis.find(idx => cartasBot[idx].cor === "especial");
        if(corigaIdx !== undefined && cartasJogador.length <= 3) melhorIndex = corigaIdx;
      }

    } else if(dificuldade === "radi") {
      // ===================== RADI (IMPOSSÍVEL) =====================
      // Sempre joga a carta MAIS prejudicial para o jogador
      // Prioridade: +2 > bloqueio > coringa para cor favorita > carta normal da cor com mais peças
      let mais2Idx = indicesJogaveis.find(idx => cartasBot[idx].efeito === "mais2");
      let bloqIdx  = indicesJogaveis.find(idx => cartasBot[idx].efeito === "bloqueio");
      let corigaIdx = indicesJogaveis.find(idx => cartasBot[idx].cor === "especial");

      if(mais2Idx !== undefined) {
        melhorIndex = mais2Idx;
      } else if(bloqIdx !== undefined) {
        melhorIndex = bloqIdx;
      } else if(corigaIdx !== undefined) {
        melhorIndex = corigaIdx;
      } else {
        // Joga a carta que deixa o bot com mais cartas da mesma cor (para encadear)
        let melhorPlacar = -1;
        for(let idx of indicesJogaveis) {
          let cor = cartasBot[idx].cor;
          let qt = cartasBot.filter(cb => cb.cor === cor).length;
          if(qt > melhorPlacar) { melhorPlacar = qt; melhorIndex = idx; }
        }
      }
      // No RADI, o bot NUNCA erra o AGRO — tempo mínimo de reação
      if(cartasBot.length === 2) {
        botGritouAgro = false;
        tempoLimiteBotAgro = millis() + random(300, 700);
      }
    }

    let c = cartasBot[melhorIndex]; 
    cartasBot.splice(melhorIndex, 1); 

    // Controle do AGRO para dificuldades normais
    if(dificuldade !== "facil" && dificuldade !== "radi" && cartasBot.length === 1) {
      botGritouAgro = false;
      tempoLimiteBotAgro = millis() + (dificuldade === "dificil" ? random(600, 1200) : random(1000, 2500));
    }
    
    dispararAnimacaoDeslizar(c, width/2, -100, width/2 + 70, height/2, () => { 
      cartaMesa = c; 
      totalCartasJogadasPartida++;
      criarParticulasTematicas(width/2 + 70, height/2, c.nome);

      if(c.nome === "Queimada") botUsouQueimada = true;
      if(c.efeito === "mais2"){ for(let i = 0; i < 2; i++) cartasJogador.push(baralho.pop()); } 
      
      if(c.efeito === "trocaCor") {
        let contagemCores = { verde: 0, azul: 0, amarelo: 0, marrom: 0 };
        for(let cb of cartasBot) { if(contagemCores[cb.cor] !== undefined) contagemCores[cb.cor]++; }
        let melhorCor = "verde"; let maxC = -1;
        for(let cor in contagemCores) { if(contagemCores[cor] > maxC) { maxC = contagemCores[cor]; melhorCor = cor; } }
        cartaMesa.cor = melhorCor;
        mensagem = "♻️ Bot jogou Reciclagem e alterou a cor ativa para " + melhorCor.toUpperCase() + "!";
      }

      if(cartasBot.length === 0){ finalizarPartidaCalculos("derrota"); return; } 
      verificarFimDeTurno();
      
      if(c.efeito === "bloqueio") { 
        mensagem = "🔥 O Bot te bloqueou e joga de novo!"; 
        setTimeout(jogadaBotExecutar, 800); 
      } else { 
        if(c.efeito !== "trocaCor") mensagem = "Sua vez!"; 
        turnoJogador = true; 
      }
    }); 
  } else { 
    // Fácil às vezes compra carta mesmo quando poderia jogar (simulado acima)
    cartasBot.push(baralho.pop()); 
    verificarFimDeTurno(); 
    mensagem = "O Bot não tinha carta e comprou do monte. Sua vez!"; 
    turnoJogador = true; 
  } 
}

function atualizarTemporizadorAgroBot() {
  if (estado !== "jogo") return;

  if (cartasBot.length === 1 && !botGritouAgro && millis() > tempoLimiteBotAgro) {
    botGritouAgro = true;
    mensagem = "📢 O Bot gritou: 'AGROOOOO!!!' e está por 1 carta de vencer!";
  }

  if (cartasJogador.length === 1 && !jogadorGritouAgro && !turnoJogador && random(1) < 0.01) {
    mensagem = "🚨 O Bot percebeu seu descuido, te denunciou! Compre +2 cartas.";
    for(let i = 0; i < 2; i++) cartasJogador.push(baralho.pop());
    jogadorGritouAgro = true; 
  }
}

// =================================================================
// 👑 INTERAÇÕES E CLIQUES
// =================================================================

function mousePressed(){
  // 🎓 Tutorial tem prioridade — checa clique no painel
  if (tutorialAtivo) {
    let consumiu = tutorialMousePressed();
    if (consumiu) return;
    // Se passo for jogarcarta, deixa o jogo processar normalmente abaixo
    let passoAtual = TUTORIAL_PASSOS[tutorialPasso];
    if (passoAtual.acao !== "jogarcarta") return;
  }

  // Botão de música — tela inicial
  if(estado == "menu") {
    let bMx = width - 44, bMy = height - 44;
    if(mouseX > bMx - 26 && mouseX < bMx + 26 && mouseY > bMy - 26 && mouseY < bMy + 26) {
      alternarMusica(); return;
    }
  }
  // Botão de música — durante o jogo
  if(estado == "jogo" && mouseX > (width - 30) - 22 && mouseX < (width - 30) + 22 && mouseY > 30 - 15 && mouseY < 30 + 15) {
    alternarMusica(); return;
  }

  if(mouseX > 90 - 70 && mouseX < 90 + 70 && mouseY > 80 - 20 && mouseY < 80 + 20) {
    cenarioAtual = (cenarioAtual + 1) % 5; return;
  }

  if(estado == "jogo" && mostraSeletorCor && callbackSeletorCor) {
    let cx = width/2; let cy = height/2;
    let cores = ["verde","azul","amarelo","marrom"];
    let labels = ["🟢 VERDE","🔵 AZUL","🟡 AMARELO","🟤 MARROM"];
    for(let i = 0; i < 4; i++) {
      let bx = cx + ((i % 2) - 0.5) * 180;
      let by = cy + (floor(i / 2) - 0.5) * 80;
      if(mouseX > bx - 80 && mouseX < bx + 80 && mouseY > by - 28 && mouseY < by + 28) {
        callbackSeletorCor(cores[i]); return;
      }
    }
    return;
  }

  if(estado == "jogo" && !animandoCarta) {
    if(mouseX > (width - 140) - 100 && mouseX < (width - 140) + 100 && mouseY > (height / 2) - 22 && mouseY < (height / 2) + 22) { 
      finalizarPartidaCalculos("derrota"); 
      return; 
    }

    if (cartasJogador.length === 1 && !jogadorGritouAgro) {
      // Clique no botão AGRO no canto esquerdo
      let agroX = 75;
      let agroY = height - 130;
      if (dist(mouseX, mouseY, agroX, agroY) < 55 || 
          (mouseX > agroX - 59 && mouseX < agroX + 59 && mouseY > agroY + 30 && mouseY < agroY + 55)) {
        jogadorGritouAgro = true;
        mensagem = "📢 Você gritou 'AGRO!' com sucesso!";
        tocarSom("agro");
        contadorGritosAgro++;
        if(contadorGritosAgro >= 3) desbloquearConquista("grito_agro");
        return;
      }
    }
    if (cartasBot.length === 1 && !botGritouAgro) {
      if (mouseX > (width / 2 + 380) - 75 && mouseX < (width / 2 + 380) + 75 && mouseY > (height - 120) - 27 && mouseY < (height - 120) + 27) {
        mensagem = "🚨 Denúncia Aceita! O Bot esqueceu de gritar AGRO e comprou +2 cartas!";
        for(let i = 0; i < 2; i++) cartasBot.push(baralho.pop());
        botGritouAgro = true; 
        return;
      }
    }
    
    if(turnoJogador) {
      let monteX = width / 2 - 130; let monteY = height / 2;
      if(mouseX > monteX - larguraCarta/2 && mouseX < monteX + larguraCarta/2 && mouseY > monteY - alturaCarta/2 && mouseY < monteY + alturaCarta/2) { 
        comprarDoMonteFechado(); 
        if(climaAtual === "⚡ Tempestade Elétrica") desbloquearConquista("mestre_chuvas");
        return; 
      }
      
      let inicioX = width / 2 - ((cartasJogador.length - 1) * 125) / 2;
      for(let i = 0; i < cartasJogador.length; i++){
        let x = inicioX + i * 125; let y = height - 80;
        if(mouseX > x - larguraCarta / 2 && mouseX < x + larguraCarta / 2 && mouseY > y - alturaCarta / 2 && mouseY < y + alturaCarta / 2){ 
          jogarCarta(i); break; 
        }
      }
    }
  }

  if(estado == "menu"){
    if(mouseX > width/2 - 160 - 100 && mouseX < width/2 - 160 + 100 && mouseY > height/2 + 50 - 32 && mouseY < height/2 + 50 + 32) { 
      estado = "dificuldade"; return; 
    }
    if(mouseX > width/2 + 160 - 100 && mouseX < width/2 + 160 + 100 && mouseY > height/2 + 50 - 32 && mouseY < height/2 + 50 + 32) { estado = "guia"; scrollManual = 0; return; }
    if(mouseX > width/2 - 160 - 100 && mouseX < width/2 - 160 + 100 && mouseY > height/2 + 140 - 27 && mouseY < height/2 + 140 + 27) { estado = "loja"; scrollLoja = 0; return; }
    if(mouseX > width/2 + 160 - 100 && mouseX < width/2 + 160 + 100 && mouseY > height/2 + 140 - 27 && mouseY < height/2 + 140 + 27) { estado = "conquistas"; return; }
    if(mouseX > width/2 - 110 - 97 && mouseX < width/2 - 110 + 97 && mouseY > height/2 + 220 - 25 && mouseY < height/2 + 220 + 25) { estado = "regras"; return; }
    if(mouseX > width/2 + 110 - 97 && mouseX < width/2 + 110 + 97 && mouseY > height/2 + 220 - 25 && mouseY < height/2 + 220 + 25) { iniciarTutorial(); return; }
  } else if(estado == "loja") {
    if(mouseX > 80 - 70 && mouseX < 80 + 70 && mouseY > 35 - 21 && mouseY < 35 + 21) { estado = "menu"; menuJaAnimou = true; return; }
    let startX = 200; let startY = 190 - scrollLoja;
    for(let i = 0; i < listaSkinsLoja.length; i++) {
      let item = listaSkinsLoja[i];
      let col = i % 2; let linha = floor(i / 2);
      let cardX = startX + (col * 240); let cardY = startY + (linha * 175);
      if(mouseX > cardX - 107 && mouseX < cardX + 107 && mouseY > cardY - 75 && mouseY < cardY + 75) {
        skinSelecionadaLojaPreview = item.id;
        if (mouseY > (cardY + 44) - 14 && mouseY < (cardY + 44) + 14 && mouseX > cardX - 75 && mouseX < cardX + 75) {
          if(inventarioSkins.includes(item.id)) { skinEquipada = item.id; } 
          else if(ecoMoedas >= item.preco) { ecoMoedas -= item.preco; inventarioSkins.push(item.id); skinEquipada = item.id; }
          salvarDadosProgresso(); 
        } return;
      }
    }
  } else if(estado == "guia") {
    let menuX = 180; let menuY = 140 - scrollManual;
    for(let i = 0; i < modelos.length; i++) {
      let itemY = menuY + (i * 70);
      if(mouseX > menuX - 120 && mouseX < menuX + 120 && mouseY > itemY - 27 && mouseY < itemY + 27) { cartaSelecionadaGuia = i; }
    }
    if(mouseX > 80 - 70 && mouseX < 80 + 70 && mouseY > 35 - 21 && mouseY < 35 + 21) { estado = "menu"; menuJaAnimou = true; }
  } else if(estado == "regras") {
    if(mouseX > 80 - 70 && mouseX < 80 + 70 && mouseY > 35 - 21 && mouseY < 35 + 21) { estado = "menu"; menuJaAnimou = true; return; }
  } else if(estado == "dificuldade") {
    let opts = ["facil","medio","dificil","radi"];
    for(let i = 0; i < 4; i++) {
      let bx = width/2; let by = height/2 - 60 + i * 85;
      if(mouseX > bx - 160 && mouseX < bx + 160 && mouseY > by - 30 && mouseY < by + 30) {
        dificuldade = opts[i]; estado = "qtcartas"; return; // vai para escolha de cartas
      }
    }
    if(mouseX > width/2 - 80 && mouseX < width/2 + 80 && mouseY > (height - 60) - 22 && mouseY < (height - 60) + 22) { estado = "menu"; return; }
  } else if(estado == "qtcartas") {
    let opcoes = [7, 9, 12];
    for(let i = 0; i < 3; i++) {
      let bx = width/2; let by = height/2 - 50 + i * 100;
      if(mouseX > bx - 180 && mouseX < bx + 180 && mouseY > by - 38 && mouseY < by + 38) {
        quantidadeCartas = opcoes[i];
        iniciarAnimacaoEmbaralhar(); // animação antes do jogo
        return;
      }
    }
    if(mouseX > width/2 - 80 && mouseX < width/2 + 80 && mouseY > (height - 60) - 22 && mouseY < (height - 60) + 22) { estado = "dificuldade"; return; }
  } else if(estado == "embaralhando") {
    // Sem clique durante animação
  } else if(estado == "conquistas") {
    if(mouseX > 80 - 70 && mouseX < 80 + 70 && mouseY > 35 - 21 && mouseY < 35 + 21) { estado = "menu"; menuJaAnimou = true; }
  } else if(estado == "fim") {
    let boxX = width / 2; let boxY = height / 2 - 30;
    if(mouseX > boxX - 110 && mouseX < boxX + 110 && mouseY > (boxY + 75) - 25 && mouseY < (boxY + 75) + 25) { 
      estado = "dificuldade"; // vai para escolha de dificuldade → cartas → animação
    }
    if(mouseX > boxX - 110 && mouseX < boxX + 110 && mouseY > (boxY + 135) - 25 && mouseY < (boxY + 135) + 25) { 
      estado = "menu"; menuJaAnimou = true;
    }
  }
}

// =================================================================
// 🔒 CICLO DE EVENTOS E CONQUISTAS
// =================================================================

function processarCicloClimatico() { 
  rodadasParaOEvento--; 
  if(rodadasParaOEvento <= 0){ 
    rodadasParaOEvento = 4; 
    let cls = ["Onda de Calor", "Chuva Abençoada", "Estável", "🌪️ Ventania", "❄️ Geada", "⚡ Tempestade Elétrica", "🌈 Clima Perfeito"]; 
    climaAtual = random(cls); 
    if(climaAtual === "Onda de Calor"){ mensagem = "🔥 Onda de calor! Ambiência seca."; } 
    else if(climaAtual === "Chuva Abençoada"){ mensagem = "🌧️ Chuva abençoada refresca as culturas."; } 
    else if(climaAtual === "🌪️ Ventania"){ mensagem = "🌪️ Rajadas de vento mudam a dispersão biológica."; }
    else if(climaAtual === "❄️ Geada"){ mensagem = "❄️ Geada severa detectada! Proteja os canteiros."; }
    else if(climaAtual === "⚡ Tempestade Elétrica"){ mensagem = "⚡ Tempestade de raios! Cuidado ao manusear maquinário."; }
    else if(climaAtual === "🌈 Clima Perfeito"){ mensagem = "🌈 Equilíbrio ideal! Solo fértil e produção recorde."; }
    else { mensagem = "⛅ Clima estável na fazenda."; } 
  } 
}

function desbloquearConquista(id) { 
  let c = listaConquistas.find(x => x.id === id); 
  if(c && !c.alcancada){ 
    c.alcancada = true; 
    notificacaoConquista = c.titulo; 
    tempoNotificacao = 150; 
    ecoMoedas += c.recompensa;
    tocarSom("conquista");
    salvarDadosProgresso(); 
    if(ecoMoedas >= 1200) { setTimeout(() => { desbloquearConquista("lenda_agrouno"); }, 1000); }
  } 
}

function desenharPopUpConquista() { 
  if(tempoNotificacao > 0){ 
    push(); rectMode(CENTER); fill(15, 30, 20, 240); stroke(0, 255, 100); strokeWeight(2);
    rect(width/2, 50, 360, 50, 12); 
    noStroke(); fill(255); textSize(12); textAlign(CENTER, CENTER); textStyle(BOLD);
    text("🎖️ DESBLOQUEADO: " + notificacaoConquista, width/2, 50); pop(); tempoNotificacao--; 
  } 
}

// =================================================================
// 🎬 MOTOR DE ANIMAÇÃO E PARTÍCULAS (CALIBRADO / ACELERADO)
// =================================================================

function dispararAnimacaoDeslizar(c, xi, yi, xf, yf, cb) { 
  cartaAnimadaObj = c; cAnimX = xi; cAnimY = yi; cAlvoX = xf; cAlvoY = yf; callbackAnimacao = cb; animandoCarta = true; 
}

// ⚡ MODIFICADO: Taxa de interpolação passou de 0.22 para 0.45 para a jogada ficar imediata e sem peso!
function atualizarEfeitoDeslizar() { 
  cAnimX = lerp(cAnimX, cAlvoX, 0.45); cAnimY = lerp(cAnimY, cAlvoY, 0.45); 
  if(dist(cAnimX, cAnimY, cAlvoX, cAlvoY) < 4){ 
    animandoCarta = false; 
    if(callbackAnimacao){ let f = callbackAnimacao; callbackAnimacao = null; f(); } 
  } else { 
    desenharCarta(cartaAnimadaObj, cAnimX, cAnimY, false, false); 
  } 
}

function criarParticulasTematicas(x, y, nomeCarta) {
  let corP = color(100, 255, 100);
  let emoji = null;
  if(nomeCarta === "Queimada") corP = color(255, 60, 0);
  if(nomeCarta === "Gotejamento" || nomeCarta === "Chuva Forte") corP = color(60, 180, 255);
  if(nomeCarta === "Energia Solar") corP = color(255, 220, 0);
  if(nomeCarta === "Reciclagem" || skinEquipada === "reciclagem") emoji = "♻️";

  for(let i = 0; i < 12; i++) { // Reduzido ligeiramente para otimização perfeita
    particulas.push({
      x: x, y: y, 
      vx: random(-4, 4), vy: random(-4, 4), 
      vida: 200, cor: corP, txt: emoji,
      tam: random(5, 10)
    });
  }
}

function criarExplosaoConfetesVitoria() {
  for(let i=0; i<50; i++) {
    particulas.push({
      x: random(width), y: random(-50, -10),
      vx: random(-2, 2), vy: random(3, 7),
      vida: 250, cor: color(random(255), random(255), random(255)),
      txt: null, tam: random(5, 9)
    });
  }
}

function desenharParticulas(){ 
  push(); 
  for(let i = particulas.length - 1; i >= 0; i--){ 
    let p = particulas[i]; 
    if(p.txt) {
      fill(255, p.vida); textSize(p.tam * 1.5); text(p.txt, p.x, p.y);
    } else {
      fill(red(p.cor), green(p.cor), blue(p.cor), p.vida); 
      rectMode(CENTER); rect(p.x, p.y, p.tam, p.tam);
    }
    p.x += p.vx; p.y += p.vy; p.vida -= 8; 
    if(p.vida <= 0) particulas.splice(i, 1); 
  } 
  pop(); 
}

// =================================================================
// 🎮 LOGICA PRINCIPAL DO JOGO
// =================================================================

// =================================================================
// 🃏 ESCOLHA DE QUANTIDADE DE CARTAS
// =================================================================
function desenharTelaQtCartas() {
  push();
  fill(8, 14, 10, 250); rectMode(CORNER); rect(0, 0, width, height);

  textAlign(CENTER, TOP);
  fill(255, 215, 0); textSize(32); textStyle(BOLD);
  text("🃏 QUANTAS CARTAS NA MÃO?", width/2, 40);
  fill(180, 240, 180); textSize(13); textStyle(NORMAL);
  text("Mais cartas = partida mais longa e estratégica!", width/2, 85);

  let opcoes = [
    { qt: 7,  label: "7 CARTAS",  sub: "Partida rápida — clássico AgroUNO",      cor: color(40,160,70),  hover: color(55,200,90)  },
    { qt: 9,  label: "9 CARTAS",  sub: "Partida equilibrada — mais opções na mão", cor: color(30,110,180), hover: color(50,145,220) },
    { qt: 12, label: "12 CARTAS", sub: "Partida longa — máxima estratégia!",       cor: color(160,60,20),  hover: color(210,85,30)  },
  ];

  rectMode(CENTER);
  for(let i = 0; i < opcoes.length; i++) {
    let op = opcoes[i];
    let bx = width/2, by = height/2 - 55 + i * 100;
    let sel = quantidadeCartas === op.qt;
    let hov = mouseX > bx - 180 && mouseX < bx + 180 && mouseY > by - 38 && mouseY < by + 38;

    fill(sel ? op.hover : (hov ? op.hover : op.cor));
    stroke(sel ? color(255,255,180) : color(255,255,255,40));
    strokeWeight(sel ? 3 : 1);
    rect(bx, by, 400, 75, 16);

    noStroke();
    fill(255); textSize(22); textStyle(BOLD); textAlign(CENTER, CENTER);
    text("🃏 " + op.label, bx, by - 12);
    fill(255,255,255,200); textSize(12); textStyle(NORMAL);
    text(op.sub, bx, by + 16);

    if(sel) {
      fill(255,240,80); textSize(13); text("◀ SELECIONADO ▶", bx, by - 12);
      fill(255); textSize(22); textStyle(BOLD); text("🃏 " + op.label, bx, by - 12);
    }
  }

  desenharBotao(width/2, height - 40, 180, 42, "⬅ VOLTAR", color(100, 40, 40), color(160, 55, 55));
  pop();
}

// =================================================================
// 🎬 ANIMAÇÃO DE EMBARALHAMENTO
// =================================================================
let _emb_cartas = [];      // cartas voando na tela
let _emb_frame = 0;
let _emb_fase = "shuffle"; // shuffle | deal
let _emb_indice = 0;
let _emb_intervalo = 0;

function iniciarAnimacaoEmbaralhar() {
  // Prepara o baralho antes de animar
  baralho = [];
  let coresAleatorias = ["verde", "azul", "amarelo", "marrom"];
  for(let i = 0; i < 12; i++) {
    for(let c of modelos) {
      let nova = {...c};
      if(nova.cor === "chuva") nova.cor = coresAleatorias[floor(random(coresAleatorias.length))];
      baralho.push(nova);
    }
  }
  embaralhar(baralho);

  _emb_cartas = [];
  _emb_frame = 0;
  _emb_fase = "shuffle";
  _emb_indice = 0;
  _emb_intervalo = 0;
  estado = "embaralhando";
}

function atualizarAnimacaoEmbaralhar() {
  _emb_frame++;

  // Fase 1: embaralhando (cartas voam aleatoriamente por 90 frames)
  if (_emb_fase === "shuffle") {
    // A cada 8 frames, solta uma carta no ar
    if (_emb_frame % 8 === 0 && _emb_cartas.length < 12) {
      let coresEmb = ["verde","azul","amarelo","marrom","especial","chuva"];
      let corSorteada = coresEmb[floor(random(4))]; // só cartas normais coloridas
      let modeloSorteado = modelos.find(m => m.cor === corSorteada) || modelos[floor(random(4))];
      _emb_cartas.push({
        x: width/2 + random(-60, 60),
        y: height/2 + random(-40, 40),
        vx: random(-6, 6),
        vy: random(-8, -3),
        rot: random(-0.5, 0.5),
        vrot: random(-0.08, 0.08),
        alpha: 255,
        cor: corSorteada,
        modelo: modeloSorteado,
        fase: "ar"
      });
    }
    // Move as cartas
    for (let c of _emb_cartas) {
      c.x += c.vx; c.y += c.vy;
      c.vy += 0.4; // gravidade
      c.rot += c.vrot;
      if (c.y > height + 80) c.fase = "sumiu";
    }
    _emb_cartas = _emb_cartas.filter(c => c.fase !== "sumiu");

    if (_emb_frame >= 90) {
      _emb_fase = "deal";
      _emb_frame = 0;
      _emb_indice = 0;
      _emb_intervalo = 0;
      _emb_cartas = [];
      // Distribui as cartas reais
      cartasJogador = [];
      cartasBot = [];
    }
    return;
  }

  // Fase 2: distribuindo as cartas uma a uma
  if (_emb_fase === "deal") {
    _emb_intervalo++;
    // A cada 10 frames, distribui uma carta
    if (_emb_intervalo >= 10 && _emb_indice < quantidadeCartas * 2) {
      _emb_intervalo = 0;
      if (_emb_indice % 2 === 0) {
        // carta para o jogador
        let c = baralho.pop();
        cartasJogador.push(c);
        _emb_cartas.push({
          x: width/2, y: height/2,
          alvoX: width/2 - ((quantidadeCartas-1)*125)/2 + (cartasJogador.length-1)*125,
          alvoY: height - 80,
          prog: 0, carta: c, para: "jogador"
        });
      } else {
        // carta para o bot
        let c = baralho.pop();
        cartasBot.push(c);
        _emb_cartas.push({
          x: width/2, y: height/2,
          alvoX: width/2 - ((quantidadeCartas-1)*80)/2 + (cartasBot.length-1)*80,
          alvoY: 100,
          prog: 0, carta: c, para: "bot"
        });
      }
      _emb_indice++;
      tocarSom("comprar");
    }

    // Anima as cartas voando
    for (let c of _emb_cartas) {
      if (c.prog !== undefined) {
        c.prog = min(c.prog + 0.12, 1);
        c.x = lerp(width/2, c.alvoX, c.prog);
        c.y = lerp(height/2, c.alvoY, c.prog);
      }
    }

    // Terminou de distribuir
    if (_emb_indice >= quantidadeCartas * 2 && _emb_intervalo > 20) {
      // Termina o setup e vai para o jogo
      cartaMesa = baralho.pop();
      pontos = 0; turnoJogador = true; mensagem = "Sua vez!";
      resultadoPartida = ""; contadorSolar = 0; botUsouQueimada = false;
      climaAtual = "Estável"; rodadasParaOEvento = 4;
      tempoInicioPartida = millis(); totalCartasJogadasPartida = 0;
      jogadorGritouAgro = false; botGritouAgro = false;
      iniciarMusica();
      estado = "jogo";
    }
  }
}

function desenharAnimacaoEmbaralhar() {
  push();
  // Fundo escuro
  fill(8, 20, 12, 240); rectMode(CORNER); rect(0, 0, width, height);

  textAlign(CENTER, CENTER); noStroke();
  if (_emb_fase === "shuffle") {
    fill(255, 215, 0); textSize(28); textStyle(BOLD);
    text("🔀 Embaralhando...", width/2, height/2 - 140);
    fill(200, 240, 200); textSize(13); textStyle(NORMAL);
    text("Preparando o baralho AgroUNO", width/2, height/2 - 105);

    // Desenha as cartas voando — idênticas às do jogo (mesma função desenharCarta)
    for (let c of _emb_cartas) {
      push();
      translate(c.x, c.y); rotate(c.rot);
      // Escala para caber bem na animação
      scale(0.52);
      // Usa a função real de desenhar carta do jogo
      let cartaMock = c.modelo || modelos.find(m => m.cor === c.cor) || modelos[0];
      desenharCarta(cartaMock, 0, 0, false, false);
      pop();
    }
  } else {
    fill(255, 215, 0); textSize(24); textStyle(BOLD);
    text("🃏 Distribuindo cartas...", width/2, height/2 - 140);
    fill(180, 240, 180); textSize(13); textStyle(NORMAL);
    text("Dificuldade: " + dificuldade.toUpperCase() + "  |  " + quantidadeCartas + " cartas por jogador", width/2, height/2 - 108);

    // Baralho no centro
    fill(30, 80, 40); stroke(200, 215, 0); strokeWeight(2); rectMode(CENTER);
    rect(width/2, height/2, 68, 95, 10);
    noStroke(); fill(255, 220, 0); textSize(28); textAlign(CENTER,CENTER);
    text("🌾", width/2, height/2);

    // Label bot
    fill(255, 180, 180); textSize(12); textStyle(BOLD); noStroke();
    text("🤖 BOT (" + cartasBot.length + "/" + quantidadeCartas + ")", width/2, 55);
    // Label jogador
    fill(180, 255, 180); textSize(12);
    text("👤 VOCÊ (" + cartasJogador.length + "/" + quantidadeCartas + ")", width/2, height - 130);

    // Desenha as cartas animando — idênticas às do jogo
    for (let c of _emb_cartas) {
      if (c.prog === undefined) continue;
      push();
      translate(c.x, c.y);
      if (c.para === "jogador") {
        // Carta do jogador: frente visível, escala um pouco menor que o jogo real
        scale(0.72);
        desenharCarta(c.carta, 0, 0, false, false);
      } else {
        // Carta do bot: verso da carta (igual ao monte fechado)
        scale(0.65);
        desenharCartaMonteFechadoRealista(0, 0, false);
      }
      pop();
    }
  }
  pop();
}

function iniciarPartida(){ 
  baralho = []; resultadoPartida = ""; contadorSolar = 0; botUsouQueimada = false; climaAtual = "Estável"; rodadasParaOEvento = 4;
  tempoInicioPartida = millis(); totalCartasJogadasPartida = 0;
  jogadorGritouAgro = false; botGritouAgro = false;
  iniciarMusica(); // 🎵 toca música ao iniciar partida 
  
  let coresAleatorias = ["verde", "azul", "amarelo", "marrom"];
  for(let i = 0; i < 12; i++) { for(let c of modelos) { let nova = {...c}; if(nova.cor === "chuva") nova.cor = coresAleatorias[floor(random(coresAleatorias.length))]; baralho.push(nova); } } 
  embaralhar(baralho); cartasJogador = []; cartasBot = []; 
  for(let i = 0; i < quantidadeCartas; i++){ cartasJogador.push(baralho.pop()); cartasBot.push(baralho.pop()); } 
  cartaMesa = baralho.pop(); pontos = 0; turnoJogador = true; mensagem = "Sua vez!"; 
}

function jogarCarta(idx){ 
  if (animandoCarta) return;
  let c = cartasJogador[idx]; 
  if(c.cor === cartaMesa.cor || c.simbolo === cartaMesa.simbolo || c.cor === "especial" || c.cor === "chuva" || cartaMesa.cor === "especial" || cartaMesa.cor === "chuva"){ 
    
    if(cartasJogador.length === 2) {
      jogadorGritouAgro = false;
    }

    cartasJogador.splice(idx, 1); 
    tutorialNotificarCartaJogada(); // 🎓 avança tutorial se ativo
    dispararAnimacaoDeslizar(c, width/2, height - 80, width/2 + 70, height/2, () => { 
      cartaMesa = c; 
      pontos += 10; 
      totalCartasJogadasPartida++;
      tocarSom(c.efeito === "bloqueio" ? "bloqueio" : c.efeito === "mais2" ? "chuva" : "jogar");

      criarParticulasTematicas(width/2 + 70, height/2, c.nome);
      
      if(c.nome === "Energia Solar") { contadorSolar++; if(contadorSolar >= 2) desbloquearConquista("mestre_solar"); }
      if(c.nome === "Queimada") { desbloquearConquista("mestre_queimada"); }
      if(pontos >= 100) desbloquearConquista("eco_campeao");
      if(pontos >= 150) desbloquearConquista("plantador_supremo");
      if(inventarioSkins.length >= 5) desbloquearConquista("colecionar_skins");
      if(dificuldade === "radi") desbloquearConquista("vencedor_radi");
      let tempoDecorrido = (millis() - tempoInicioPartida) / 1000;
      if(tempoDecorrido < 120) desbloquearConquista("partida_rapida");
      
      if(c.efeito === "mais2"){ for(let i = 0; i < 2; i++) cartasBot.push(baralho.pop()); } 
      
      if(cartasJogador.length === 0 && !jogadorGritouAgro) {
        mensagem = "🚨 Você bateu o jogo mas ESQUECEU de gritar AGRO! Compre +2 de penalidade.";
        for(let i = 0; i < 2; i++) cartasJogador.push(baralho.pop());
        jogadorGritouAgro = true;
      } else if(cartasJogador.length === 0 && jogadorGritouAgro) {
        finalizarPartidaCalculos("vitoria"); 
        return; 
      }

      if(c.efeito === "trocaCor") {
        mostraSeletorCor = true;
        turnoJogador = false;
        callbackSeletorCor = (corEscolhida) => {
          cartaMesa.cor = corEscolhida;
          mensagem = "♻️ Você aplicou Reciclagem! Cor ativa: " + corEscolhida.toUpperCase();
          mostraSeletorCor = false;
          processarCicloClimatico();
          setTimeout(jogadaBot, 800);
        };
        return;
      }

      processarCicloClimatico();
      
      if(c.efeito === "bloqueio") { 
        mensagem = "🔥 Você bloqueou o Bot com manobra sustentável! Jogue de novo."; 
        turnoJogador = true; 
      } else { 
        if(c.efeito !== "trocaCor") mensagem = "Vez do Bot pensar..."; 
        turnoJogador = false; 
        setTimeout(jogadaBot, 800); 
      }
    }); 
  } 
}

function comprarDoMonteFechado(){ 
  if(animandoCarta || !turnoJogador) return; 
  let nc = baralho.pop(); 
  tocarSom("comprar");
  
  if(cartasJogador.length === 1) jogadorGritouAgro = true;

  dispararAnimacaoDeslizar(nc, width/2 - 130, height/2, width/2, height - 120, () => { 
    cartasJogador.push(nc); 
    verificarFimDeTurno(); 
    processarCicloClimatico(); 
    turnoJogador = false; 
    setTimeout(jogadaBot, 800); 
  }); 
}

function finalizarPartidaCalculos(r){ 
  let tempoDecorridoSegundos = floor((millis() - tempoInicioPartida) / 1000);
  let mins = floor(tempoDecorridoSegundos / 60); let segs = tempoDecorridoSegundos % 60;
  tempoTotalPartidaTexto = nf(mins, 2) + ":" + nf(segs, 2);
  resultadoPartida = r; estado = "fim"; 

  if(r === "vitoria") { 
    tocarSom("vitoria");
    let ganhoBase = floor(pontos * 0.7);
    ecoMoedas += ganhoBase; 
    criarExplosaoConfetesVitoria();

    if(!botUsouQueimada) desbloquearConquista("guarda_florestal"); 
    if(skinEquipada === "reciclagem") desbloquearConquista("senhor_reciclagem");
    if(pontos >= 150) desbloquearConquista("plantador_supremo");
  } else {
    tocarSom("derrota");
  }
  salvarDadosProgresso(); 
}

function verificarFimDeTurno(){ if(baralho.length < 5) { for(let i = 0; i < 6; i++) { for(let c of modelos) baralho.push({...c}); } embaralhar(baralho); } }
function embaralhar(l){ for(let i = l.length - 1; i > 0; i--){ let j = floor(random(i + 1)); [l[i], l[j]] = [l[j], l[i]]; } }

// =================================================================
// 📦 TELAS DE MENUS E RESULTADOS
// =================================================================

// =================================================================
// ⏳ TELA DE CARREGAMENTO — ESTILO AGROUNO
// =================================================================

// Helper: desenha uma carta IDÊNTICA ao estilo do jogo (usada na loading screen)
function _cartaLoading(wC, hC, cBase, cTopo, simbolo, nome) {
  let larguraCarta = wC, alturaCarta = hC;
  rectMode(CENTER);
  // Sombra
  fill(0, 80); rect(6, 8, wC, hC, 14);
  // Gradiente fundo igual ao jogo
  for(let i = -hC/2; i < hC/2; i++) {
    stroke(lerpColor(cBase, cTopo, map(i, -hC/2, hC/2, 0, 1)));
    line(-wC/2+2, i, wC/2-2, i);
  }
  noStroke();
  // Brilho interno suave
  fill(255, 30); rect(0, 0, wC-8, hC-8, 10);
  // Borda dourada dupla igual ao jogo
  noFill(); stroke(225, 190, 50, 220); strokeWeight(2.5);
  rect(0, 0, wC, hC, 14);
  stroke(255, 238, 110, 80); strokeWeight(1.2);
  rect(0, 0, wC-8, hC-8, 10);
  noStroke();
  // Oval/brilho central igual ao jogo
  fill(255, 35); circle(0, -hC*0.22, 68);
  // Símbolo grande central
  fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(26);
  text(simbolo, 0, -hC*0.22);
  // Nome da carta
  fill(255); textSize(8); textStyle(BOLD);
  text(nome, 0, hC*0.28);
  // Canto superior esquerdo — bolinha + símbolo pequeno
  fill(255); circle(-wC/2+14, -hC/2+14, 20);
  fill(50, 50, 50); textSize(9); textStyle(BOLD);
  text(simbolo, -wC/2+14, -hC/2+14);
  // Canto inferior direito — invertido
  push();
  translate(wC/2-14, hC/2-14); rotate(PI);
  fill(255); circle(0, 0, 20);
  fill(50, 50, 50); text(simbolo, 0, 0);
  pop();
}

function desenharTelaCarregamento() {
  tempoCarregamento++;
  rectMode(CORNER);
  noStroke();

  // ══════════════════════════════════════════
  // FUNDO VERDE — no estilo da cartinha monte do AgroUNO
  // ══════════════════════════════════════════
  // Gradiente verde escuro→verde campo (igual à cartinha monte)
  for(let y = 0; y < height; y++) {
    let t = map(y, 0, height, 0, 1);
    stroke(lerpColor(color(8, 30, 10), color(45, 120, 45), t));
    line(0, y, width, y);
  }
  noStroke();

  // ── RAIOS EM LEQUE verdes escuros saindo do centro — estilo AgroUNO ──
  let cx = width/2, cy = height * 0.40;
  push();
  translate(cx, cy);
  let numRaios = 24;
  for(let r = 0; r < numRaios; r++) {
    let ang = (r / numRaios) * TWO_PI + frameCount * 0.003;
    // Raios alternados: verde mais escuro e verde médio
    let corR = (r % 2 === 0) ? color(8, 40, 10, 120) : color(30, 90, 30, 70);
    fill(corR);
    push(); rotate(ang);
    let dist2 = max(width, height) * 1.6;
    let halfAng = TWO_PI / numRaios / 2;
    triangle(0, 0,
      cos(-halfAng) * dist2, sin(-halfAng) * dist2,
      cos( halfAng) * dist2, sin( halfAng) * dist2);
    pop();
  }
  pop();

  // Vinheta escura nas bordas
  for(let v = 8; v > 0; v--) {
    fill(0, 0, 0, map(v, 8, 0, 55, 0));
    ellipse(width/2, height/2, width*(0.4+v*0.1), height*(0.4+v*0.1));
  }

  // ══════════════════════════════════════════
  // PLANETA CENTRAL REALISTA
  // ══════════════════════════════════════════
  let px = width/2, py = height * 0.38;
  let pR = 100;

  // Halo atmosférico azul
  for(let h = 10; h > 0; h--) {
    fill(30, 140, 255, map(h, 10, 0, 4, 18));
    circle(px, py, pR * 2 + h * 16);
  }

  // Oceano — gradiente azul linha-a-linha
  for(let i = -pR; i < pR; i++) {
    let t = map(i, -pR, pR, 0, 1);
    stroke(lerpColor(color(8, 38, 130), color(25, 115, 215), t));
    let dx = sqrt(max(0, pR*pR - i*i));
    line(px - dx, py + i, px + dx, py + i);
  }
  noStroke();

  // Continentes girando
  push();
  translate(px, py);
  let rotP = frameCount * 0.006;
  rotate(rotP);

  fill(34, 120, 46);
  beginShape();
    vertex(-28, -18); vertex(-12, -30); vertex(-8, -42);
    vertex(2,  -38); vertex(8,  -25); vertex(10, -10);
    vertex(14,  8);  vertex(12,  28); vertex(4,   48);
    vertex(-6,  52); vertex(-18, 44); vertex(-24, 28);
    vertex(-28, 10);
  endShape(CLOSE);
  fill(22, 90, 34);
  beginShape();
    vertex(-18, -10); vertex(-4, -22); vertex(4, -18);
    vertex(8, 0);    vertex(6, 18);   vertex(-4, 32);
    vertex(-14, 28); vertex(-18, 14);
  endShape(CLOSE);
  fill(88, 165, 55, 200);
  beginShape();
    vertex(-14, 28); vertex(-6, 38); vertex(2, 48);
    vertex(-6, 52);  vertex(-18, 44); vertex(-22, 34);
  endShape(CLOSE);
  fill(140, 130, 110, 150);
  beginShape();
    vertex(-28, -18); vertex(-22, -14); vertex(-20, 8);
    vertex(-24, 28);  vertex(-28, 14);
  endShape(CLOSE);
  fill(34, 120, 46);
  beginShape();
    vertex(-28, -38); vertex(-16, -44); vertex(-8, -42);
    vertex(-10, -52); vertex(-20, -56); vertex(-32, -50);
  endShape(CLOSE);
  fill(34, 120, 46);
  beginShape();
    vertex(28, -52); vertex(42, -58); vertex(52, -50);
    vertex(54, -38); vertex(46, -32); vertex(38, -30);
    vertex(30, -38);
  endShape(CLOSE);
  fill(34, 120, 46);
  beginShape();
    vertex(30, -28); vertex(48, -32); vertex(58, -22);
    vertex(62, -4);  vertex(60, 14);  vertex(56, 32);
    vertex(48, 48);  vertex(38, 56);  vertex(26, 54);
    vertex(20, 40);  vertex(22, 20);  vertex(18, 4);
    vertex(22, -10); vertex(24, -22);
  endShape(CLOSE);
  fill(200, 175, 100, 190);
  beginShape();
    vertex(24, -22); vertex(48, -28); vertex(58, -18);
    vertex(58, -4);  vertex(48, 0);   vertex(30, -2);
    vertex(22, -10);
  endShape(CLOSE);
  fill(220, 238, 255, 220);
  ellipse(0, pR * 0.78, 58, 20);
  ellipse(0, -pR * 0.80, 50, 16);
  // Nuvens
  rotate(-rotP * 0.9);
  fill(255, 255, 255, 110);
  ellipse(-50, -22, 54, 16); ellipse(-36, -26, 38, 12);
  ellipse(14, 44, 48, 14);   ellipse(-16, -58, 40, 11);
  ellipse(58, 8, 34, 11);
  fill(255, 255, 255, 60);
  ellipse(0, -pR*0.76, 70, 20); ellipse(0, pR*0.74, 62, 18);
  pop();

  // Atmosfera brilhante
  noFill();
  stroke(70, 190, 255, 55); strokeWeight(9); circle(px, py, pR*2);
  stroke(130, 230, 255, 22); strokeWeight(20); circle(px, py, pR*2+4);
  noStroke();
  // Brilho especular
  fill(255, 255, 255, 70);
  ellipse(px - pR*0.38, py - pR*0.36, pR*0.50, pR*0.25);

  // ══════════════════════════════════════════
  // OVAL VERDE GRANDE — no estilo da cartinha monte AgroUNO
  // ══════════════════════════════════════════
  let ovalW = 420, ovalH = 160;
  let ovalY = py + pR + 55;

  // Sombra do oval
  fill(0, 0, 0, 100);
  ellipse(px + 6, ovalY + 8, ovalW + 16, ovalH + 8);
  // Oval principal verde escuro (borda)
  fill(8, 30, 12);
  ellipse(px, ovalY, ovalW + 14, ovalH + 8);
  // Oval verde vibrante — igual ao gradiente da cartinha monte
  for(let ov = 0; ov < 6; ov++) {
    let t = ov / 5;
    fill(lerpColor(color(12, 45, 16), color(38, 105, 38), t));
    ellipse(px, ovalY - ov*2, ovalW - ov*10, ovalH - ov*6);
  }
  // Brilho no topo do oval
  fill(255, 255, 255, 35);
  ellipse(px - 20, ovalY - ovalH*0.22, ovalW*0.55, ovalH*0.35);
  // Linha dourada ao redor do oval
  noFill(); stroke(255, 215, 0, 200); strokeWeight(3);
  ellipse(px, ovalY, ovalW + 14, ovalH + 8);
  noStroke();

  // ── TEXTO "AgroUNO!" dentro do oval — estilo UNO ──
  textAlign(CENTER, CENTER); textStyle(BOLD);
  // Sombra preta
  fill(0, 0, 0, 220); textSize(88);
  text("AgroUNO!", px + 5, ovalY + 5);
  // Contorno escuro
  fill(90, 40, 0); textSize(88);
  for(let ox = -3; ox <= 3; ox++) {
    for(let oy = -3; oy <= 3; oy++) {
      if(ox*ox + oy*oy > 1) text("AgroUNO!", px + ox, ovalY + oy);
    }
  }
  // Amarelo base
  fill(220, 155, 0); textSize(88);
  text("AgroUNO!", px, ovalY);
  // Amarelo brilhante
  fill(255, 218, 0); textSize(88);
  text("AgroUNO!", px, ovalY);
  // Reflexo branco no topo
  fill(255, 255, 200, 90); textSize(88);
  text("AgroUNO!", px, ovalY - 3);

  // ── Subtítulo abaixo do oval — "A aplicação agroecológica oficial" ──
  let subY = ovalY + ovalH * 0.5 + 28;
  fill(0, 0, 0, 140); rectMode(CENTER);
  rect(px, subY, 430, 28, 6);
  fill(255, 228, 0); textSize(14); textStyle(BOLD);
  text("A aplicação agroecológica oficial", px, subY);

  // ══════════════════════════════════════════
  // 6 CARTAS AO REDOR — como no UNO oficial
  // sup esq, mid esq, inf esq, sup dir, mid dir, inf dir
  // ══════════════════════════════════════════
  let posCartas = [
    { x: px - 320, y: py - 90,  rot: -0.42, mi: 0 }, // sup esq  — Reflorestamento (verde)
    { x: px - 295, y: py + 20,  rot:  0.18, mi: 1 }, // mid esq  — Gotejamento (azul)
    { x: px - 260, y: py + 115, rot:  0.38, mi: 3 }, // inf esq  — Rotação (marrom)
    { x: px + 320, y: py - 80,  rot:  0.40, mi: 2 }, // sup dir  — Energia Solar (amarelo)
    { x: px + 298, y: py + 28,  rot: -0.20, mi: 4 }, // mid dir  — Queimada (especial)
    { x: px + 255, y: py + 118, rot: -0.36, mi: 5 }, // inf dir  — Reciclagem (especial)
  ];

  for(let i = 0; i < posCartas.length; i++) {
    let pc = posCartas[i];
    let mi = pc.mi < modelos.length ? pc.mi : 0;
    let m = modelos[mi];
    let floatY = sin(frameCount * 0.04 + i * 1.3) * 7;
    let floatR = sin(frameCount * 0.03 + i * 1.1) * 0.05;

    push();
    translate(pc.x, pc.y + floatY);
    rotate(pc.rot + floatR);
    scale(0.62); // escala para caber ao redor do planeta
    desenharCarta(m, 0, 0, false, false);
    pop();
  }

  noStroke();

  // ── BARRA DE CARREGAMENTO ──
  rectMode(CORNER);
  let barW = 380; let barH = 14;
  let barX = width/2 - barW/2; let barY = height - 55;

  fill(0, 150); rect(barX - 2, barY - 2, barW + 4, barH + 4, 8);
  fill(80, 8, 8);  rect(barX, barY, barW, barH, 6);

  let prog = constrain(tempoCarregamento / duracaoCarregamento, 0, 1);
  let gradW = barW * prog;
  for(let gx = 0; gx < gradW; gx++) {
    let t2 = gx / barW;
    stroke(lerpColor(color(255, 200, 0), color(255, 240, 80), t2));
    line(barX + gx, barY + 1, barX + gx, barY + barH - 1);
  }
  noStroke();
  fill(255, 255, 255, 55); rect(barX + 1, barY + 1, gradW - 2, barH/2 - 1, 4);
  noFill(); stroke(255, 215, 0, 120); strokeWeight(1.5);
  rect(barX, barY, barW, barH, 6);

  noStroke(); fill(255, 230, 200); textSize(11); textAlign(CENTER, CENTER); textStyle(NORMAL);
  let dots = ".".repeat(1 + floor(frameCount / 20) % 4);
  text("Preparando o campo" + dots, width/2, barY + 24);

  // Transição para o menu
  if(tempoCarregamento >= duracaoCarregamento) {
    let fadeAlfa = map(tempoCarregamento, duracaoCarregamento, duracaoCarregamento + 30, 0, 255);
    fill(8, 30, 10, fadeAlfa); rectMode(CORNER); rect(0, 0, width, height);
    if(tempoCarregamento >= duracaoCarregamento + 30) {
      estado = "menu";
      menuAnimFrame = 0;
      menuJaAnimou = false;
      tocarSom("menu");
      iniciarMusica();
    }
  }
}

function desenharMenu(){ 
  push();
  fill(0, 175); rectMode(CORNER); rect(0, 0, width, height);

  // ── ANIMAÇÃO DE ENTRADA ──
  if (!menuJaAnimou) menuAnimFrame++;
  let prog = constrain(menuAnimFrame / menuAnimDuracao, 0, 1);
  // easing suave (ease-out cubic)
  let ease = 1 - pow(1 - prog, 3);
  if (prog >= 1) menuJaAnimou = true;

  // Fade geral da tela inteira
  let alfa = ease * 255;

  // Cartas decorativas voando para o lugar — idênticas às do jogo
  push();
  translate(width/2, height/2);
  for (let i = 0; i < cartasMenuAnim.length; i++) {
    let c = cartasMenuAnim[i];
    let cx = lerp(c.xIni, c.xFinal, ease);
    let cy = lerp(c.yIni, c.yFinal, ease);
    let cr = c.rot * ease;
    let mi = (c.mi !== undefined && c.mi < modelos.length) ? c.mi : 0;
    let m = modelos[mi];
    push();
    translate(cx, cy);
    rotate(cr);
    drawingContext.globalAlpha = ease;
    scale(0.58);
    desenharCarta(m, 0, 0, false, false);
    drawingContext.globalAlpha = 1.0;
    pop();
  }
  pop();

  // Título com slide-in de cima
  let tituloY = lerp(height/2 - 280, height/2 - 110, ease);
  textAlign(CENTER, CENTER);
  fill(255, 215, 0, alfa); textSize(68); textStyle(BOLD);
  text("🌾 AgroUNO 🚜", width/2, tituloY);

  // Subtítulo
  fill(230, alfa); textStyle(NORMAL); textSize(16);
  text("Gestão agroecológica avançada em formato competitivo", width/2, tituloY + 70);

  // Botões com fade-in suave (aparecem um pouco depois)
  let bEase = constrain((prog - 0.3) / 0.7, 0, 1);
  let bEase3 = 1 - pow(1 - bEase, 3);
  push();
  tint(255, bEase3 * 255);
  desenharBotao(width/2 - 150, height/2 + 60,  200, 60, "▶ INICIAR CAMPO", color(230, 130, 20), color(255, 160, 40)); 
  desenharBotao(width/2 + 150, height/2 + 60,  200, 60, "📖 MANUAL ECO",   color(40, 150, 70),  color(65, 190, 95)); 
  desenharBotao(width/2 - 150, height/2 + 140, 200, 55, "🛍️ LOJA SKINS",  color(140, 50, 170), color(175, 70, 210)); 
  desenharBotao(width/2 + 150, height/2 + 140, 200, 55, "🎖️ TROFÉUS",     color(35, 100, 160), color(55, 130, 200)); 
  desenharBotao(width/2 - 110, height/2 + 220, 195, 50, "❓ COMO JOGAR",   color(60, 120, 120), color(80, 160, 160));
  desenharBotao(width/2 + 110, height/2 + 220, 195, 50, "🎓 TUTORIAL",     color(180, 100, 20), color(220, 135, 30));
  pop();

  // ── CRÉDITOS NA TELA INICIAL ──
  noStroke(); fill(0, 150); rectMode(CORNER);
  rect(10, height - 72, 222, 60, 10);
  fill(200, 240, 200); textAlign(LEFT, TOP); textSize(11); textStyle(BOLD); noStroke();
  text("Lucas Schneider", 18, height - 66);
  textStyle(NORMAL); textSize(10); fill(180, 215, 180);
  text("CCM Olavo Bilac", 18, height - 52);
  text("2B  |  Jaguariaíva, PR — Brasil", 18, height - 38);

  // ── BOTÃO MUTE NA TELA INICIAL ──
  let bMx = width - 44, bMy = height - 44;
  let hMus = mouseX > bMx - 26 && mouseX < bMx + 26 && mouseY > bMy - 26 && mouseY < bMy + 26;
  noStroke(); fill(0, hMus ? 200 : 140); rectMode(CENTER); rect(bMx, bMy, 52, 52, 12);
  fill(255); textSize(22); textAlign(CENTER, CENTER); textStyle(NORMAL);
  text(musicaMutada ? "🔇" : "🎵", bMx, bMy);
  fill(180); textSize(9); text(musicaMutada ? "SOM OFF" : "SOM ON", bMx, bMy + 30);

  pop(); 
}

function desenharTelaDificuldade() {
  push();
  fill(8, 14, 10, 250); rectMode(CORNER); rect(0, 0, width, height);

  textAlign(CENTER, TOP);
  fill(255, 215, 0); textSize(36); textStyle(BOLD);
  text("⚔️ ESCOLHA A DIFICULDADE", width/2, 35);
  fill(180, 240, 180); textSize(13); textStyle(NORMAL);
  text("Qual o desafio que você aguenta hoje?", width/2, 82);

  let opcoes = [
    { id:"facil",   label:"🌱 FÁCIL",   sub:"Bot lento, joga aleatório e esquece o AGRO!", cor:color(40,160,70),  hover:color(55,200,90)  },
    { id:"medio",   label:"🌾 MÉDIO",   sub:"Bot equilibrado, reage quando você está fraco.",  cor:color(200,140,20), hover:color(240,170,30) },
    { id:"dificil", label:"🔥 DIFÍCIL", sub:"Bot esperto, planeja as jogadas com cuidado.",   cor:color(200,80,20),  hover:color(240,100,30) },
    { id:"radi",    label:"💀 RADI",    sub:"Bot implacável. +2 e bloqueio toda hora. Boa sorte.", cor:color(130,10,10),  hover:color(180,20,20)  },
  ];

  rectMode(CENTER);
  for(let i = 0; i < opcoes.length; i++) {
    let op = opcoes[i];
    let bx = width/2, by = height/2 - 60 + i * 85;
    let sel = dificuldade === op.id;

    // Fundo do card
    fill(sel ? op.hover : op.cor);
    stroke(sel ? color(255, 255, 200) : color(255, 255, 255, 40));
    strokeWeight(sel ? 3 : 1);
    rect(bx, by, 480, 65, 14);

    // Brilho selecionado
    if(sel) {
      noFill(); stroke(255, 255, 150, 80); strokeWeight(6);
      rect(bx, by, 480, 65, 14);
    }

    noStroke();
    fill(255); textSize(18); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(op.label, bx, by - 10);
    fill(255, 255, 255, 200); textSize(11); textStyle(NORMAL);
    text(op.sub, bx, by + 14);

    // Ícone de selecionado
    if(sel) {
      fill(255, 240, 80); textSize(16); text("◀ SELECIONADO ▶", bx, by - 10);
      fill(255); textSize(18); textStyle(BOLD); text(op.label, bx, by - 10);
    }
  }

  desenharBotao(width/2, height - 40, 180, 42, "⬅ VOLTAR", color(100, 40, 40), color(160, 55, 55));
  pop();
}

function desenharTelaConquistas() { 
  push(); fill(10, 15, 25, 195); rectMode(CORNER); rect(0, 0, width, height);
  textAlign(CENTER, TOP); 
  fill(255, 215, 0); textSize(30); textStyle(BOLD); text("🏆 GALERIA DE TROFÉUS ECO DELUXE", width/2, 15); 
  desenharBotao(80, 35, 140, 42, "⬅ VOLTAR", color(160, 50, 50), color(200, 70, 70));
  rectMode(CENTER);
  
  let colunas = 2;
  let largCard = min(560, (width - 80) / colunas);
  for(let i = 0; i < listaConquistas.length; i++){ 
    let c = listaConquistas[i];
    let col = i % colunas;
    let linha = floor(i / colunas);
    let cardX = width/2 + (col - 0.5) * (largCard + 20);
    let itemY = 105 + linha * 70;

    if(c.alcancada) { fill(25, 60, 35, 220); stroke(50, 215, 90); strokeWeight(2); } 
    else { fill(45, 18, 18, 220); stroke(180, 45, 45); strokeWeight(1.5); }
    rect(cardX, itemY, largCard, 58, 10); 

    textAlign(LEFT, CENTER); noStroke(); fill(255); textSize(13); textStyle(BOLD);
    text((c.alcancada ? "⭐ " : "🔒 ") + c.titulo, cardX - largCard/2 + 12, itemY - 10);
    fill(190); textSize(10); textStyle(NORMAL); 
    text(c.desc + "  🪙 +" + c.recompensa, cardX - largCard/2 + 12, itemY + 10);
    
    textAlign(RIGHT, CENTER); 
    fill(c.alcancada ? color(80, 255, 80) : color(255, 80, 80)); textSize(10); textStyle(BOLD);
    text(c.alcancada ? "✔ FEITO" : "BLOQUEADO", cardX + largCard/2 - 10, itemY);
  } 
  pop(); 
}

function desenharTelaFimDoJogo(){ 
  push(); fill(10, 15, 20, 240); rect(0, 0, width, height); rectMode(CENTER);
  fill(25, 30, 40, 250); stroke(255, 215, 0); strokeWeight(2); rect(width/2, height/2 - 40, 480, 390, 24);
  
  textAlign(CENTER, CENTER); noStroke();
  if(resultadoPartida === "vitoria") {
    fill(100, 255, 120); textSize(28); textStyle(BOLD); text("🏆 VITÓRIA SUSTENTÁVEL!", width/2, height/2 - 190);
  } else {
    fill(255, 90, 90); textSize(28); textStyle(BOLD); text("⚠️ O CAMPO SOFREU DANOS", width/2, height/2 - 190);
  }

  textAlign(LEFT, CENTER); fill(255); textSize(14); textStyle(NORMAL);
  let textoEstatistica = 
    "• Pontuação de Manejo Ecológico: " + pontos + " pts\n\n" +
    "• Total de Cartas Despachadas: " + totalCartasJogadasPartida + " jogadas\n\n" +
    "• Tempo de Gestão da Partida: " + tempoTotalPartidaTexto + "\n\n" +
    "• EcoMoedas Liquidadas: 🪙 " + (resultadoPartida === "vitoria" ? floor(pontos * 0.7) : "0");
  text(textoEstatistica, width/2 - 200, height/2 - 60);

  desenharBotao(width/2, height/2 + 65, 220, 45, "🔄 JOGAR DE NOVO", color(230, 130, 20), color(255, 160, 40)); 
  desenharBotao(width/2, height/2 + 125, 220, 45, "🚪 SAIR DO JOGO", color(55, 65, 80), color(75, 85, 105)); 
  pop(); 
}

function desenharCartasJogador(){ 
  push(); let inX = width/2 - ((cartasJogador.length - 1) * 125) / 2; 
  for(let i = 0; i < cartasJogador.length; i++){ 
    let x = inX + i * 125; let y = height - 80; 
    let h = mouseX > x - larguraCarta / 2 && mouseX < x + larguraCarta / 2 && mouseY > y - alturaCarta / 2 && mouseY < y + alturaCarta / 2; 
    desenharCarta(cartasJogador[i], x, (h && !animandoCarta) ? y - 22 : y, h, false); 
  } pop(); 
}

function desenharHUD(){ 
  push(); fill(0, 190); rectMode(CORNER); rect(0, height - 40, width, 40); fill(255); textAlign(CENTER, CENTER); textSize(15); text(mensagem, width/2, height - 20); 
  rectMode(CENTER); fill(0, 150); stroke(255, 15); rect(width/2, 85, 520, 32, 10); fill(255); textSize(13); 
  text("🌱 Pontos: " + pontos + " | 🪙 Saldo: " + ecoMoedas + " | 🌤️ Clima: " + climaAtual + " (" + rodadasParaOEvento + " rod.)", width/2, 85);
  // Botão mute discreto no canto superior direito durante o jogo
  noStroke(); fill(0, 120); rectMode(CENTER); rect(width - 30, 30, 44, 30, 8);
  fill(255); textSize(14); textAlign(CENTER, CENTER); textStyle(NORMAL);
  text(musicaMutada ? "🔇" : "🎵", width - 30, 30);
  pop(); 
}

function desenharBotao(x, y, w, h, texto, corBase, corHover){ 
  push(); let hov = mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2; rectMode(CENTER); fill(hov ? corHover : corBase); rect(x, y, w, h, 15); noStroke(); fill(255); textSize(14); textStyle(BOLD); textAlign(CENTER, CENTER); text(texto, x, y + 2); pop(); 
}

function diamond(x, y, w, h) {
  beginShape();
  vertex(x, y - h/2); vertex(x + w/2, y);
  vertex(x, y + h/2); vertex(x - w/2, y);
  endShape(CLOSE);
}

// =================================================================
// ❓ TELA DE REGRAS GERAIS
// =================================================================

function desenharTelaRegras() {
  push();
  fill(10, 18, 12, 195); rectMode(CORNER); rect(0, 0, width, height);
  desenharBotao(80, 35, 140, 42, "⬅ VOLTAR", color(150, 50, 50), color(200, 70, 70));

  // Título
  textAlign(CENTER, TOP); fill(255, 215, 0); textSize(32); textStyle(BOLD);
  text("❓ COMO JOGAR — AgroUNO", width/2, 18);
  fill(180, 240, 180); textSize(12); textStyle(NORMAL);
  text("Jogo de cartas agroecológico estilo UNO — desenvolvido por Lucas Schneider", width/2, 60);

  let col1 = 50;
  let col2 = width / 2 + 25;
  let lh = 16;

  function secao(titulo, linhas, x, y) {
    textAlign(LEFT, TOP);
    fill(100, 255, 130); textSize(13); textStyle(BOLD);
    text(titulo, x, y);
    fill(210); textSize(10.5); textStyle(NORMAL);
    for (let i = 0; i < linhas.length; i++) {
      text(linhas[i], x, y + 18 + i * lh);
    }
    return y + 18 + linhas.length * lh + 14;
  }

  // ── COLUNA ESQUERDA ──
  let ly = 88;

  ly = secao("🎯 OBJETIVO DO JOGO", [
    "Seja o primeiro jogador a descartar",
    "todas as cartas da sua mão.",
    "Com 1 carta, grite 'AGRO!' para não",
    "ser penalizado com +2 cartas."
  ], col1, ly);

  ly = secao("▶ COMO JOGAR UMA CARTA", [
    "Clique em uma carta da sua mão.",
    "Ela precisa ter a mesma COR ou o mesmo",
    "SÍMBOLO da carta que está na mesa."
  ], col1, ly);

  ly = secao("📦 SEM CARTA PARA JOGAR?", [
    "Clique no baralho (centro da mesa)",
    "para comprar 1 carta do monte."
  ], col1, ly);

  ly = secao("📢 AGRO! (equivalente ao UNO)", [
    "Ao restar 1 carta na mão, clique em",
    "'GRITAR AGRO!' antes do bot perceber.",
    "Se esquecer → leva +2 cartas de punição!"
  ], col1, ly);

  ly = secao("🚨 DENUNCIAR O BOT", [
    "Se o bot ficou com 1 carta e não gritou,",
    "clique 'DENUNCIAR BOT' para puni-lo.",
    "Ele compra +2 cartas!"
  ], col1, ly);

  ly = secao("🃏 QUANTIDADE DE CARTAS", [
    "Escolha antes de jogar: 7, 9 ou 12.",
    "7 = partida rápida (clássico)",
    "9 = equilibrada, mais opções",
    "12 = longa, máxima estratégia"
  ], col1, ly);

  ly = secao("⚔️ DIFICULDADES", [
    "🌱 Fácil — bot lento e aleatório",
    "🌾 Médio — bot equilibrado",
    "🔥 Difícil — bot esperto e estratégico",
    "💀 RADI — bot implacável, sem piedade"
  ], col1, ly);

  // ── COLUNA DIREITA ──
  ly = 88;

  ly = secao("🌿 CARTAS E SEUS EFEITOS", [
    "🌱 Reflorestamento (VERDE) — normal",
    "💧 Gotejamento (AZUL) — normal",
    "☀️ Energia Solar (AMARELO) — +pontos!",
    "🔄 Rotação Culturas (MARROM) — normal",
    "🔥 Queimada — Bloqueio: pula turno",
    "🌧️ Chuva Forte +2 — oponente compra 2",
    "   (cor aleatória ao aparecer!)",
    "♻️ Reciclagem — Coringa: sempre jogável,",
    "   você escolhe a próxima cor ativa"
  ], col2, ly);

  ly = secao("🌤️ SISTEMA DE CLIMA", [
    "A cada 4 rodadas o clima muda.",
    "Climas possíveis: Estável, Onda de Calor,",
    "Chuva Abençoada, Ventania, Geada,",
    "Tempestade Elétrica, Clima Perfeito.",
    "O clima afeta o visual e o ambiente."
  ], col2, ly);

  ly = secao("🪙 ECOMOEDAS & CONQUISTAS", [
    "Ganhe EcoMoedas vencendo partidas.",
    "Desbloqueie conquistas para bônus extras.",
    "Gaste EcoMoedas na Loja para comprar",
    "skins exclusivas para suas cartas!"
  ], col2, ly);

  ly = secao("🖼️ CENÁRIOS DISPONÍVEIS", [
    "🌾 Campo de Trigo — Paraná dourado",
    "🌳 Floresta Tropical — mata fechada",
    "☕ Cafezal — produção de café",
    "🌲 Araucárias — pôr do sol paranaense",
    "🚜 Fazenda Paranaense — celeiro e trator",
    "(Clique em CENÁRIO no topo para trocar!)"
  ], col2, ly);

  pop();
}

// =================================================================
// 🎨 SELETOR DE COR (RECICLAGEM)
// =================================================================

function desenharSeletorCor() {
  push();
  fill(0, 0, 0, 180); rectMode(CORNER); rect(0, 0, width, height);
  rectMode(CENTER);
  fill(15, 30, 20, 250); stroke(100, 255, 120); strokeWeight(2);
  rect(width/2, height/2, 420, 240, 20);
  noStroke(); fill(100, 255, 140); textSize(18); textStyle(BOLD); textAlign(CENTER, CENTER);
  text("♻️ RECICLAGEM — Escolha a cor ativa:", width/2, height/2 - 80);

  let cores = ["verde", "azul", "amarelo", "marrom"];
  let labels = ["🟢 VERDE", "🔵 AZUL", "🟡 AMARELO", "🟤 MARROM"];
  let coresBotao = [color(30,130,50), color(20,80,160), color(180,140,10), color(110,65,25)];
  let coresHover = [color(50,180,75), color(45,120,210), color(230,185,35), color(150,100,50)];

  for(let i = 0; i < 4; i++) {
    let bx = width/2 + ((i % 2) - 0.5) * 180;
    let by = height/2 + (floor(i / 2) - 0.5) * 80;
    desenharBotao(bx, by, 155, 55, labels[i], coresBotao[i], coresHover[i]);
  }
  pop();
}