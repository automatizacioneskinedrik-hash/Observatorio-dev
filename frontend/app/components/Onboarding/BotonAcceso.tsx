"use client";

import { useRouter } from "next/navigation"; 

interface Props {
  perfilDetectado: string;
}

export default function BotonAcceso({ perfilDetectado }: Props) {
  const router = useRouter();

  const manejarIngreso = () => {
    
    const perfilesEstrategicos = ['CEO', 'Dueño', 'Inversor'];

    const perfilesEvaluacion = ['Líder Directivo', 'Coordinador', 'Técnico Profesional'];

    console.log("Perfil procesado:", perfilDetectado);

    if (perfilesEstrategicos.includes(perfilDetectado)) {
    
      router.push('/');
    } else if (perfilesEvaluacion.includes(perfilDetectado)) {
      
      router.push('/evaluacion');
    } else {
      
      router.push('/');
    }
  };

  return (
    <button
      onClick={manejarIngreso}
      className="bg-[#0b332a] text-white px-12 py-4 rounded-sm font-medium hover:bg-[#124d40] transition-all tracking-widest uppercase text-sm shadow-xl"
    >
      Usar AECO IA
    </button>
  );
}