import { registerRootComponent } from 'expo';
import App from './App';

// Entry esplicito: registra App relativo alla cartella client/,
// evitando l'ambiguità di "../../App" dell'AppEntry di default di Expo
// (necessario nel monorepo con node_modules sia in root che in client).
registerRootComponent(App);
