interface EventosEnFlujo {
  tipo: Acciones;
}

declare global {
  interface WindowEventMap {
    enflujo: CustomEvent<EventosEnFlujo>;
  }
}
