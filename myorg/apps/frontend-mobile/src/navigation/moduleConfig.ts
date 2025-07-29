// src/navigation/moduleConfig.ts

import React from 'react';
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
import RecepcionDeVistosBuenosScreen from '../app/protected/recepcionDeVistosBuenos/page';
import LiberacionDeVistosBuenosScreen from '../app/protected/liberacionDeVistosBuenos/page';
import ConfiguracionVistosBuenosScreen from '../app/protected/configuracionVistosBuenos/page';
// Para auditor
import AceptarAuditoriaScreen from '../app/protected/aceptarAuditoria/page';
import CerrarOrdenDeTrabajoScreen from '../app/protected/cerrarOrdenDeTrabajo/page';
import RechazosScreen from '../app/protected/rechazos/page';

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
  component: React.FC<any>;
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
    name: 'Recepcion de Vistos Buenos',
    route: 'recepcionDeVistosBuenos',
    component: RecepcionDeVistosBuenosScreen,
  },
  {
    name: 'Liberacion de Vistos Buenos',
    route: 'liberacionDeVistosBuenos',
    component: LiberacionDeVistosBuenosScreen,
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
  {
    name: 'Rechazos',
    route: 'rechazos',
    component: RechazosScreen,
  }
];
