// === PWA UPDATE ===
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.register('/sw.js');
}

// === TASKS LIST ===
const DAILY_TASKS_LIST = [
  "Нули в казино 2/4 BP",
  "25 действий на стройке 2/4 BP",
  "25 действий в порту 2/4 BP",
  "25 действий в шахте 2/4 BP",
  "3 победы в Дэнс Баттлах 2/4 BP",
  "Заказ материалов для бизнеса вручную (просто прожать вкл/выкл) 1/2 BP",
  "20 подходов в тренажерном зале 1/2 BP",
  "Успешная тренировка в тире 1/2 BP",
  "10 посылок на почте 1/2 BP",
  "Арендовать киностудию 2/4 BP",
  "Купить лотерейный билет 1/2 BP",
  "Выиграть гонку в картинге 1/2 BP",
  "10 действий на ферме (10 коров, 10 пшеницы и т.д. - один любой способ в день) 1/2 BP",
  "Потушить 25 'огоньков' пожарным 1/2 BP",
  "Выкопать 1 сокровище(не мусор) 1/2 BP",
  "Проехать 1 уличную гонку (через регистрацию в телефоне, ставка минимум 1000$) 1/2 BP",
  "Выполнить 3 заказа дальнобойщиком 2/4 BP",
  "Два раза оплатить смену внешности у хирурга в EMS 2/4 BP",
  "Добавить 5 видео в кинотеатре 1/2 BP",
  "Выиграть 5 игр в тренировочном комплексе со ставкой (от 100$) 1/2 BP",
  "Выиграть 3 любых игры на арене со ставкой (от 100$) 1/2 BP",
  "2 круга на любом маршруте автобусника 2/4 BP",
  "5 раз снять 100% шкуру с животных 2/4 BP",
  "Посетить любой сайт в браузере 1/2 BP",
  "Зайти в любой канал в Brawl 1/2 BP",
  "Поставить лайк любой анкете в Match 1/2 BP",
  "Прокрутить за DP серебрянный, золотой или driver кейс 10/20 BP",
  "Кинуть мяч питомцу 15 раз 2/4 BP",
  "15 выполненных питомцем команд 2/4 BP",
  "Ставка в колесе удачи в казино (межсерверное колесо) 3/6BP",
  "Проехать 1 станцию на метро 2/4 BP",
  "Поймать 20 рыб 4/8 BP",
  "Выполнить 2 квеста любых клубов 4/8 BP",
  "Починить деталь в автосервисе 1/2 BP",
  "Забросить 2 мяча в баскетболе 1/2 BP",
  "Забить 2 гола в футболе 1/2",
  "Победить в армрестлинге 1/2 BP",
  "Победить в дартс 1/2 BP",
  "Поиграть 1 минуту в волейбол 1/2 BP",
  "Поиграть 1 минуту в настольный теннис 1/2 BP",
  "Поиграть 1 минуту в большой теннис 1/2 BP",
  "Сыграть в мафию в казино 3/6 BP",
  "Сделать платеж по лизингу 1/2 BP",
  "Посадить траву в теплице 4/8 BP",
  "Запустить переработку обезболивающих в лаборатории 4/8 BP",
  "Принять участие в двух аирдропах 4/8 BP"
];

// === HASH ===
async function hashPassword(password) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getDefaultData() {
  return {
    nickname: '',
    server: '',
    transactions: [],
    dailyTasks: DAILY_TASKS_LIST.reduce((a, t) => ({ ...a, [t]: false }), {}),
    presetTimers: {},
    customTimers: {},
    lastResetDate: ''
  };
}

// === DOM ===
const screens = {
  auth: document.getElementById('authScreen'),
  main: document.getElementById('mainScreen'),
  profile: document.getElementById('profileScreen')
};

let currentUser = null;
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('user_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      loadUserData();
      showScreen('main');
    } catch (e) {
      console.error('Session error:', e);
      showScreen('auth');
    }
  } else {
    showScreen('auth');
  }
  setupAuth();
  setupMain();
  setupProfile();
});

function showScreen(name) {
  Object.values(screens).forEach(s => s.style.display = 'none');
  screens[name].style.display = 'block';
}

// === SOUND ===
function playSound() {
  const a = new Audio('/notification.mp3');
  a.volume = 0.7;
  a.play().catch(() => {});
}

async function requestNotify() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
}

// === AUTH ===
function setupAuth() {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);
}

async function login() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPassword').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  if (!email || !pass) return err.textContent = 'Заполните поля';

  try {
    const hash = await hashPassword(pass);
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .eq('password_hash', hash)
      .single();

    if (error) throw error;

    currentUser = { id: data.id, email: data.email };
    localStorage.setItem('user_session', JSON.stringify(currentUser));
    loadUserData();
    showScreen('main');
  } catch (e) {
    err.textContent = 'Неверная почта или пароль';
  }
}

