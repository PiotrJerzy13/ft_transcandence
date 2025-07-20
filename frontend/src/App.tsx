import AppRouter from "./routes/Router";
import { ToastProvider } from './context/ToastContext';
import { PlayerDataProvider } from './context/PlayerDataContext'; // Import

export default function App() {
  return (
    <ToastProvider>
      <PlayerDataProvider> {/* Wrap AppRouter with the new provider */}
        <AppRouter />
      </PlayerDataProvider>
    </ToastProvider>
  );
}