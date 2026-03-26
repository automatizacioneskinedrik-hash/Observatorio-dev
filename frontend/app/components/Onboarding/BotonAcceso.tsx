"use client";

import { useRouter } from "next/navigation"; 

interface Props {
  perfilDetectado: string;
}

export default function BotonAcceso({ perfilDetectado }: Props) {
  const router = useRouter();

  const manejarIngreso = () => {
    console.log("Perfil procesado:", perfilDetectado);
    // Redirige a todos directamente al chat
    router.push('/chat'); 
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