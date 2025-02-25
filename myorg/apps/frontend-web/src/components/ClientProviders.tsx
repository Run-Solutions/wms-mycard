"use client";

import React from "react";
import { Provider } from "react-redux";
import { store } from "../store";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
