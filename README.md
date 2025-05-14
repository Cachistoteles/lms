# Entorno de Juan CLI

![Entorno de Juan CLI logo](https://files.entorno-juan.ai/entorno-juan-light.png)

Este proyecto es el CLI y utilidades para el Entorno de Juan. Todas las referencias a lms, lmstudio, LM Studio, lms- y derivados han sido renombradas a Entorno de Juan o entorno-juan.

## Instalación y uso

Consulta la documentación para instrucciones de uso y personalización.

---

## Branding y modularidad

- Todas las dependencias rotas de LMStudio han sido eliminadas.
- El CLI es modular y listo para cargar modelos `.gguf` o conectarse a tu backend.
- Puedes personalizar y ampliar la estructura para cualquier motor LLM local o remoto.

---

## Panel PRUNE (en UI)

- Carga de modelos `.gguf` desde disco
- Parámetros de ejecución (temperatura, top_p, top_k, etc.)
- Historial de conversaciones por modelo
- Aprendizaje y anotaciones personalizadas
- Botón de reinicio del entorno
- Guardado de configuración personalizada por modelo

---

## Conexión backend-frontend

- El backend recibe prompts desde la UI
- Cada modelo responde según su contexto
- Todo queda guardado en la base de datos o en archivos `.json` locales
