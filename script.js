// Audio Controller
let audioCtx;
const sfx = {
    init: function() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    },
    playTone: function(freq, type, duration, vol=0.1) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    click: function() { this.playTone(600, 'sine', 0.1, 0.1); },
    installSkill: function() { 
        this.playTone(800, 'square', 0.1, 0.1); 
        setTimeout(() => this.playTone(1200, 'square', 0.15, 0.1), 100);
    },
    catchGood: function() { 
        this.playTone(800, 'square', 0.1, 0.05); 
        setTimeout(() => this.playTone(1200, 'square', 0.15, 0.05), 100);
    },
    catchBad: function() { 
        this.playTone(150, 'sawtooth', 0.3, 0.1); 
    },
    countdown: function() { this.playTone(440, 'square', 0.1, 0.05); },
    go: function() { this.playTone(880, 'square', 0.3, 0.1); },
    levelUp: function() {
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.2, 0.05), i * 150);
        });
    },
    wrong: function() {
        this.playTone(200, 'square', 0.2, 0.1);
        setTimeout(() => this.playTone(150, 'square', 0.3, 0.1), 150);
    },
    win: function() {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.3, 0.08), i * 150);
        });
        setTimeout(() => this.playTone(1046.50, 'square', 0.6, 0.08), 600);
    }
};

let bgmInterval;
function startBGM() {
    if (bgmInterval) clearInterval(bgmInterval);
    const bass = [110, 110, 110, 110, 130.81, 130.81, 146.83, 146.83];
    let step = 0;
    bgmInterval = setInterval(() => {
        sfx.playTone(bass[step % bass.length], 'sawtooth', 0.2, 0.02);
        step++;
    }, 250);
}

// State
let state = {
    score: 0,
    degree: null,
    skills: new Set(),
    gameActive: false
};

// Elements
const screens = document.querySelectorAll('.screen');
const btnStart = document.getElementById('btn-start');

// Navigation
function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

btnStart.addEventListener('click', () => {
    sfx.init();
    sfx.click();
    startBGM();
    showScreen('screen-level1');
    prepareLevel1();
});

// Level 1: Catch game
let fallTimeouts = [];
const gameContainer = document.getElementById('game-catch');
const catcher = document.getElementById('catcher');
const scoreDisplay = document.getElementById('score-display');
const btnSkipL1 = document.getElementById('btn-skip-l1');

const goodSubjects = ['Mathematics', 'Science', 'Computer Science', 'Physics', 'Further Maths'];
const badSubjects = ['History', 'Art', 'Geography', 'Drama', 'PE'];

// Mouse / Touch tracking for catcher
let catcherX = gameContainer.clientWidth / 2;

function updateCatcherPos(clientX) {
    if (!state.gameActive) return;
    let rect = gameContainer.getBoundingClientRect();
    let x = clientX - rect.left;
    const catcherWidth = catcher.clientWidth;
    x = Math.max(catcherWidth/2, Math.min(x, rect.width - catcherWidth/2));
    catcherX = x;
    catcher.style.left = x + 'px';
}

gameContainer.addEventListener('mousemove', (e) => {
    updateCatcherPos(e.clientX);
});

gameContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    updateCatcherPos(e.touches[0].clientX);
}, {passive: false});

const countdownOverlay = document.getElementById('countdown-overlay');

function prepareLevel1() {
    btnSkipL1.style.display = 'none';
    document.querySelectorAll('.falling-item').forEach(el => el.remove());
    fallTimeouts.forEach(clearTimeout);
    fallTimeouts = [];
    catcher.style.left = '50%';
    scoreDisplay.textContent = `Subjects: 0 / 4`;
    scoreDisplay.style.color = 'var(--neon-blue)';
    
    countdownOverlay.style.display = 'flex';
    countdownOverlay.style.background = 'rgba(11, 15, 25, 0.8)';
    let count = 3;
    countdownOverlay.textContent = count;
    sfx.countdown();
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownOverlay.textContent = count;
            sfx.countdown();
        } else if (count === 0) {
            countdownOverlay.textContent = "GO!";
            countdownOverlay.style.color = "var(--neon-blue)";
            sfx.go();
        } else {
            clearInterval(countInterval);
            countdownOverlay.style.display = 'none';
            countdownOverlay.style.color = "var(--neon-pink)";
            startLevel1();
        }
    }, 1000);
}

