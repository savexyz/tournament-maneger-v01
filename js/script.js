// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let tournamentState = {
    players: [],
    currentRound: 1,
    currentMatchIndex: 0,
    totalRounds: 0,
    combinations: [],
    teamStats: [],
    playerStats: {},
    matchResults: {},
    activeMatch: null,
    allRounds: [], // Хранит данные всех раундов
    usedPairs: new Set() // Хранит уже использованные пары игроков
};

// ========== DOM ЭЛЕМЕНТЫ ==========
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

const numPlayersInput = document.getElementById('numPlayers');
const setPlayersCountBtn = document.getElementById('setPlayersCountBtn');
const playersInputContainer = document.getElementById('playersInputContainer');
const confirmPlayersBtn = document.getElementById('confirmPlayersBtn');
const backToStep1Btn = document.getElementById('backToStep1Btn');
const backToStep2Btn = document.getElementById('backToStep2Btn');

const currentRoundSpan = document.getElementById('currentRound');
const allTablesContainer = document.getElementById('allTablesContainer');
const currentMatchContainer = document.getElementById('currentMatchContainer');
const endMatchBtn = document.getElementById('endMatchBtn');
const playerStatsTable = document.getElementById('playerStatsTable');

const goalModal = document.getElementById('goalModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const confirmGoalBtn = document.getElementById('confirmGoalBtn');
const cancelGoalBtn = document.getElementById('cancelGoalBtn');

const resetTournamentBtn = document.getElementById('resetTournamentBtn');
const finalResults = document.getElementById('finalResults');
const newTournamentBtn = document.getElementById('newTournamentBtn');

const errorMessage = document.getElementById('errorMessage');
const playersError = document.getElementById('playersError');

let pendingGoalAction = null;

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    setupEventListeners();
}

function setupEventListeners() {
    setPlayersCountBtn.addEventListener('click', handleSetPlayersCount);
    confirmPlayersBtn.addEventListener('click', handleConfirmPlayers);
    backToStep1Btn.addEventListener('click', () => showStep(1));
    backToStep2Btn.addEventListener('click', () => showStep(2));
    endMatchBtn.addEventListener('click', handleEndMatch);
    confirmGoalBtn.addEventListener('click', handleConfirmGoal);
    cancelGoalBtn.addEventListener('click', () => goalModal.style.display = 'none');
    resetTournamentBtn.addEventListener('click', handleResetTournament);
    newTournamentBtn.addEventListener('click', () => {
        resetTournamentState();
        showStep(1);
    });
}

// ========== УПРАВЛЕНИЕ ШАГАМИ ==========
function showStep(stepNumber) {
    step1.style.display = stepNumber === 1 ? 'block' : 'none';
    step2.style.display = stepNumber === 2 ? 'block' : 'none';
    step3.style.display = stepNumber === 3 ? 'block' : 'none';
    step4.style.display = stepNumber === 4 ? 'block' : 'none';
    clearErrors();
}

function clearErrors() {
    errorMessage.style.display = 'none';
    playersError.style.display = 'none';
}

// ========== ШАГ 1: ВВОД КОЛИЧЕСТВА ИГРОКОВ ==========
function handleSetPlayersCount() {
    const numPlayers = parseInt(numPlayersInput.value);
    
    if (isNaN(numPlayers) || numPlayers < 4 || numPlayers > 20 || numPlayers % 2 !== 0) {
        errorMessage.textContent = 'Введите чётное число от 4 до 20';
        errorMessage.style.display = 'block';
        return;
    }
    
    createPlayerInputFields(numPlayers);
    showStep(2);
}

function createPlayerInputFields(count) {
    playersInputContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-input';
        
        const label = document.createElement('label');
        label.textContent = `Игрок ${i + 1}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Введите имя игрока ${i + 1}`;
        input.dataset.index = i;
        
        playerDiv.appendChild(label);
        playerDiv.appendChild(input);
        playersInputContainer.appendChild(playerDiv);
    }
}

