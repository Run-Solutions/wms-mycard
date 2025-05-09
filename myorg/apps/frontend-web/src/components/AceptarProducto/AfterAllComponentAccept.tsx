'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  workOrder: any;
}

export default function AfterCorteComponentAccept({ workOrder }: Props) {
  const router = useRouter();

  useEffect(() => {
    const lastCompleted = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => item.status === "Pendiente");

    const currentArea = lastCompleted?.id;
    const token = localStorage.getItem('token');

    const acceptWorkOrder = async () => {
      if (!currentArea) return;

      try {
        const res = await fetch(`http://localhost:3000/work-order-flow/${currentArea}/accept`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          router.push('/aceptarProducto');  // o window.location.reload() si prefieres
        }
      } catch (error) {
        console.error(error);
        alert('Error al conectar con el servidor');
      }
    };

    acceptWorkOrder();
  }, [workOrder, router]);

  return null; // no renderiza nada
}