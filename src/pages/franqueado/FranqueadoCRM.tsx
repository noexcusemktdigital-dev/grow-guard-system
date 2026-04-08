// @ts-nocheck
import ClienteCRM from "@/pages/cliente/ClienteCRM";
import { useLocation } from "react-router-dom";

export default function FranqueadoCRM() {
  const location = useLocation();
  // Derive config route from current path
  const basePath = location.pathname.replace(/\/$/, "");
  const configRoute = `${basePath}/config`;

  return <ClienteCRM hideQuota configRoute={configRoute} />;
}
