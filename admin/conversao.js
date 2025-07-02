import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
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
const db = getFirestore(app);

let chartConversao = null;

document.addEventListener("DOMContentLoaded", () => {
  carregarTaxaConversao();
});

export async function carregarTaxaConversao() {
  try {
    const visitasSnap = await getDocs(collection(db, "visitas"));
    const leadsSnap = await getDocs(collection(db, "leads"));

    const totalVisitas = visitasSnap.size;
    const totalLeads = leadsSnap.size;

    const taxa = totalVisitas > 0
      ? ((totalLeads / totalVisitas) * 100).toFixed(1)
      : 0;

    const valorConversaoEl = document.getElementById("valorConversao");
    if (valorConversaoEl) {
      valorConversaoEl.textContent = `${taxa}%`;
    }

    desenharGraficoConversao(totalVisitas, totalLeads);
  } catch (e) {
    console.error("Erro ao carregar taxa de conversão:", e);
  }
}

function desenharGraficoConversao(visitas, leads) {
  const ctx = document.getElementById("chartConversion")?.getContext("2d");
  if (!ctx) return;

  if (chartConversao) chartConversao.destroy();

  // Detecta tema escuro para ajustar cores
  const isDark = document.documentElement.classList.contains('dark');

  chartConversao = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Leads", "Outros"],
      datasets: [{
        data: [leads, visitas - leads],
        backgroundColor: isDark ? ["#3b82f6", "#374151"] : ["#3b82f6", "#e5e7eb"]
      }]
    },
    options: {
        
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: isDark ? '#ddd' : '#333'
          }
        }
      }
    }
  });
}
