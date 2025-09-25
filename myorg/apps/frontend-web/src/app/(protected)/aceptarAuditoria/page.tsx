// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { getFileByName } from '@/api/seguimientoDeOts';
import { getPendingOrders } from '../../../api/aceptarAuditoria';
import { useAuthContext } from '@/context/AuthContext';

// Se define el tipo de datos
interface WorkOrder {
  id: number;
  work_order_id: number;
  area_id: number;
  status: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  workOrder: {
    id: number;
    ot_id: string;
    mycard_id: string;
    quantity: number;
    priority: boolean;
    comments: string;
    created_by: number;
    validated: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: number;
      username: string;
    };
    files: {
      id: number;
      type: string;
      file_path: string;
    }[];
    flow: {
      id: number;
      status: string;
      assigned_user: number;
      area: {
        id: number;
        name: string;
      };
    }[];
  };
  areaResponse: {
    id: number;
    prepress: {
      id: number;
      plates: number;
      positives: number;
      testType: string;
      comments: string;
    };
  };
}

type PartialRelease = {
  validated: boolean;
  quantity: number;
};

type WorkOrderFlow = {
  id: number;
  area_id: number;
  status: string;
  assigned_user: number | null;
  work_order_id: number;
  partialReleases?: PartialRelease[];
};

function puedeAceptarNuevaEtapa(
  currentFlow: WorkOrderFlow,
  allFlows: WorkOrderFlow[],
  currentUserId: number
): boolean {
  const flujosAnterioresMismaAreaYUsuario = allFlows.filter(
    (f) =>
      f.area_id === currentFlow.area_id &&
      f.id < currentFlow.id &&
      f.assigned_user === currentUserId
  );
  if (flujosAnterioresMismaAreaYUsuario.length === 0) return true;
  for (const flujo of flujosAnterioresMismaAreaYUsuario) {
    const pendiente =
      ['Parcial', 'Listo'].includes(flujo.status) ||
      (flujo.partialReleases || []).some((r) => !r.validated);
    if (pendiente) {
      console.log('⛔ Usuario ya participó y aún tiene pendientes:', flujo);
      return false;
    }
  }
  // ✅ Participó antes pero todo está liberado
  return true;
}

// ======================= Utils / Preview =======================
const isCardImageFile = (f: { type: string; file_path: string }) => {
  const t = (f.type || '').toLowerCase();
  const p = (f.file_path || '').toLowerCase();
  return (
    t.includes('card') ||
    p.includes('cardimage') ||
    p.includes('card-img') ||
    p.includes('card_img') ||
    p.includes('card')
  );
};

const isSkuPdfFile = (f: { type: string; file_path: string }) => {
  const t = (f.type || '').toLowerCase();
  const p = (f.file_path || '').toLowerCase();
  return t.includes('sku') || p.includes('sku');
};

const guessMimeFromName = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

