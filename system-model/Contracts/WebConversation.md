# Elements

### Architettura del client web

Il codice è organizzato per funzionalità (vertical slice), secondo lo schema di Bulletproof React, sotto `src/`:

- `src/features/<funzionalità>/`: una cartella per funzionalità, inizialmente `configuration` (configurazione di esecuzione), `session` (identità e sessione `ambrogio.v1`), `conversations` (consultazione HTTP ed elenco della barra laterale) e `chat` (chat corrente, turni, indirizzo della pagina). Ogni funzionalità ha una parte `model/`, in TypeScript puro, e se serve una parte `ui/` con i componenti React. Le funzionalità non si importano a vicenda.
- `src/shared/`: codice comune a più funzionalità, come `Result`, i dizionari delle lingue in `src/shared/i18n/` e componenti di interfaccia riusabili.
- `src/app/`: `main.tsx` e `App.tsx` assemblano le dipendenze del browser e collegano le funzionalità tra loro; è l'unica parte che importa più funzionalità.

Il nucleo del client è l'insieme delle parti `model/` e di `src/shared/` esclusi i componenti: non importa React né parti `ui/` e non accede a `document` o `window`; le API del browser che usa (`fetch`, `WebSocket`, `Storage`, `crypto.getRandomValues`, preferenze di lingua, indirizzo della pagina) gli sono fornite come dipendenze da `src/app/`, così si prova in Node. Lo stato di ogni funzionalità è una funzione reducer pura nella sua parte `model/`, collegata ai componenti con `useReducer` e un contesto React, senza librerie di stato. Gli stili sono CSS Modules, un file `<Componente>.module.css` accanto a ogni componente, compilati da Vite in file CSS statici. Le operazioni del nucleo con esiti negativi previsti restituiscono `Result<T, E>`, cioè `{ ok: true, value }` oppure `{ ok: false, error }`, con varianti di errore distinte da un campo `kind`; le eccezioni restano per i guasti inattesi. I file TypeScript non React hanno nomi in kebab-case (`conversation-session.ts`), i componenti in PascalCase (`ChatPanel.tsx`); il punto d'ingresso `src/app/main.tsx`, che non è un componente, ha il nome in minuscolo. I test stanno in `test/`, con la stessa struttura di `src/`, e si chiamano `<nome>.test.ts` o `<nome>.test.tsx`; fanno eccezione `test/support/`, con il backend simulato e gli aiuti condivisi dai test, e `test/repository/`, con le prove sui file del repository esterni a `src/`, come workflow, hook, dipendenze e regole di importazione. Non si usano ESLint né Prettier.

#### Metadata
  * type: specification

