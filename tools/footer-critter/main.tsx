import * as React from 'react';
import { createRoot } from 'react-dom/client';
import FuzzyCritterScene from './FuzzyCritterScene';

export function mountCritters(container: HTMLElement, showPoster: () => void) {
  const root = createRoot(container);
  root.render(<FuzzyCritterScene onUnavailable={showPoster} />);
}