// ========== ШАГ 2: ВВОД ИМЁН ИГРОКОВ ==========
function handleConfirmPlayers() {
    const inputs = playersInputContainer.querySelectorAll('input');
    const players = [];
    
    for (let input of inputs) {
        const name = input.value.trim();
        if (!name) {
            playersError.textContent = 'Все поля должны быть заполнены';
            playersError.style.display = 'block';
            return;
        }
        players.push(name);
    }
    
    // Проверка уникальности имён
    const uniqueNames = new Set(players);
    if (uniqueNames.size !== players.length) {
        playersError.textContent = 'Все имена должны быть уникальными';
        playersError.style.display = 'block';
        return;
    }
    
    tournamentState.players = players;
    initializeTournament();
    showStep(3);
}

// ========== ИНИЦИАЛИЗАЦИЯ ТУРНИРА ==========
function initializeTournament() {
    const numPlayers = tournamentState.players.length;
    tournamentState.totalRounds = numPlayers - 1;
    tournamentState.currentRound = 1;
    tournamentState.currentMatchIndex = 0;
    tournamentState.combinations = [];
    tournamentState.teamStats = [];
    tournamentState.playerStats = {};
    tournamentState.matchResults = {};
    tournamentState.activeMatch = null;
    tournamentState.allRounds = [];
    tournamentState.usedPairs = new Set();
    
    // Инициализация статистики игроков
    tournamentState.players.forEach(player => {
        tournamentState.playerStats[player] = {
            wins: 0,
            losses: 0,
            draws: 0,
            goals: 0,
            goalsAgainst: 0
        };
    });
    
    // Создаем первый раунд
    createNewRound();
    
    // Обновление интерфейса
    updateTournamentInterface();
}

function createNewRound() {
    const players = tournamentState.players;
    const numTeams = players.length / 2;
    
    // Генерируем уникальные команды для раунда
    const teams = generateUniqueTeams(players, numTeams);
    
    if (!teams) {
        alert('Невозможно создать уникальные команды для нового раунда!');
        return;
    }
    
    tournamentState.combinations = teams;
    initializeTeamStats();
    initializeMatchSchedule();
    
    // Сохраняем данные раунда
    tournamentState.allRounds.push({
        round: tournamentState.currentRound,
        combinations: [...teams],
        teamStats: JSON.parse(JSON.stringify(tournamentState.teamStats)),
        matchResults: JSON.parse(JSON.stringify(tournamentState.matchResults))
    });
}

