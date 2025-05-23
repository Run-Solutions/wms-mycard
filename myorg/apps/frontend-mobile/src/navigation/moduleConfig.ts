// moduleConfig.ts
import OrdenesScreen from '../app/protected/ordenesDeTrabajo/page';
import SeguimientoScreen from '../app/protected/seguimientoDeOts/page';
import FinalizacionScreen from '../app/protected/finalizacion/FinalizacionScreen';
import PermisosScreen from '../app/protected/permisos/PermisosScreen';
import UsuariosScreen from '../app/protected/usuarios/UsuariosScreen';
// Para operadores
import AceptarProductoScreen from '../app/protected/aceptarProducto/index';
import LiberarProductoScreen from '../app/protected/liberarProducto/index';
import InconformidadesScreen from '../app/protected/inconformidades/index';
// Para calidad
import VistosBuenosScreen from '../app/protected/vistosBuenos/index';
import RecepcionCQMScreen from '../app/protected/recepcionCqm/index';
import ConfiguracionVistosBuenosScreen from '../app/protected/configuracionVistosBuenos/index';
// Para auditor
import AceptarAuditoriaScreen from '../app/protected/aceptarAuditoria/index';
import CerrarOrdenDeTrabajoScreen from '../app/protected/cerrarOrdenDeTrabajo/index';

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