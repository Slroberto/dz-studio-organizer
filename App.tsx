import React from "react";
import emailjs from "@emailjs/browser";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

const App: React.FC = () => {
  const handleTestEmail = async () => {
    console.log("📨 Teste: clicou no botão");

    try {
      // 1️⃣ Gera o PDF
      const doc = new jsPDF();
      doc.text("Relatório DZ Studio Organizer", 20, 20);
      autoTable(doc, {
        head: [["Tarefa", "Status"]],
        body: [
          ["Render PBA", "Concluído"],
          ["Ajuste Path", "Em andamento"]
        ]
      });

      // 2️⃣ Converte em Blob
      const pdfBlob = doc.output("blob");

      // 3️⃣ Faz upload pro Firebase
      const storageRef = ref(storage, `relatorios/Relatorio_${Date.now()}.pdf`);
      await uploadBytes(storageRef, pdfBlob);

      // 4️⃣ Obtém a URL pública
      const downloadURL = await getDownloadURL(storageRef);
      console.log("✅ PDF hospedado:", downloadURL);

      // 5️⃣ Envia via EmailJS
      await emailjs.send(
        "service_21jvn5k", // seu service ID
        "template_sk2s73c", // seu template ID
        {
          to_name: "Sandro",
          to_email: "sandrosam@gmail.com",
          email: "sandrosam@gmail.com",
          pdf_url: downloadURL // link real do arquivo
        },
        "31sFn0r0c1Jt6U1rm" // sua Public Key
      );

      console.log("✅ E-mail enviado com sucesso!");
      alert("Relatório enviado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao enviar:", error);
      alert("Erro ao enviar o relatório. Veja o console para detalhes.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <button
        onClick={handleTestEmail}
        className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500"
      >
        Exportar PDF e Enviar
      </button>
    </div>
  );
};

export default App;
