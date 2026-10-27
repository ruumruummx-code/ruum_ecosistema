import type { Metadata } from "next";
import { UserResponsiveLayout } from "../../components/layout/UserResponsiveLayout";
import { PreguntasFrecuentes } from "./PreguntasFrecuentes";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default function PaginaPreguntasFrecuentes() {
  return (
    <>
      <UserResponsiveLayout mobileShell mobileNavigation mobileBottomNavigation mobileContentClassName="faq-shell-content">
        <PreguntasFrecuentes />
      </UserResponsiveLayout>
    </>
  );
}