// Componente de preview (cardImage > SKU.pdf)
const CardPreview: React.FC<{
  files: { id: number; type: string; file_path: string }[];
  getFile: (filename: string) => Promise<ArrayBuffer>;
  openByName: (filename: string) => void;
}> = ({ files, getFile, openByName }) => {
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);
  const [openUrl, setOpenUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isImage, setIsImage] = React.useState<boolean>(false);
  const skuPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const revokeList: string[] = [];

    const makeBlobUrl = (ab: ArrayBuffer, mime: string) => {
      const blob = new Blob([ab], { type: mime });
      const url = URL.createObjectURL(blob);
      revokeList.push(url);
      return url;
    };

    const load = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // @ts-ignore worker local en /public (asegúrate de tenerlo copiado)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // 1) Imagen de tarjeta (prioridad)
        const card = files.find(isCardImageFile);
        if (card) {
          const ab = await getFile(card.file_path);
          const mime = guessMimeFromName(card.file_path);
          const imgUrl = makeBlobUrl(ab, mime);
          if (!isMounted) return;
          setIsImage(true);
          setThumbUrl(imgUrl);
          setOpenUrl(imgUrl);
          return;
        }

        // 2) Si no hay imagen, render de 1ra página del SKU.pdf
        const sku = files.find(isSkuPdfFile);
        if (sku) {
          const ab = await getFile(sku.file_path);
          const loadingTask = pdfjsLib.getDocument({ data: ab });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({ scale: 1 });
          const scale = 180 / viewport.height;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.max(1, Math.floor(scaledViewport.width * dpr));
          canvas.height = Math.max(1, Math.floor(scaledViewport.height * dpr));
          canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
          canvas.style.height = `${Math.floor(scaledViewport.height)}px`;
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          await page.render({
            // @ts-ignore tipos de pdfjs v5
            canvas,
            canvasContext: ctx,
            viewport: scaledViewport,
          }).promise;

          const dataUrl = canvas.toDataURL('image/png');

          if (!isMounted) return;
          setIsImage(false);
          setThumbUrl(dataUrl);
          setOpenUrl(null); // abrirá por nombre desde el padre
          skuPathRef.current = sku.file_path;
          return;
        }

        if (isMounted) {
          setThumbUrl(null);
          setOpenUrl(null);
        }
      } catch (err) {
        console.error('Error cargando preview:', err);
        if (isMounted) {
          setThumbUrl(null);
          setOpenUrl(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      revokeList.forEach((u) => URL.revokeObjectURL(u));
      isMounted = false;
    };
  }, [files, getFile]);

  if (loading) return <PreviewSkeleton />;
  if (!thumbUrl) {
    return (
      <PreviewBox>
        <EmptyState>
          <span>Sin vista previa</span>
        </EmptyState>
      </PreviewBox>
    );
  }

  const onOpen = () => {
    if (isImage && openUrl) window.open(openUrl, '_blank');
    else if (skuPathRef.current) openByName(skuPathRef.current);
  };

  return (
    <PreviewBox
      role="img"
      aria-label={isImage ? 'Card image' : 'SKU (PDF)'}
      onClick={onOpen}
      style={{ cursor: 'pointer' }}
    >
      <ImgThumb src={thumbUrl} alt={isImage ? 'Card image' : 'SKU preview'} />
      <Overlay className="overlay">
        {isImage ? 'Ver imagen' : 'Ver PDF'}
      </Overlay>
    </PreviewBox>
  );
};

const AcceptAuditoryPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();

  // Para obtener Ordenes Pendientes
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔎 Buscador + Organizador
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'priority' | 'createdAt' | 'quantity' | 'ot' | 'mycard'
  >('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Lista filtrada + ordenada (memoizada)
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = (WorkOrders || []).filter((wo) => {
      const w = wo.workOrder;
      if (!w) return false;
      const hay =
        w.ot_id?.toLowerCase().includes(q) ||
        w.mycard_id?.toLowerCase().includes(q) ||
        w.user?.username?.toLowerCase().includes(q) ||
        w.comments?.toLowerCase().includes(q);
      return q === '' ? true : !!hay;
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    const sorted = filtered.sort((a, b) => {
      const wa = a.workOrder;
      const wb = b.workOrder;
      if (!wa || !wb) return 0;

      switch (sortBy) {
        case 'priority': {
          // prioridad true primero/último según dir
          const pa = wa.priority ? 1 : 0;
          const pb = wb.priority ? 1 : 0;
          if (pa !== pb) return (pb - pa) * dir; // true ahead on 'desc' => adjust below
          // desempatamos por fecha
          const da = new Date(wa.createdAt).getTime();
          const db = new Date(wb.createdAt).getTime();
          return (da - db) * dir;
        }
        case 'createdAt': {
          const da = new Date(wa.createdAt).getTime();
          const db = new Date(wb.createdAt).getTime();
          return (da - db) * dir;
        }
        case 'quantity': {
          return (wa.quantity - wb.quantity) * dir;
        }
        case 'ot': {
          return (wa.ot_id || '').localeCompare(wb.ot_id || '') * dir;
        }
        case 'mycard': {
          return (wa.mycard_id || '').localeCompare(wb.mycard_id || '') * dir;
        }
        default:
          return 0;
      }
    });

    // Para prioridad, normalmente se quiere true primero => forzamos si sortBy='priority'
    if (sortBy === 'priority') {
      return sortDir === 'asc' ? sorted.reverse() : sorted;
    }
    return sorted;
  }, [WorkOrders, query, sortBy, sortDir]);

  const handleCardClick = (order: WorkOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const aceptarOT = async () => {
    if (!selectedOrder) return;
    const flowItem = [...(selectedOrder?.workOrder.flow || [])]
      .reverse()
      .find(
        (f) =>
          f.area.id === selectedOrder.area_id &&
          f.status === selectedOrder.status
      );
    if (!flowItem) {
      alert('No se encontró el flujo activo para esta área');
      return;
    }
    const flowId = flowItem?.id;
    const mappedFlows = selectedOrder.workOrder.flow.map((f) => ({
      id: f.id,
      status: f.status,
      area_id: f.area.id,
      assigned_user: f.assigned_user ?? null,
      work_order_id: selectedOrder.workOrder.id,
      partialReleases: (f as any).partialReleases || [],
    }));
    const currentUserId = user?.id;
    if (!currentUserId) return;
    const puedeAceptar = puedeAceptarNuevaEtapa(
      {
        ...flowItem,
        area_id: selectedOrder.area_id,
        assigned_user: currentUserId ?? null,
        work_order_id: selectedOrder.work_order_id,
      },
      mappedFlows,
      currentUserId
    );
    console.log('User', currentUserId);
    if (!puedeAceptar) {
      alert(
        'Debes liberar completamente tu participación anterior antes de aceptar esta etapa.'
      );
      return;
    }
    if (selectedOrder?.area_id !== 1) {
      window.location.href = `/aceptarAuditoria/${flowId}`;
      return;
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename); // <- ya la tienes
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        const data = await getPendingOrders();
        if (Array.isArray(data)) {
          setWorkOrders(data);
        } else {
          setWorkOrders([]);
        }
      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrders:', err);
      }
    }
    fetchWorkOrders();
  }, []);

  return (
    <>
      {isModalOpen && selectedOrder && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>Orden: {selectedOrder.workOrder.ot_id}</h2>
            <ModalBody>
              <ModalInfo>
                <p>
                  <strong>Id del Presupuesto:</strong>{' '}
                  {selectedOrder.workOrder.mycard_id}
                </p>
                <p>
                  <strong>Cantidad:</strong> {selectedOrder.workOrder.quantity}
                </p>
                <p>
                  <strong>Creado por:</strong>{' '}
                  {selectedOrder.workOrder.user?.username}
                </p>
                <p>
                  <strong>Prioritario:</strong>{' '}
                  {selectedOrder.workOrder.priority ? 'Sí' : 'No'}
                </p>
                <p>
                  <strong>Comentarios:</strong>{' '}
                  {selectedOrder.workOrder.comments}
                </p>
                <p>
                  <strong>Archivos:</strong>
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {selectedOrder.workOrder.files.map((file) => {
                    const name = file.file_path.toLowerCase();
                    const label = name.includes('ot')
                      ? 'Ver OT'
                      : name.includes('sku')
                      ? 'Ver SKU'
                      : name.includes('op')
                      ? 'Ver OP'
                      : name.includes('image')
                      ? 'Ver TARJETA'
                      : 'Adjunto';
                    return (
                      <button
                        key={file.file_path}
                        onClick={() => downloadFile(file.file_path)}
                        className="flex items-center justify-center w-full px-3 py-2
                                 rounded-lg shadow-sm bg-white hover:bg-gray-100 
                                 border text-sm font-medium transition-all duration-200"
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </ModalInfo>
              <ModalFlow>
                <strong>Flujos:</strong>
                <Timeline>
                  {selectedOrder.workOrder.flow.map((f, index) => (
                    <TimelineItem key={index}>
                      <Circle>{index + 1}</Circle>
                      <AreaName>{f.area.name ?? 'Area Desconocida'}</AreaName>
                      {index < selectedOrder.workOrder.flow.length - 1 && (
                        <Line />
                      )}
                    </TimelineItem>
                  ))}
                </Timeline>
              </ModalFlow>
            </ModalBody>
            <button
              style={{ marginTop: '20px', backgroundColor: '#bbbbbb' }}
              onClick={closeModal}
            >
              Cerrar
            </button>
            <button
              style={{
                marginTop: '20px',
                backgroundColor: '#0038A8',
                color: 'white',
              }}
              onClick={aceptarOT}
            >
              Aceptar OT
            </button>
          </ModalContent>
        </ModalOverlay>
      )}

      <PageContainer>
        <TitleWrapper>
          <Title theme={theme}>Órdenes de Trabajo Pendientes</Title>
        </TitleWrapper>

        {/* 🔎 Barra de búsqueda y organización */}
        <Toolbar>
          <SearchBox>
            <SearchInput
              placeholder="Buscar por OT"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <ClearBtn onClick={() => setQuery('')}>×</ClearBtn>}
          </SearchBox>

          <SortGroup>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="priority">Ordenar: Prioridad</option>
              <option value="createdAt">Ordenar: Fecha creación</option>
              <option value="quantity">Ordenar: Cantidad</option>
              <option value="ot">Ordenar: OT</option>
              <option value="mycard">Ordenar: MyCard</option>
            </Select>
            <Select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </Select>
          </SortGroup>
        </Toolbar>

        <CardsContainer>
          {Array.isArray(filteredSorted) && filteredSorted.length > 0 ? (
            filteredSorted.map((order, index) => {
              const workOrder = order.workOrder;
              if (!workOrder) return null;
              return (
                <WorkOrderCard
                  key={order.id}
                  onClick={() => handleCardClick(order)}
                >
                  <CardPreview
                    files={workOrder.files || []}
                    getFile={getFileByName}
                    openByName={downloadFile}
                  />
                  <CardTitle>
                    {workOrder.priority && <PriorityBadge />}
                    {workOrder.ot_id}
                  </CardTitle>
                  <InfoItem>
                    <p>{workOrder.mycard_id}</p>
                    <p>Cantidad: {workOrder.quantity}</p>
                  </InfoItem>
                  <Info style={{ paddingTop: '10px' }}>
                    Creado por: {workOrder.user.username}
                  </Info>
                  <Info>
                    Fecha de creación:{' '}
                    {new Date(workOrder.createdAt).toLocaleDateString()}
                  </Info>
                </WorkOrderCard>
              );
            })
          ) : (
            <Message>No hay órdenes que coincidan con tu búsqueda.</Message>
          )}
        </CardsContainer>
      </PageContainer>
    </>
  );
};

export default AcceptAuditoryPage;

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
  margin-bottom: 1rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary};
