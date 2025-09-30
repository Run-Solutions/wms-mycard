// myorg/apps/frontend-web/src/app/(protected)/ordenesDeTrabajo/page.tsx
// permite crear nuevas ordenes de trabajo con form que incluye datos
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Typography from '@mui/material/Typography';
import { getAreasOperator, createWorkOrder } from '@/api/ordenesDeTrabajo';
import { toast } from 'react-toastify';

const WorkOrdersPage: React.FC = () => {
  const theme = useTheme();

  // Formulacion de los estados
  const [formData, setFormData] = useState({
    ot_id: '',
    mycard_id: '',
    quantity: '',
    comments: '',
    quantity_contacts: '24',
    tipoSeleccion: 0,
    areasOperatorIds: [] as string[],
    priority: false,
    total_sheets: 0,
    files: [] as File[],
  });
  const [message, setMessage] = useState('');
  const [areasOperator, setAreasOperator] = useState<
    { label: string; value: string; sheets: number }[]
  >([]);
  const [dropdownCount, setDropdownCount] = useState(4);
  const [files, setFiles] = useState<{
    ot: File | null;
    sku: File | null;
    op: File | null;
    cardImage: File | null; // NEW
  }>({ ot: null, sku: null, op: null, cardImage: null });
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [fileInputsKey, setFileInputsKey] = useState(0);
  const MAX_TOTAL_FILES = 9;
  const MAX_ATTACHMENTS = 5;
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
  ];
  const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
  ] as const;
  const ALLOWED_PDF_TYPES = ['application/pdf'] as const;

  const hasExt = (name: string, exts: string[]) =>
    exts.some((ext) => name.toLowerCase().endsWith(ext));

  const isPdf = (file: File) =>
    ALLOWED_PDF_TYPES.includes(file.type as any) || hasExt(file.name, ['.pdf']);

  const isImage = (file: File) =>
    ALLOWED_IMAGE_TYPES.includes(file.type as any) ||
    hasExt(file.name, ['.png', '.jpg', '.jpeg', '.webp']);

  const validatePdfFile = (file: File) => {
    if (!isPdf(file)) {
      alert(`"${file.name}" no es un PDF válido.`);
      return false;
    }
    return true;
  };

  const validateImageFile = (file: File) => {
    if (!isImage(file)) {
      alert(
        `Formato no permitido: ${file.name} (${file.type}). Solo PNG/JPEG/WEBP.`
      );
      return false;
    }
    return true;
  };

  const validateFile = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      alert(
        `Formato no permitido: ${file.name} (${file.type}). Solo PDF/PNG/JPEG/WEBP.`
      );
      return false;
    }
    return true;
  };
  const [totalSheets, setTotalSheets] = useState(0);

  const totalSheetsAreas = useMemo(() => {
    return formData.areasOperatorIds.reduce((acc: number, id: any) => {
      const a = areasOperator.find((x: any) => String(x.value) === String(id));
      return acc + (a?.sheets ?? 0);
    }, 0);
  }, [formData.areasOperatorIds, areasOperator]);

  // Para obtener las areas de operacion
  // 1) Sólo al montar: cargar áreas y forzar value a string
  useEffect(() => {
    getAreasOperator()
      .then((data) =>
        setAreasOperator(
          data.map((a: any) => ({
            ...a,
            value: String(a.value),
            sheets: Number(a.sheets ?? a.sheets_count ?? 0), // 👈 fuerza número
          }))
        )
      )
      .catch(() => alert('Error: No se pudieron cargar las áreas'));
  }, []);

  // 2) Cálculo de totalSheets (sin llamadas al API)
  useEffect(() => {
    const quantity = Number(formData.quantity) || 0;
    const contacts = Number(formData.quantity_contacts) || 0;

    const hojasBase = contacts > 0 ? Math.ceil(quantity / contacts) : 0;
    const extraEmpalme = formData.tipoSeleccion === 1 ? 26 : 0;
    const merma = Math.ceil(hojasBase * 0.07);

    const tsa = Number(totalSheetsAreas) || 0; // 👈 por si acaso
    setTotalSheets(hojasBase + tsa + extraEmpalme + merma); // 👈 todo numérico
  }, [
    formData.quantity,
    formData.quantity_contacts,
    formData.tipoSeleccion,
    totalSheetsAreas,
  ]);

  const askWithToast = () =>
    new Promise<1 | 0>((resolve) => {
      const id = toast(
        ({ closeToast }) => (
          <ChoiceBox>
            <Sub>Elige una opción:</Sub>
            <Actions>
              <BtnEmpalme
                onClick={() => {
                  closeToast();
                  resolve(0);
                }}
              >
                Empalme
              </BtnEmpalme>
              <BtnCollector
                onClick={() => {
                  closeToast();
                  resolve(1);
                }}
              >
                Collator
              </BtnCollector>
            </Actions>
          </ChoiceBox>
        ),
        {
          autoClose: false,
          closeOnClick: false,
          position: 'top-center',
        }
      );
    });

  const AREA_NAMES: Record<string, string> = {
    '1': 'Preprensa',
    '2': 'Impresión',
    '3': 'Serigrafía',
    '4': 'Empalme',
    '5': 'Laminación',
    '6': 'Corte',
    '7': 'Color Edge',
    '8': 'Hot Stamping',
    '9': 'Milling Chip',
    '10': 'Personalización',
  };

  const allowedNextAreas: Record<string, string[]> = {
    '1': ['2', '3'], // después de Preprensa → Impresión o Serigrafía
    '2': ['2', '3', '4'], // después de Impresión → Serigrafía, Empalme o Impresión
    '3': ['2', '4', '6'], // después de Serigrafía → Impresión, Empalme o Corte
    '4': ['5'], // después de Empalme → Laminación
    '5': ['3', '6'], // después de Laminación → Corte o Serigrafía
    '6': ['8', '9', '10', '7'], // después de Corte → Hot Stamping, Milling Chip, Personalización o Color Edge
    '7': ['8', '9', '10'], // después de Color Edge → Hot Stamping, Milling Chip o Personalización
    '8': ['9', '10', '7'], // después de Hot Stamping → Milling Chip, Personalización o Color Edge
    '9': ['7', '9', '10'], // después de Milling Chip → Color Edge, Hot Stamping o Personalización
    '10': ['7', '10'], // después de Personalización → Color Edge o Personalización
  };

  const handleChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    areaIndex?: number
  ) => {
    const target = e.target;
    const name = target.name;
    const value =
      target.type === 'checkbox'
        ? (target as HTMLInputElement).checked
        : target.value;

    let updated: any[] = [];
    if (areaIndex !== undefined) {
      // 1) El primer área SIEMPRE debe ser '1' (Preprensa)
      if (areaIndex === 0 && value !== '1' && value !== '') {
        const shouldReset = window.confirm(
          'La primera área debe ser Preprensa (ID: 1). ¿Deseas limpiar todas las áreas seleccionadas?'
        );
        if (shouldReset) {
          setFormData((prev) => ({ ...prev, areasOperatorIds: [] }));
          setDropdownCount(4);
        }
        e.preventDefault();
        return;
      }

      // Permitir limpiar (value === '') sin más validación
      if (value === '') {
        setFormData((prev) => {
          const updated = [...(prev.areasOperatorIds || [])];
          updated[areaIndex] = '';
          // Limpieza en cascada para evitar inconsistencias
          for (let i = areaIndex + 1; i < updated.length; i++) updated[i] = '';
          return { ...prev, areasOperatorIds: updated };
        });
        return;
      }

      // 2) Para índices > 0, validar contra el VALOR PREVIO (no el índice)
      if (areaIndex > 0) {
        // OJO: usamos el estado actual para leer el valor previo
        const previousValue =
          (formData?.areasOperatorIds &&
            formData.areasOperatorIds[areaIndex - 1]) ||
          '';

        if (!previousValue) {
          alert('Selecciona primero el área anterior antes de continuar.');
          e.preventDefault();
          return;
        }

        const allowed = allowedNextAreas[previousValue] || [];
        if (!allowed.includes(value as string)) {
          const allowedNames = allowed
            .map((v) => AREA_NAMES[v] ?? v)
            .join(', ');
          alert(
            `Después de ${
              AREA_NAMES[previousValue] ?? previousValue
            } solo puede ir: ${allowedNames}`
          );
          e.preventDefault();
          return;
        }
      }

      if (String(value) === '4') {
        const tipo = await askWithToast();
        setFormData((p) => ({ ...p, tipoSeleccion: tipo }));
      }
      console.log('area', areasOperator);
      // Actualiza y limpia en cascada lo que viene después para mantener la secuencia válida
      setFormData((prev) => {
        updated = [...(prev.areasOperatorIds || [])];
        updated[areaIndex] = value as string;
        for (let i = areaIndex + 1; i < updated.length; i++) updated[i] = '';
        return { ...prev, areasOperatorIds: updated };
      });
    } else {
      // Campos que no son de áreas
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Para obtener solo las areas disponibles
  const getAvailableAreas = (index: number) => {
    return areasOperator.slice(0, 10);
  };
  // Agregar un nuevo dropdown para las areas en el flujo asignado
  const addDropdown = () => {
    setDropdownCount((prev) => prev + 1);
  };
  // Elimina el ultimo dropdown de areas en el flujo asignado
  const removeLastDropdown = () => {
    setFormData((prev) => {
      const updatedAreas = [...prev.areasOperatorIds];
      updatedAreas.pop(); // elimina el último valor seleccionado
      return { ...prev, areasOperatorIds: updatedAreas };
    });
    setDropdownCount((prev) => prev - 1);
  };

  // Para la carga de archivos
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'ot' | 'sku' | 'op'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validar estrictamente PDF
    if (!validatePdfFile(file)) {
      e.target.value = '';
      return;
    }

    const baseCount =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0);
    const replacing = files[type] ? 1 : 0;
    const newTotal = baseCount - replacing + 1 + extraFiles.length;

    if (newTotal > MAX_TOTAL_FILES) {
      alert(
        `Con este archivo superas el máximo de ${MAX_TOTAL_FILES} por orden.`
      );
      e.target.value = '';
      return;
    }

    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleExtraFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const validNew = picked.filter(validateFile);

    const baseCount =
      (files.ot ? 1 : 0) + (files.sku ? 1 : 0) + (files.op ? 1 : 0);
    const currentExtra = extraFiles.length;
    const availableSlots = MAX_TOTAL_FILES - (baseCount + currentExtra);

    if (availableSlots <= 0) {
      alert(
        `Ya alcanzaste el máximo de ${MAX_TOTAL_FILES} archivos por orden.`
      );
      e.target.value = '';
      return;
    }

    const toAdd = validNew.slice(0, availableSlots);
    if (toAdd.length < validNew.length) {
      alert(
        `Se agregaron ${toAdd.length} archivo(s). Límite total ${MAX_TOTAL_FILES}.`
      );
    }

    setExtraFiles((prev) => [...prev, ...toAdd]);

    // Limpia el input para poder volver a elegir los mismos archivos, si se quiere
    e.target.value = '';
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      e.target.value = '';
      return;
    }

    const baseCount =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0);
    const replacing = files.cardImage ? 1 : 0;
    const newTotal = baseCount - replacing + 1 + extraFiles.length;

    if (newTotal > MAX_TOTAL_FILES) {
      alert(
        `Con este archivo superas el máximo de ${MAX_TOTAL_FILES} por orden.`
      );
      e.target.value = '';
      return;
    }

    setFiles((prev) => ({ ...prev, cardImage: file }));
  };

  const removeCardImage = () => {
    setFiles((prev) => ({ ...prev, cardImage: null }));
  };

  const removeExtraFileAt = (index: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Para eliminar un archivo adjunto
  const removeFile = (type: 'ot' | 'sku' | 'op') => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [type]: null, // Elimina el archivo específico
    }));
  };

  // Para el envío de la informacion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.ot || !files.sku || !files.op || !files.cardImage) {
      alert(
        'Los archivos OT, SKU, OP (PDF) y la imagen de tarjeta son obligatorios.'
      );
      return;
    }
    if (
      !formData.ot_id.trim() ||
      !formData.mycard_id.trim() ||
      !formData.quantity.trim() ||
      !formData.comments.trim()
    ) {
      alert('Todos los campos son obligatorios excepto la prioridad.');
      return;
    }

    // Flujo mínimo y primera área
    if (formData.areasOperatorIds.length < 3) {
      alert('Debes seleccionar al menos 3 áreas.');
      return;
    }
    if (formData.areasOperatorIds[0] !== '1') {
      alert('La primera área debe ser la de Preprensa (ID: 1).');
      return;
    }

    // Límite total de archivos: OT + SKU + OP + extraFiles
    const totalFiles =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0) +
      extraFiles.length;

    if (extraFiles.length > MAX_ATTACHMENTS) {
      alert(`Máximo ${MAX_ATTACHMENTS} adjuntos permitidos.`);
      return;
    }
    if (totalFiles > MAX_TOTAL_FILES) {
      alert(
        `Máximo ${MAX_TOTAL_FILES} archivos por orden. Actualmente: ${totalFiles}.`
      );
      return;
    }
    const cleanedAreasOperatorIds = formData.areasOperatorIds.filter(
      (id) => id !== '' && id !== undefined && id !== null
    );

    const payload = {
      ...formData,
      areasOperatorIds: cleanedAreasOperatorIds,
      files: extraFiles,
      total_sheets: totalSheets,
    };

    try {
      const result = await createWorkOrder(payload, {
        ot: files.ot!,
        sku: files.sku!,
        op: files.op!,
        cardImage: files.cardImage,
        attachments: extraFiles,
      });
      setMessage(result.message || 'Orden de trabajo creada correctamente');
      // Reseteamos
      setFormData({
        ot_id: '',
        mycard_id: '',
        quantity: '',
        comments: '',
        quantity_contacts: '',
        tipoSeleccion: 0,
        areasOperatorIds: [],
        priority: false,
        total_sheets: 0,
        files: [],
      });
      setFiles({ ot: null, sku: null, op: null, cardImage: null });
      setExtraFiles([]);
      setDropdownCount(4);
      setFileInputsKey((k) => k + 1);
    } catch (error: any) {
      console.error(error);
      setMessage('Error al crear la orden de trabajo');
      alert('La OT es duplicada');
    }
  };
  
  return (
    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Crear nueva orden de trabajo</Title>
      </TitleWrapper>

      <FormWrapper onSubmit={handleSubmit}>
        <DataWrapper>
          <Auxiliar>
            <Label>Número de Orden:</Label>
            <Input
              type="text"
              name="ot_id"
              value={formData.ot_id}
              onChange={handleChange}
              required
            />
          </Auxiliar>
          <Auxiliar>
            <Label>ID del Presupuesto:</Label>
            <Input
              type="text"
              name="mycard_id"
              value={formData.mycard_id}
              onChange={handleChange}
              required
            />
          </Auxiliar>
          <Auxiliar>
            <Label>Cantidad (TARJETAS):</Label>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </Auxiliar>
          <Auxiliar>
            <Label>Cantidad (Hojas Frente / Hojas Vuelta):</Label>
            <Input
              type="number"
              name="total_sheets"
              value={totalSheets}
              readOnly
            />
          </Auxiliar>
          <Auxiliar>
            <Label>Cantidad de Contactos:</Label>
            <Input
              style={{ width: '80%' }}
              type="number"
              name="quantity_contacts"
              value={formData.quantity_contacts}
              onChange={handleChange}
              required
            />
          </Auxiliar>
        </DataWrapper>

        <OperationWrapper>
          <Auxiliar>
            <Label>Flujo Asignado:</Label>
            <Selects style={{ marginRight: '40px' }}>
              {Array.from({ length: Math.ceil(dropdownCount / 4) }).map(
                (_, rowIndex) => (
                  <SelectRow
                    key={rowIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '50px',
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, colIndex) => {
                      const index = rowIndex * 4 + colIndex;
                      return index < dropdownCount ? (
                        <SelectWrapper
                          key={index}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          {colIndex > 0 && <Arrow>➡</Arrow>}
                          <Select
                            name={`area-${index}`}
                            onChange={(e) => handleChange(e, index)}
                            value={formData.areasOperatorIds[index] || ''}
                            style={{ height: '100%' }}
                          >
                            <option value="">Selecciona un área</option>
                            {getAvailableAreas(index).map((area) => (
                              <option key={area.value} value={area.value}>
                                {`${area.label}`}
                              </option>
                            ))}
                          </Select>
                        </SelectWrapper>
                      ) : null;
                    })}
                    {dropdownCount > rowIndex * 4 &&
                      dropdownCount <= (rowIndex + 1) * 4 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '0px',
                            padding: '0',
                            minWidth: '40px',
                          }}
                        >
                          {dropdownCount < 50 &&
                            dropdownCount > rowIndex * 4 &&
                            dropdownCount <= (rowIndex + 1) * 4 && (
                              <IconButton
                                type="button"
                                onClick={addDropdown}
                                style={{
                                  height: '20px',
                                  borderRadius: '40em',
                                  padding: '0',
                                  color: '#05060f99',
                                }}
                              >
                                +
                              </IconButton>
                            )}
                          <IconButton
                            aria-label="delete"
                            type="button"
                            onClick={removeLastDropdown}
                            style={{
                              height: '20px',
                              color: '#05060f99',
                              borderRadius: '40em',
                              marginTop: '5px',
                              padding: '0',
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      )}
                  </SelectRow>
                )
              )}
            </Selects>

            <Label>Comentarios:</Label>
            <TextArea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              required
              placeholder="Escribe tus comentarios aquí..."
            />
            {/* === Adjuntos adicionales (único bloque) === */}
            <Label>Adjuntos adicionales (PDF / Imágenes):</Label>
            <label
              key={`upload-extra-${fileInputsKey}`}
              htmlFor="upload-extra"
              style={{
                borderRadius: '10rem',
                border: '2px solid #aeadab',
                width: '100%',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <HiddenInput
                id="upload-extra"
                type="file"
                accept={ALLOWED_MIME_TYPES.join(',')}
                multiple
                onChange={handleExtraFilesChange}
                disabled={
                  (files.ot ? 1 : 0) +
                    (files.sku ? 1 : 0) +
                    (files.op ? 1 : 0) +
                    (files.cardImage ? 1 : 0) + // NEW
                    extraFiles.length >=
                  MAX_TOTAL_FILES
                }
              />
              <IconButton color="primary" component="span">
                <UploadFileIcon />
              </IconButton>
              <Typography variant="body2" style={{ color: 'black' }}>
                {extraFiles.length === 0
                  ? 'Selecciona uno o varios archivos'
                  : `${extraFiles.length} archivo(s) añadidos`}
              </Typography>
            </label>
            {/* Lista (solo una vez) */}
            {extraFiles.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {extraFiles.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Typography
                      variant="body2"
                      style={{
                        color: 'black',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={f.name}
                    >
                      {f.name}
                    </Typography>
                    <IconButton
                      onClick={() => removeExtraFileAt(idx)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
            {/* Ayuda de límite (solo una vez) */}
            <Typography
              variant="caption"
              style={{ marginTop: '6px', color: '#555' }}
            >
              Límite total por orden: {MAX_TOTAL_FILES} archivos (incluye OT,
              SKU, OP).
            </Typography>
          </Auxiliar>

          <Auxiliar style={{ width: '30%' }}>
            <Label>Subir OT (PDF):</Label>
            <label
              key={`upload-ot-${fileInputsKey}`}
              htmlFor="upload-ot"
              style={{
                borderRadius: '10rem',
                border: '2px solid #aeadab',
                width: '100%',
                height: '44px',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <HiddenInput
                accept="application/pdf"
                id="upload-ot"
                type="file"
                onChange={(e) => handleFileChange(e, 'ot')}
              />
              <IconButton color="primary" component="span">
                <UploadFileIcon />
              </IconButton>
              {files.ot && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Typography variant="body2" style={{ color: 'black' }}>
                    {files.ot.name}
                  </Typography>
                  <IconButton onClick={() => removeFile('ot')} color="error">
                    <DeleteIcon />
                  </IconButton>
                </div>
              )}
            </label>
            <Label>Subir SKU (PDF):</Label>
            <label
              key={`upload-sku-${fileInputsKey}`}
              htmlFor="upload-sku"
              style={{
                borderRadius: '10rem',
                border: '2px solid #aeadab',
                width: '100%',
                height: '44px',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <HiddenInput
                accept="application/pdf"
                id="upload-sku"
                type="file"
                onChange={(e) => handleFileChange(e, 'sku')}
              />
              <IconButton color="primary" component="span">
                <UploadFileIcon />
              </IconButton>
              {files.sku && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Typography variant="body2" style={{ color: 'black' }}>
                    {files.sku.name}
                  </Typography>
                  <IconButton onClick={() => removeFile('sku')} color="error">
                    <DeleteIcon />
                  </IconButton>
                </div>
              )}
            </label>
            <Label>Subir OP (PDF):</Label>
            <label
              key={`upload-op-${fileInputsKey}`}
              htmlFor="upload-op"
              style={{
                borderRadius: '10rem',
                border: '2px solid #aeadab',
                width: '100%',
                height: '44px',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <HiddenInput
                accept="application/pdf"
                id="upload-op"
                type="file"
                onChange={(e) => handleFileChange(e, 'op')}
              />
              <IconButton color="primary" component="span">
                <UploadFileIcon />
              </IconButton>
              {files.op && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Typography variant="body2" style={{ color: 'black' }}>
                    {files.op.name}
                  </Typography>
                  <IconButton onClick={() => removeFile('op')} color="error">
                    <DeleteIcon />
                  </IconButton>
                </div>
              )}
            </label>
            <Label>Subir imagen de tarjeta (PNG/JPEG/WEBP):</Label>
            <label
              key={`upload-card-${fileInputsKey}`}
              htmlFor="upload-card-image"
              style={{
                borderRadius: '10rem',
                border: '2px solid #aeadab',
                width: '100%',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <HiddenInput
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                id="upload-card-image"
                type="file"
                onChange={handleCardImageChange}
              />
              <IconButton color="primary" component="span">
                <UploadFileIcon />
              </IconButton>

              {files.cardImage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="body2" style={{ color: 'black' }}>
                    {files.cardImage.name}
                  </Typography>
                  <IconButton onClick={removeCardImage} color="error">
                    <DeleteIcon />
                  </IconButton>
                  <img
                    src={URL.createObjectURL(files.cardImage)}
                    alt="Previsualización tarjeta"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #aeadab',
                    }}
                  />
                </div>
              )}
            </label>
            <CheckboxWrapper>
              <Label>Prioridad:</Label>
              <input
                type="checkbox"
                name="priority"
                checked={formData.priority}
                onChange={(e) => {
                  handleChange(e);
                }}
              />
            </CheckboxWrapper>
          </Auxiliar>
        </OperationWrapper>
        <Button type="submit">Crear Orden</Button>
      </FormWrapper>

      {message && <Message>{message}</Message>}
    </PageContainer>
  );
};

export default WorkOrdersPage;

// =================== Styled Components ===================
const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
  margin-top: -70px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;

const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 10px;
  background: #f8f9fa; // Color de fondo suave
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); // Sombra ligera
`;

const TextArea = styled.textarea`
  padding: 10px;
  border-radius: 1rem;
  border: 2px solid #aeadab;
  width: 100%;
  min-height: 80px;
  color: black;
  outline: none;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #05060f;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
`;

const DataWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5rem;
  margin: 0 auto;
`;

const OperationWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
`;

const Selects = styled.div`
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const SelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
`;

const SelectRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Arrow = styled.div`
  font-size: 1.2rem;
  color: #333; /* Ajusta el color según tu diseño */
`;

const Auxiliar = styled.div`
  display: flex;
  flex-direction: column; // Pone el Label arriba del Input
  // Permite que todos los campos ocupen el mismo espacio
`;

const Label = styled.label`
  display: block;
  flex-direction: column;
  font-weight: 600;
  margin-bottom: 5px;
  color: #05060f99;
  transition: color 0.3s cubic-bezier(0.25, 0.01, 0.25, 1);
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 10rem;
  border: 2px solid #aeadab;
  width: 100%;
  height: 44px;
  outline: none;
  color: black;
  transition: border-color 0.3s cubic-bezier(0.25, 0.01, 0.25, 1),
    color 0.3s cubic-bezier(0.25, 0.01, 0.25, 1),
    background 0.2s cubic-bezier(0.25, 0.01, 0.25, 1);

  &::placeholder {
    color: #aaa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  &:hover,
  &:focus {
    border-color: #05060f;
  }
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 10rem;
  border: 2px solid #aeadab;
  min-width: 150px;
  max-height: 44px;
  flex-grow: 1;
  color: #000000;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 15px 30px;
  text-align: center;
  background-color: ${({ theme }) => theme.palette.primary.main};
  border: 2px solid ${({ theme }) => theme.palette.primary.main};
  border-radius: 10em;
  color: white;
  font-size: 15px;
  font-weight: 600;
  height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.dark};
    transform: scale(1.05); // Pequeño efecto de crecimiento
  }
`;

const Message = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: green;
  font-weight: bold;
`;

const HiddenInput = styled('input')({
  display: 'none',
});

const ChoiceBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px; /* más espacio interno */
  min-width: 300px; /* ancho cómodo */
`;

const Sub = styled.div`
  color: #6b7280;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px; /* espacio entre botones */
  justify-content: flex-end;
`;

const Btn = styled.button`
  border: none;
  padding: 7px 11px; /* botones más grandes */
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
`;

const BtnEmpalme = styled(Btn)`
  background: #0038a8; /* azul */
  color: #fff;
  &:hover {
    filter: brightness(0.95);
  }
`;

const BtnCollector = styled(Btn)`
  background: #e5e7eb; /* gris claro */
  color: #111827;
  &:hover {
    filter: brightness(0.95);
  }
`;
