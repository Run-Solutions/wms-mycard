'use client';

import { Card, CardContent } from '@/components/ui/card';
import { getFileByName } from '@/api/seguimientoDeOts';

interface Props {
  workOrder: any;
  lastCompletedOrPartial?: any;
  cantidadporliberar?: any;
}
interface PartialRelease {
  validated: boolean;
  quantity: number;
}

export default function WorkOrderInfo({
  workOrder,
  lastCompletedOrPartial,
  cantidadporliberar,
}: Props) {
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

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename);
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  return (
    <>
      {/* Datos principales */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Número de Orden
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.ot_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Presupuesto
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.mycard_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Cantidad (Tarjetas)
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.quantity}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Usuario del area previa:
            </p>
            <p className="text-xl font-semibold text-black">
              {lastCompletedOrPartial.user.username}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? 'Cantidad entregada:'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? 'Cantidad entregada validada:'
                : 'Cantidad faltante por liberar:'}
            </p>
            <p className="text-xl font-semibold text-black">
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? // Mostrar cantidad según sub-área disponible
                  lastCompletedOrPartial.areaResponse.prepress?.plates ??
                  lastCompletedOrPartial.areaResponse.impression
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.serigrafia
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.empalme
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.laminacion
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.colorEdge
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.hotStamping
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.millingChip
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.personalizacion
                    ?.good_quantity ??
                  'Sin cantidad'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? lastCompletedOrPartial.partialReleases
                    .filter((release: PartialRelease) => release.validated)
                    .reduce(
                      (sum: number, release: PartialRelease) =>
                        sum + release.quantity,
                      0
                    )
                : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
                  (lastCompletedOrPartial.partialReleases?.reduce(
                    (sum: number, release: PartialRelease) =>
                      sum + release.quantity,
                    0
                  ) ?? 0)}
            </p>
          </CardContent>
        </Card>
        {workOrder?.partialReleases?.length > 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Cantidad por Liberar:
              </p>
              <p className="text-xl font-semibold text-black">
                {cantidadporliberar}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comentarios y Archivos */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Comentarios
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.comments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Archivos de la Orden de Trabajo
            </p>
            {workOrder?.workOrder.files &&
            workOrder.workOrder.files.length > 0 ? (
              <div className="flex gap-3 m-2">
                {workOrder.workOrder.files.map((file: any) => {
                  const label =
                    file.type === 'OT'
                      ? 'OT'
                      : file.type === 'SKU'
                      ? 'SKU'
                      : file.type === 'OP'
                      ? 'OP'
                      : file.type === 'CARD_IMAGE'
                      ? 'Ver TARJETA'
                      : 'Adjunto';
                  return (
                    <button
                      key={file.id}
                      onClick={() => downloadFile(file.file_path)}
                      className="flex-row items-center
                                 rounded-xl border border-gray-200
                                 bg-white px-4 py-2 text-sm font-medium text-gray-700
                                 shadow-sm transition
                                 hover:bg-gray-50 hover:shadow-md
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                 active:scale-[0.98]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xl font-semibold text-black">
                No se ha adjuntado ningún archivo
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function WorkOrderHojasInfo({
  workOrder,
  lastCompletedOrPartial,
  cantidadporliberar,
}: Props) {
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective =
    workOrder?.workOrder?.total_sheets ?? cantidadHojas;

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

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename);
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  return (
    <>
      {/* Datos principales */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Número de Orden
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.ot_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Presupuesto
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.mycard_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="">
            <p className="text-sm text-muted-foreground text-black">
              Cantidad (Tarjetas)
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.quantity}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-400">
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Cantidad (Hojas Frente / Hojas Vuelta):
            </p>
            <p className="text-xl font-semibold text-black">
              {totalSheetsEffective}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comentarios y Archivos */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Área que lo envía:
            </p>
            <p className="text-xl font-semibold text-black">
              {lastCompletedOrPartial.area.name}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Usuario del area previa:
            </p>
            <p className="text-xl font-semibold text-black">
              {lastCompletedOrPartial.user.username}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? 'Cantidad entregada:'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? 'Cantidad entregada validada:'
                : 'Cantidad faltante por liberar:'}
            </p>
            <p className="text-xl font-semibold text-black">
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? // Mostrar cantidad según sub-área disponible
                  lastCompletedOrPartial.areaResponse.prepress?.plates ??
                  lastCompletedOrPartial.areaResponse.impression
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.serigrafia
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.empalme
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.laminacion
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.colorEdge
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.hotStamping
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.millingChip
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.personalizacion
                    ?.good_quantity ??
                  'Sin cantidad'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? lastCompletedOrPartial.partialReleases
                    .filter((release: PartialRelease) => release.validated)
                    .reduce(
                      (sum: number, release: PartialRelease) =>
                        sum + release.quantity,
                      0
                    )
                : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
                  (lastCompletedOrPartial.partialReleases?.reduce(
                    (sum: number, release: PartialRelease) =>
                      sum + release.quantity,
                    0
                  ) ?? 0)}
            </p>
          </CardContent>
        </Card>
        {workOrder?.partialReleases?.length > 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Cantidad por Liberar:
              </p>
              <p className="text-xl font-semibold text-black">
                {cantidadporliberar}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Comentarios
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.comments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Archivos de la Orden de Trabajo
            </p>
            {workOrder?.workOrder.files &&
            workOrder.workOrder.files.length > 0 ? (
              <div className=" flex gap-3 m-2">
                {workOrder.workOrder.files.map((file: any) => {
                  const label =
                    file.type === 'OT'
                      ? 'OT'
                      : file.type === 'SKU'
                      ? 'SKU'
                      : file.type === 'OP'
                      ? 'OP'
                      : file.type === 'CARD_IMAGE'
                      ? 'Ver TARJETA'
                      : 'Adjunto';
                  return (
                    <button
                      key={file.id}
                      onClick={() => downloadFile(file.file_path)}
                      className="flex-row items-center
                                         rounded-xl border border-gray-200
                                         bg-white px-4 py-2 text-sm font-medium text-gray-700
                                         shadow-sm transition
                                         hover:bg-gray-50 hover:shadow-md
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                         active:scale-[0.98]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xl font-semibold text-black">
                No se ha adjuntado ningun archivo
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function WorkOrderPrePressInfo({ workOrder }: Props) {
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective =
    workOrder?.workOrder?.total_sheets ?? cantidadHojas;

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

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename);
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  return (
    <>
      {/* Datos principales */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Número de Orden
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.ot_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Presupuesto
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.mycard_id}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Cantidad (Tarjetas)
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.quantity}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-400">
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Cantidad (Hojas Frente / Hojas Vuelta):
            </p>
            <p className="text-xl font-semibold text-black">
              {totalSheetsEffective}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Comentarios y Archivos */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Comentarios
            </p>
            <p className="text-xl font-semibold text-black">
              {workOrder.workOrder.comments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground text-black">
              Archivos de la Orden de Trabajo
            </p>
            {workOrder?.workOrder.files &&
            workOrder.workOrder.files.length > 0 ? (
              <div className=" flex gap-3 m-2">
                {workOrder.workOrder.files.map((file: any) => {
                  const label =
                    file.type === 'OT'
                      ? 'OT'
                      : file.type === 'SKU'
                      ? 'SKU'
                      : file.type === 'OP'
                      ? 'OP'
                      : file.type === 'CARD_IMAGE'
                      ? 'Ver TARJETA'
                      : 'Adjunto';
                  return (
                    <button
                      key={file.id}
                      onClick={() => downloadFile(file.file_path)}
                      className="flex-row items-center
                                         rounded-xl border border-gray-200
                                         bg-white px-4 py-2 text-sm font-medium text-gray-700
                                         shadow-sm transition
                                         hover:bg-gray-50 hover:shadow-md
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                         active:scale-[0.98]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xl font-semibold text-black">
                No se ha adjuntado ningun archivo
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
