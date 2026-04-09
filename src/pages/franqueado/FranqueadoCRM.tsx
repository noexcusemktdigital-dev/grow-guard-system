import ClienteCRM from "@/pages/cliente/ClienteCRM";
import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function FranqueadoCRM() {
  return (
    <ErrorBoundary pageName="FranqueadoCRM">
      <FranqueadoCRMContent />
    </ErrorBoundary>
  );
}

function FranqueadoCRMContent() {
  const location = useLocation();
  // Derive config route from current path
  const basePath = location.pathname.replace(/\/$/, "");
  const configRoute = `${basePath}/config`;

  return <ClienteCRM hideQuota configRoute={configRoute} />;
}
