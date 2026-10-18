# Elements

### Accessibilità di base dell'interfaccia

Il client web deve essere utilizzabile da tastiera e con un lettore di schermo in tutte le sue funzioni, secondo il profilo di accessibilità di base del client.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Anteprima delle conversazioni nella barra laterale

Quando il client web mostra una pagina dell'elenco conversazioni, deve presentare per ogni conversazione visibile un'anteprima del primo messaggio della persona ottenuta dallo storico HTTP pubblico; se uno storico non è disponibile, deve mantenere selezionabile la conversazione mostrando un identificativo abbreviato.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Apertura e continuazione di una conversazione conservata

Quando la persona sceglie una conversazione nella barra laterale, il client web deve mostrarne lo storico ottenuto dall'API HTTP pubblica e inviare i turni successivi in quella conversazione, anche se è iniziata da un altro client.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/WebConversation.md#contratti-pubblici-del-backend-ambrogio)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Chat aperta nell'indirizzo della pagina

Quando la persona apre una conversazione conservata, il client web deve riportarne l'identificativo nell'indirizzo della pagina; quando la pagina viene aperta con l'identificativo di una conversazione, deve mostrare quella conversazione come chat corrente.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Client conversazionale nel browser

Ambrogio deve fornire alla famiglia un client di chat testuale utilizzabile da un browser, collegato al backend tramite il protocollo conversazionale `ambrogio.v1` e le API HTTP pubbliche di consultazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/WebConversation.md#contratti-pubblici-del-backend-ambrogio)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Compatibilità con l'API conversazionale del backend

Quando il client web comunica con il backend Ambrogio, deve usare il protocollo conversazionale e le API HTTP pubbliche della versione di backend dichiarata come dipendenza, senza accedere ai file o ai moduli interni del server.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controlli CI del client web

Quando viene eseguito un push sul branch principale o viene proposta una pull request, la CI del client web deve eseguire la validazione e il lint del modello Reqvire, il controllo TypeScript senza emissione, la suite di test e la build, e deve fallire se uno di questi controlli fallisce.

#### Details
Decisione concordata con la persona il 18 ottobre 2026, allineata agli altri repository di prodotto: Reqvire 1.3.2 per `validate` e `lint`, con il lint che fallisce se restano correzioni automatiche o elementi da rivedere; `npm run typecheck`; `npm test`, che usa il backend simulato locale; `npm run build`; Node.js 24. La prova di integrazione contro la revisione backend fissata (`npm run test:backend`) richiede un checkout del backend e resta fuori dalla CI.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controllo dei segreti prima del commit

Quando si crea un commit in un clone del repository con gli hook versionati attivi, il controllo pre-commit deve scansionare con gitleaks le modifiche in staging e deve impedire il commit se rileva un segreto oppure se gitleaks non è disponibile.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti con gitleaks](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-con-gitleaks)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Distribuzione come immagine Docker

Il client web deve essere distribuito come immagine container che serve i file statici dell'applicazione con un processo non privilegiato e riceve la configurazione di esecuzione dall'installazione, senza includerla nell'immagine.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Esiti previsti come valori tipizzati

Quando un'operazione del nucleo del client web prevede un esito negativo nel proprio contratto, deve rappresentarlo come valore tipizzato distinguibile dal successo, riservando le eccezioni ai guasti inattesi.

#### Metadata
  * type: requirement

