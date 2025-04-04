import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Insertando datos iniciales...");

  // 🔹 Seed para AreasOperator
  await prisma.areasOperator.createMany({
    data: [
      { id: 1, name: "preprensa" },
      { id: 2, name: "impresion" },
      { id: 3, name: "serigrafia" },
      { id: 4, name: "empalme" },
      { id: 5, name: "laminacion" },
      { id: 6, name: "corte" },
      { id: 7, name: "color edge" },
      { id: 8, name: "hot stamping" },
      { id: 9, name: "milling chip" },
      { id: 10, name: "personalizacion" },
    ],
  });

  // 🔹 Seed para Module
  await prisma.module.createMany({
    data: [
      { id: 1, name: "Ordenes de Trabajo", description: "Registra nuevas ordenes de trabajo.", imageName: "ubication.jpg", logoName: "items.webp" },
      { id: 2, name: "Seguimiento de OTs", description: "Marca avance en el proceso de trabajo de las Ordenes de Trabajo.", imageName: "arrivals.jpg", logoName: "arrivals.webp" },
      { id: 3, name: "Finalizacion", description: "Cierre de OTs que hayan completado el flujo asignado.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 4, name: "Permisos", description: "Manejar vista de modulo de acuerdo a los roles de tus usuarios.", imageName: "packing.jpg", logoName: "settings.svg" },
      { id: 5, name: "Usuarios", description: "Gestiona y administra los usuarios del sistema.", imageName: "users.jpg", logoName: "users.webp" },
      { id: 6, name: "Vistos Buenos", description: "Maneja las OTs enviadas por produccion para calificar.", imageName: "ubication.jpg", logoName: "items.webp" },
      { id: 7, name: "Recepcion CQM", description: "Recibe las OTs enviadas por produccion.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 8, name: "Configuracion Vistos Buenos", description: "Edita los puntos de evaluación de tu área.", imageName: "slotting.jpg", logoName: "settings.svg" },
      { id: 9, name: "Aceptar Producto", description: "Maneja las OTs enviadas por áreas previas.", imageName: "putaway.jpg", logoName: "items.webp" },
      { id: 10, name: "Cerrar Orden de Trabajo", description: "Finaliza las OTs que han completado todos sus procesos junto con su cantidad.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 11, name: "Liberar Producto", description: "Maneja las OTs que tienes en tu área para liberar.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 12, name: "Inconformidades", description: "Maneja las OTs que han sido rechazadas por parte de la operacion siguiente.", imageName: "nebulas.gif", logoName: "extra.webp" },
    ],
  });

  // 🔹 Seed para Role
  await prisma.role.createMany({
    data: [
      { id: 1, name: "planeador" },
      { id: 2, name: "operador" },
      { id: 3, name: "calidad" },
      { id: 4, name: "auditor" },
    ],
  });

  // 🔹 Seed para ModulePermission (asignando permisos a roles)
  await prisma.modulePermission.createMany({
    data: [
      { id: 1, role_id: 1, module_id: 1, enabled: true }, 
      { id: 2, role_id: 1, module_id: 2, enabled: true }, 
      { id: 3, role_id: 1, module_id: 3, enabled: true },
      { id: 4, role_id: 1, module_id: 4, enabled: true },
      { id: 5, role_id: 1, module_id: 5, enabled: true }, 
      { id: 6, role_id: 3, module_id: 6, enabled: true }, 
      { id: 7, role_id: 3, module_id: 7, enabled: true },
      { id: 8, role_id: 3, module_id: 8, enabled: true },
      { id: 9, role_id: 4, module_id: 9, enabled: true }, 
      { id: 10, role_id: 4, module_id: 10, enabled: true }, 
      { id: 11, role_id: 2, module_id: 9, enabled: true }, 
      { id: 12, role_id: 2, module_id: 11, enabled: true },
      { id: 13, role_id: 2, module_id: 12, enabled: true },
    ],
  });

  console.log("✅ Seed completado!");
}

// Manejo correcto de errores y desconexión
void main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
