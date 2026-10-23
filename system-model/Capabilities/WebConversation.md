# Elements

### Conversazione testuale nel browser

La famiglia interagisce con Ambrogio da un browser, in alternativa al client terminale: invia turni testuali, osserva la risposta progressiva, consulta le conversazioni conservate e le continua, anche se sono iniziate da un altro client. Il client usa soltanto le interfacce pubbliche del backend, cioè il protocollo conversazionale `ambrogio.v1` e le API HTTP di consultazione; il backend e il client web hanno repository e modelli Reqvire autonomi. Il client web è un componente facoltativo dell'installazione e non configura il backend né i satelliti.

#### Metadata
  * type: capability
---