async function register() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPassword').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  if (!email || !pass) return err.textContent = 'Заполните поля';

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (data && data.length > 0) return err.textContent = 'Пользователь существует';

    const hash = await hashPassword(pass);
    const { error: insErr } = await supabase
      .from('users')
      .insert({ email, password_hash: hash, data: getDefaultData() });

    if (insErr) throw insErr;

    await login();
  } catch (e) {
    err.textContent = 'Ошибка регистрации';
  }
}

// === DATA ===
async function loadUserData() {
  if (!currentUser || !currentUser.id) {
    showScreen('auth');
    return;
  }

  requestNotify();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('data')
      .eq('id', currentUser.id)
      .single();

    if (error) throw error;

    window.userData = data.data || getDefaultData();
    checkDailyReset();
    renderAll();
  } catch (e) {
    console.error('Load error:', e);
    alert('Ошибка загрузки данных. Войдите снова.');
    localStorage.removeItem('user_session');
    showScreen('auth');
  }
}

async function saveUserData() {
  if (!currentUser) return;
  try {
    const { error } = await supabase
      .from('users')
      .update({ data: window.userData })
      .eq('id', currentUser.id);
    if (error) throw error;
    localStorage.setItem('user_data_backup', JSON.stringify(window.userData));
  } catch (e) {
    console.error('Save error:', e);
    localStorage.setItem('user_data_backup', JSON.stringify(window.userData));
  }
}

function checkDailyReset() {
  const today = new Date().toISOString().split('T')[0];
  if (window.userData.lastResetDate !== today) {
    window.userData.dailyTasks = DAILY_TASKS_LIST.reduce((a, t) => ({ ...a, [t]: false }), {});
    window.userData.lastResetDate = today;
    saveUserData();
    renderDailyTasks();
  }
}

// === MAIN ===
function setupMain() {
  document.getElementById('profileBtn').addEventListener('click', () => {
    document.getElementById('nicknameInput').value = window.userData.nickname || '';
    document.getElementById('serverSelect').value = window.userData.server || '';
    updateStats();
    showScreen('profile');
  });

  document.getElementById('addTransBtn').addEventListener('click', addTransaction);
  document.getElementById('addTimerBtn').addEventListener('click', addCustomTimer);
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);

  document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins);
      startPresetTimer(btn.textContent.replace('▶️ ', '').trim(), mins * 60);
    });
  });
}

// === FINANCE ===
function addTransaction() {
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('transType').value;
  const desc = document.getElementById('desc').value.trim() || 'Без описания';
  if (isNaN(amount)) return alert('Сумма?');

  window.userData.transactions.push({ type, amount, desc, timestamp: Date.now() });
  saveUserData();
  document.getElementById('amount').value = '';
  document.getElementById('desc').value = '';
  updateSummary();
  renderTransactions();
}

function updateSummary() {
  const buy = window.userData.transactions.filter(t => t.type === 'buy').reduce((s, t) => s + t.amount, 0);
  const sell = window.userData.transactions.filter(t => t.type === 'sell').reduce((s, t) => s + t.amount, 0);
  const balance = sell - buy;
  document.getElementById('summary').textContent =
    `Итого: покупки=${buy.toFixed(2)}, продажи=${sell.toFixed(2)}, баланс=${balance >= 0 ? '+' : ''}${balance.toFixed(2)}`;
}

// === TIMERS ===
const intervals = {};

function startPresetTimer(name, duration) {
  if (window.userData.presetTimers[name]) return;
  const start = Date.now();
  window.userData.presetTimers[name] = { duration, start };
  saveUserData();
  renderTimers();

  const int = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    if (remaining <= 0) {
      clearInterval(int);
      delete window.userData.presetTimers[name];
      saveUserData();
      playSound();
      if (Notification.permission === 'granted') {
        new Notification('Таймер завершён!', { body: name });
      } else {
        alert(`Таймер завершён: ${name}!`);
      }
      renderTimers();
    }
  }, 1000);
  intervals[name] = int;
}

function addCustomTimer() {
  const name = document.getElementById('timerName').value.trim();
  if (!name || window.userData.customTimers[name]) return alert('Название?');
  window.userData.customTimers[name] = { start: Date.now() };
  saveUserData();
  document.getElementById('timerName').value = '';
  renderTimers();
}

function renderTimers() {
  const cont = document.getElementById('customTimers');
  cont.innerHTML = '';

  Object.entries(window.userData.presetTimers).forEach(([name, t]) => {
    const rem = Math.max(0, t.duration - (Date.now() - t.start) / 1000);
    cont.appendChild(createTimerEl(name, rem, true, () => {
      delete window.userData.presetTimers[name];
      saveUserData();
      renderTimers();
    }));
  });

  Object.entries(window.userData.customTimers).forEach(([name, t]) => {
    const elapsed = (Date.now() - t.start) / 1000;
    cont.appendChild(createTimerEl(name, elapsed, false, () => {
      delete window.userData.customTimers[name];
      saveUserData();
      renderTimers();
    }));
  });
}