function generateUniqueTeams(players, numTeams) {
    const availablePlayers = [...players];
    const teams = [];
    
    // Пытаемся создать уникальные команды
    for (let attempt = 0; attempt < 100; attempt++) {
        // Перемешиваем игроков
        shuffleArray(availablePlayers);
        
        const tempTeams = [];
        const tempUsedPairs = new Set();
        let valid = true;
        
        // Формируем команды из перемешанных игроков
        for (let i = 0; i < numTeams; i++) {
            const player1 = availablePlayers[i * 2];
            const player2 = availablePlayers[i * 2 + 1];
            
            // Создаем ключ для пары (сортированный)
            const pairKey = [player1, player2].sort().join('|');
            
            // Проверяем, не была ли эта пара уже использована
            if (tournamentState.usedPairs.has(pairKey)) {
                valid = false;
                break;
            }
            
            tempTeams.push([player1, player2]);
            tempUsedPairs.add(pairKey);
        }
        
        // Если все пары уникальны, используем их
        if (valid) {
            // Добавляем пары в usedPairs
            tempUsedPairs.forEach(pair => tournamentState.usedPairs.add(pair));
            return tempTeams;
        }
    }
    
    // Если не удалось создать уникальные команды, используем любые
    console.warn('Не удалось создать полностью уникальные команды, используем доступные');
    
    const fallbackTeams = [];
    for (let i = 0; i < numTeams; i++) {
        fallbackTeams.push([availablePlayers[i * 2], availablePlayers[i * 2 + 1]]);
    }
    
    return fallbackTeams;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializeTeamStats() {
    tournamentState.teamStats = tournamentState.combinations.map((team, index) => ({
        teamIndex: index,
        players: team,
        wins: 0,
        losses: 0,
        draws: 0,
        goals: 0,
        goalsAgainst: 0,
        points: 0
    }));
}

function initializeMatchSchedule() {
    const numTeams = tournamentState.teamStats.length;
    tournamentState.matchResults = {};
    
    // Создаем расписание матчей
    const matches = createBalancedSchedule(numTeams);
    
    // Заполняем matchResults
    matches.forEach(([team1Index, team2Index]) => {
        const matchKey = `${team1Index}-${team2Index}`;
        tournamentState.matchResults[matchKey] = {
            played: false,
            score1: 0,
            score2: 0
        };
    });
    
    // Начинаем с первого матча
    tournamentState.currentMatchIndex = 0;
    const firstMatch = matches[0];
    tournamentState.activeMatch = `${firstMatch[0]}-${firstMatch[1]}`;
}

function createBalancedSchedule(numTeams) {
    const matches = [];
    
    // Создаем все возможные пары
    for (let i = 0; i < numTeams; i++) {
        for (let j = i + 1; j < numTeams; j++) {
            matches.push([i, j]);
        }
    }
    
    // Перемешиваем матчи
    shuffleArray(matches);
    
    // Переупорядочиваем матчи, чтобы команда не играла подряд больше 2 раз
    return balanceMatches(matches, numTeams);
}

function balanceMatches(matches, numTeams) {
    const balancedMatches = [];
    const teamLastMatches = new Array(numTeams).fill(0);
    const teamMatchCount = new Array(numTeams).fill(0);
    
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (matches.length > 0 && attempts < maxAttempts) {
        attempts++;
        
        // Находим команду, которая дольше всех не играла
        let teamToPlay = teamLastMatches.indexOf(Math.min(...teamLastMatches));
        
        // Ищем матч с этой командой
        let matchIndex = -1;
        for (let i = 0; i < matches.length; i++) {
            if (matches[i][0] === teamToPlay || matches[i][1] === teamToPlay) {
                const otherTeam = matches[i][0] === teamToPlay ? matches[i][1] : matches[i][0];
                
                // Проверяем, не играла ли команда подряд 2 раза
                if (teamMatchCount[teamToPlay] < 2 && teamMatchCount[otherTeam] < 2) {
                    matchIndex = i;
                    break;
                }
            }
        }
        
        // Если нашли подходящий матч
        if (matchIndex !== -1) {
            const match = matches.splice(matchIndex, 1)[0];
            balancedMatches.push(match);
            
            // Обновляем счетчики
            teamLastMatches[match[0]] = balancedMatches.length;
            teamLastMatches[match[1]] = balancedMatches.length;
            teamMatchCount[match[0]]++;
            teamMatchCount[match[1]]++;
            
            // Сбрасываем счетчики, если команда сыграла 2 раза
            if (teamMatchCount[match[0]] >= 2) teamMatchCount[match[0]] = 0;
            if (teamMatchCount[match[1]] >= 2) teamMatchCount[match[1]] = 0;
        } else {
            // Если не нашли подходящий матч, берем любой
            const match = matches.shift();
            balancedMatches.push(match);
            teamLastMatches[match[0]] = balancedMatches.length;
            teamLastMatches[match[1]] = balancedMatches.length;
        }
    }
    
    // Если остались необработанные матчи, добавляем их в конец
    if (matches.length > 0) {
        balancedMatches.push(...matches);
    }
    
    return balancedMatches;
}

// ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ТУРНИРА ==========
function updateTournamentInterface() {
    currentRoundSpan.textContent = tournamentState.currentRound;
    updateAllTables();
    updateCurrentMatchDisplay();
    updatePlayerStatsTable();
}

function updateAllTables() {
    allTablesContainer.innerHTML = '';
    
    // Отображаем все созданные раунды
    tournamentState.allRounds.forEach(roundData => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-table';
        
        const roundTitle = document.createElement('h3');
        roundTitle.textContent = `Раунд ${roundData.round}`;
        if (roundData.round === tournamentState.currentRound) {
            roundTitle.innerHTML += ' <span style="color: #27ae60;">(Текущий)</span>';
        }
        
        roundDiv.appendChild(roundTitle);
        
        // Создаем таблицу для этого раунда
        const tableHTML = createTableForRound(roundData);
        roundDiv.innerHTML += tableHTML;
        
        allTablesContainer.appendChild(roundDiv);
    });
}

