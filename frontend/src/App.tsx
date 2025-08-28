import AppRouter from "./routes/Router";
import { ToastProvider } from './context/ToastContext';
import { SimpleToastProvider } from './context/SimpleToastContext';
import { PlayerDataProvider } from './context/PlayerDataContext'; // Import

export default function App() {
  return (
    <ToastProvider>
      <SimpleToastProvider>
        <PlayerDataProvider> {/* Wrap AppRouter with the new provider */}
          <AppRouter />
        </PlayerDataProvider>
      </SimpleToastProvider>
    </ToastProvider>
  );
}