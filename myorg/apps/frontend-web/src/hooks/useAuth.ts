// myorg\apps\frontend-web\src\hooks\useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  return { auth, dispatch };
};