function createTableForRound(roundData) {
    const numTeams = roundData.combinations.length;
    
    let html = `
        <table class="tournament-table">
            <thead>
                <tr>
                    <th class="team-header">Команды</th>
    `;
    
    // Заголовки столбцов матчей
    for (let i = 1; i <= numTeams; i++) {
        html += `<th class="match-header">vs К${i}</th>`;
    }
    
    html += `
                    <th>Голы</th>
                    <th>Проп.</th>
                    <th>Ничьи</th>
                    <th>Пор.</th>
                    <th>Поб.</th>
                    <th>Очки</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Строки для каждой команды
    roundData.combinations.forEach((team, teamIndex) => {
        const teamStats = roundData.teamStats[teamIndex];
        
        html += `<tr>`;
        
        // Ячейка с именами игроков
        html += `<td class="team-cell">`;
        team.forEach(player => {
            html += `<div class="player-name-cell">${player}</div>`;
        });
        html += `</td>`;
        
        // Ячейки с результатами матчей
        for (let i = 0; i < numTeams; i++) {
            if (teamIndex === i) {
                // Диагональная ячейка
                html += `<td class="diagonal-cell">-</td>`;
            } else {
                const matchKey = teamIndex < i ? `${teamIndex}-${i}` : `${i}-${teamIndex}`;
                const match = roundData.matchResults[matchKey];
                
                if (match && match.played) {
                    // Матч сыгран
                    const isTeam1 = teamIndex < i;
                    const score1 = match.score1;
                    const score2 = match.score2;
                    const score = isTeam1 ? `${score1}:${score2}` : `${score2}:${score1}`;
                    
                    // Определяем очки для этой команды
                    let points = 0;
                    if (isTeam1) {
                        if (score1 > score2) points = 3;
                        else if (score1 === score2) points = 1;
                    } else {
                        if (score2 > score1) points = 3;
                        else if (score1 === score2) points = 1;
                    }
                    
                    // Проверяем, активный ли это матч в текущем раунде
                    const isActiveMatch = roundData.round === tournamentState.currentRound && 
                                          matchKey === tournamentState.activeMatch;
                    const cellClass = isActiveMatch ? 'active-match' : '';
                    
                    html += `
                        <td class="match-result-cell ${cellClass}">
                            <div class="score">${score}</div>
                            <div class="match-points">${points} очк${points === 1 ? 'о' : 'а'}</div>
                        </td>
                    `;
                } else if (match) {
                    // Матч не сыгран, но идет или будет
                    const isTeam1 = teamIndex < i;
                    const score1 = match.score1;
                    const score2 = match.score2;
                    const score = isTeam1 ? `${score1}:${score2}` : `${score2}:${score1}`;
                    
                    // Проверяем, активный ли это матч
                    const isActiveMatch = roundData.round === tournamentState.currentRound && 
                                          matchKey === tournamentState.activeMatch;
                    const cellClass = isActiveMatch ? 'active-match' : '';
                    
                    html += `
                        <td class="${cellClass}">
                            <div class="score">${score}</div>
                        </td>
                    `;
                }
            }
        }
        
        // Статистические ячейки
        html += `
            <td class="stats-cell">${teamStats.goals}</td>
            <td class="stats-cell">${teamStats.goalsAgainst}</td>
            <td class="stats-cell draws-cell">${teamStats.draws}</td>
            <td class="stats-cell losses-cell">${teamStats.losses}</td>
            <td class="stats-cell wins-cell">${teamStats.wins}</td>
            <td class="stats-cell">${teamStats.points}</td>
        `;
        
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    return html;
}

function updateCurrentMatchDisplay() {
    if (!tournamentState.activeMatch) return;
    
    const [team1Index, team2Index] = tournamentState.activeMatch.split('-').map(Number);
    const team1 = tournamentState.teamStats[team1Index];
    const team2 = tournamentState.teamStats[team2Index];
    const match = tournamentState.matchResults[tournamentState.activeMatch];
    
    let html = `
        <div class="team-display">
            <h4>Команда ${team1Index + 1}</h4>
    `;
    
    team1.players.forEach(player => {
        html += `
            <div class="player-with-controls">
                <span class="player-name">${player}</span>
                <div class="player-controls">
                    <button class="goal-btn" onclick="showGoalModal('add', ${team1Index}, '${player}')">Гол</button>
                    <button class="cancel-goal-btn" onclick="showGoalModal('remove', ${team1Index}, '${player}')">Отмена</button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="team-score">${match.score1}:${match.score2}</div>
        <div class="team-display">
            <h4>Команда ${team2Index + 1}</h4>
    `;
    
    team2.players.forEach(player => {
        html += `
            <div class="player-with-controls">
                <span class="player-name">${player}</span>
                <div class="player-controls">
                    <button class="goal-btn" onclick="showGoalModal('add', ${team2Index}, '${player}')">Гол</button>
                    <button class="cancel-goal-btn" onclick="showGoalModal('remove', ${team2Index}, '${player}')">Отмена</button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    currentMatchContainer.innerHTML = html;
}

