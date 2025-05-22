// myorg/apps/frontend-mobile/src/navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
  RoleSelection: { pendingUser: { username: string; email: string; password: string } };

  aceptarAuditoria: undefined;
  cerrarOrdenDeTrabajo: undefined;
};
