# Elements

### Accessibilità di base dell'interfaccia

Il client web deve essere utilizzabile da tastiera e con un lettore di schermo in tutte le sue funzioni, secondo il profilo di accessibilità di base del client.

#### Details
Alternative: una conformità formale WCAG 2.2 AA (richiede la verifica con strumenti automatici e un controllo manuale); il rinvio dell'accessibilità a una capacità successiva (la chat resta fino ad allora inutilizzabile da tastiera e con lettore di schermo); un avviso breve come «Risposta completata.» per annunciare l'esito (obbliga a cercare la risposta).

Motivo: il profilo di base rende la chat usabile da tastiera e con lettore di schermo e si verifica nei test della schermata, senza dichiarare una conformità formale; leggere direttamente il testo dell'esito non richiede testi aggiuntivi.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [global.css](../../src/app/global.css)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * satisfiedBy: [Composer.tsx](../../src/features/chat/ui/Composer.tsx)
  * satisfiedBy: [Sidebar.tsx](../../src/features/conversations/ui/Sidebar.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Anteprima delle conversazioni nella barra laterale della chat web

Quando la chat web mostra una pagina dell'elenco delle conversazioni nella barra laterale, deve presentare l'anteprima di ogni conversazione visibile e, per una conversazione con lo storico non disponibile, l'identificativo abbreviato nella forma stabilita dalla schermata web della chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * derivedFrom: [Anteprima delle conversazioni nell'elenco dei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#anteprima-delle-conversazioni-nellelenco-dei-client-testuali)
  * satisfiedBy: [conversation-list.ts](../../src/features/conversations/model/conversation-list.ts)
  * satisfiedBy: [Sidebar.tsx](../../src/features/conversations/ui/Sidebar.tsx)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Apertura e continuazione di una conversazione conservata

Quando la persona sceglie una conversazione nella barra laterale, il client web deve mostrarne lo storico ottenuto dall'API HTTP pubblica e inviare i turni successivi in quella conversazione, anche se è iniziata da un altro client.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Audit delle dipendenze nella CI della chat web

Quando la CI della chat web esegue il job `Web client checks`, il job deve eseguire l'audit delle dipendenze della chat web dopo la loro installazione congelata e prima del controllo TypeScript, e deve fallire se l'audit trova una vulnerabilità di gravità alta o critica non elencata fra le eccezioni accettate.

#### Details
Nessuna eccezione è accettata per la chat web: `pnpm-workspace.yaml` non dichiara `auditConfig`.

#### Metadata
  * type: requirement

#### Contract References
  * [Audit delle dipendenze con pnpm](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#audit-delle-dipendenze-con-pnpm)

#### Relations
  * derivedFrom: [Audit delle vulnerabilità delle dipendenze](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#audit-delle-vulnerabilità-delle-dipendenze)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
---

### Chat aperta nell'indirizzo della pagina

Quando la persona apre una conversazione conservata, il client web deve riportarne l'identificativo nell'indirizzo della pagina; quando la pagina viene aperta con l'identificativo di una conversazione, deve mostrare quella conversazione come chat corrente.

#### Details
Alternative: un indirizzo sempre uguale, come all'avvio del client terminale (riporta a «Nuova chat» a ogni ricaricamento e non permette di aprire una conversazione da un link).

Motivo: l'identificativo nel frammento dell'indirizzo conserva la chat aperta al ricaricamento e permette di aprirla da un link, senza librerie di routing né configurazione del server statico.

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
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [main.tsx](../../src/app/main.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Comando di verifica completo della chat web

La chat web deve offrire lo script `verify` di `package.json`, eseguito con `pnpm verify`, che ripete in locale i controlli del job `Web client checks` nell'ordine stabilito dal comando di verifica completo e termina con esito non riuscito al primo controllo fallito.

#### Details
I comandi del punto 5 di «Comando di verifica completo con pnpm», cioè i controlli del job della CI successivi all'installazione delle dipendenze della chat web, sono nell'ordine `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:backend`.

#### Metadata
  * type: requirement

#### Contract References
  * [Comando di verifica completo con pnpm](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#comando-di-verifica-completo-con-pnpm)

#### Relations
  * derivedFrom: [Comando di verifica completo](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#comando-di-verifica-completo)
  * satisfiedBy: [AGENTS.md](../../AGENTS.md)
  * satisfiedBy: [package.json](../../package.json)
---

### Controlli CI del client web

Quando viene eseguito un push sul branch principale, viene proposta una pull request, viene richiesta un'esecuzione manuale oppure un altro workflow del repository la richiama, la CI della chat web deve eseguire nel job `Web client checks` i controlli dell'intero modello sulla cartella di lavoro affiancata, il controllo TypeScript senza emissione, la suite di test, la prova di integrazione con il backend affiancato e la build, e deve fallire se uno di questi controlli fallisce.

#### Details
Il workflow `.github/workflows/ci.yml` esegue il checkout di `ambrogio-web` in `workspace/ambrogio-web`, clona `ambrogio-model` sul branch della modifica se esiste e altrimenti su `main`, scarica gli altri repository con `checkout-workspace` ed esegue `model-checks` sulla cartella `workspace`; installa le dipendenze del backend affiancato in `workspace/ambrogio-backend` e lo compila, dopo aver attivato pnpm con Corepack, con la versione di pnpm che il backend dichiara; nella cartella `workspace/ambrogio-web` installa gitleaks secondo il profilo di scansione dei segreti della chat web e le dipendenze su Node.js 24, esegue l'audit delle dipendenze e poi `pnpm typecheck`, `pnpm test`, che usa il backend simulato locale, `pnpm build` e la prova di integrazione con il backend affiancato (`pnpm test:backend`). Il job dichiara il servizio `postgres` con l'immagine `pgvector/pgvector:pg18`, `POSTGRES_HOST_AUTH_METHOD: trust`, la porta `5432:5432` e un controllo di salute con `pg_isready`, e la variabile `AMBROGIO_TEST_DATABASE_URL` pari a `postgres://postgres@127.0.0.1:5432/postgres`, che la prova di integrazione passa all'ingresso di prova del backend secondo «Comando di verifica completo con pnpm».

#### Metadata
  * type: requirement

#### Contract References
  * [Checkout affiancato dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#checkout-affiancato-dello-spazio-di-lavoro)
  * [Controlli del modello dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-dello-spazio-di-lavoro)
  * [Profilo di installazione delle dipendenze del client web](../Contracts/WebConversation.md#profilo-di-installazione-delle-dipendenze-del-client-web)
  * [Profilo di scansione dei segreti della chat web](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-della-chat-web)

#### Relations
  * derivedFrom: [Controlli CI dei repository di Ambrogio](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-ci-dei-repository-di-ambrogio)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Controlli del modello prima del commit della chat web

Quando si crea un commit in un clone della chat web con gli hook versionati attivi, l'hook `.githooks/pre-commit` del repository deve eseguire, dopo la scansione dei segreti, i controlli dell'intero modello con `model-checks` di `ambrogio-model` affiancato, e deve impedire il commit se i controlli falliscono o se `ambrogio-model` non è affiancato al repository.

#### Metadata
  * type: requirement

#### Contract References
  * [Controlli del modello dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-dello-spazio-di-lavoro)
  * [Controlli del modello nell'hook pre-commit](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-nellhook-pre-commit)

#### Relations
  * derivedFrom: [Controlli del modello prima del commit](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-del-modello-prima-del-commit)
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
---

### Controlli obbligatori prima del merge della chat web

Il repository GitHub della chat web deve proteggere il branch principale con il ruleset della chat web, che richiede i controlli della CI e della scansione dei segreti del repository.

#### Metadata
  * type: requirement

#### Contract References
  * [Ruleset del branch principale](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#ruleset-del-branch-principale)

#### Relations
  * derivedFrom: [Controlli obbligatori prima del merge](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-obbligatori-prima-del-merge)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Controllo dei segreti prima del commit della chat web

Quando si crea un commit in un clone della chat web con gli hook versionati attivi, l'hook `.githooks/pre-commit` del repository deve eseguire il controllo dei segreti secondo il profilo di scansione dei segreti della chat web.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti della chat web](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-della-chat-web)

#### Relations
  * derivedFrom: [Controllo dei segreti prima del commit](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controllo-dei-segreti-prima-del-commit)
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Distribuzione come immagine Docker

Il client web deve essere distribuito come immagine container che serve i file statici dell'applicazione con un processo non privilegiato e riceve la configurazione di esecuzione dall'installazione, senza includerla nell'immagine, costruita da un contesto di build che esclude storia Git, dipendenze installate, risultati di build, configurazioni effettive, modello, test e file d'ambiente.

#### Details
Alternative: la sola pubblicazione di un archivio di file statici (lascia a chi installa la scelta e la configurazione del server web); il servizio dei file da parte del backend sulla stessa origine (evita CORS e `config.json`, ma rende l'interfaccia parte obbligatoria del backend e lega i rilasci dei due repository); Caddy come server statico (di base gira come root); un server Node.js del progetto (più codice da mantenere).

Motivo: un'immagine propria con nginx non privilegiato mantiene il client web un componente facoltativo, come gli altri client, al costo di un container in più e dell'origine del client da aggiungere all'elenco del backend.

Origine: baseline Reqvire «Configuration and data outside the container image», adottata: la chat web non ha dati persistenti; «Minimal container build context», adattata: il contesto non esclude file di database, che la chat web non produce, ed esclude anche configurazioni effettive, workflow, hook e script del repository.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione delle dipendenze del client web](../Contracts/WebConversation.md#profilo-di-installazione-delle-dipendenze-del-client-web)

#### Relations
  * satisfiedBy: [.dockerignore](../../.dockerignore)
  * satisfiedBy: [Dockerfile](../../Dockerfile)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Esiti previsti come valori tipizzati nella chat web

Quando un'operazione del nucleo della chat web prevede un esito negativo nel proprio contratto, deve restituirlo con il tipo `Result` dell'architettura del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Architettura del client web](../Contracts/WebConversation.md#architettura-del-client-web)

#### Relations
  * derivedFrom: [Esiti previsti come valori tipizzati](../../../ambrogio-model/system-model/Requirements/CodeArchitecture.md#esiti-previsti-come-valori-tipizzati)
  * satisfiedBy: [result.ts](../../src/shared/result.ts)
  * specify: [Architettura del codice](../../../ambrogio-model/system-model/Capabilities/Engineering.md#architettura-del-codice)
---

### Header di sicurezza del server statico

Quando il server dei file statici del client web risponde a una richiesta, deve applicare il profilo di header di sicurezza e di cache del client web.

#### Details
Alternative: una Content-Security-Policy generata all'avvio per ammettere solo l'origine del backend (richiede uno script di avvio nel container).

Motivo: con `connect-src` aperto alle origini HTTP(S) e WebSocket la configurazione di nginx resta statica, mentre l'indirizzo del backend si conosce solo a runtime.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [default.conf](../../nginx/default.conf)
  * satisfiedBy: [security-headers.conf](../../nginx/security-headers.conf)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Identificazione del browser nella sessione

Quando il client web apre la sessione conversazionale, deve presentarsi al backend con un identificativo di client stabile per quel browser e un nome leggibile, senza richiedere configurazione alla persona.

#### Details
Alternative: un'identità fissata in `config.json` (tutti i browser della casa diventano indistinguibili); un nome che include il sistema operativo (distingue meglio i dispositivi, ma rivela più dettagli al backend).

Motivo: l'identità per browser distingue i dispositivi senza configurazione, al costo di cambiare quando la persona cancella i dati del sito.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [client-identity.ts](../../src/features/session/model/client-identity.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Indirizzo del backend dalla configurazione di esecuzione

Quando la pagina del client web viene aperta, il client deve ricavare l'indirizzo del backend dalla configurazione di esecuzione servita insieme all'applicazione; se la configurazione manca o non è valida, deve mostrare l'errore di configurazione senza contattare il backend.

#### Details
Alternative: una variabile d'ambiente del container da cui generare `config.json` all'avvio (i file statici non leggono l'ambiente: serve uno script di avvio nel container); la sola stessa origine tramite reverse proxy (nessuna configurazione, ma funziona soltanto dietro un proxy che instrada `/api` al backend).

Motivo: un file di configurazione servito accanto all'applicazione e montato dall'installazione indica qualunque backend senza codice di avvio nel container.

#### Metadata
  * type: requirement

#### Contract References
  * [Controllo dell'origine all'apertura della sessione](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#controllo-dellorigine-allapertura-della-sessione)
  * [Politica CORS del componente HTTP](../../../ambrogio-backend/system-model/Contracts/ServerFoundation.md#politica-cors-del-componente-http)

#### Relations
  * satisfiedBy: [.gitignore](../../.gitignore)
  * satisfiedBy: [App.tsx](../../src/app/App.tsx)
  * satisfiedBy: [runtime-config.ts](../../src/features/configuration/model/runtime-config.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Installazione riproducibile delle dipendenze

Quando si installano le dipendenze del client web, in sviluppo, nella CI o nella build dell'immagine, l'installazione deve usare il gestore di pacchetti e il lockfile fissati dal repository senza modificarne le versioni, con ogni dipendenza diretta dichiarata con una versione esatta, deve impedire gli script di build delle dipendenze non ammesse esplicitamente e deve applicare l'attesa minima di pnpm per le versioni appena pubblicate.

#### Details
Un lockfile aggiornato durante l'installazione o uno script di build eseguito senza un'ammissione esplicita introducono nel client codice diverso da quello revisionato.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione con pnpm e Corepack](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-installazione-con-pnpm-e-corepack)

#### Relations
  * derivedFrom: [Installazione delle dipendenze con pnpm attivato da Corepack](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#installazione-delle-dipendenze-con-pnpm-attivato-da-corepack)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [Dockerfile](../../Dockerfile)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [pnpm-lock.yaml](../../pnpm-lock.yaml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
---

### Invio del turno dalla chat web

Quando la famiglia invia un turno dalla chat web, la chat web deve trasmetterlo sull'unica sessione `ambrogio.v1` della pagina, secondo la sessione `ambrogio.v1` del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Errori ed estensioni del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#errori-ed-estensioni-del-protocollo-ambrogio-v1)
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Schema JSON del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#schema-json-del-protocollo-ambrogio-v1)
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Trasmissione in ingresso del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-ingresso-del-protocollo-ambrogio-v1)
  * [Trasmissione in uscita del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-uscita-del-protocollo-ambrogio-v1)

#### Relations
  * derivedFrom: [Invio del turno testuale sul canale conversazionale](../../../ambrogio-model/system-model/Requirements/TextConversation.md#invio-del-turno-testuale-sul-canale-conversazionale)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Istruzioni per gli agenti della chat web

Le istruzioni per gli agenti del repository devono applicare al lavoro nel repository le regole di processo di `ambrogio-model`, rimandando a `ambrogio-model/AGENTS.md` per le regole comuni e aggiungendo soltanto le indicazioni proprie del repository.

#### Metadata
  * type: requirement

#### Relations
  * derivedFrom: [Ordine di lavoro guidato dal modello](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#ordine-di-lavoro-guidato-dal-modello)
  * satisfiedBy: [AGENTS.md](../../AGENTS.md)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Lingua dell'interfaccia dalla configurazione

Quando la pagina del client web viene aperta, il client deve mostrare i testi dell'interfaccia nella lingua indicata dalla configurazione di esecuzione oppure, se non indicata, nella lingua supportata preferita dal browser, con l'inglese come ripiego.

#### Details
Alternative: una lingua predefinita fissa, italiana o inglese, quando `language` manca (chi non configura il campo riceve una lingua diversa da quella del proprio browser).

Motivo: seguire il browser è più comodo per chi non configura il campo, al costo di mostrare lingue diverse su dispositivi diversi della stessa installazione.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [dictionaries.ts](../../src/shared/i18n/dictionaries.ts)
  * satisfiedBy: [dictionary.ts](../../src/shared/i18n/dictionary.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Navigazione durante un turno in corso

Mentre un turno è in corso in una conversazione, il client web deve consentire di aprire, creare e continuare altre conversazioni e di aggiornare l'elenco, impedendo soltanto un nuovo invio nella conversazione con il turno in corso fino al suo esito.

#### Details
Il client raffina la regola del protocollo per i client con lo stato di ciascuna chat della pagina: dall'invio fino all'esito del turno il pulsante di invio di quella chat è disabilitato e `Invio` nel campo di scrittura non invia, mentre il campo resta modificabile; le altre chat restano inviabili sulla stessa sessione `ambrogio.v1`.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Disabilitazione degli ingressi durante un turno](../../../ambrogio-backend/system-model/Requirements/FamilyConversation.md#disabilitazione-degli-ingressi-durante-un-turno)
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Nessun ciclo di import nella chat web

Il grafo degli import dei file TypeScript di `src/` e di `test/` della chat web, compresi gli import di soli tipi e le riesportazioni, non deve contenere cicli, e la suite di test deve rifiutare ogni ciclo con la regola `no-circular-imports`, riportandone il percorso.

#### Details
Il client raffina il requisito comune con la stessa estrazione testuale degli specificatori usata dalle altre regole di architettura della chat web: uno specificatore relativo è un arco verso il file TypeScript del repository con lo stesso percorso, con `.ts` o `.tsx` aggiunto o al posto di `.js`, oppure verso il suo `index.ts` o `index.tsx`; i package e i file non TypeScript, come i fogli di stile, non sono archi. Ogni ciclo elementare è riportato una volta, come `no-circular-imports: <modulo> -> … -> <modulo>` a partire dal modulo primo in ordine alfabetico. La fixture negativa `test/repository/fixtures/import-cycles.txt` contiene un ciclo fra moduli dello stesso layer, uno di soli tipi e riesportazioni e uno più lungo nella stessa cartella chiuso da un import di soli tipi.

#### Metadata
  * type: requirement

#### Relations
  * derivedFrom: [Nessun ciclo di import](../../../ambrogio-model/system-model/Requirements/CodeArchitecture.md#nessun-ciclo-di-import)
  * satisfiedBy: [architecture.test.ts](../../test/repository/architecture.test.ts)
---

### Nuova chat iniziale della chat web

All'apertura della pagina, la chat web deve mostrare la nuova chat locale come voce «Nuova chat» in cima alla barra laterale, secondo la schermata web della chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * derivedFrom: [Nuova chat iniziale nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#nuova-chat-iniziale-nei-client-testuali)
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [chat-state.ts](../../src/features/chat/model/chat-state.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione degli errori HTTP nella chat web

Quando una lettura dell'elenco o dello storico dall'API HTTP `v1` del backend riceve una risposta d'errore, la chat web deve presentare il testo «Conversazione inesistente» dell'interfaccia per il tipo `/problems/conversation-not-found` e il testo «Errore HTTP del backend», con lo stato HTTP, per ogni altro tipo o per una risposta d'errore che non è un Problem Details, senza mostrare `title` o `detail` del backend.

#### Details
Il tipo si legge soltanto dal membro `type` del corpo `application/problem+json`; la lingua del testo è quella dell'interfaccia, indipendente dalla lingua configurata nel backend.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Catalogo dei problemi di protocollo HTTP](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#catalogo-dei-problemi-di-protocollo-http)
  * [Forma dei Problem Details dell'API HTTP](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#forma-dei-problem-details-dellapi-http)
  * [Versioni dell'API HTTP pubblica](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#versioni-dellapi-http-pubblica)
  * [Lingue dell'interfaccia del client web](../Contracts/WebConversation.md#lingue-dellinterfaccia-del-client-web)

#### Relations
  * derivedFrom: [Interpretazione degli errori HTTP per tipo da parte del client](../../../ambrogio-backend/system-model/Requirements/HttpApi.md#interpretazione-degli-errori-http-per-tipo-da-parte-del-client)
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * satisfiedBy: [conversations-api.ts](../../src/features/conversations/model/conversations-api.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione del rifiuto del turno nella chat web

Quando la chat web riceve `turn.rejected` per un turno, deve mostrare nella chat il messaggio pubblico contenuto in `message` come esito di errore del turno, secondo la sessione `ambrogio.v1` del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Motivi di rifiuto del turno](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#motivi-di-rifiuto-del-turno)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Presentazione del rifiuto del turno da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#presentazione-del-rifiuto-del-turno-da-parte-del-client)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione dell'errore dopo l'ammissione nella chat web

Quando la chat web riceve `turn.failed` per un turno ammesso, deve mostrare nella chat il messaggio pubblico contenuto in `message` come esito di errore del turno, secondo la sessione `ambrogio.v1` del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Presentazione dell'errore dopo l'ammissione da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#presentazione-dellerrore-dopo-lammissione-da-parte-del-client)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione sanificata delle risposte

Quando il client web mostra una risposta di Ambrogio, deve presentarla come Markdown senza interpretare l'HTML contenuto, senza caricare risorse esterne e rendendo cliccabili soltanto i link con schema ammesso; quando mostra un messaggio della persona o un messaggio di errore, deve presentarlo come testo semplice con gli a capo preservati.

#### Details
Alternative: tutte le risposte come testo semplice, come nel client terminale (nessuna dipendenza, ma elenchi e grassetti restano simboli); `markdown-it` con DOMPurify (richiede `innerHTML` e due librerie da mantenere allineate); il caricamento delle immagini remote (la pagina contatta server esterni scelti dal testo prodotto dal modello e la Content-Security-Policy si allarga); i messaggi della persona come Markdown (non restano come la persona li ha scritti).

Motivo: `react-markdown` con `remark-gfm` rende la formattazione delle risposte come elementi React, senza `innerHTML` e senza risorse esterne.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [AnswerMarkdown.tsx](../../src/features/chat/ui/AnswerMarkdown.tsx)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Privilegi minimi dei workflow GitHub Actions

I workflow GitHub Actions della chat web devono seguire il profilo di sicurezza dei workflow GitHub Actions della chat web e impedire che due pubblicazioni dello stesso tag si sovrappongano.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo comune dei workflow GitHub Actions](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-comune-dei-workflow-github-actions)

#### Relations
  * derivedFrom: [Workflow GitHub Actions con privilegi e durata limitati](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#workflow-github-actions-con-privilegi-e-durata-limitati)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [publish-image.yml](../../.github/workflows/publish-image.yml)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Pubblicazione dell'immagine Docker

Quando viene creato un tag di release `vMAJOR.MINOR.PATCH`, il repository deve pubblicare l'immagine della chat web per `linux/amd64` e `linux/arm64` soltanto dopo che CI, scansione dei segreti e verifica di entrambe le immagini sono riuscite.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo dell'immagine Docker del client web](../Contracts/WebConversation.md#profilo-dellimmagine-docker-del-client-web)
  * [Profilo di scansione dei segreti della chat web](../Contracts/WebConversation.md#profilo-di-scansione-dei-segreti-della-chat-web)
  * [Profilo di sicurezza dei workflow GitHub Actions](../Contracts/WebConversation.md#profilo-di-sicurezza-dei-workflow-github-actions)

#### Relations
  * derivedFrom: [Pubblicazione delle immagini di release](../../../ambrogio-model/system-model/Requirements/HomelabInstallation.md#pubblicazione-delle-immagini-di-release)
  * satisfiedBy: [publish-image.yml](../../.github/workflows/publish-image.yml)
  * specify: [Installazione nell'homelab](../../../ambrogio-model/system-model/Capabilities/Engineering.md#installazione-nellhomelab)
---

### Riconoscimento del completamento della risposta nella chat web

Quando un turno della chat web si conclude, la chat web deve considerare la risposta completata correttamente soltanto se ha ricevuto `turn.completed` per quel turno, secondo la sessione `ambrogio.v1` del client web.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Trasmissione in uscita del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-uscita-del-protocollo-ambrogio-v1)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Riconoscimento dell'esito riuscito del turno da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#riconoscimento-dellesito-riuscito-del-turno-da-parte-del-client)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Rifiuto locale del turno non trasmissibile

Quando la persona invia dalla chat web un testo che supera 64 KiB in UTF-8, oppure un testo vuoto o composto di soli spazi, la chat web deve rifiutarlo con il messaggio corrispondente dell'interfaccia, senza aprire la sessione conversazionale.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Rifiuto locale del turno testuale non trasmissibile](../../../ambrogio-model/system-model/Requirements/TextConversation.md#rifiuto-locale-del-turno-testuale-non-trasmissibile)
  * satisfiedBy: [Composer.tsx](../../src/features/chat/ui/Composer.tsx)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Ripartenza dell'elenco conversazioni della chat web

Quando la persona sceglie «Aggiorna» nella chat web, la chat web deve richiedere la prima pagina dell'elenco delle conversazioni e ricaricare lo storico della chat corrente.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * derivedFrom: [Ripartenza dell'elenco conversazioni dei client testuali dopo un aggiornamento](../../../ambrogio-model/system-model/Requirements/TextConversation.md#ripartenza-dellelenco-conversazioni-dei-client-testuali-dopo-un-aggiornamento)
  * satisfiedBy: [conversation-list.ts](../../src/features/conversations/model/conversation-list.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Scansione dei segreti nella CI della chat web

La CI della chat web deve scansionare l'intera storia Git del repository nel job `Gitleaks` di `.github/workflows/secret-scan.yml`, secondo il profilo di scansione dei segreti della chat web.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti con gitleaks](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-scansione-dei-segreti-con-gitleaks)
  * [Profilo di sicurezza dei workflow GitHub Actions](../Contracts/WebConversation.md#profilo-di-sicurezza-dei-workflow-github-actions)

#### Relations
  * derivedFrom: [Scansione dei segreti nella CI](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#scansione-dei-segreti-nella-ci)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Segnalazione locale dell'interruzione della chat

Quando la sessione conversazionale si chiude prima dell'esito di un turno, oppure il backend comunica `turn.interrupted`, la chat web deve mostrare per quel turno il testo «Risposta interrotta» del dizionario dell'interfaccia.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Lingue dell'interfaccia del client web](../Contracts/WebConversation.md#lingue-dellinterfaccia-del-client-web)
  * [Sessione ambrogio.v1 del client web](../Contracts/WebConversation.md#sessione-ambrogiov1-del-client-web)

#### Relations
  * derivedFrom: [Segnalazione locale dell'interruzione nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#segnalazione-locale-dellinterruzione-nei-client-testuali)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Separazione del nucleo dall'interfaccia

Il client web deve organizzare il codice per funzionalità e mantenere configurazione, identità, sessione conversazionale, consultazione HTTP e stato di ogni funzionalità in parti TypeScript indipendenti da React e dal DOM, usate dai componenti dell'interfaccia senza dipendere da essi.

#### Details
Alternative per la struttura: la divisione per natura tecnica in nucleo, interfaccia e lingue o l'organizzazione per tipo tecnico tipica dei progetti React (semplici finché l'applicazione è piccola, ma con ogni funzionalità sparsa su più cartelle); Feature-Sliced Design (rigorosa ma sovradimensionata per una sola pagina); l'architettura esagonale di backend e satellite (sproporzionata per un'interfaccia).

Alternative per lo stato e gli stili: Zustand o TanStack Query (librerie di stato in più rispetto ai reducer puri collegati con `useReducer` e un contesto React); un unico foglio di stile globale o Tailwind CSS per gli stili dei componenti (stili non più accanto al componente che li usa).

Motivo: le fette verticali tengono insieme logica e interfaccia di ogni funzionalità e rendono semplice aggiungerne di nuove; le parti `model/` pure conservano la logica del protocollo e dei turni paralleli provabile senza browser, al costo di passare esplicitamente le API del browser e di collegare le funzionalità soltanto in `src/app/`.

Origine: baseline Reqvire «No generic sharing packages without a recorded decision», adattata: la regola riguarda le cartelle del client web, che non ha package; `src/shared/` è la cartella comune a più funzionalità registrata in «Architettura del client web».

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [browser.ts](../../src/app/browser.ts)
  * satisfiedBy: [main.tsx](../../src/app/main.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

### Stack del client web

Il client web deve essere un'applicazione a pagina singola in TypeScript e React, costruita in file statici, che in esecuzione non richiede un processo server proprio oltre al server dei file statici.

#### Details
Alternative: Svelte (bundle più piccolo, ma ecosistema meno diffuso); TypeScript senza framework (nessuna dipendenza di runtime, ma più codice manuale per lo stato dell'interfaccia).

Alternative per le traduzioni: i18next con react-i18next (più completa, ma sproporzionata per poche decine di testi).

Motivo: React offre l'ecosistema più diffuso e rende semplice gestire barra laterale, risposta progressiva e paginazione, al costo di un bundle più grande, irrilevante per un'applicazione domestica servita in rete locale.

Origine: baseline Reqvire «Strict TypeScript compilation», adottata.

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

### Stato del turno in elaborazione alla riapertura nella chat web

Quando la chat web mostra un turno in elaborazione alla consultazione di una conversazione, deve presentarlo con il testo «In elaborazione» del dizionario dell'interfaccia, che invita ad aggiornare più tardi, e deve mostrare un turno interrotto con il testo «Risposta interrotta».

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Stati persistenti dei turni conversazionali](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#stati-persistenti-dei-turni-conversazionali)
  * [Stati del turno testuale alla riapertura](../../../ambrogio-model/system-model/Contracts/TextConversation.md#stati-del-turno-testuale-alla-riapertura)
  * [Lingue dell'interfaccia del client web](../Contracts/WebConversation.md#lingue-dellinterfaccia-del-client-web)
  * [Schermata web della chat](../Contracts/WebConversation.md#schermata-web-della-chat)

#### Relations
  * derivedFrom: [Stato del turno in elaborazione alla riapertura nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#stato-del-turno-in-elaborazione-alla-riapertura-nei-client-testuali)
  * satisfiedBy: [ChatPanel.tsx](../../src/features/chat/ui/ChatPanel.tsx)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Uso delle sole interfacce pubbliche del backend nella chat web

Quando la chat web comunica con il backend, deve usare soltanto il protocollo `ambrogio.v1` e le API HTTP pubbliche definite dai contratti del backend, e il suo codice di produzione non deve importare codice del backend.

#### Metadata
  * type: requirement

#### Contract References
  * [Schema JSON del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#schema-json-del-protocollo-ambrogio-v1)
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Ingresso di prova del server conversazionale](../../../ambrogio-backend/system-model/Contracts/ServerFoundation.md#ingresso-di-prova-del-server-conversazionale)

#### Relations
  * derivedFrom: [Uso delle sole interfacce pubbliche del backend](../../../ambrogio-model/system-model/Requirements/CodeArchitecture.md#uso-delle-sole-interfacce-pubbliche-del-backend)
  * satisfiedBy: [conversations-api.ts](../../src/features/conversations/model/conversations-api.ts)
  * satisfiedBy: [conversation-session.ts](../../src/features/session/model/conversation-session.ts)
  * specify: [Architettura del codice](../../../ambrogio-model/system-model/Capabilities/Engineering.md#architettura-del-codice)
---

### Vista a due aree della conversazione

Quando la pagina del client web è aperta, il client deve mostrare l'elenco delle conversazioni e la conversazione corrente con il campo di scrittura, mantenendo visibili conversazione e campo di scrittura mentre la persona compone, invia e riceve un turno, anche su schermi stretti.

#### Details
Alternative: bloccare invio, navigazione e aggiornamento durante un turno (più semplice, ma impedisce di consultare o usare altre conversazioni mentre una risposta è lenta).

Alternative per i colori: un solo tema chiaro (meno stili, ma senza rispettare la preferenza del dispositivo).

Motivo: la navigazione libera sfrutta l'elaborazione parallela di conversazioni diverse garantita dal backend, al costo di conservare nella pagina lo stato di più turni contemporanei.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ChatApplication.module.css](../../src/app/ChatApplication.module.css)
  * satisfiedBy: [ChatApplication.tsx](../../src/app/ChatApplication.tsx)
  * specify: [Conversazione testuale nel browser](../Capabilities/WebConversation.md#conversazione-testuale-nel-browser)
---

