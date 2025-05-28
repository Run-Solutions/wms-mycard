// myorg/apps/frontend-mobile/src/navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
  RoleSelection: { pendingUser: { username: string; email: string; password: string } };

  WorkOrderDetailScreen: { id: number };
  AceptarProductoAuxScreen: { flowId: string };
  LiberarProductoAuxScreen: { id: string };
  RecepcionCQMAuxScreen: { id: string };
  InconformidadesAuxScreen: { id: string };
  liberarProducto: undefined;
  aceptarProducto: undefined;
  recepcionCQM: undefined;
};