function updatePlayerStatsTable() {
    const players = tournamentState.players;
    
    let html = `
        <table class="player-stats-table">
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Победы</th>
                    <th>Поражения</th>
                    <th>Ничьи</th>
                    <th>Голы</th>
                    <th>Пропущенные</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    players.forEach(player => {
        const stats = tournamentState.playerStats[player];
        html += `
            <tr>
                <td><strong>${player}</strong></td>
                <td class="wins-cell">${stats.wins}</td>
                <td class="losses-cell">${stats.losses}</td>
                <td class="draws-cell">${stats.draws}</td>
                <td>${stats.goals}</td>
                <td>${stats.goalsAgainst}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    playerStatsTable.innerHTML = html;
}

// ========== УПРАВЛЕНИЕ ГОЛАМИ ==========
window.showGoalModal = function(action, teamIndex, player) {
    const [team1Index, team2Index] = tournamentState.activeMatch.split('-').map(Number);
    const isTeam1 = teamIndex === team1Index;
    const match = tournamentState.matchResults[tournamentState.activeMatch];
    
    // Проверяем, можно ли отменить гол
    if (action === 'remove') {
        if (isTeam1 && match.score1 === 0) {
            alert('Нет голов для отмены у этой команды');
            return;
        }
        if (!isTeam1 && match.score2 === 0) {
            alert('Нет голов для отмены у этой команды');
            return;
        }
    }
    
    pendingGoalAction = {
        action: action,
        teamIndex: teamIndex,
        player: player,
        isTeam1: isTeam1
    };
    
    if (action === 'add') {
        modalTitle.textContent = 'Подтверждение гола';
        modalMessage.textContent = `Засчитать гол игроку ${player}?`;
    } else {
        modalTitle.textContent = 'Отмена гола';
        modalMessage.textContent = `Отменить гол у игрока ${player}?`;
    }
    
    goalModal.style.display = 'flex';
}