#### Contract References
  * [Architettura del client web](../Contracts/WebConversation.md#architettura-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Header di sicurezza del server statico

Quando il server dei file statici del client web risponde a una richiesta, deve applicare il profilo di header di sicurezza e di cache del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo dell'immagine Docker del client web](../Contracts/WebConversation.md#profilo-dellimmagine-docker-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Identificazione del browser nella sessione

Quando il client web apre la sessione conversazionale, deve presentarsi al backend con un identificativo di client stabile per quel browser e un nome leggibile, senza richiedere configurazione alla persona.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Indirizzo del backend dalla configurazione di esecuzione

Quando la pagina del client web viene aperta, il client deve ricavare l'indirizzo del backend dalla configurazione di esecuzione servita insieme all'applicazione; se la configurazione manca o non è valida, deve mostrare l'errore di configurazione senza contattare il backend.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Invio del turno sul canale conversazionale

Quando la famiglia invia un turno testuale dal client web, il client deve trasmetterlo al backend come richiesta testuale del protocollo conversazionale `ambrogio.v1`, chiedendo la risposta in testo e indicando la conversazione corrente quando la continua.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/WebConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Lingua dell'interfaccia dalla configurazione

Quando la pagina del client web viene aperta, il client deve mostrare i testi dell'interfaccia nella lingua indicata dalla configurazione di esecuzione oppure, se non indicata, nella lingua supportata preferita dal browser, con l'inglese come ripiego.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Navigazione durante un turno in corso

Mentre un turno è in corso in una conversazione, il client web deve consentire di aprire, creare e continuare altre conversazioni e di aggiornare l'elenco, impedendo soltanto un nuovo invio nella conversazione con il turno in corso fino al suo esito.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Nuova chat iniziale nella barra laterale

All'apertura della pagina, il client web deve aprire una nuova chat locale come conversazione corrente e mostrarla come prima voce della barra laterale; dopo l'invio del primo messaggio, deve usare l'anteprima di quel messaggio come nome della voce e continuare a mostrare la stessa chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione del rifiuto del turno

Quando il client web riceve `turn.rejected` per un turno, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno nella chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione dell'errore dopo l'ammissione

Quando il client web riceve `turn.failed` per un turno ammesso, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno, sostituendo gli eventuali frammenti di risposta già mostrati per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione sanificata delle risposte

Quando il client web mostra una risposta di Ambrogio, deve presentarla come Markdown senza interpretare l'HTML contenuto, senza caricare risorse esterne e rendendo cliccabili soltanto i link con schema ammesso; quando mostra un messaggio della persona o un messaggio di errore, deve presentarlo come testo semplice con gli a capo preservati.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Pubblicazione dell'immagine Docker

Quando viene creato un tag di release `vMAJOR.MINOR.PATCH`, il repository deve pubblicare l'immagine del client web per `linux/amd64` e `linux/arm64` soltanto dopo che CI, scansione dei segreti e verifica di entrambe le immagini sono riuscite.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Repository autonomo del client web

Il client web deve essere sviluppato e versionato nel repository `ambrogio-web`, con workspace Reqvire canonico alla propria radice e decisioni tecniche del client registrate nel proprio modello.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Riconoscimento del completamento della risposta testuale

Quando un turno del client web si conclude, il client deve considerare la risposta completata correttamente soltanto se ha ricevuto `turn.completed` per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Segnalazione locale dell'interruzione della chat

Quando la sessione conversazionale si chiude prima dell'esito di un turno, oppure il backend comunica `turn.interrupted`, il client web deve mostrare lo stato locale «Risposta interrotta» senza trasformare l'interruzione in uno scambio di errore conservato.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Riconoscimento del completamento della risposta testuale](#riconoscimento-del-completamento-della-risposta-testuale)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Rifiuto locale del turno non trasmissibile

Se il testo da inviare è vuoto, composto di soli spazi o supera 64 KiB in UTF-8, il client web deve rifiutarlo con un messaggio senza aprire la sessione né trasmetterlo al backend.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Ripartenza dell'elenco conversazioni dopo un aggiornamento

Quando il client web aggiorna l'elenco delle conversazioni conservate, deve scartare il riferimento alla pagina successiva della consultazione precedente e richiedere la prima pagina dell'elenco corrente.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Scansione dei segreti nella CI

Quando viene eseguito un push su qualunque branch o viene proposta una pull request, la CI del repository deve scansionare con gitleaks l'intera storia Git del client web e deve fallire se rileva un segreto, senza riportarne il valore nell'output.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Separazione del nucleo dall'interfaccia

Il client web deve organizzare il codice per funzionalità e mantenere configurazione, identità, sessione conversazionale, consultazione HTTP e stato di ogni funzionalità in parti TypeScript indipendenti da React e dal DOM, usate dai componenti dell'interfaccia senza dipendere da essi.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Stack del client web

Il client web deve essere un'applicazione a pagina singola in TypeScript e React, costruita in file statici, che in esecuzione non richiede un processo server proprio oltre al server dei file statici.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Stato del turno in elaborazione alla riapertura

Quando la famiglia consulta dal client web una conversazione con un turno testuale accettato il cui esito non è ancora conservato, il client deve mostrare quel turno come «In elaborazione» e invitare ad aggiornare più tardi; a una nuova consultazione dopo la conservazione dell'esito deve mostrare lo scambio concluso.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Vista a due aree della conversazione

Quando la pagina del client web è aperta, il client deve mostrare l'elenco delle conversazioni e la conversazione corrente con il campo di scrittura, mantenendo visibili conversazione e campo di scrittura mentre la persona compone, invia e riceve un turno, anche su schermi stretti.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