function createTimerEl(name, sec, isPreset, onDelete) {
  const div = document.createElement('div');
  div.className = 'timer-card';
  const time = document.createElement('span');
  time.className = 'timer-time ' + (isPreset ? 'preset' : '');
  time.textContent = formatTime(Math.floor(sec));
  const nameEl = document.createElement('span');
  nameEl.textContent = name;
  const del = document.createElement('button');
  del.className = 'btn';
  del.textContent = '❌';
  del.onclick = onDelete;
  div.append(time, nameEl, del);
  return div;
}

function formatTime(s) {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}` : `${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
}

// === TASKS ===
function markTask(task) {
  if (window.userData.dailyTasks[task]) return;
  window.userData.dailyTasks[task] = true;
  saveUserData();
  renderDailyTasks();
}

function renderDailyTasks() {
  const cont = document.getElementById('dailyTasks');
  cont.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'tasks-grid';

  DAILY_TASKS_LIST.forEach(task => {
    const cell = document.createElement('div');
    cell.className = 'task-cell';
    if (window.userData.dailyTasks[task]) {
      cell.classList.add('completed');
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = window.userData.dailyTasks[task];
    checkbox.style.display = 'none';

    const label = document.createElement('label');
    label.textContent = task;

    cell.appendChild(checkbox);
    cell.appendChild(label);

    cell.addEventListener('click', () => {
      if (!window.userData.dailyTasks[task]) {
        markTaskDone(task);
        cell.classList.add('completed');
        checkbox.checked = true;
      }
    });

    grid.appendChild(cell);
  });

  cont.appendChild(grid);
}

// === PROFILE ===
function setupProfile() {
  document.getElementById('backToMainBtn').onclick = () => showScreen('main');
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('user_session');
    currentUser = null;
    showScreen('auth');
  };
  document.getElementById('saveProfileBtn').onclick = () => {
    window.userData.nickname = document.getElementById('nicknameInput').value.trim();
    window.userData.server = document.getElementById('serverSelect').value;
    saveUserData();
    alert('Сохранено!');
  };
}

function updateStats() {
  const buy = window.userData.transactions.filter(t => t.type === 'buy').reduce((s, t) => s + t.amount, 0);
  const sell = window.userData.transactions.filter(t => t.type === 'sell').reduce((s, t) => s + t.amount, 0);
  const balance = sell - buy;

  document.getElementById('statsSummary').innerHTML = `
    <p><strong>Покупки:</strong> ${buy.toFixed(2)}</p>
    <p><strong>Продажи:</strong> ${sell.toFixed(2)}</p>
    <p><strong>Баланс:</strong> <span style="color:${balance >= 0 ? 'lightgreen' : 'tomato'}">${balance >= 0 ? '+' : ''}${balance.toFixed(2)}</span></p>
  `;

  renderChart();

  const list = document.getElementById('statsTransList');
  list.innerHTML = '';
  [...window.userData.transactions].reverse().forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${new Date(t.timestamp).toLocaleDateString()} — ${t.type === 'buy' ? '🔴' : '🟢'} ${t.amount.toFixed(2)} — ${t.desc}`;
    list.appendChild(li);
  });
}

function renderChart() {
  const ctx = document.getElementById('statsChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const now = new Date();
  const labels = [];
  const buyData = [];
  const sellData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }));

    const b = window.userData.transactions
      .filter(t => t.type === 'buy' && new Date(t.timestamp).toISOString().split('T')[0] === ds)
      .reduce((sum, t) => sum + t.amount, 0);
    const s = window.userData.transactions
      .filter(t => t.type === 'sell' && new Date(t.timestamp).toISOString().split('T')[0] === ds)
      .reduce((sum, t) => sum + t.amount, 0);

    buyData.push(b);
    sellData.push(s);
  }

  // Ограничиваем максимальное значение оси Y
  const maxVal = Math.max(...buyData, ...sellData, 1) * 1.1;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Покупки',
          data: buyData,
          borderColor: 'rgba(255,112,67,1)',
          backgroundColor: 'rgba(255,112,67,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.4
        },
        {
          label: 'Продажи',
          data: sellData,
          borderColor: 'rgba(102,187,106,1)',
          backgroundColor: 'rgba(102,187,106,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e0e0e0' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxVal,
          ticks: {
            color: '#e0e0e0',
            stepSize: Math.ceil(maxVal / 5)
          },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        x: {
          ticks: { color: '#e0e0e0' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    }
  });
}

function clearAll() {
  if (!confirm('Очистить всё?')) return;
  window.userData = getDefaultData();
  window.userData.lastResetDate = new Date().toISOString().split('T')[0];
  saveUserData();
  renderAll();
}

function renderAll() {
  renderTimers();
  renderTransactions();
  updateSummary();
  renderDailyTasks();
}

function renderTransactions() {
  const list = document.getElementById('transList');
  list.innerHTML = '';
  window.userData.transactions.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.type === 'buy' ? '🔴' : '🟢'} ${t.amount.toFixed(2)} — ${t.desc}`;
    list.appendChild(li);
  });
}