function startLevel1() {
    state.score = 0;
    state.gameActive = true;
    spawnLoop();
}

function spawnLoop() {
    if (!state.gameActive || state.score >= 4) return;
    spawnItem();
    let nextSpawn = 1200 + Math.random() * 1000; // spawn every 1.2s to 2.2s
    let t = setTimeout(spawnLoop, nextSpawn);
    fallTimeouts.push(t);
}

function spawnItem() {
    const item = document.createElement('div');
    item.classList.add('falling-item');
    
    // 60% chance for good subject
    const isGood = Math.random() > 0.4;
    item.textContent = isGood 
        ? goodSubjects[Math.floor(Math.random() * goodSubjects.length)]
        : badSubjects[Math.floor(Math.random() * badSubjects.length)];
    
    if (isGood) item.classList.add('item-good');
    else item.classList.add('item-bad');

    // Make sure we append first to get clientWidth
    item.style.left = '0px';
    item.style.top = '0px';
    gameContainer.appendChild(item);

    const containerWidth = gameContainer.clientWidth;
    const itemWidth = item.clientWidth;
    const xPos = Math.random() * (containerWidth - itemWidth);
    item.style.left = `${xPos}px`;
    
    let yPos = -30;
    item.style.top = `${yPos}px`;
    // Reduced fall speed so subjects are readable
    const fallSpeed = 0.8 + Math.random() * 1.2; 
    
    function fall() {
        if (!state.gameActive || !item.parentNode) return;
        
        yPos += fallSpeed;
        item.style.top = `${yPos}px`;
        
        // Collision detection
        const itemRect = item.getBoundingClientRect();
        const catcherRect = catcher.getBoundingClientRect();
        
        if (
            itemRect.bottom >= catcherRect.top &&
            itemRect.top <= catcherRect.bottom &&
            itemRect.right >= catcherRect.left &&
            itemRect.left <= catcherRect.right
        ) {
            // Caught
            item.remove();
            if (isGood) {
                sfx.catchGood();
                state.score++;
                scoreDisplay.textContent = `Subjects: ${state.score} / 4`;
                if (state.score >= 4) {
                    endLevel1();
                }
            } else {
                sfx.catchBad();
                scoreDisplay.style.color = "red";
                setTimeout(() => { 
                    if (state.score < 4) scoreDisplay.style.color = "var(--neon-blue)"; 
                }, 300);
            }
        } else if (itemRect.top > gameContainer.getBoundingClientRect().bottom) {
            // Missed
            item.remove();
        } else {
            requestAnimationFrame(fall);
        }
    }
    
    requestAnimationFrame(fall);
}

function endLevel1() {
    state.gameActive = false;
    document.querySelectorAll('.falling-item').forEach(el => el.remove());
    scoreDisplay.textContent = `Subjects: ${state.score} / 4`;
    scoreDisplay.style.color = 'var(--neon-blue)';
    btnSkipL1.style.display = 'block';
    
    countdownOverlay.innerHTML = "<div style='font-size: 2rem; text-align: center; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); letter-spacing: 1px; line-height: 1.5;'>Excellent!<br>Please click the 'Next Step' button.</div>";
    countdownOverlay.style.display = 'flex';
    countdownOverlay.style.background = 'rgba(11, 15, 25, 0.95)';
    sfx.levelUp();
}

btnSkipL1.addEventListener('click', () => {
    sfx.click();
    showScreen('screen-level2');
});

// Level 2: Degree
const degreeCards = document.querySelectorAll('.card');
degreeCards.forEach(card => {
    card.addEventListener('click', () => {
        sfx.click();
        state.degree = card.dataset.degree;
        showScreen('screen-level3');
        initLevel3();
        updateBotPreview();
    });
});

// Level 3: Skills
const level3SkillsContainer = document.getElementById('level3-skills');
const installedSkills = document.getElementById('installed-skills');
const btnFinish = document.getElementById('btn-finish');
const botMsg = document.getElementById('bot-msg');