function handleConfirmGoal() {
    if (!pendingGoalAction) return;
    
    const { action, teamIndex, player, isTeam1 } = pendingGoalAction;
    const matchKey = tournamentState.activeMatch;
    const match = tournamentState.matchResults[matchKey];
    const [team1Index, team2Index] = matchKey.split('-').map(Number);
    
    if (action === 'add') {
        // Добавление гола
        if (isTeam1) {
            match.score1++;
            // Обновляем голы команды
            tournamentState.teamStats[team1Index].goals++;
            // Обновляем пропущенные у противоположной команды
            tournamentState.teamStats[team2Index].goalsAgainst++;
            // Обновляем пропущенные у игроков противоположной команды
            tournamentState.teamStats[team2Index].players.forEach(oppPlayer => {
                tournamentState.playerStats[oppPlayer].goalsAgainst++;
            });
        } else {
            match.score2++;
            tournamentState.teamStats[team2Index].goals++;
            tournamentState.teamStats[team1Index].goalsAgainst++;
            tournamentState.teamStats[team1Index].players.forEach(oppPlayer => {
                tournamentState.playerStats[oppPlayer].goalsAgainst++;
            });
        }
        
        // Обновление статистики игрока (голы)
        tournamentState.playerStats[player].goals++;
        
    } else {
        // Отмена гола
        if (isTeam1 && match.score1 > 0) {
            match.score1--;
            tournamentState.teamStats[team1Index].goals--;
            tournamentState.teamStats[team2Index].goalsAgainst--;
            tournamentState.playerStats[player].goals--;
            tournamentState.teamStats[team2Index].players.forEach(oppPlayer => {
                tournamentState.playerStats[oppPlayer].goalsAgainst--;
            });
        } else if (!isTeam1 && match.score2 > 0) {
            match.score2--;
            tournamentState.teamStats[team2Index].goals--;
            tournamentState.teamStats[team1Index].goalsAgainst--;
            tournamentState.playerStats[player].goals--;
            tournamentState.teamStats[team1Index].players.forEach(oppPlayer => {
                tournamentState.playerStats[oppPlayer].goalsAgainst--;
            });
        }
    }
    
    // Обновляем данные текущего раунда
    updateCurrentRoundData();
    
    goalModal.style.display = 'none';
    pendingGoalAction = null;
    updateTournamentInterface();
}

function updateCurrentRoundData() {
    // Находим текущий раунд в allRounds и обновляем его данные
    const currentRoundIndex = tournamentState.currentRound - 1;
    tournamentState.allRounds[currentRoundIndex] = {
        round: tournamentState.currentRound,
        combinations: [...tournamentState.combinations],
        teamStats: JSON.parse(JSON.stringify(tournamentState.teamStats)),
        matchResults: JSON.parse(JSON.stringify(tournamentState.matchResults))
    };
}

// ========== ЗАВЕРШЕНИЕ МАТЧА ==========
function handleEndMatch() {
    const matchKey = tournamentState.activeMatch;
    const match = tournamentState.matchResults[matchKey];
    
    // Матч можно завершить даже со счетом 0:0
    match.played = true;
    
    // Обновляем статистику команд
    updateTeamStatsAfterMatch();
    
    // Обновляем данные текущего раунда
    updateCurrentRoundData();
    
    // Переходим к следующему матчу
    const matches = Object.keys(tournamentState.matchResults);
    const currentIndex = matches.indexOf(matchKey);
    
    if (currentIndex < matches.length - 1) {
        // Есть ещё матчи в этом раунде
        tournamentState.currentMatchIndex = currentIndex + 1;
        tournamentState.activeMatch = matches[currentIndex + 1];
        updateTournamentInterface();
    } else {
        // Все матчи раунда сыграны
        checkTournamentProgress();
    }
}

function updateTeamStatsAfterMatch() {
    const matchKey = tournamentState.activeMatch;
    const match = tournamentState.matchResults[matchKey];
    const [team1Index, team2Index] = matchKey.split('-').map(Number);
    const team1 = tournamentState.teamStats[team1Index];
    const team2 = tournamentState.teamStats[team2Index];
    
    // Обновляем победы/поражения/ничьи
    if (match.score1 > match.score2) {
        team1.wins++;
        team1.points += 3;
        team2.losses++;
        
        // Обновляем статистику игроков
        team1.players.forEach(player => tournamentState.playerStats[player].wins++);
        team2.players.forEach(player => tournamentState.playerStats[player].losses++);
    } else if (match.score1 < match.score2) {
        team2.wins++;
        team2.points += 3;
        team1.losses++;
        
        team2.players.forEach(player => tournamentState.playerStats[player].wins++);
        team1.players.forEach(player => tournamentState.playerStats[player].losses++);
    } else {
        team1.draws++;
        team2.draws++;
        team1.points += 1;
        team2.points += 1;
        
        team1.players.forEach(player => tournamentState.playerStats[player].draws++);
        team2.players.forEach(player => tournamentState.playerStats[player].draws++);
    }
}

