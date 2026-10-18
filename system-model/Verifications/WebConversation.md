# Elements

### Verifica del client web

Raggruppa le prove del comportamento del client web, della sua integrazione con il backend e della sua distribuzione.

#### Metadata
  * type: verification-objective
---

### Analisi dell'architettura del client web

Esaminare gli import di `src/features/`, `src/shared/` e `src/app/`, le firme delle operazioni del nucleo con esiti negativi previsti, i nomi dei file e la struttura di `test/`.

#### Details
L'analisi passa se nessuna parte `model/` né il codice non React di `src/shared/` importa React o parti `ui/` o usa `document` o `window`, nessuna funzionalità importa un'altra funzionalità, soltanto `src/app/` collega più funzionalità e fornisce le API del browser come dipendenze, lo stato di ogni funzionalità è un reducer puro nella sua parte `model/`, le operazioni con esiti negativi previsti restituiscono `Result` con varianti distinte da `kind`, i nomi dei file seguono le convenzioni del contratto e `test/` rispecchia la struttura di `src/`. Fallisce se una di queste regole è violata.

#### Metadata
  * type: analysis-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Esiti previsti come valori tipizzati](../Requirements/WebConversation.md#esiti-previsti-come-valori-tipizzati)
  * verify: [Separazione del nucleo dall'interfaccia](../Requirements/WebConversation.md#separazione-del-nucleo-dallinterfaccia)
---

### Analisi della compatibilità con il backend

Esaminare la revisione di backend dichiarata nel contratto sorgente e confrontare i messaggi `ambrogio.v1` inviati e interpretati dal client, gli esiti e i rifiuti, l'elenco e lo storico con i contratti pubblici e lo schema del protocollo a quella revisione, e con l'esito della prova di integrazione.

#### Details
L'analisi passa se la revisione è identificata in modo riproducibile e tutti gli usi del protocollo e delle rotte HTTP corrispondono ai contratti, allo schema e alle prove eseguite. Fallisce se la revisione è indefinita o se il client dipende da file o moduli interni del backend.

#### Metadata
  * type: analysis-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Compatibilità con l'API conversazionale del backend](../Requirements/WebConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Controllo del percorso CI del client web

Esaminare `.github/workflows/ci.yml` ed eseguirlo su GitHub dopo un push sul branch principale.

#### Details
Il controllo passa se il workflow si attiva su push del branch principale, pull request, richiesta manuale e chiamata da altri workflow; installa le dipendenze con `npm ci` su Node.js 24; esegue Reqvire 1.3.2 `validate` e `lint` facendo fallire il job se il lint riporta correzioni automatiche o elementi da rivedere; esegue `npm run typecheck`, `npm test` e `npm run build`; e l'esecuzione su GitHub termina con successo. Fallisce se manca una fase o se un controllo fallito non fa fallire il job.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Controlli CI del client web](../Requirements/WebConversation.md#controlli-ci-del-client-web)
---

### Controllo del repository del client web

Esaminare il repository Git del client web, la configurazione del workspace Reqvire, `package.json` e la build.

#### Details
Il controllo passa se repository e modello sono autonomi dal backend, le decisioni del client sono tracciate in questo workspace, il client è un'applicazione React in TypeScript costruita da Vite in file statici e le versioni fissate corrispondono al contratto dello stack. Fallisce se la build richiede un processo server proprio o se una decisione del client è registrata solo nel codice.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Repository autonomo del client web](../Requirements/WebConversation.md#repository-autonomo-del-client-web)
  * verify: [Stack del client web](../Requirements/WebConversation.md#stack-del-client-web)
---

### Controllo dell'hook pre-commit dei segreti

Attivare l'hook con `git config core.hooksPath .githooks` in un clone di prova, mettere in staging un file con un token fittizio riconosciuto da gitleaks e tentare il commit; ripetere con un file privo di segreti e con `gitleaks` assente dal `PATH`.

#### Details
Il controllo passa se il commit con il token fittizio viene rifiutato senza mostrarne il valore, il commit senza segreti riesce e, senza `gitleaks` nel `PATH`, il commit viene rifiutato con un messaggio che indica come installarlo. Il clone di prova viene eliminato dopo il controllo.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Controllo dei segreti prima del commit](../Requirements/WebConversation.md#controllo-dei-segreti-prima-del-commit)
---

### Controllo della pubblicazione dell'immagine

Esaminare `.github/workflows/publish-image.yml` ed eseguirlo su GitHub con il primo tag di release.

#### Details
Il controllo passa se il workflow si attiva solo per i tag `vMAJOR.MINOR.PATCH`, verifica che la versione di `package.json` coincida, richiama CI e scansione dei segreti prima di costruire, verifica entrambe le immagini prima di qualunque push e pubblica il manifest con `linux/amd64` e `linux/arm64` senza tag `latest`. Fallisce se una pubblicazione può avvenire con controlli falliti.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Pubblicazione dell'immagine Docker](../Requirements/WebConversation.md#pubblicazione-dellimmagine-docker)
---

### Controllo della scansione dei segreti in CI

Esaminare `.github/workflows/secret-scan.yml` ed eseguirlo su GitHub dopo un push.

#### Details
Il controllo passa se il workflow si attiva su push di qualunque branch, pull request, richiesta manuale e chiamata da altri workflow; recupera l'intera storia con il checkout fissato e senza credenziali persistenti; scarica gitleaks v8.30.1, ne verifica lo SHA-256 prima dell'estrazione e interrompe il job se l'impronta non corrisponde; esegue `gitleaks git --redact --no-banner --exit-code 1 .`; e l'esecuzione su GitHub termina con successo sulla storia corrente. Fallisce se una di queste condizioni manca o se l'output riporta il valore di un segreto.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Scansione dei segreti nella CI](../Requirements/WebConversation.md#scansione-dei-segreti-nella-ci)
---

### Dimostrazione nel browser

Costruire l'immagine, montare un `config.json` con l'indirizzo di un backend alla revisione dichiarata, aggiungere l'origine del client all'elenco del backend e usare la chat da un browser desktop e da uno con schermo stretto: nuovo turno, continuazione, conversazione iniziata da un altro client, risposta con Markdown, cambio di chat durante un turno, ricaricamento con la chat nell'indirizzo, uso da tastiera.

#### Details
La dimostrazione passa se la persona conversa e consulta le conversazioni dal browser come previsto dalla schermata e la console del browser non riporta violazioni della Content-Security-Policy. L'esito si registra con data, versione del client, revisione del backend e browser usati, descrivendo l'ambiente in termini generici.

#### Metadata
  * type: demonstration-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Client conversazionale nel browser](../Requirements/WebConversation.md#client-conversazionale-nel-browser)
---

### Prova del protocollo del client web

Contro un backend simulato con `ws`, inviare un nuovo turno e uno di continuazione, due turni contemporanei in conversazioni diverse, un testo vuoto, uno di soli spazi e uno oltre 64 KiB; far rispondere il backend con frammenti e `turn.completed`, con `turn.rejected`, con `turn.failed` dopo frammenti, con `turn.interrupted`, con `session.error`, chiudendo la sessione prima dell'esito, senza `session.ready` e con un messaggio non legato a un turno che contiene `id`.

#### Details
La prova passa se i messaggi inviati seguono il contratto della sessione, la sessione è unica e si riapre al turno successivo dopo una chiusura, i turni in conversazioni diverse procedono in parallelo, i testi non trasmissibili sono rifiutati senza aprire la sessione, il turno risulta riuscito soltanto con `turn.completed`, `turn.rejected` e `turn.failed` restituiscono il loro `message` al posto dei frammenti, chiusura e `turn.interrupted` producono l'esito interrotto, l'assenza di `session.ready` produce l'avviso di backend non raggiungibile dopo 10 secondi e il messaggio con `id` riceve `client.result` con `reason: "unsupported"`. Fallisce se un turno senza `turn.completed` risulta riuscito.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [conversation-session.test.ts](../../test/features/session/model/conversation-session.test.ts)
  * satisfiedBy: [fake-backend.ts](../../test/support/fake-backend.ts)
  * verify: [Invio del turno sul canale conversazionale](../Requirements/WebConversation.md#invio-del-turno-sul-canale-conversazionale)
  * verify: [Presentazione del rifiuto del turno](../Requirements/WebConversation.md#presentazione-del-rifiuto-del-turno)
  * verify: [Presentazione dell'errore dopo l'ammissione](../Requirements/WebConversation.md#presentazione-dellerrore-dopo-lammissione)
  * verify: [Riconoscimento del completamento della risposta testuale](../Requirements/WebConversation.md#riconoscimento-del-completamento-della-risposta-testuale)
  * verify: [Rifiuto locale del turno non trasmissibile](../Requirements/WebConversation.md#rifiuto-locale-del-turno-non-trasmissibile)
  * verify: [Segnalazione locale dell'interruzione della chat](../Requirements/WebConversation.md#segnalazione-locale-dellinterruzione-della-chat)
---

### Prova dell'accessibilità di base

In jsdom con Testing Library, individuare regioni, elenco delle conversazioni, comandi e campo di scrittura tramite ruoli e nomi accessibili nelle due lingue; usare la pagina soltanto da tastiera per creare una chat, inviare un turno, aprire una conversazione e caricare la pagina successiva; osservare la regione `aria-live` durante e dopo un turno; sotto i 720 pixel aprire il pannello, chiuderlo con `Esc` e osservare il focus.

#### Details
La prova passa se ogni comando e il campo di scrittura hanno un nome accessibile, le regioni di navigazione e principale sono presenti, la chat corrente ha `aria-current`, tutte le azioni riescono da tastiera, la regione `aria-live` annuncia l'esito del turno ma non i singoli frammenti, il focus entra nel pannello all'apertura e torna al pulsante alla chiusura con `Esc`, e gli stili definiscono un indicatore di focus visibile. Fallisce se una funzione richiede il mouse o un comando non ha nome accessibile.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [accessibility.test.tsx](../../test/app/accessibility.test.tsx)
  * verify: [Accessibilità di base dell'interfaccia](../Requirements/WebConversation.md#accessibilità-di-base-dellinterfaccia)
---

### Prova dell'identità del browser nella sessione

Con un `localStorage` simulato vuoto, poi con un valore conservato valido, con un valore non conforme e con `localStorage` che solleva un errore, ricavare l'identità del client per diversi user agent e osservare `session.hello` inviato al backend simulato.

#### Details
La prova passa se il primo uso genera e conserva `web-<UUID v4>` nella chiave `ambrogio.web.clientId`, gli usi successivi lo riusano, un valore non conforme viene sostituito, senza `localStorage` si usa un identificativo valido per la pagina, gli UUID non dipendono da `crypto.randomUUID` e il `name` vale `Web Firefox`, `Web Chrome`, `Web Edge`, `Web Safari` o `Web browser`. Fallisce se la sessione si apre con un identificativo vuoto o se l'identità cambia tra due caricamenti con lo stesso `localStorage`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [client-identity.test.ts](../../test/features/session/model/client-identity.test.ts)
  * satisfiedBy: [conversation-session.test.ts](../../test/features/session/model/conversation-session.test.ts)
  * verify: [Identificazione del browser nella sessione](../Requirements/WebConversation.md#identificazione-del-browser-nella-sessione)
---

### Prova dell'immagine Docker del client web

Con `scripts/verify-docker-image.mjs`, avviare l'immagine costruita senza `config.json` e poi con un `config.json` di esempio montato in sola lettura; richiedere `index.html`, `config.json`, un file sotto `assets/` e un percorso inesistente; esaminare utente del processo, porta e contenuto dell'immagine.

#### Details
La prova passa se il processo non è root e ascolta sulla porta 8080, l'immagine non contiene `config.json`, senza file la richiesta riceve `404`, con il file montato lo restituisce, tutte le risposte hanno gli header di sicurezza del contratto, `index.html` e `config.json` hanno `Cache-Control: no-store`, i file sotto `assets/` hanno la cache immutabile e la versione di nginx non è esposta. Fallisce se manca uno di questi elementi.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [verify-docker-image.mjs](../../scripts/verify-docker-image.mjs)
  * verify: [Distribuzione come immagine Docker](../Requirements/WebConversation.md#distribuzione-come-immagine-docker)
  * verify: [Header di sicurezza del server statico](../Requirements/WebConversation.md#header-di-sicurezza-del-server-statico)
---

### Prova dell'indirizzo della chat aperta

In jsdom con un backend simulato, aprire la pagina senza frammento, con `#/c/<id>` di una conversazione esistente, di una inesistente e con un frammento di forma diversa; aprire una conversazione dalla barra laterale, inviare il primo turno di una nuova chat e tornare indietro nella cronologia.

#### Details
La prova passa se senza frammento compare «Nuova chat», un frammento valido apre la conversazione indicata, una conversazione inesistente mostra il messaggio pubblico del backend lasciando disponibile «Nuova chat», un frammento di forma diversa viene ignorato, l'apertura di una conversazione e `turn.accepted` del primo turno aggiornano il frammento senza ricaricare la pagina e il ritorno nella cronologia riapre la chat precedente. Fallisce se la pagina si ricarica o mostra una conversazione diversa da quella indicata.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [address.test.tsx](../../test/app/address.test.tsx)
  * satisfiedBy: [chat-address.test.ts](../../test/features/chat/model/chat-address.test.ts)
  * verify: [Chat aperta nell'indirizzo della pagina](../Requirements/WebConversation.md#chat-aperta-nellindirizzo-della-pagina)
---

### Prova della configurazione di esecuzione

Con una funzione di lettura HTTP controllata, caricare la configurazione con `config.json` valido con e senza `language`, con preferenze del browser diverse, con file assente, JSON malformato, `backendUrl` mancante, non HTTP(S), con credenziali, query o frammento, `language` non supportato e un campo sconosciuto.

#### Details
La prova passa se la configurazione valida produce l'URL base e la lingua attesi, `language` assente segue la prima lingua supportata del browser con `en` come ripiego, la richiesta non usa la cache e ogni caso non valido produce l'errore di configurazione senza alcuna richiesta al backend. Fallisce se un caso non valido viene accettato o se la pagina contatta il backend con una configurazione non valida.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [App.test.tsx](../../test/app/App.test.tsx)
  * satisfiedBy: [runtime-config.test.ts](../../test/features/configuration/model/runtime-config.test.ts)
  * satisfiedBy: [dictionary.test.ts](../../test/shared/i18n/dictionary.test.ts)
  * verify: [Indirizzo del backend dalla configurazione di esecuzione](../Requirements/WebConversation.md#indirizzo-del-backend-dalla-configurazione-di-esecuzione)
  * verify: [Lingua dell'interfaccia dalla configurazione](../Requirements/WebConversation.md#lingua-dellinterfaccia-dalla-configurazione)
---

### Prova della presentazione sanificata delle risposte

In jsdom, mostrare risposte con Markdown (titoli, elenchi, codice, tabelle), con HTML grezzo come `<script>` e `<img onerror>`, con link `https:`, `mailto:` e `javascript:`, con immagini Markdown remote; mostrare messaggi della persona ed errori che contengono Markdown e HTML.

#### Details
La prova passa se il Markdown delle risposte produce gli elementi attesi, l'HTML grezzo resta testo e non crea elementi, solo i link ammessi sono cliccabili e hanno `target="_blank"` e `rel="noopener noreferrer"`, nessun elemento `img` viene creato e i messaggi della persona e gli errori compaiono come testo letterale con gli a capo. Fallisce se un contenuto ricevuto crea elementi HTML non previsti o una richiesta verso un'altra origine.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [AnswerMarkdown.test.tsx](../../test/features/chat/ui/AnswerMarkdown.test.tsx)
  * verify: [Presentazione sanificata delle risposte](../Requirements/WebConversation.md#presentazione-sanificata-delle-risposte)
---

### Prova della schermata della chat

In jsdom con Testing Library, aprire la pagina con un backend simulato: verificare la voce «Nuova chat», inviare il primo turno e osservare risposta progressiva e nome della voce; aprire una conversazione conservata, anche iniziata da un altro client, e continuarla; caricare elenco e pagina successiva, aggiornare e verificare la ripartenza dalla prima pagina; simulare uno storico non leggibile, un turno `pending` poi concluso, un turno `interrupted`; durante un turno aprire un'altra chat, inviarvi un turno e tornare indietro; ripetere a una larghezza inferiore a 720 pixel e nelle due lingue.

#### Details
La prova passa se la schermata rispetta il contratto: anteprime di 60 caratteri o identificativo di 8, ripartenza dell'elenco senza cursore dopo «Aggiorna», stato in elaborazione con invito ad aggiornare e scambio concluso alla consultazione successiva, avviso di risposta interrotta, invio bloccato solo nella chat con il turno in corso, `Invio` e `Maiusc+Invio` come previsto, pannello delle conversazioni sotto 720 pixel e testi fissi nella lingua scelta secondo il dizionario. Fallisce se la pagina perde la conversazione corrente, invia due turni nella stessa conversazione o blocca le altre chat durante un turno.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [ChatApplication.test.tsx](../../test/app/ChatApplication.test.tsx)
  * satisfiedBy: [chat-state.test.ts](../../test/features/chat/model/chat-state.test.ts)
  * satisfiedBy: [conversation-list.test.ts](../../test/features/conversations/model/conversation-list.test.ts)
  * satisfiedBy: [conversations-api.test.ts](../../test/features/conversations/model/conversations-api.test.ts)
  * verify: [Anteprima delle conversazioni nella barra laterale](../Requirements/WebConversation.md#anteprima-delle-conversazioni-nella-barra-laterale)
  * verify: [Apertura e continuazione di una conversazione conservata](../Requirements/WebConversation.md#apertura-e-continuazione-di-una-conversazione-conservata)
  * verify: [Navigazione durante un turno in corso](../Requirements/WebConversation.md#navigazione-durante-un-turno-in-corso)
  * verify: [Nuova chat iniziale nella barra laterale](../Requirements/WebConversation.md#nuova-chat-iniziale-nella-barra-laterale)
  * verify: [Ripartenza dell'elenco conversazioni dopo un aggiornamento](../Requirements/WebConversation.md#ripartenza-dellelenco-conversazioni-dopo-un-aggiornamento)
  * verify: [Stato del turno in elaborazione alla riapertura](../Requirements/WebConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
  * verify: [Vista a due aree della conversazione](../Requirements/WebConversation.md#vista-a-due-aree-della-conversazione)
---

### Prova di integrazione con il backend fissato

Con un checkout del backend al commit dichiarato nel contratto sorgente, avviare il server conversazionale con un orchestratore controllato e il componente HTTP configurato con un'origine di esempio autorizzata. Usare il nucleo del client web per inviare turni, con esito completato, errore dopo frammenti e interruzione, e per leggere elenco e storico; aprire il canale e leggere l'elenco con l'origine autorizzata e con un'origine non autorizzata.

#### Details
La prova passa se il client conversa e consulta tramite le sole interfacce pubbliche, il backend valida i messaggi con lo schema, l'origine autorizzata apre la sessione e riceve gli header CORS e quella non autorizzata viene respinta. Fallisce se il commit del backend non corrisponde, se un messaggio è rifiutato dallo schema o se il client usa componenti interni del server. La prova richiede il checkout del backend e resta fuori dalla CI.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [pinned-backend.test.ts](../../integration/pinned-backend.test.ts)
  * verify: [Client conversazionale nel browser](../Requirements/WebConversation.md#client-conversazionale-nel-browser)
---