#### Relations
  * define: [Separazione del nucleo dall'interfaccia](../Requirements/WebConversation.md#separazione-del-nucleo-dallinterfaccia)
---

### Configurazione di esecuzione del client web

All'apertura della pagina il client legge `config.json` dalla stessa directory di `index.html`, con una richiesta che non usa la cache del browser. Il file è un oggetto JSON con il campo obbligatorio `backendUrl`, l'URL base HTTP o HTTPS assoluto del backend, senza credenziali, query o frammento, con eventuale prefisso di percorso, e il campo opzionale `language`, che sceglie la lingua dell'interfaccia tra `it` e `en`. Se `language` manca, il client usa la prima lingua supportata tra quelle preferite dal browser, altrimenti `en`. Un valore di `language` non supportato o un campo diverso da `backendUrl` e `language` rende la configurazione non valida, così un errore di battitura non passa inosservato. Il client non sceglie un backend predefinito. Se il file manca, non è JSON valido o non rispetta questa forma, la pagina mostra l'errore di configurazione con il motivo, nella lingua preferita dal browser, e non apre sessioni né richieste verso il backend. Dall'URL base il client ricava gli endpoint HTTP `api/conversations` e l'indirizzo WebSocket `api/session`, con schema `ws:` per `http:` e `wss:` per `https:`. Il file appartiene all'installazione: non è incluso nel repository né nell'immagine e il repository ne contiene solo un esempio con valori segnaposto. Il browser dichiara l'origine della pagina nell'apertura del canale e nelle letture HTTP: il backend accetta il canale e autorizza le letture soltanto per le origini che chi installa elenca nella configurazione del componente HTTP del backend, secondo «Controllo dell'origine all'apertura della sessione» e «Politica CORS del componente HTTP».

#### Metadata
  * type: input-output

#### Relations
  * define: [Indirizzo del backend dalla configurazione di esecuzione](../Requirements/WebConversation.md#indirizzo-del-backend-dalla-configurazione-di-esecuzione)
---

### Identità del client web nella sessione

Al primo uso il browser genera un `clientId` della forma `web-<UUID v4>` e lo conserva in `localStorage` con la chiave `ambrogio.web.clientId`; gli usi successivi nello stesso browser e per la stessa origine riusano il valore conservato. Un valore conservato vuoto o non conforme viene sostituito da uno nuovo. Il `name` vale `Web <browser>`, con `<browser>` uguale a `Firefox`, `Chrome`, `Edge` o `Safari` secondo lo user agent, altrimenti `Web browser`, indipendentemente dalla lingua dell'interfaccia. Se `localStorage` non è disponibile, il client usa un identificativo generato per la sola pagina aperta. Gli UUID si ricavano da `crypto.getRandomValues`, disponibile anche quando la pagina è servita in HTTP non sicuro, dove `crypto.randomUUID` manca. Cancellare i dati del sito produce una nuova identità; la modifica del nome dall'interfaccia è una capacità successiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Identificazione del browser nella sessione](../Requirements/WebConversation.md#identificazione-del-browser-nella-sessione)
---

### Indirizzo della chat aperta

La chat corrente compare nel frammento dell'indirizzo della pagina come `#/c/<conversationId>`; la voce locale «Nuova chat» corrisponde all'indirizzo senza frammento. Aprire una conversazione conservata o ricevere `turn.accepted` per il primo turno di una nuova chat aggiorna il frammento senza ricaricare la pagina. Aprire la pagina con un frammento valido, o cambiarlo dalla cronologia del browser, mostra quella conversazione leggendone lo storico; se lo storico non è leggibile, l'area della chat mostra il messaggio pubblico ricevuto e «Nuova chat» resta disponibile. Un frammento con forma diversa viene ignorato e la pagina apre «Nuova chat». Non si usano librerie di routing e il server statico non richiede configurazione aggiuntiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Chat aperta nell'indirizzo della pagina](../Requirements/WebConversation.md#chat-aperta-nellindirizzo-della-pagina)
---

### Lingue dell'interfaccia del client web

L'interfaccia è disponibile in italiano (`it`) e inglese (`en`); la lingua si sceglie con `language` nella configurazione di esecuzione e, se il campo manca, segue le preferenze del browser con `en` come ripiego. Aggiungere una lingua significa aggiungere un dizionario con tutte le chiavi e il relativo codice tra i valori ammessi di `language`. I messaggi pubblici prodotti dal backend per rifiuti ed errori dei turni sono mostrati come ricevuti, nella lingua configurata nel backend. Gli errori delle letture dall'API HTTP `v1`, `/api/v1/conversations` e `/api/v1/conversations/<id>`, sono presentati con i testi dell'interfaccia scelti in base al `type` del Problem Details: «Conversazione inesistente» per `/problems/conversation-not-found`, «Errore HTTP del backend», con `<n>` uguale allo stato HTTP, per ogni altro tipo o corpo; `title` e `detail` del backend non sono mostrati. I testi fissi dell'interfaccia sono:

| Chiave | `it` | `en` |
|---|---|---|
| Nuova chat | «Nuova chat» | «New chat» |
| Aggiorna | «Aggiorna» | «Refresh» |
| Altre conversazioni | «Altre conversazioni» | «More conversations» |
| Pannello conversazioni | «Conversazioni» | «Conversations» |
| Invio | «Invia» | «Send» |
| Segnaposto del campo | «Scrivi un messaggio» | «Write a message» |
| Etichetta della persona | «Tu» | «You» |
| Etichetta di Ambrogio | «Ambrogio» | «Ambrogio» |
| In elaborazione | «In elaborazione. Aggiorna più tardi per vedere l'esito.» | «In progress. Refresh later to see the outcome.» |
| Risposta interrotta | «Risposta interrotta.» | «Response interrupted.» |
| Messaggio vuoto | «Scrivi un messaggio non vuoto.» | «Write a non-empty message.» |
| Messaggio troppo grande | «Messaggio troppo grande (massimo 64 KiB).» | «Message too large (64 KiB at most).» |
| Backend non raggiungibile | «Impossibile collegarsi al backend.» | «Cannot connect to the backend.» |
| Errore di protocollo | «Errore del protocollo.» | «Protocol error.» |
| Conversazione inesistente | «Conversazione non trovata.» | «Conversation not found.» |
| Errore HTTP del backend | «Il backend ha risposto con un errore (HTTP <n>).» | «The backend answered with an error (HTTP <n>).» |
| Configurazione non valida | «Configurazione del client web non valida» | «Invalid web client configuration» |

#### Metadata
  * type: specification

#### Relations
  * define: [Lingua dell'interfaccia dalla configurazione](../Requirements/WebConversation.md#lingua-dellinterfaccia-dalla-configurazione)
---

### Presentazione Markdown delle risposte

Le risposte di Ambrogio, anche durante la risposta progressiva, sono rese come Markdown con `react-markdown` e `remark-gfm`, che producono elementi React senza `innerHTML`. L'HTML grezzo contenuto nella risposta non viene interpretato e resta testo. I link sono cliccabili soltanto con schema `http:`, `https:` o `mailto:`, si aprono in una nuova scheda con `rel="noopener noreferrer"`; con altri schemi resta il solo testo del link. Le immagini Markdown non vengono caricate: al loro posto compare il testo alternativo, come link se l'indirizzo è `http:` o `https:`. I messaggi della persona e i messaggi di errore sono testo semplice con gli a capo preservati, senza interpretazione di Markdown o HTML.

#### Metadata
  * type: specification

#### Relations
  * define: [Presentazione sanificata delle risposte](../Requirements/WebConversation.md#presentazione-sanificata-delle-risposte)
---

### Profilo dell'immagine Docker del client web

Il client web è distribuito come immagine container propria, servizio facoltativo che chi installa aggiunge accanto al backend. L'immagine si costruisce in due fasi: la prima, con `node:24` sulla piattaforma di build, installa le dipendenze secondo il contratto «Profilo di installazione delle dipendenze del client web» ed esegue `pnpm build`; la seconda parte da `nginxinc/nginx-unprivileged` 1.30 su Alpine e contiene soltanto i file di `dist/` e la configurazione nginx del progetto. Il processo gira come utente non privilegiato e ascolta sulla porta 8080 del container. `config.json` non è nell'immagine: chi installa lo monta in sola lettura in `/usr/share/nginx/html/config.json`; senza file la richiesta riceve `404` e la pagina mostra l'errore di configurazione. La fase di build gira sulla piattaforma nativa della macchina di build anche quando l'immagine finale è per un'altra architettura, perché il suo risultato non dipende dalla piattaforma.

L'immagine finale dichiara le etichette OCI `org.opencontainers.image.source` con valore `https://github.com/ambrogio-app/ambrogio-web` e `org.opencontainers.image.licenses` con valore `MIT`, la licenza del repository. Il contesto di build esclude, tramite `.dockerignore`, `.git`, `.github`, `.githooks`, `node_modules` e `**/node_modules`, `dist`, `config.json`, `public/config.json`, `system-model`, `test`, `integration`, `scripts`, `*.env` e `*.env.*`, così che configurazioni effettive, file d'ambiente e dipendenze locali non entrino nella build.

#### Metadata
  * type: specification

#### Relations
  * define: [Distribuzione come immagine Docker](../Requirements/WebConversation.md#distribuzione-come-immagine-docker)
---

### Profilo di accessibilità di base del client web

La pagina usa HTML semantico: la barra laterale è una regione di navigazione con un elenco di conversazioni, la conversazione corrente è la regione principale e ogni comando è un pulsante con un nome accessibile nella lingua dell'interfaccia. Ogni funzione è raggiungibile e utilizzabile da tastiera in un ordine coerente con la disposizione, e l'elemento con il focus ha un indicatore visibile. Il campo di scrittura ha un'etichetta. Ogni messaggio della chat ha l'etichetta di chi parla: quella della persona o «Ambrogio». La voce della chat corrente è segnalata con `aria-current`. Una regione `aria-live` cortese annuncia l'esito di ogni turno della chat corrente leggendo il testo della risposta completata, il messaggio di errore oppure l'avviso di risposta interrotta, senza annunciare i singoli frammenti della risposta progressiva. Sotto i 720 pixel, aprire il pannello delle conversazioni porta il focus al suo interno, `Esc` lo chiude e il focus torna al pulsante che lo ha aperto.

#### Metadata
  * type: specification

#### Relations
  * define: [Accessibilità di base dell'interfaccia](../Requirements/WebConversation.md#accessibilità-di-base-dellinterfaccia)
---

### Profilo di installazione delle dipendenze del client web

Il gestore di pacchetti è pnpm 12.11.2, dichiarato nel campo `packageManager` di `package.json`; il lockfile è `pnpm-lock.yaml` e il repository non contiene `package-lock.json`. Ogni dipendenza diretta di `package.json`, di esecuzione e di sviluppo, è dichiarata con la versione esatta `MAJOR.MINOR.PATCH` risolta nel lockfile. Sviluppo, CI e build dell'immagine installano le dipendenze con `pnpm install --frozen-lockfile`, che fallisce se il lockfile non corrisponde a `package.json`; la CI e la fase di build dell'immagine attivano pnpm con Corepack secondo «Profilo di installazione con pnpm e Corepack»: il job `checks` di `ci.yml` dichiara `COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'` ed esegue `corepack enable` prima di ogni comando `pnpm`, e la fase `build` del `Dockerfile`, basata su `node:24`, esegue `corepack enable` prima di copiare il manifest. La regola predefinita di pnpm che attende 24 ore dalla pubblicazione prima di installare una nuova versione resta attiva e `pnpm-workspace.yaml` non dichiara eccezioni. `allowBuilds` in `pnpm-workspace.yaml` non ammette script di build per alcuna dipendenza: l'unica dipendenza con uno script di installazione è `fsevents`, dipendenza facoltativa di Vite installata soltanto su macOS che contiene il binario precompilato, ed è dichiarata con `false` così che il suo script non venga eseguito. Gli script del progetto si eseguono con `pnpm <script>`.

#### Metadata
  * type: specification

#### Relations
  * define: [Installazione riproducibile delle dipendenze](../Requirements/WebConversation.md#installazione-riproducibile-delle-dipendenze)
---

### Profilo di pubblicazione dell'immagine Docker del client web

GitHub Actions pubblica `ghcr.io/ambrogio-app/ambrogio-web` al push di un tag `vMAJOR.MINOR.PATCH`, con versione uguale a quella di `package.json`. Il tag immagine finale coincide con il tag Git; non esiste `latest`. Prima della pubblicazione si eseguono sullo stesso commit la CI e la scansione dei segreti, poi si costruiscono dal `Dockerfile` e si verificano le immagini `linux/amd64` e `linux/arm64` con `scripts/verify-docker-image.mjs`; l'immagine `linux/arm64` si costruisce e si verifica con l'emulazione QEMU. Le immagini verificate ricevono i tag tecnici `<tag>-amd64` e `<tag>-arm64` e il tag di release le riunisce in un manifest. Nessun push avviene prima che entrambe le verifiche siano riuscite. Dopo il push e il controllo del manifest, il job scrive nel riepilogo del job (`$GITHUB_STEP_SUMMARY`) la riga `Published <immagine>` con il riferimento `ghcr.io/ambrogio-app/ambrogio-web:<tag>`. Un push ordinario su `main` non pubblica. Il workflow non cambia la visibilità del pacchetto nel registro.

#### Metadata
  * type: specification

#### Relations
  * define: [Pubblicazione dell'immagine Docker](../Requirements/WebConversation.md#pubblicazione-dellimmagine-docker)
---

### Profilo di scansione dei segreti della chat web

La chat web applica il profilo comune di scansione dei segreti con gitleaks nel workflow `.github/workflows/secret-scan.yml`, con il job `Gitleaks`, e nell'hook `.githooks/pre-commit`. Il checkout del job `Gitleaks` usa `actions/checkout` con `fetch-depth: 0`. Il job dei controlli di `.github/workflows/ci.yml` installa gitleaks con le stesse variabili, lo stesso archivio e la stessa verifica SHA-256 del job `Gitleaks`, perché la suite di test esegue l'hook pre-commit e il comando della scansione. La pubblicazione dell'immagine richiama la scansione dei segreti secondo il profilo di sicurezza dei workflow della chat web.

#### Metadata
  * type: specification

#### Relations
  * define: [Scansione dei segreti nella CI della chat web](../Requirements/WebConversation.md#scansione-dei-segreti-nella-ci-della-chat-web)
---

### Profilo di sicurezza dei workflow GitHub Actions

I workflow `.github/workflows/ci.yml`, `.github/workflows/secret-scan.yml` e `.github/workflows/publish-image.yml` della chat web applicano il profilo comune dei workflow GitHub Actions con questi valori:

- **Permessi del token.** Soltanto il job `publish` di `publish-image.yml` dichiara in più `packages: write`, necessario per scrivere in GHCR.
- **Azioni fissate per commit.** Oltre alle action del profilo comune, la pubblicazione usa `docker/setup-qemu-action@c7c53464625b32c7a7e944ae62b3e17d2b600130` (v3) e `docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` (v3). Ogni `actions/setup-node` ha `package-manager-cache: false`.
- **Durata dei job.** `timeout-minutes` vale 15 per il job `checks` di `ci.yml`, 10 per `gitleaks` in `secret-scan.yml` e 45 per `publish` in `publish-image.yml`.
- **Credenziali.** Il job `publish` passa `GITHUB_TOKEN` a `docker login` tramite variabile d'ambiente e `--password-stdin` ed esegue `docker logout ghcr.io` anche quando un passo precedente fallisce.
- **Riuso dei controlli.** `publish-image.yml` richiama `ci.yml` e `secret-scan.yml` come job `checks` e `secret-scan`, da cui dipende il job `publish`.
- **Concorrenza.** `publish-image.yml` ha `concurrency` con gruppo `web-release-${{ github.ref }}` e `cancel-in-progress: false`: due esecuzioni per lo stesso tag non si sovrappongono e una pubblicazione avviata non viene annullata.

#### Metadata
  * type: specification

#### Relations
  * define: [Privilegi minimi dei workflow GitHub Actions](../Requirements/WebConversation.md#privilegi-minimi-dei-workflow-github-actions)
---

### Profilo header e cache del server statico

Le risposte del server statico hanno `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` e `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`. `connect-src` ammette qualunque origine HTTP(S) e WebSocket perché l'indirizzo del backend si conosce solo a runtime. `index.html` e `config.json` hanno `Cache-Control: no-store`; i file con impronta sotto `assets/` hanno `Cache-Control: public, max-age=31536000, immutable`. Il server non rivela la versione di nginx. HTTPS e HSTS sono compito del reverse proxy.

#### Metadata
  * type: specification

#### Relations
  * define: [Header di sicurezza del server statico](../Requirements/WebConversation.md#header-di-sicurezza-del-server-statico)
---

### Ruleset del branch principale della chat web

Il ruleset `main` del repository della chat web segue il ruleset comune del branch principale e richiede i controlli `Web client checks` e `Gitleaks`.

#### Metadata
  * type: specification

#### Relations
  * define: [Controlli obbligatori prima del merge della chat web](../Requirements/WebConversation.md#controlli-obbligatori-prima-del-merge-della-chat-web)
---

### Schermata web della chat

La pagina ha due aree: a sinistra la barra laterale delle conversazioni, a destra la conversazione corrente con il campo di scrittura. All'apertura una voce locale «Nuova chat» è selezionata come prima voce e non crea una conversazione sul backend; dopo l'invio del primo turno la voce prende come nome l'anteprima del testo inviato e resta la chat corrente. La barra laterale mostra le conversazioni della prima pagina dell'elenco HTTP, con l'anteprima del primo messaggio della persona ricavata dagli storici delle sole voci visibili, al massimo 60 caratteri con «…» se troncata; se uno storico non è disponibile la voce resta selezionabile con i primi 8 caratteri dell'identificativo. I comandi «Nuova chat», «Aggiorna» e «Altre conversazioni», quest'ultimo presente solo con una pagina successiva, completano la barra; «Aggiorna» riparte dalla prima pagina e ricarica lo storico della chat corrente. Un errore di caricamento dell'elenco è mostrato nella barra con il messaggio pubblico ricevuto.

L'area destra mostra in ordine gli scambi della chat: il testo della persona e, secondo lo stato, la risposta, il messaggio di errore, l'invito ad aggiornare per un turno in elaborazione oppure l'avviso di risposta interrotta. Durante un turno mostra la risposta progressiva; al termine ricarica lo storico della conversazione dal backend. Mentre un turno è in corso il client consente alla persona di aprire altre chat, crearne una nuova, aggiornare l'elenco e inviare turni in altre conversazioni; soltanto l'invio nella chat con il turno in corso resta disabilitato fino all'esito. Ogni chat ha il proprio campo di scrittura: il testo scritto in una chat e non inviato non passa a un'altra chat. Tornando alla chat con il turno in corso, la pagina mostra la risposta progressiva ricevuta fino a quel momento. Nel campo di scrittura `Invio` invia e `Maiusc+Invio` va a capo; il pulsante di invio equivale a `Invio`. Sotto i 720 pixel di larghezza la barra laterale diventa un pannello che si apre con un pulsante e si chiude quando si sceglie una chat. I colori seguono il tema chiaro o scuro del dispositivo tramite `prefers-color-scheme`, senza un selettore nell'interfaccia. I testi fissi citati qui sono quelli italiani; le altre lingue seguono il contratto delle lingue dell'interfaccia.

La pagina occupa esattamente l'altezza della finestra e non scorre nel suo insieme. L'elenco delle conversazioni scorre all'interno della barra laterale e gli scambi scorrono all'interno dell'area destra, ciascuno con la propria barra di scorrimento; l'intestazione della chat e il campo di scrittura restano sempre visibili. Gli stili globali della pagina, cioè colori dei due temi, font e altezza, sono un foglio di stile ordinario importato dall'applicazione e non un modulo CSS, perché la build scarta i moduli CSS importati senza usarne le classi.

#### Metadata
  * type: specification

#### Relations
  * define: [Vista a due aree della conversazione](../Requirements/WebConversation.md#vista-a-due-aree-della-conversazione)
---

### Sessione ambrogio.v1 del client web

La pagina apre una sola sessione WebSocket verso `api/session`, che trasporta i turni di tutte le conversazioni, offrendo il sottoprotocollo `ambrogio.v1`; la apre al primo turno e, se si chiude, la riapre al turno successivo. Dopo l'apertura invia `session.hello` con l'identità del client e attende `session.ready` per al massimo 10 secondi; in mancanza conclude il turno con l'avviso di backend non raggiungibile. Il browser dichiara l'origine della pagina nella richiesta di upgrade.

Ogni turno è una richiesta testuale: `input.start` con `requestId` UUID v4 e `stream` nuovi, `content` `{"type":"text"}`, `reply` `"text"` e `conversationId` quando si continua una conversazione; il testo in un solo `input.chunk`; poi `input.end`. Prima dell'invio il client controlla che il testo non sia vuoto né composto di soli spazi e non superi 64 KiB in UTF-8. Dopo `turn.accepted` il client conserva `conversationId` e `turnId` e mostra, nell'ordine ricevuto, i frammenti `output.chunk` delle trasmissioni del turno. Il turno è riuscito soltanto con `turn.completed`; `turn.failed` e `turn.rejected` concludono il turno con il loro `message`, che sostituisce i frammenti mostrati; `turn.interrupted`, oppure la chiusura della sessione prima dell'esito, concludono localmente il turno come interrotto. Un `session.error` riferito alla richiesta conclude il turno con un errore locale. La stessa sessione trasporta contemporaneamente turni in corso di conversazioni diverse; il client non invia un secondo turno in una conversazione che ne ha già uno in corso. Il client ignora `expectsReply`, perché il campo di scrittura resta disponibile, e ignora i messaggi del server di tipo sconosciuto. La sessione non trasferisce al client la produzione della risposta né la persistenza del turno.

#### Metadata
  * type: specification

#### Relations
  * define: [Invio del turno dalla chat web](../Requirements/WebConversation.md#invio-del-turno-dalla-chat-web)
---

### Stack e build del client web

Il client web è un'applicazione a pagina singola in TypeScript con React 19, costruita con Vite in file statici sotto `dist/`; non ha un processo server proprio e in esecuzione usa soltanto le API del browser, incluso il `WebSocket` nativo per `ambrogio.v1`. Compilazione, test e CI usano Node.js 24; le dipendenze si installano secondo il contratto «Profilo di installazione delle dipendenze del client web». Le dipendenze di `package.json` sono fissate a versioni esatte, tra cui TypeScript 7.0.2 e Vitest 5.0.5. TypeScript è in modalità `strict`. Le risposte in Markdown sono rese con `react-markdown` e `remark-gfm`. Le traduzioni dell'interfaccia sono dizionari TypeScript propri, uno per lingua, con le stesse chiavi controllate dal compilatore, senza librerie di internazionalizzazione. I test usano Vitest: in ambiente Node per il protocollo e la consultazione, con un backend simulato basato su `ws`, e in ambiente jsdom con Testing Library per la schermata. Le prove sui file del repository girano in ambiente Node senza dipendenze aggiuntive: leggono i workflow come testo, senza librerie YAML, estraggono gli import e i riferimenti del codice dal testo dei sorgenti con espressioni regolari ed eseguono l'hook pre-commit e il comando della scansione con il gitleaks installato.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client web](../Requirements/WebConversation.md#stack-del-client-web)
---
