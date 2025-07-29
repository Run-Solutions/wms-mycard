import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Insertando datos iniciales...");

  // 🔹 Seed para AreasOperator
  const areas = [
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
  ];
  
  for (const area of areas) {
    await prisma.areasOperator.upsert({
      where: { id: area.id },
      update: {}, // o podrías usar `update: { name: area.name }` si quieres actualizar el nombre si cambia
      create: area,
    });
  }

  // 🔹 Seed para Module
  await prisma.module.createMany({
    data: [
      { id: 1, name: "Ordenes de Trabajo", description: "Registra nuevas ordenes de trabajo.", imageName: "ubication.jpg", logoName: "items.webp" },
      { id: 2, name: "Seguimiento de OTs", description: "Marca avance en el proceso de trabajo de las Ordenes de Trabajo.", imageName: "arrivals.jpg", logoName: "arrivals.webp" },
      { id: 3, name: "Finalizacion", description: "Cierre de OTs que hayan completado el flujo asignado.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 4, name: "Permisos", description: "Manejar vista de modulo de acuerdo a los roles de tus usuarios.", imageName: "packing.jpg", logoName: "settings.svg" },
      { id: 5, name: "Usuarios", description: "Gestiona y administra los usuarios del sistema.", imageName: "users.jpg", logoName: "users.webp" },
      { id: 6, name: "Recepcion de Vistos Buenos", description: "Maneja las OTs enviadas por produccion para calificar.", imageName: "ubication.jpg", logoName: "items.webp" },
      { id: 7, name: "Liberacion de Vistos Buenos", description: "Recibe las OTs enviadas por produccion.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 8, name: "Configuracion Vistos Buenos", description: "Edita los puntos de evaluación de tu área.", imageName: "slotting.jpg", logoName: "settings.svg" },
      { id: 9, name: "Aceptar Producto", description: "Maneja las OTs enviadas por áreas previas.", imageName: "putaway.jpg", logoName: "items.webp" },
      { id: 10, name: "Aceptar Auditoria", description: "Maneja las OTs enviadas por áreas previas.", imageName: "putaway.jpg", logoName: "items.webp" },
      { id: 11, name: "Cerrar Orden de Trabajo", description: "Finaliza las OTs que han completado todos sus procesos junto con su cantidad.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 12, name: "Liberar Producto", description: "Maneja las OTs que tienes en tu área para liberar.", imageName: "putaway.jpg", logoName: "putaway.webp" },
      { id: 13, name: "Inconformidades", description: "Maneja las OTs que han sido rechazadas por parte de la operacion siguiente.", imageName: "nebulas.gif", logoName: "extra.webp" },
      { id: 14, name: "Rechazos", description: "Maneja las OTs que han sido rechazadas por parte de la operacion siguiente.", imageName: "nebulas.gif", logoName: "extra.webp" },
    ],
    skipDuplicates: true,
  });

  // 🔹 Seed para Role
  await prisma.role.createMany({
    data: [
      { id: 1, name: "planeador" },
      { id: 2, name: "operador" },
      { id: 3, name: "calidad" },
      { id: 4, name: "auditor" },
    ],
    skipDuplicates: true,
  });

  // 🔹 Seed para ModulePermission (asignando permisos a roles)
  const permissions = [
    { id: 1, role_id: 1, module_id: 1, enabled: true }, 
    { id: 2, role_id: 1, module_id: 2, enabled: true }, 
    { id: 3, role_id: 1, module_id: 3, enabled: true },
    { id: 4, role_id: 1, module_id: 4, enabled: true },
    { id: 5, role_id: 1, module_id: 5, enabled: true }, 
    { id: 6, role_id: 3, module_id: 6, enabled: true }, 
    { id: 7, role_id: 3, module_id: 7, enabled: true },
    { id: 8, role_id: 3, module_id: 8, enabled: true },
    { id: 9, role_id: 4, module_id: 10, enabled: true }, 
    { id: 10, role_id: 4, module_id: 11, enabled: true }, 
    { id: 11, role_id: 4, module_id: 14, enabled: true }, 
    { id: 12, role_id: 2, module_id: 9, enabled: true }, 
    { id: 13, role_id: 2, module_id: 12, enabled: true },
    { id: 14, role_id: 2, module_id: 13, enabled: true },
  ];
  
  for (const perm of permissions) {
    await prisma.modulePermission.upsert({
      where: { id: perm.id },
      update: {
        role_id: perm.role_id,
        module_id: perm.module_id,
        enabled: perm.enabled,
      },
      create: perm,
    });
  }
  
  // 🔹 Seed para FormQuestions asociadas a "impresion"
  // 🔹 Seed para FormQuestions
  const questionsData = [
    { id: 1, title: "Impresión De Guías, Sensores, Área Para Cinta Mágnetica, Pinzas Y Escuadra", key: "impresion_guias", role_id: null, areas: [2] },
    { id: 2, title: "Revisión Espesor De Material Para Armado Sandwich", key: "revision_espesor", role_id: null, areas: [2] },
    { id: 3, title: "Revisar Piojos Y Velo En La Impresión", key: "revisar_piojos", role_id: null, areas: [2] },
    { id: 4, title: "Verificar Coincidencia Frente Y Vuelta", key: "verificar_coincidencia", role_id: null, areas: [2] },
    { id: 5, title: "Revisar Anclaje De Tinta", key: "review_ink_anchor", role_id: 3, areas: [2] },
    { id: 6, title: "Verificar Ortografia De Los Textos", key: "verify_text_orthography", role_id: 3, areas: [2] },
    { id: 7, title: "Validar Textos Completos Vs Prueba De Color", key: "validate_texts_vs_color_test", role_id: 3, areas: [2] },
    { id: 8, title: "Revisar Elementos VS Prueba De Color", key: "review_elements_vs_color_test", role_id: 3, areas: [2, 3] },
    { id: 9, title: "Verificar Elemento Se Corte (Usar Mica)", key: "verify_element_cut", role_id: 3, areas: [2] },
    { id: 11, title: "Revisar Registro De Elementos Vs Imagen O Prueba De Color", key: "revisar_registro", role_id: null, areas: [3] },
    { id: 12, title: "Validar Espesor Del Material Vs Ot", key: "validar_espesor", role_id: null, areas: [3] },
    { id: 13, title: "Revisar Coincidencia Frente Y Vuelta", key: "revisar_coincidencia", role_id: null, areas: [3] },
    { id: 14, title: "Revisar Pinza Y Escuadra", key: "revisar_pinza", role_id: null, areas: [3] },
    { id: 15, title: "Revisar Tinta Semáforo", key: "revisar_tinta_semaforo", role_id: 3, areas: [3] },
    { id: 16, title: "Revisar Que Se Pueda Firmar El Panel", key: "revisar_firmar_panel", role_id: 3, areas: [3] },
    { id: 17, title: "Anclaje De Tinta", key: "anclaje_tinta", role_id: 3, areas: [3] },
    { id: 18, title: "Revisar Materiales De La Composición Vs Ot", key: "revisar_materiales", role_id: null, areas: [4] },
    { id: 19, title: "Verificar Calibre Empalmado (Máx 32)", key: "verificar_calibre", role_id: null, areas: [4] },
    { id: 20, title: "Validad Posición De Cinta Magnética / Holobanda", key: "validar_posicion", role_id: null, areas: [4] },
    { id: 21, title: "Revisar Posición De Piedra Del Inlay", key: "revisar_posicion", role_id: null, areas: [4] },
    { id: 22, title: "Validar Posicion De Antenas Para Tarjetas Duales", key: "validar_posicion_antenas", role_id: 3, areas: [4] },
    { id: 23, title: "Revisar Crudos", key: "revisar_crudos", role_id: null, areas: [5] },
    { id: 24, title: "Revisar Deformaciones Del Material", key: "revisar_deformaciones", role_id: null, areas: [5] },
    { id: 25, title: "Revisar Si Existe Tinta Reventada", key: "revisar_tinta_reventada", role_id: null, areas: [5] },
    { id: 26, title: "Validar Que El Material No Esté Tostado", key: "validar_material_tostado", role_id: null, areas: [5] },
    { id: 27, title: "Validar Anclaje De Tinta (Overlay/Cinta)", key: "validar_anclaje_tinta", role_id: 3, areas: [5] },
    { id: 28, title: "Validar Anclaje De Materiales (Si Aplica)", key: "anclaje_si_aplica", role_id: 3, areas: [5] },
    { id: 31, title: "Verificar Calibre Final Máximo 32", key: "calibre_max", role_id: 3, areas: [5] },
    { id: 33, title: "Revisar Caja De Seguridad (Que No Se Corte)", key: "revisar_cajaseguridad", role_id: null, areas: [6] },
    { id: 34, title: "Revisar Distancia De Cinta Magnética U Holobanda", key: "revisar_distancia", role_id: null, areas: [6] },
    { id: 35, title: "Revisar Plecas De Corte (Si Aplica)", key: "revisar_plecas", role_id: null, areas: [6] },
    { id: 36, title: "Revisar Tipo De Perforación Y Posición (Si Aplica)", key: "revisar_tipo_perforacion", role_id: null, areas: [6] },
    { id: 37, title: "Revisar Bordes Y Esquinas (Libre De Rebabas)", key: "revisar_bordes", role_id: null, areas: [6] },
    { id: 38, title: "Integridad De Las Antenas O Inlays (Si Aplica)", key: "integridad_antenas", role_id: null, areas: [6] },
    { id: 39, title: "Liberacion De Datos", key: "liberacion_datos", role_id: 3, areas: [6] },
    { id: 40, title: "Prueba de Adhesión", key: "prueba_adhesion", role_id: null, areas: [7] },
    { id: 41, title: "Verificar Imagen Y Medidas Del Panel De Firma Vs Ot", key: "verificar_imagen", role_id: null, areas: [8] },
    { id: 43, title: "Revisar Posición De Panel De Firma Vs Ot", key: "revisar_posicion_firma", role_id: null, areas: [8] },
    { id: 44, title: "Verificar Anclaje", key: "verificar_anclaje", role_id: 3, areas: [8] },
    { id: 45, title: "Verificar Anclaje Del Panel De Firma", key: "verificar_anclaje_firma", role_id: 3, areas: [8] },
    { id: 46, title: "Validar Escritura Sobre Panel De Firma", key: "verificar_escritura", role_id: 3, areas: [8] },
    { id: 47, title: "Revisar Posición De Tierra En Chip", key: "revisar_posicion_tierra", role_id: null, areas: [9] },
    { id: 48, title: "Adhesivo Libre De Golpes En Reverso De Tarjeta", key: "adhesivo_libre", role_id: null, areas: [9] },
    { id: 49, title: "Prueba De Anclaje", key: "prueba_anclaje", role_id: 3, areas: [9] },
    { id: 50, title: "Revisar Posición De Etiqueta", key: "revisar_etiqueta", role_id: null, areas: [10] },
    { id: 51, title: "Verificar Base De Datos Vs Autorización (Si Aplica)", key: "verificar_bd", role_id: null, areas: [10] },
    { id: 52, title: "Revisar Tipo De Fuente Y Tamaño Textos / Folio Vs Ot / Autorización", key: "revisar_tipo_fuente", role_id: null, areas: [10] },
    { id: 53, title: "Revisa Posición De Textos / Folios", key: "posicion_textos", role_id: null, areas: [10] },
    { id: 54, title: "Validar Color Textos / Folio Vs Ot / Autorización", key: "validar_ot", role_id: null, areas: [10] },
    { id: 55, title: "Revisar Código De Barras Vs Ot / Autorización", key: "revisar_codigo", role_id: null, areas: [10] },
    { id: 56, title: "Revisa La Posición De Código De Barras", key: "codigo_barras", role_id: null, areas: [10] },
    { id: 57, title: "Validar Lectura De Código De Barras Correcta", key: "barras_correctas", role_id: null, areas: [10] },
    { id: 58, title: "Verificar Lectura De Cinta Magnética (En Máquina Az)", key: "lectura_correcta", role_id: null, areas: [10] },
    { id: 59, title: "Verificar Lectura Y Match De Inik Id (Inlays)", key: "ink_id_inlays", role_id: null, areas: [10] },
    { id: 60, title: "Verificar Tamaño Y Fuente De Folio Vs OT / Autorización", key: "verificacion_tamaño", role_id: 3, areas: [10] },
    { id: 61, title: "Verificar Fuente Y Tamaño De Textos Vs OT / Autorización", key: "verificacion_fuente", role_id: 3, areas: [10] },
    { id: 62, title: "Verificar Posición De Los Elementos (Textos / Folio)", key: "verificacion_posicion", role_id: 3, areas: [10] },
    { id: 65, title: "Verificar Anclaje de Tinta", key: "anclaje_tinta_perso", role_id: 3, areas: [10] },
    { id: 66, title: "Revisar Que La Tarjeta No Se Desprenda", key: "revisar_tarjeta", role_id: null, areas: [10] },
    { id: 67, title: "Revisar La Posición Correcta De La Tarjeta", key: "revisar_posicion_tarjeta", role_id: null, areas: [10] },
    { id: 68, title: "Verificar Que El Papel No Se Desgarre Al Desprender La Tarjeta", key: "verificar_papel", role_id: null, areas: [10] },
    { id: 69, title: "Revisa La Cantidad De Pegamento Blanco", key: "verificar_pegamento", role_id: null, areas: [10] },
    { id: 70, title: "Revisa Que Se Descargue El Papel Del Carrier Al Abrir", key: "verfificar_papel_carrier", role_id: null, areas: [10] },
    { id: 71, title: "Revisar Doblado Del Carrier Correctamente", key: "verificar_doblado_carrier", role_id: null, areas: [10] },
    { id: 72, title: "Revisar Caída Conforme Pdf Firmado (Datos Y Posición Correctos", key: "revisar_caida_conforme_pdf", role_id: null, areas: [10] },
    { id: 73, title: "Sku Carrier Corresponde", key: "sku_corresponde", role_id: null, areas: [10] },
    { id: 74, title: "Sku De Sobre Corresponde", key: "sku_de_sobre_corresponde", role_id: null, areas: [10] },
    { id: 75, title: "Etiqueta No Cae Sobre Nip", key: "etiqueta_no_cae", role_id: null, areas: [10] },
    { id: 76, title: "Lectura De Código De Barras O Qr (Si Aplica)", key: "lectura_barras_qr", role_id: null, areas: [10] },
    { id: 77, title: "Revisar Tipo De Letra Si Está Especificado", key: "revisar_tipo_letra", role_id: null, areas: [10] },
    { id: 78, title: "Doblez Correcto Carrier", key: "doblez_carrier", role_id: null, areas: [10] },
    { id: 79, title: "Pegado Correcto Del Sobre", key: "pegado_correcto", role_id: null, areas: [10] },
    { id: 80, title: "Se Encuentra Bien Sellado", key: "se_encuentra_sellado", role_id: null, areas: [10] },
    { id: 81, title: "Posición Correcta De Sellado", key: "posicion_sellado", role_id: null, areas: [10] },
  ];

  for (const question of questionsData) {
    // Crear o actualizar la pregunta
    await prisma.formQuestion.upsert({
      where: { id: question.id },
      update: {
        title: question.title,
        key: question.key,
        role_id: question.role_id,
      },
      create: {
        id: question.id,
        title: question.title,
        key: question.key,
        role_id: question.role_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Conectar las áreas a la pregunta
    for (const areaId of question.areas) {
      await prisma.areasOperator.update({
        where: { id: areaId },
        data: {
          formQuestions: {
            connect: { id: question.id },
          },
        },
      });
    }
  }

  console.log("✅ Seed completado!");
}

// Manejo correcto de errores y desconexión
void main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());