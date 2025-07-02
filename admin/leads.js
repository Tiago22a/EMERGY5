import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { Chart, registerables } from "https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.esm.min.js";

Chart.register(...registerables);

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAzuAWnx-hHZ8WQNjU_2iY40i32_aqOF6I",
  authDomain: "emergy-41abe.firebaseapp.com",
  projectId: "emergy-41abe",
  storageBucket: "emergy-41abe.appspot.com",
  messagingSenderId: "105318588888",
  appId: "1:1053185888:web:f814971e9ff8453c38d2ad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let chartInstance = null;
let carregando = false;

// Autenticação e carregamento inicial
window.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      carregarDashboard();
    }
  });
});

// Carrega dashboard de leads
async function carregarDashboard() {
  if (carregando) return;
  carregando = true;

  document.getElementById('totalLeads').textContent = 'Carregando...';
  document.getElementById('leads24h').textContent = 'Carregando...';

  try {
    const leadsCol = collection(db, "leads");
    const allLeadsSnapshot = await getDocs(leadsCol);
    const totalLeads = allLeadsSnapshot.size;

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const timestampOntem = Timestamp.fromDate(ontem);

    const query24h = query(leadsCol, where("dataEnvio", ">", timestampOntem));
    const ultimas24hSnapshot = await getDocs(query24h);
    const leads24h = ultimas24hSnapshot.size;

    const hoje = new Date();
    const datasContagem = {};
    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(hoje.getDate() - i);
      const key = dia.toISOString().slice(0, 10);
      datasContagem[key] = 0;
    }

    allLeadsSnapshot.forEach(doc => {
      const dataEnvioRaw = doc.data().dataEnvio;
      let dataEnvio = dataEnvioRaw instanceof Date
        ? dataEnvioRaw
        : typeof dataEnvioRaw?.toDate === 'function'
          ? dataEnvioRaw.toDate()
          : new Date(dataEnvioRaw);

      if (!isNaN(dataEnvio)) {
        const key = dataEnvio.toISOString().slice(0, 10);
        if (key in datasContagem) datasContagem[key]++;
      }
    });

    document.getElementById('totalLeads').textContent = totalLeads;
    document.getElementById('leads24h').textContent = leads24h;

    desenharGrafico(datasContagem);
  } catch (error) {
    alert('Erro ao carregar dados: ' + error.message);
    document.getElementById('totalLeads').textContent = 'Erro';
    document.getElementById('leads24h').textContent = 'Erro';
  } finally {
    carregando = false;
  }
}

// Desenhar gráfico
function desenharGrafico(datasContagem) {
  const ctx = document.getElementById('chartLeads').getContext('2d');
  const isDark = document.documentElement.classList.contains('dark');
  const fontColor = isDark ? '#fff' : '#000';

  if (!chartInstance) {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(datasContagem),
        datasets: [{
          label: 'Leads por dia',
          data: Object.values(datasContagem),
          backgroundColor: 'rgba(59,130,246,0.7)'
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: fontColor } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: fontColor } },
          x: { ticks: { color: fontColor } }
        }
      }
    });
  } else {
    chartInstance.data.labels = Object.keys(datasContagem);
    chartInstance.data.datasets[0].data = Object.values(datasContagem);
    chartInstance.options.scales.y.ticks.color = fontColor;
    chartInstance.options.scales.x.ticks.color = fontColor;
    chartInstance.options.plugins.legend.labels.color = fontColor;
    chartInstance.update();
  }
}

// Logout
window.logout = function () {
  signOut(auth)
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch(error => {
      alert('Erro ao sair: ' + error.message);
    });
};
