# Reglas para agentes (Gemini/Antigravity, Codex, Claude y cualquier otro)

Este repo lo trabajan VARIOS agentes a la vez, a veces en la misma carpeta/worktree.
Estas reglas son obligatorias.

## Reglas de repo

1. **Al empezar:** `git fetch && git status -sb && git log --oneline -5 origin/main`.
   Puede haber OTROS agentes trabajando el mismo repo/worktree: no toques archivos
   que no son de tu tarea ni commitees cambios ajenos (`git add` solo de tus archivos,
   nunca `git add -A` / `git add .`).
2. **Antes de push:** `git pull --rebase`, correr tests (`npx tsc --noEmit` + `npx vitest run`
   de lo tocado) y OTRA VEZ `git pull --rebase`. Recién ahí `git push origin HEAD:main`.
3. **NO pushees ni deployes sin OK explícito del usuario.** Primero mostrá diff + tests.
4. **Una tarea NO está terminada** hasta que muestres:
   - `git log --oneline -3 origin/main` con tu commit adentro,
   - `git status -sb` limpio (sin commits "adelante" de origin/main),
   - el estado del deploy de Vercel en `success`.
   Si algo de eso falta, decí **"NO ESTÁ ONLINE"** y por qué.
5. **Nunca digas "listo" / "deployado" sin pegar ese output real.**

## Además

- Nunca `git stash` / `git stash pop` a secas: el stash es compartido entre worktrees y
  podés pisar el trabajo de otro agente. Si hace falta apartar algo, commit WIP.
- Nada de IA para redibujar prendas ni diseños de clientes: el diseño del cliente se usa
  IDÉNTICO; mockups y composición son determinísticos (sharp).
