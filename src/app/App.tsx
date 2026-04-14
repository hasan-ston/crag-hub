import { RouterProvider } from "react-router";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGate } from "@/components/auth-gate";
import { router } from "@/app/routes";

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </AuthProvider>
  );
}