`;

/* 🔎 Toolbar */
const Toolbar = styled.div`
  margin: 10px 0 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  position: relative;
  min-width: 260px;
  flex: 1 1 360px;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 10px 38px 10px 14px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  outline: none;
  color: #111827;
  background: #fff;
  transition: border-color .18s ease;
  &:focus { border-color: #9ca3af; }
`;

const ClearBtn = styled.button`
  position: absolute;
  right: 8px;
  top: 7px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #111827;
  font-size: 18px;
  cursor: pointer;
  &:hover { background: #e5e7eb; }
`;

const SortGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Select = styled.select`
  height: 44px;
  padding: 10px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #fff;
  color: #111827;
  min-width: 180px;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
`;

const WorkOrderCard = styled.div`
  padding: 12px 16px 18px;
  border-radius: 1.25rem;
  border: 2px solid #e5e7eb;
  width: 100%;
  max-width: 420px;
  background-color: ${(props) => props.theme.palette.primary.main};
  cursor: pointer;
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
    border-color: #d1d5db;
  }
`;

const CardTitle = styled.div`
  font-size: 1.35rem;
  font-weight: 700;
  padding: 10px 0 6px 0;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  margin: 0.2rem 0;
`;

const Info = styled.div`
  color: white;
  margin: 0.2rem 0;
  font-size: 0.9rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: white;
  color: black;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 560px;
  width: 92%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  h2 { font-size: 1.6rem; margin-bottom: 1rem; }
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.6rem;
    background-color: #f3f4f6;
    color: #111827;
    cursor: pointer;
    margin: 5px;
    transition: transform .15s ease, background .15s ease;
    &:hover { transform: translateY(-1px); background: #e5e7eb; }
  }
`;

const ModalBody = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const ModalFlow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ModalInfo = styled.div`
  p { margin: 0.4rem 0; }
  width: 64%;
  min-width: 260px;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0.5rem 0;
`;

const TimelineItem = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1rem;
`;

const Circle = styled.div`
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  background-color: #4a90e2;
  border-radius: 50%;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Line = styled.div`
  position: absolute;
  left: 9px;
  top: 20px;
  height: 30px;
  width: 2px;
  background-color: #4a90e2;
`;

const AreaName = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
`;

const PriorityBadge = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.7);
  position: relative;
  top: 1px;
  &:after {
    content: '';
    position: absolute;
    top: 1.5px;
    left: 1.5px;
    width: 3px;
    height: 3px;
    background-color: white;
    border-radius: 50%;
    opacity: 0.9;
  }
`;

const Message = styled.p`
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: 1rem;
  text-align: center;
  margin-top: 2rem;
`;

/* ====== Styled del Preview ====== */
const PreviewBox = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const ImgThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const PreviewSkeleton = styled.div`
  width: 100%;
  height: 180px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  background: rgba(0,0,0,0);
  opacity: 0;
  transition: opacity .2s ease, background .2s ease;
  pointer-events: none;
  ${PreviewBox}:hover & {
    opacity: 1;
    background: rgba(0,0,0,0.28);
  }
`;

const EmptyState = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #6b7280;
  font-weight: 700;
`;