const allSkills = [
    { name: "Python", realName: "Python Programming", isCorrect: true },
    { name: "Machine Learning", realName: "Machine Learning", isCorrect: true },
    { name: "Data Analysis", realName: "Data Analysis", isCorrect: true },
    { name: "Statistics", realName: "Statistics & Algorithms", isCorrect: true },
    { name: "Video Editing", realName: "Video Editing", isCorrect: false },
    { name: "Creative Writing", realName: "Creative Writing", isCorrect: false },
    { name: "Accounting", realName: "Accounting", isCorrect: false },
    { name: "Biology", realName: "Biology", isCorrect: false }
];

function initLevel3() {
    level3SkillsContainer.innerHTML = '';
    botMsg.style.display = 'none';
    botMsg.style.color = 'var(--neon-pink)';
    botMsg.style.borderColor = 'var(--neon-pink)';
    
    // Shuffle skills
    let shuffled = [...allSkills].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.textContent = skill.name;
        btn.dataset.skill = skill.realName;
        btn.dataset.correct = skill.isCorrect;
        
        btn.addEventListener('click', () => {
            if (skill.isCorrect) {
                sfx.installSkill();
                state.skills.add(skill.realName);
                btn.classList.add('installed');
                btn.disabled = true;
                botMsg.style.display = 'none';
                updateBotPreview();
            } else {
                // Reject
                sfx.wrong();
                btn.classList.add('wrong');
                setTimeout(() => btn.classList.remove('wrong'), 500);
                botMsg.textContent = "BZZT! I don't need " + skill.name + "!";
                botMsg.style.display = 'block';
                botMsg.classList.remove('shake');
                void botMsg.offsetWidth; // trigger reflow
                botMsg.classList.add('shake');
            }
        });
        
        level3SkillsContainer.appendChild(btn);
    });
}

function updateBotPreview() {
    installedSkills.innerHTML = '';
    state.skills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'installed-chip';
        div.textContent = skill;
        installedSkills.appendChild(div);
    });
    
    if (state.skills.size === 4) {
        btnFinish.style.display = 'block';
        btnFinish.style.animation = 'fadeIn 0.5s';
        
        document.querySelectorAll('.skill-btn').forEach(b => b.disabled = true);
        botMsg.textContent = "All core AI skills installed! Ready.";
        botMsg.style.color = "var(--neon-blue)";
        botMsg.style.borderColor = "var(--neon-blue)";
        botMsg.style.display = 'block';
        botMsg.classList.remove('shake');
        sfx.levelUp();
    }
}

btnFinish.addEventListener('click', () => {
    sfx.click();
    calculateCareer();
    sfx.win();
    showScreen('screen-outro');
});

// Outro
function calculateCareer() {
    const titleEl = document.getElementById('final-career-title');
    const descEl = document.getElementById('final-career-desc');
    const pathEl = document.getElementById('path-summary');
    const botFinal = document.getElementById('bot-final');

    let title = "";
    let desc = "";
    
    // Clear old classes
    botFinal.className = 'bot-final';

    if (state.degree === 'Robotics') {
        title = "Robotics Engineer";
        desc = "Builds intelligent robots. Creates smart physical systems.";
        botFinal.classList.add('bot-robotics');
    } else if (state.degree === 'Data Science') {
        title = "Data Scientist";
        desc = "Analyses data. Turns data into massive insights.";
        botFinal.classList.add('bot-data');
    } else if (state.degree === 'Artificial Intelligence') {
        title = "AI Researcher";
        desc = "Develops new technology. Innovates the future of learning.";
        botFinal.classList.add('bot-research');
    } else {
        // Computer Science -> AI Engineer
        title = "AI Engineer";
        desc = "Builds end-to-end AI systems. Trains intelligent models.";
        botFinal.classList.add('bot-general');
    }

    titleEl.textContent = title;
    descEl.textContent = desc;
    
    // Custom logic to highlight specific skills could go here
    const skillsList = Array.from(state.skills).join(', ');
    pathEl.innerHTML = `<strong>A-Levels:</strong> STEM Focus<br>
                        <strong>Degree:</strong> ${state.degree}<br>
                        <strong>Skills:</strong> ${skillsList}`;
}

document.getElementById('btn-restart').addEventListener('click', () => {
    sfx.click();
    state = { score: 0, degree: null, skills: new Set(), gameActive: false };
    installedSkills.innerHTML = '';
    btnFinish.style.display = 'none';
    if(botMsg) botMsg.style.display = 'none';
    showScreen('screen-intro');
});
