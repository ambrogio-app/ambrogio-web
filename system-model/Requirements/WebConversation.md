# Elements

### Accessibilità di base dell'interfaccia

Il client web deve essere utilizzabile da tastiera e con un lettore di schermo in tutte le sue funzioni, secondo il profilo di accessibilità di base del client.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [global.css](../../src/app/global.css)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * satisfiedBy: [Composer.tsx](../../src/features/chat/ui/Composer.tsx)
  * satisfiedBy: [Sidebar.tsx](../../src/features/conversations/ui/Sidebar.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Anteprima delle conversazioni nella barra laterale

Quando il client web mostra una pagina dell'elenco conversazioni, deve presentare per ogni conversazione visibile un'anteprima del primo messaggio della persona ottenuta dallo storico HTTP pubblico; se uno storico non è disponibile, deve mantenere selezionabile la conversazione mostrando un identificativo abbreviato.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * satisfiedBy: [conversation-list.ts](../../src/features/conversations/model/conversation-list.ts)
  * satisfiedBy: [Sidebar.tsx](../../src/features/conversations/ui/Sidebar.tsx)
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
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Chat aperta nell'indirizzo della pagina

Quando la persona apre una conversazione conservata, il client web deve riportarne l'identificativo nell'indirizzo della pagina; quando la pagina viene aperta con l'identificativo di una conversazione, deve mostrare quella conversazione come chat corrente.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-address.ts](../../src/features/chat/model/chat-address.ts)
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
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [main.tsx](../../src/app/main.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Compatibilità con l'API conversazionale del backend

Quando il client web comunica con il backend Ambrogio, deve usare il protocollo conversazionale e le API HTTP pubbliche della versione di backend dichiarata come dipendenza, senza accedere ai file o ai moduli interni del server.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [conversations-api.ts](../../src/features/conversations/model/conversations-api.ts)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controlli CI del client web

Quando viene eseguito un push sul branch principale, viene proposta una pull request, viene richiesta un'esecuzione manuale oppure un altro workflow del repository la richiama, la CI del client web deve eseguire la validazione e il lint del modello Reqvire, il controllo TypeScript senza emissione, la suite di test e la build, e deve fallire se uno di questi controlli fallisce.

#### Details
Il workflow `.github/workflows/ci.yml` installa pnpm e le dipendenze su Node.js 24 ed esegue, in quest'ordine, Reqvire 1.3.2 `validate` e `lint`, con il lint che fallisce se restano correzioni automatiche o elementi da rivedere; lo script di integrità del modello; `pnpm typecheck`; `pnpm test`, che usa il backend simulato locale; `pnpm build`. La prova di integrazione contro la revisione backend fissata (`pnpm test:backend`) richiede un checkout del backend e resta fuori dalla CI.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione delle dipendenze del client web](../Contracts/WebConversation.md#profilo-di-installazione-delle-dipendenze-del-client-web)

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controlli obbligatori prima del merge

Quando una modifica viene integrata nel branch principale, il repository GitHub deve accettarla soltanto tramite una pull request i cui controlli della CI e scansione dei segreti sono superati, e deve rifiutare il push diretto, la riscrittura forzata e la cancellazione del branch principale.

#### Details
La regola vale per chiunque, amministratori compresi: ogni modifica passa da un branch e da una pull request, così che CI e scansione dei segreti precedano sempre l'integrazione.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controllo automatico dell'integrità del modello

Quando la CI del repository esegue la validazione e il lint del modello Reqvire, deve eseguire anche lo script di integrità del modello e deve fallire se lo script segnala una violazione o non riesce a eseguire.

#### Details
Il controllo copre le regole di integrità verificabili sul testo e sui file; `validate` e `lint` di Reqvire non le controllano.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [check-model.mjs](../../scripts/check-model.mjs)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Controllo dei segreti prima del commit

Quando si crea un commit in un clone del repository con gli hook versionati attivi, il controllo pre-commit deve scansionare con gitleaks le modifiche in staging e deve impedire il commit se rileva un segreto oppure se gitleaks non è disponibile.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti con gitleaks](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-con-gitleaks)

#### Relations
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Decisioni sostituite rimosse nella stessa modifica

Quando una decisione ne sostituisce un'altra, la modifica che registra la nuova decisione deve aggiornare o rimuovere ogni requisito, contratto e verifica che afferma la decisione sostituita, e i testi di requisiti, contratti e verifiche non devono riportare date, storia delle decisioni o esiti di esecuzioni.

#### Details
Il modello descrive gli obblighi validi oggi e come verificarli; la storia è conservata da Git. Decisioni datate accumulate nei contratti convivono con elementi che affermano ancora le decisioni sostituite. Gli esiti dei test sono dati dalla CI; l'esito di una verifica manuale si registra nel messaggio del commit o nella pull request che la esegue, non nel modello.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/WebConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Dipendenze fra contratti dichiarate come riferimenti

Quando il contenuto di un contratto dipende da un contratto posseduto da un altro requisito, il requisito proprietario del contratto dipendente deve dichiarare una Contract Reference al contratto da cui dipende, e il contratto dipendente non deve ripetere il contenuto di quel contratto.

#### Details
Le Contract References propagano l'analisi di impatto: una modifica del contratto riferito segnala il contratto dipendente per la revisione. Un contratto che ripete un fatto posseduto da un altro requisito resta invariato quando quel fatto cambia, e il modello finisce per contraddirsi senza che l'analisi di impatto lo segnali.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Distribuzione come immagine Docker

Il client web deve essere distribuito come immagine container che serve i file statici dell'applicazione con un processo non privilegiato e riceve la configurazione di esecuzione dall'installazione, senza includerla nell'immagine.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione delle dipendenze del client web](../Contracts/WebConversation.md#profilo-di-installazione-delle-dipendenze-del-client-web)

#### Relations
  * satisfiedBy: [.dockerignore](../../.dockerignore)
  * satisfiedBy: [Dockerfile](../../Dockerfile)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Esiti previsti come valori tipizzati

Quando un'operazione del nucleo del client web prevede un esito negativo nel proprio contratto, deve rappresentarlo come valore tipizzato distinguibile dal successo, riservando le eccezioni ai guasti inattesi.

#### Metadata
  * type: requirement

#### Contract References
  * [Architettura del client web](../Contracts/WebConversation.md#architettura-del-client-web)

#### Relations
  * satisfiedBy: [result.ts](../../src/shared/result.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### File di governo collegati al modello

Ogni workflow di CI, hook Git, file di build del container, esempio Compose, file di esclusione, configurazione del gestore di pacchetti, del compilatore o del runner di test e script del repository deve essere riferito da almeno un requisito o una verifica del modello.

#### Details
Un file che codifica decisioni ingegneristiche senza un collegamento al modello cambia senza che alcun obbligo lo segnali, e le decisioni presenti solo nei file divergono fra file simili, per esempio fra i workflow di controllo e quello di pubblicazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/WebConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Formulazione normativa degli obblighi

Gli enunciati dei requisiti e i testi dei contratti devono esprimere gli obblighi con «deve» o «devono» e non devono usare `può`, `possono`, `potrebbe`, `potrebbero`, `dovrebbe`, `dovrebbero` o `eventualmente`; un'opzione lasciata a una parte deve essere espressa nominando la parte che sceglie.

#### Details
Il testo in code span, i messaggi citati e i nomi di elementi tra «» non sono formulazione dell'obbligo. Le sezioni Details dei requisiti sono indicazioni e non vengono controllate. Una formula permissiva rende ambiguo se il comportamento è obbligatorio, facoltativo o scelto da qualcuno, e il codice e il modello finiscono per darne letture diverse.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/WebConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Header di sicurezza del server statico

Quando il server dei file statici del client web risponde a una richiesta, deve applicare il profilo di header di sicurezza e di cache del client web.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [default.conf](../../nginx/default.conf)
  * satisfiedBy: [security-headers.conf](../../nginx/security-headers.conf)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Identificazione del browser nella sessione

Quando il client web apre la sessione conversazionale, deve presentarsi al backend con un identificativo di client stabile per quel browser e un nome leggibile, senza richiedere configurazione alla persona.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [client-identity.ts](../../src/features/session/model/client-identity.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Indirizzo del backend dalla configurazione di esecuzione

Quando la pagina del client web viene aperta, il client deve ricavare l'indirizzo del backend dalla configurazione di esecuzione servita insieme all'applicazione; se la configurazione manca o non è valida, deve mostrare l'errore di configurazione senza contattare il backend.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [.gitignore](../../.gitignore)
  * satisfiedBy: [App.tsx](../../src/app/App.tsx)
  * satisfiedBy: [runtime-config.ts](../../src/features/configuration/model/runtime-config.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Installazione riproducibile delle dipendenze

Quando si installano le dipendenze del client web, in sviluppo, nella CI o nella build dell'immagine, l'installazione deve usare il gestore di pacchetti e il lockfile fissati dal repository senza modificarne le versioni e deve impedire gli script di build delle dipendenze non ammesse esplicitamente.

#### Details
Un lockfile aggiornato durante l'installazione o uno script di build eseguito senza un'ammissione esplicita introducono nel client codice diverso da quello revisionato.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [Dockerfile](../../Dockerfile)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [pnpm-lock.yaml](../../pnpm-lock.yaml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Invio del turno sul canale conversazionale

Quando la famiglia invia un turno testuale dal client web, il client deve trasmetterlo al backend come richiesta testuale del protocollo conversazionale `ambrogio.v1`, chiedendo la risposta in testo e indicando la conversazione corrente quando la continua.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/WebConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Lingua dell'interfaccia dalla configurazione

Quando la pagina del client web viene aperta, il client deve mostrare i testi dell'interfaccia nella lingua indicata dalla configurazione di esecuzione oppure, se non indicata, nella lingua supportata preferita dal browser, con l'inglese come ripiego.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [dictionaries.ts](../../src/shared/i18n/dictionaries.ts)
  * satisfiedBy: [dictionary.ts](../../src/shared/i18n/dictionary.ts)
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
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Nuova chat iniziale nella barra laterale

All'apertura della pagina, il client web deve aprire una nuova chat locale come conversazione corrente e mostrarla come prima voce della barra laterale; dopo l'invio del primo messaggio, deve usare l'anteprima di quel messaggio come nome della voce e continuare a mostrare la stessa chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione del rifiuto del turno

Quando il client web riceve `turn.rejected` per un turno, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno nella chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione dell'errore dopo l'ammissione

Quando il client web riceve `turn.failed` per un turno ammesso, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno, sostituendo gli eventuali frammenti di risposta già mostrati per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Presentazione sanificata delle risposte

Quando il client web mostra una risposta di Ambrogio, deve presentarla come Markdown senza interpretare l'HTML contenuto, senza caricare risorse esterne e rendendo cliccabili soltanto i link con schema ammesso; quando mostra un messaggio della persona o un messaggio di errore, deve presentarlo come testo semplice con gli a capo preservati.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [AnswerMarkdown.tsx](../../src/features/chat/ui/AnswerMarkdown.tsx)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Privilegi minimi dei workflow GitHub Actions

I workflow GitHub Actions del repository devono concedere a ogni job soltanto i permessi del token necessari, eseguire azioni esterne fissate al commit, limitare la durata di ogni job, non conservare le credenziali del checkout e impedire che due pubblicazioni dello stesso tag si sovrappongano.

#### Details
Un'azione indicata con un tag mobile o un token con permessi ampi espone il repository e il registro delle immagini a codice di terzi modificato dopo l'adozione.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [publish-image.yml](../../.github/workflows/publish-image.yml)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Pubblicazione dell'immagine Docker

Quando viene creato un tag di release `vMAJOR.MINOR.PATCH`, il repository deve pubblicare l'immagine del client web per `linux/amd64` e `linux/arm64` soltanto dopo che CI, scansione dei segreti e verifica di entrambe le immagini sono riuscite.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo dell'immagine Docker del client web](../Contracts/WebConversation.md#profilo-dellimmagine-docker-del-client-web)
  * [Profilo di scansione dei segreti con gitleaks](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-con-gitleaks)
  * [Profilo di sicurezza dei workflow GitHub Actions](../Contracts/WebConversation.md#profilo-di-sicurezza-dei-workflow-github-actions)

#### Relations
  * satisfiedBy: [publish-image.yml](../../.github/workflows/publish-image.yml)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Repository autonomo del client web

Il client web deve essere sviluppato e versionato nel repository `ambrogio-web`, con workspace Reqvire canonico alla propria radice e decisioni tecniche del client registrate nel proprio modello.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [README.md](../../README.md)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Riconoscimento del completamento della risposta testuale

Quando un turno del client web si conclude, il client deve considerare la risposta completata correttamente soltanto se ha ricevuto `turn.completed` per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
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
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Rifiuto locale del turno non trasmissibile

Se il testo da inviare è vuoto, composto di soli spazi o supera 64 KiB in UTF-8, il client web deve rifiutarlo con un messaggio senza aprire la sessione né trasmetterlo al backend.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * satisfiedBy: [Composer.tsx](../../src/features/chat/ui/Composer.tsx)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Ripartenza dell'elenco conversazioni dopo un aggiornamento

Quando il client web aggiorna l'elenco delle conversazioni conservate, deve scartare il riferimento alla pagina successiva della consultazione precedente e richiedere la prima pagina dell'elenco corrente.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * satisfiedBy: [conversation-list.ts](../../src/features/conversations/model/conversation-list.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Scansione dei segreti nella CI

Quando viene eseguito un push su qualunque branch o viene proposta una pull request, la CI del repository deve scansionare con gitleaks l'intera storia Git del client web e deve fallire se rileva un segreto, senza riportarne il valore nell'output.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di sicurezza dei workflow GitHub Actions](../Contracts/WebConversation.md#profilo-di-sicurezza-dei-workflow-github-actions)

#### Relations
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Separazione del nucleo dall'interfaccia

Il client web deve organizzare il codice per funzionalità e mantenere configurazione, identità, sessione conversazionale, consultazione HTTP e stato di ogni funzionalità in parti TypeScript indipendenti da React e dal DOM, usate dai componenti dell'interfaccia senza dipendere da essi.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [browser.ts](../../src/app/browser.ts)
  * satisfiedBy: [main.tsx](../../src/app/main.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Stack del client web

Il client web deve essere un'applicazione a pagina singola in TypeScript e React, costruita in file statici, che in esecuzione non richiede un processo server proprio oltre al server dei file statici.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione delle dipendenze del client web](../Contracts/WebConversation.md#profilo-di-installazione-delle-dipendenze-del-client-web)

#### Relations
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [tsconfig.json](../../tsconfig.json)
  * satisfiedBy: [vite.config.ts](../../vite.config.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Stato del turno in elaborazione alla riapertura

Quando la famiglia consulta dal client web una conversazione con un turno testuale accettato il cui esito non è ancora conservato, il client deve mostrare quel turno come «In elaborazione» e invitare ad aggiornare più tardi; a una nuova consultazione dopo la conservazione dell'esito deve mostrare lo scambio concluso.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Verifiche manuali giustificate

Ogni verifica di ispezione, analisi o dimostrazione deve indicare il motivo per cui non è automatizzabile, in una frase che inizia con «Non automatizzabile:».

#### Details
Una verifica automatizzabile è una verifica di test. Reqvire registra che una verifica esiste, non che sia stata eseguita: una verifica manuale non ripetuta dopo una modifica lascia passare una violazione del requisito.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/WebConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Vista a due aree della conversazione

Quando la pagina del client web è aperta, il client deve mostrare l'elenco delle conversazioni e la conversazione corrente con il campo di scrittura, mantenendo visibili conversazione e campo di scrittura mentre la persona compone, invia e riceve un turno, anche su schermi stretti.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ChatApplication.module.css](../../src/app/ChatApplication.module.css)
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

