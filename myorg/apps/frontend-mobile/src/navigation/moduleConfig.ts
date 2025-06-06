// moduleConfig.ts
import OrdenesScreen from '../app/protected/ordenesDeTrabajo/page';
import SeguimientoScreen from '../app/protected/seguimientoDeOts/page';
import FinalizacionScreen from '../app/protected/finalizacion/page';
import PermisosScreen from '../app/protected/permisos/page';
import UsuariosScreen from '../app/protected/usuarios/page';
// Para operadores
import AceptarProductoScreen from '../app/protected/aceptarProducto/page';
import LiberarProductoScreen from '../app/protected/liberarProducto/page';
import InconformidadesScreen from '../app/protected/inconformidades/page';
// Para calidad
import VistosBuenosScreen from '../app/protected/vistosBuenos/page';
import RecepcionCQMScreen from '../app/protected/recepcionCqm/page';
import ConfiguracionVistosBuenosScreen from '../app/protected/configuracionVistosBuenos/page';
// Para auditor
import AceptarAuditoriaScreen from '../app/protected/aceptarAuditoria/page';
import CerrarOrdenDeTrabajoScreen from '../app/protected/cerrarOrdenDeTrabajo/page';

export type ModuleFromApi = {
  id: number;
  name: string;
  description: string;
  imageName: string;
  logoName: string;
};

export type ModuleConfig = {
  name: string;
  route: string;
  component: React.FC;
};

export const MODULE_CONFIG: ModuleConfig[] = [
  {
    name: 'Ordenes de Trabajo',
    route: 'ordenesDeTrabajo',
    component: OrdenesScreen,
  },
  {
    name: 'Seguimiento de OTs',
    route: 'seguimientoDeOTs',
    component: SeguimientoScreen,
  },
  {
    name: 'Finalizacion',
    route: 'finalizacion',
    component: FinalizacionScreen,
  },
  {
    name: 'Permisos',
    route: 'permisos',
    component: PermisosScreen,
  },
  {
    name: 'Usuarios',
    route: 'usuarios',
    component: UsuariosScreen,
  },
  {
    name: 'Aceptar Producto',
    route: 'aceptarProducto',
    component: AceptarProductoScreen,
  },
  {
    name: 'Liberar Producto',
    route: 'liberarProducto',
    component: LiberarProductoScreen,
  },
  {
    name: 'Inconformidades',
    route: 'inconformidades',
    component: InconformidadesScreen,
  },
  {
    name: 'Vistos Buenos',
    route: 'vistosBuenos',
    component: VistosBuenosScreen,
  },
  {
    name: 'Recepcion CQM',
    route: 'recepcionCQM',
    component: RecepcionCQMScreen,
  },
  {
    name: 'Configuracion Vistos Buenos',
    route: 'configuracionVistosBuenos',
    component: ConfiguracionVistosBuenosScreen,
  },
  {
    name: 'Aceptar Auditoria',
    route: 'aceptarAuditoria',
    component: AceptarAuditoriaScreen,
  },
  {
    name: 'Cerrar Orden de Trabajo',
    route: 'cerrarOrdenDeTrabajo',
    component: CerrarOrdenDeTrabajoScreen,
  },
];