import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import bodyHtml from '@/units/fcc-r400/body.html?raw';
import unitCss from '@/units/fcc-r400/styles.css?inline';
import { mountFccScene } from '@/units/fcc-r400/scene.js';

export const Route = createFileRoute('/units/fcc-r400')({
  head: () => ({
    meta: [
      { title: 'R-400 | Fluid Catalytic Cracker — 3D Viewer' },
      {
        name: 'description',
        content:
          'Interactive 3D isolation viewer for the R-400 Fluid Catalytic Cracker unit with live process readings, yields, and slide-valve controls.',
      },
      { property: 'og:title', content: 'R-400 | Fluid Catalytic Cracker' },
      {
        property: 'og:description',
        content: 'Three.js 3D viewer of the FCC R-400 with live process telemetry.',
      },
    ],
  }),
  component: FccR400Page,
});

function FccR400Page() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    let dispose: (() => void) | undefined;
    const id = window.setTimeout(() => {
      try {
        dispose = mountFccScene();
      } catch (e) {
        console.error('FCC scene mount failed', e);
      }
    }, 0);
    return () => {
      window.clearTimeout(id);
      try {
        dispose?.();
      } catch (e) {
        console.warn(e);
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: unitCss }} />
      <div
        ref={rootRef}
        className="fcc-r400-root"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
