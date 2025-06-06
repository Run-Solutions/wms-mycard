export type InternalStackParamList = {
  DashboardScreen: undefined;
  WorkOrderDetailScreen: { id: number };
  AceptarProductoAuxScreen: { flowId: string };
  AceptarAuditoriaAuxScreen: { flowId: string };
  CerrarOrdenDeTrabajoAuxScreen: { id: string };
  LiberarProductoAuxScreen: { id: string };
  RecepcionCQMAuxScreen: { id: string };
  InconformidadesAuxScreen: { id: string };
};

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
  RoleSelection: { pendingUser: { username: string; email: string; password: string } };

  Principal: {
    screen: keyof InternalStackParamList;
    params?: InternalStackParamList[keyof InternalStackParamList];
  };

  liberarProducto: undefined;
  aceptarProducto: undefined;
  recepcionCQM: undefined;
};