# Prompt inicial para Claude Code

Pega esto como primer mensaje dentro de la carpeta del proyecto (con `CLAUDE.md` y `docs/` ya dentro):

---

Lee `CLAUDE.md`, `docs/SPEC.md`, `docs/CONTENIDO.md`, `docs/DATA_MODEL.sql` y `docs/ROADMAP.md`, en ese orden. Después:

1. Resúmeme en 10 líneas lo que vas a construir y señala cualquier contradicción o hueco que veas en los documentos (no asumas, dime).
2. Ejecuta la **Fase 0** del roadmap completa: scaffold, GitHub Pages con HashRouter, y el humo de SQL contra mi proyecto de Supabase (te daré la URL y la anon key por `.env.local`; nunca las subas al repo).
3. Explícame el porqué de cada decisión técnica con trade-offs, y al final de cada fase dame 1–2 recursos concretos para profundizar.
4. Cuando termine la Fase 0, para y enséñame la URL de deploy antes de seguir con la Fase 1.

Reglas que no se rompen: fidelidad histórica solo desde `docs/CONTENIDO.md`; cronología correcta del Terror (Danton y Desmoulins en abril de 1794, antes de la Ley del 22 de pradial); nunca denuncias contra compañeros reales; nada de fotos de personas reales; todo texto libre pasa por moderación.