function checkTournamentProgress() {
    const allMatchesPlayed = Object.values(tournamentState.matchResults).every(match => match.played);
    
    if (allMatchesPlayed) {
        if (tournamentState.currentRound < tournamentState.totalRounds) {
            // Создаем новый раунд
            tournamentState.currentRound++;
            createNewRound();
            updateTournamentInterface();
        } else {
            // Турнир завершен
            showFinalResults();
        }
    }
}

// ========== ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ ==========
function showFinalResults() {
    const players = tournamentState.players;
    
    // Собираем статистику для сортировки
    const playerResults = players.map(player => {
        const stats = tournamentState.playerStats[player];
        return {
            name: player,
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
            goals: stats.goals,
            goalsAgainst: stats.goalsAgainst,
            goalDifference: stats.goals - stats.goalsAgainst
        };
    });
    
    // Сортируем по правилам турнира
    playerResults.sort((a, b) => {
        // 1. Больше побед
        if (b.wins !== a.wins) return b.wins - a.wins;
        
        // 2. Меньше поражений
        if (a.losses !== b.losses) return a.losses - b.losses;
        
        // 3. Больше голов
        if (b.goals !== a.goals) return b.goals - a.goals;
        
        // 4. Меньше пропущенных
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
        
        // 5. Больше ничьих
        return b.draws - a.draws;
    });
    
    let html = `
        <table class="final-results-table">
            <thead>
                <tr>
                    <th>Место</th>
                    <th>Игрок</th>
                    <th>Победы</th>
                    <th>Поражения</th>
                    <th>Ничьи</th>
                    <th>Голы</th>
                    <th>Пропущенные</th>
                    <th>Разница</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let currentPosition = 1;
    
    playerResults.forEach((player, index) => {
        let position = currentPosition;
        
        // Проверяем, делит ли игрок место с предыдущим
        if (index > 0) {
            const prev = playerResults[index - 1];
            if (player.wins === prev.wins &&
                player.losses === prev.losses &&
                player.goals === prev.goals &&
                player.goalsAgainst === prev.goalsAgainst &&
                player.draws === prev.draws) {
                position = currentPosition;
            } else {
                position = index + 1;
                currentPosition = index + 1;
            }
        }
        
        const positionClass = position <= 3 ? `position-${position}` : 'position-other';
        
        html += `
            <tr>
                <td>
                    <div class="position-cell ${positionClass}">${position}</div>
                </td>
                <td><strong>${player.name}</strong></td>
                <td class="wins-cell">${player.wins}</td>
                <td class="losses-cell">${player.losses}</td>
                <td class="draws-cell">${player.draws}</td>
                <td>${player.goals}</td>
                <td>${player.goalsAgainst}</td>
                <td>${player.goalDifference > 0 ? '+' : ''}${player.goalDifference}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    finalResults.innerHTML = html;
    
    showStep(4);
}

// ========== СБРОС ТУРНИРА ==========
function handleResetTournament() {
    if (confirm('Вы уверены, что хотите сбросить турнир? Все данные будут потеряны.')) {
        resetTournamentState();
        showStep(1);
    }
}

function resetTournamentState() {
    tournamentState = {
        players: [],
        currentRound: 1,
        currentMatchIndex: 0,
        totalRounds: 0,
        combinations: [],
        teamStats: [],
        playerStats: {},
        matchResults: {},
        activeMatch: null,
        allRounds: [],
        usedPairs: new Set()
    };
    
    numPlayersInput.value = '4';
    playersInputContainer.innerHTML = '';
    allTablesContainer.innerHTML = '';
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
// Экспортируем функции для глобального использования
window.showGoalModal = showGoalModal;