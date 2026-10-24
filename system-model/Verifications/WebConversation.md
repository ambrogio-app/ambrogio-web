# Elements

### Verifica del client web

Raggruppa le prove del comportamento del client web, della sua integrazione con il backend e della sua distribuzione.

#### Metadata
  * type: verification-objective
---

### Analisi dell'architettura del client web

Esaminare le parti `model/` delle funzionalità e il codice non React di `src/shared/`: le funzioni che calcolano lo stato, le firme delle operazioni con esiti negativi previsti e l'uso delle API del browser `fetch`, `history` e `location`.

#### Details
L'analisi passa se lo stato di ogni funzionalità è un reducer puro nella sua parte `model/`, senza effetti né letture di stato esterno, le operazioni con esiti negativi previsti dal contratto restituiscono `Result` con varianti distinte da `kind`, riservando le eccezioni ai guasti inattesi, e il nucleo riceve `fetch` e la cronologia e l'indirizzo della pagina come dipendenze da `src/app/`, senza usare le globali `fetch`, `history` e `location`. Fallisce se un reducer produce effetti, se un esito negativo previsto è segnalato con un'eccezione o se il nucleo usa una di quelle globali. Non automatizzabile: stabilire che un reducer sia puro e che ogni esito negativo previsto sia un `Result` richiede di leggere il codice e i contratti, e distinguere nel testo le globali `fetch`, `history` e `location` da proprietà e metodi omonimi del progetto richiede il controllo dei tipi; import, `document`, `window` e le altre API del browser, nomi dei file e struttura dei test sono coperti dalla prova delle regole di architettura.

#### Metadata
  * type: analysis-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Esiti previsti come valori tipizzati nella chat web](../Requirements/WebConversation.md#esiti-previsti-come-valori-tipizzati-nella-chat-web)
  * verify: [Separazione del nucleo dall'interfaccia](../Requirements/WebConversation.md#separazione-del-nucleo-dallinterfaccia)
---

### Controllo della pubblicazione dell'immagine

Al push di un tag di release, consultare su GitHub l'esecuzione di `.github/workflows/publish-image.yml` e il pacchetto pubblicato in GHCR.

#### Details
Il controllo passa se l'esecuzione richiama CI e scansione dei segreti, verifica entrambe le immagini e pubblica in GHCR il manifest del tag con `linux/amd64` e `linux/arm64`, senza tag `latest`. Fallisce se una pubblicazione avviene con controlli falliti o se il manifest non contiene entrambe le piattaforme. Non automatizzabile: la pubblicazione si osserva soltanto eseguendo il workflow su GitHub con un tag di release e i permessi del registro GHCR.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Pubblicazione dell'immagine Docker](../Requirements/WebConversation.md#pubblicazione-dellimmagine-docker)
---

### Controllo delle esecuzioni di CI e scansione dei segreti su GitHub

Dopo un push sul branch principale, consultare su GitHub le esecuzioni di `.github/workflows/ci.yml` e `.github/workflows/secret-scan.yml` per il commit.

#### Details
Il controllo passa se entrambe le esecuzioni terminano con successo sul commit, la scansione esamina l'intera storia del repository remoto e i log non riportano il valore di un segreto. Fallisce se un'esecuzione manca, fallisce o riporta il valore di un segreto. Non automatizzabile: l'esito dipende dall'esecuzione dei workflow sui runner di GitHub e dall'intera storia del repository remoto, che i test locali non riproducono.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Controlli CI del client web](../Requirements/WebConversation.md#controlli-ci-del-client-web)
  * verify: [Scansione dei segreti nella CI della chat web](../Requirements/WebConversation.md#scansione-dei-segreti-nella-ci-della-chat-web)
---

### Dimostrazione nel browser

Costruire l'immagine, montare un `config.json` con l'indirizzo di un backend avviato dal checkout affiancato nella cartella di lavoro, aggiungere l'origine del client all'elenco del backend e usare la chat da un browser desktop e da uno con schermo stretto: nuovo turno, continuazione, conversazione iniziata da un altro client, risposta con Markdown, cambio di chat durante un turno, ricaricamento con la chat nell'indirizzo, uso da tastiera.

#### Details
La dimostrazione registra nell'evidenza il commit del backend usato. Passa se la persona conversa e consulta le conversazioni dal browser come previsto dalla schermata e la console del browser non riporta violazioni della Content-Security-Policy. Non automatizzabile: l'uso da tastiera, lo scorrimento delle due aree e l'assenza di violazioni della Content-Security-Policy si osservano soltanto in un browser reale con il layout applicato, che jsdom non riproduce.

#### Metadata
  * type: demonstration-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Client conversazionale nel browser](../Requirements/WebConversation.md#client-conversazionale-nel-browser)
---

### Ispezione della protezione del merge della chat web

Leggere con `gh api repos/<proprietario>/<repository>/rulesets` e con il dettaglio del ruleset `main` le regole attive sul branch principale.

#### Details
L'ispezione passa se il ruleset corrisponde al contratto: applicazione attiva sul branch predefinito, nessun attore escluso, integrazione solo tramite pull request, controlli richiesti con i nomi del contratto, riscrittura forzata e cancellazione vietate; e se un push diretto sul branch principale viene rifiutato. Fallisce se il ruleset manca, è disattivato, ha attori esclusi o differisce dal contratto. Non automatizzabile: il ruleset è un'impostazione del repository GitHub e non un file del repository, e leggerlo richiede credenziali con accesso amministrativo che la CI non possiede.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Controlli obbligatori prima del merge della chat web](../Requirements/WebConversation.md#controlli-obbligatori-prima-del-merge-della-chat-web)
---

### Ispezione della sicurezza dei workflow GitHub Actions

Per ogni azione fissata nel profilo di sicurezza dei workflow, consultare il repository ufficiale dell'azione; per ogni permesso concesso dal profilo, leggere i passi del job che lo riceve.

#### Details
L'ispezione passa se ogni SHA fissato appartiene alla release indicata nel commento nel repository ufficiale dell'azione e ogni permesso del profilo è necessario al job che lo riceve. Fallisce se uno SHA non appartiene alla release indicata o se un job riceve un permesso che i suoi passi non usano. Non automatizzabile: la corrispondenza fra SHA e release si legge nel repository dell'azione su GitHub, fuori dal repository e dalla CI, e stabilire che un permesso sia necessario richiede di leggere i passi del job e la documentazione dell'azione.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Privilegi minimi dei workflow GitHub Actions](../Requirements/WebConversation.md#privilegi-minimi-dei-workflow-github-actions)
---

### Ispezione delle istruzioni per gli agenti della chat web

Durante la revisione di ogni modifica di `AGENTS.md` della chat web o di `AGENTS.md` di `ambrogio-model`, leggere i due file e confrontarli con i requisiti della capability «Sviluppo governato dal modello».

#### Details
L'ispezione passa se le istruzioni della chat web rimandano a `ambrogio-model/AGENTS.md` per le regole comuni, non contraddicono i requisiti di processo e aggiungono soltanto indicazioni proprie del repository. Fallisce se le istruzioni contraddicono un requisito, ripetono una regola comune in forma divergente o descrivono un modello autonomo o una revisione fissata del backend. Non automatizzabile: stabilire che istruzioni in prosa contraddicono o ripetono un requisito richiede di leggerle.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * verify: [Istruzioni per gli agenti della chat web](../Requirements/WebConversation.md#istruzioni-per-gli-agenti-della-chat-web)
---

### Prova del profilo di sicurezza dei workflow

Leggere come testo `.github/workflows/ci.yml`, `.github/workflows/secret-scan.yml` e `.github/workflows/publish-image.yml` e confrontarli con il profilo comune dei workflow GitHub Actions e con il profilo di sicurezza dei workflow GitHub Actions della chat web letti dal modello.

#### Details
La prova passa se ogni workflow dichiara al primo livello soltanto `permissions: contents: read`; soltanto il job `publish` dichiara permessi propri, `contents: read` e `packages: write`, e nessun altro permesso di scrittura compare; ogni azione esterna è indicata con lo SHA completo e il commento di versione elencati nei due profili; `actions/setup-node` ha `package-manager-cache: false`; ogni job eseguito su un runner usa `ubuntu-24.04` e ha `timeout-minutes` uguale a 15 per `checks`, 10 per `gitleaks` e 45 per `publish`; ogni `actions/checkout` ha `persist-credentials: false`; `GITHUB_TOKEN` arriva a `docker login` soltanto tramite variabile d'ambiente e `--password-stdin` e nessuno script interpola segreti; `docker logout ghcr.io` ha `if: always()`; `ci.yml` e `secret-scan.yml` dichiarano `workflow_call` e `publish-image.yml` li richiama nei job `checks` e `secret-scan`; `concurrency` ha gruppo `web-release-${{ github.ref }}` e `cancel-in-progress: false`. Fallisce se un job riceve un permesso non previsto dal profilo, se un'azione è indicata con un tag, un branch o uno SHA diverso dai profili, se un job non ha limite di durata o se un checkout conserva le credenziali.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [workflow-security.test.ts](../../test/repository/workflow-security.test.ts)
  * verify: [Privilegi minimi dei workflow GitHub Actions](../Requirements/WebConversation.md#privilegi-minimi-dei-workflow-github-actions)
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
  * verify: [Invio del turno dalla chat web](../Requirements/WebConversation.md#invio-del-turno-dalla-chat-web)
  * verify: [Presentazione del rifiuto del turno nella chat web](../Requirements/WebConversation.md#presentazione-del-rifiuto-del-turno-nella-chat-web)
  * verify: [Presentazione dell'errore dopo l'ammissione nella chat web](../Requirements/WebConversation.md#presentazione-dellerrore-dopo-lammissione-nella-chat-web)
  * verify: [Riconoscimento del completamento della risposta nella chat web](../Requirements/WebConversation.md#riconoscimento-del-completamento-della-risposta-nella-chat-web)
  * verify: [Rifiuto locale del turno non trasmissibile](../Requirements/WebConversation.md#rifiuto-locale-del-turno-non-trasmissibile)
  * verify: [Segnalazione locale dell'interruzione della chat](../Requirements/WebConversation.md#segnalazione-locale-dellinterruzione-della-chat)
---

### Prova del workflow CI del client web

Leggere come testo `.github/workflows/ci.yml` ed esaminarne attivazioni, job e passi.

#### Details
La prova passa se il workflow si attiva su push del branch principale, pull request, richiesta manuale e chiamata da altri workflow; il job `checks`, chiamato `Web client checks`, dichiara `BRANCH` uguale a `${{ github.head_ref || github.ref_name }}`, esegue il checkout del repository in `workspace/ambrogio-web` con `fetch-depth: 0`, imposta Node.js 24, clona `ambrogio-model` in `workspace/ambrogio-model` sul branch `BRANCH` se esiste sul remoto e altrimenti su `main`, esegue `workspace/ambrogio-model/scripts/checkout-workspace workspace "$BRANCH"` e poi `workspace/ambrogio-model/scripts/model-checks --workspace workspace`; nella cartella `workspace/ambrogio-backend` installa le dipendenze del backend con `pnpm install --frozen-lockfile` e lo compila con `pnpm build`, con il `pnpm` attivato da `corepack enable`, che il job esegue prima e con `COREPACK_ENABLE_DOWNLOAD_PROMPT` uguale a `'0'` a livello di job, senza `npm install --global` né `npx`; nella cartella `workspace/ambrogio-web` installa gitleaks con le stesse variabili e gli stessi comandi, verifica SHA-256 compresa, di `.github/workflows/secret-scan.yml`, installa le dipendenze con `pnpm install --frozen-lockfile`, esegue `pnpm audit --audit-level high` e poi in quest'ordine `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:backend`; nessun passo ha `continue-on-error`, condizioni `if` o `|| true`, nessun passo ripete il numero di versione di Reqvire, e ogni script su più righe inizia con `set -euo pipefail`. Fallisce se manca una fase, se l'ordine differisce o se un controllo fallito non fa fallire il job.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [ci-workflow.test.ts](../../test/repository/ci-workflow.test.ts)
  * verify: [Controlli CI del client web](../Requirements/WebConversation.md#controlli-ci-del-client-web)
---

### Prova del workflow di pubblicazione dell'immagine

Leggere come testo `.github/workflows/publish-image.yml` ed esaminarne attivazione, controllo della versione, dipendenze fra job e ordine di costruzione, verifica e push; applicare l'espressione regolare del workflow a tag validi e non validi.

#### Details
La prova passa se il workflow si attiva soltanto al push di tag `v*` e la sua espressione regolare accetta soltanto `vMAJOR.MINOR.PATCH` senza zeri iniziali; la versione di `package.json` viene confrontata con il tag; i job `checks` e `secret-scan` richiamano `ci.yml` e `secret-scan.yml` e il job `publish` dipende da entrambi; il passo di build costruisce le immagini `linux/amd64` e `linux/arm64` ed esegue `scripts/verify-docker-image.mjs` su ciascuna senza alcun push, e i `docker push` compaiono soltanto nei passi successivi; le immagini ricevono i tag `<tag>-amd64` e `<tag>-arm64` di `ghcr.io/ambrogio-app/ambrogio-web`, il manifest del tag di release le riunisce e viene controllato che contenga esattamente le due piattaforme, e dopo il controllo il riferimento dell'immagine pubblicata è scritto nel riepilogo del job; il workflow non contiene `latest`. Fallisce se un push precede la verifica di entrambe le immagini, se la pubblicazione non dipende da CI e scansione dei segreti o se compare il tag `latest`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [publish-workflow.test.ts](../../test/repository/publish-workflow.test.ts)
  * verify: [Pubblicazione dell'immagine Docker](../Requirements/WebConversation.md#pubblicazione-dellimmagine-docker)
---

### Prova del workflow di scansione dei segreti

Leggere come testo `.github/workflows/secret-scan.yml` ed esaminarne attivazioni, checkout, installazione di gitleaks e scansione; eseguire il comando di scansione del workflow in un repository Git temporaneo, con una storia che contiene un token fittizio costruito durante la prova e con una storia priva di segreti.

#### Details
La prova passa se il workflow si attiva su push di qualunque branch, pull request, richiesta manuale e chiamata da altri workflow; il job `gitleaks`, chiamato `Gitleaks`, recupera l'intera storia con `fetch-depth: 0` e `persist-credentials: false`; versione, archivio e SHA-256 di gitleaks corrispondono al profilo comune di scansione dei segreti con gitleaks, l'archivio si scarica dalla release ufficiale, `sha256sum --check --strict` precede l'estrazione e lo script inizia con `set -euo pipefail`; la scansione esegue `gitleaks git --redact --no-banner --exit-code 1 .`; quel comando termina con stato 1 sulla storia con il token, senza riportarne il valore, e con stato 0 sulla storia pulita. Il repository temporaneo viene eliminato dopo la prova. Fallisce se una di queste condizioni manca, se gitleaks non è disponibile o se l'output riporta il valore del token.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [secret-scan-workflow.test.ts](../../test/repository/secret-scan-workflow.test.ts)
  * verify: [Scansione dei segreti nella CI della chat web](../Requirements/WebConversation.md#scansione-dei-segreti-nella-ci-della-chat-web)
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

### Prova dell'assenza di import del backend nella chat web

Leggere come testo ogni file TypeScript di produzione sotto `src/`, con l'estrazione degli specificatori di import ed export della prova delle regole di architettura, e risolvere gli specificatori relativi rispetto alla radice del repository.

#### Details
La prova passa se nessuno specificatore nomina un package dello scope `@ambrogio/`, che contiene i package del backend, né un percorso che contiene `ambrogio-backend` o che si risolve fuori dalla radice del repository, e se le stesse regole riconoscono come import del backend gli specificatori di esempio di ciascun tipo. Fallisce se un file di produzione importa codice del backend o se non vengono letti tutti i file TypeScript di `src/`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [backend-imports.test.ts](../../test/repository/backend-imports.test.ts)
  * verify: [Uso delle sole interfacce pubbliche del backend nella chat web](../Requirements/WebConversation.md#uso-delle-sole-interfacce-pubbliche-del-backend-nella-chat-web)
---

### Prova dell'hook pre-commit dei segreti della chat web

In un repository Git temporaneo con `.githooks/pre-commit` attivato tramite `core.hooksPath`, mettere in staging un file con un token fittizio costruito durante la prova e tentare il commit; ripetere con un file privo di segreti e con un `PATH` che contiene soltanto `git`, senza `gitleaks`.

#### Details
La prova passa se il commit con il token fittizio viene rifiutato e l'output non ne riporta il valore, il commit senza segreti riesce e, senza `gitleaks` nel `PATH`, il commit viene rifiutato con un messaggio che indica come installare gitleaks 8.30.1. Il repository temporaneo viene eliminato dopo la prova. Fallisce se uno dei tre esiti differisce o se gitleaks non è disponibile per la prova.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [pre-commit-hook.test.ts](../../test/repository/pre-commit-hook.test.ts)
  * verify: [Controllo dei segreti prima del commit della chat web](../Requirements/WebConversation.md#controllo-dei-segreti-prima-del-commit-della-chat-web)
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

Con `scripts/verify-docker-image.mjs`, avviare l'immagine costruita senza `config.json` e poi con un `config.json` di esempio montato in sola lettura; richiedere `index.html`, `config.json`, un file sotto `assets/` e un percorso inesistente; esaminare etichette, utente del processo, porta e contenuto dell'immagine e le esclusioni di `.dockerignore`.

#### Details
La prova passa se l'immagine dichiara le etichette `org.opencontainers.image.source` e `org.opencontainers.image.licenses` con i valori del contratto, `.dockerignore` contiene tutte le esclusioni del contratto, il processo non è root e ascolta sulla porta 8080, l'immagine non contiene `config.json`, senza file la richiesta riceve `404`, con il file montato lo restituisce, tutte le risposte hanno gli header di sicurezza del contratto, `index.html` e `config.json` hanno `Cache-Control: no-store`, i file sotto `assets/` hanno la cache immutabile e la versione di nginx non è esposta. Fallisce se manca uno di questi elementi.

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

### Prova dell'installazione congelata delle dipendenze

In un checkout pulito, attivare pnpm con Corepack ed eseguire `pnpm install --frozen-lockfile`, come fanno la CI e la fase di build dell'immagine.

#### Details
La prova passa se l'installazione termina senza errori, `pnpm-lock.yaml` resta invariato, `package-lock.json` non esiste, `packageManager` vale `pnpm@12.11.2` nessuna dipendenza esegue script di build fuori da `allowBuilds`, e se la fase `build` del `Dockerfile` dichiara `ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0` ed esegue `corepack enable` prima della copia del manifest e dell'installazione, senza `npm install --global` né `npx`. Fallisce se il lockfile non corrisponde a `package.json`, se l'installazione lo modifica o se uno script di build di una dipendenza non ammessa viene eseguito.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [stack-versions.test.ts](../../test/repository/stack-versions.test.ts)
  * verify: [Installazione riproducibile delle dipendenze](../Requirements/WebConversation.md#installazione-riproducibile-delle-dipendenze)
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

In jsdom con Testing Library, aprire la pagina con un backend simulato: verificare la voce «Nuova chat», inviare il primo turno e osservare risposta progressiva e nome della voce; aprire una conversazione conservata, anche iniziata da un altro client, e continuarla; caricare elenco e pagina successiva, aggiornare e verificare la ripartenza dalla prima pagina; simulare uno storico non leggibile, un turno `pending` poi concluso, un turno `interrupted`; durante un turno aprire un'altra chat, inviarvi un turno e tornare indietro; ripetere a una larghezza inferiore a 720 pixel e nelle due lingue. Eseguire inoltre la build di produzione con Vite in una directory temporanea ed esaminare i fogli di stile prodotti, perché jsdom non applica i fogli di stile della build.

#### Details
La prova passa se la schermata rispetta il contratto: anteprime di 60 caratteri o identificativo di 8, ripartenza dell'elenco senza cursore dopo «Aggiorna», stato in elaborazione con invito ad aggiornare e scambio concluso alla consultazione successiva, avviso di risposta interrotta, invio bloccato solo nella chat con il turno in corso, `Invio` e `Maiusc+Invio` come previsto, pannello delle conversazioni sotto 720 pixel e testi fissi nella lingua scelta secondo il dizionario; e se i fogli di stile della build contengono i colori dei temi chiaro e scuro, il font della pagina e l'altezza a tutta finestra di `html`, `body` e della radice dell'applicazione. Fallisce se la pagina perde la conversazione corrente, invia due turni nella stessa conversazione, blocca le altre chat durante un turno o se la build perde gli stili globali. Lo scorrimento separato delle due aree con il campo di scrittura visibile si osserva nella dimostrazione nel browser.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [ChatApplication.test.tsx](../../test/app/ChatApplication.test.tsx)
  * satisfiedBy: [build-styles.test.ts](../../test/app/build-styles.test.ts)
  * satisfiedBy: [chat-state.test.ts](../../test/features/chat/model/chat-state.test.ts)
  * satisfiedBy: [conversation-list.test.ts](../../test/features/conversations/model/conversation-list.test.ts)
  * satisfiedBy: [conversations-api.test.ts](../../test/features/conversations/model/conversations-api.test.ts)
  * verify: [Anteprima delle conversazioni nella barra laterale della chat web](../Requirements/WebConversation.md#anteprima-delle-conversazioni-nella-barra-laterale-della-chat-web)
  * verify: [Apertura e continuazione di una conversazione conservata](../Requirements/WebConversation.md#apertura-e-continuazione-di-una-conversazione-conservata)
  * verify: [Navigazione durante un turno in corso](../Requirements/WebConversation.md#navigazione-durante-un-turno-in-corso)
  * verify: [Nuova chat iniziale della chat web](../Requirements/WebConversation.md#nuova-chat-iniziale-della-chat-web)
  * verify: [Ripartenza dell'elenco conversazioni della chat web](../Requirements/WebConversation.md#ripartenza-dellelenco-conversazioni-della-chat-web)
  * verify: [Stato del turno in elaborazione alla riapertura nella chat web](../Requirements/WebConversation.md#stato-del-turno-in-elaborazione-alla-riapertura-nella-chat-web)
  * verify: [Vista a due aree della conversazione](../Requirements/WebConversation.md#vista-a-due-aree-della-conversazione)
---

### Prova delle regole di architettura del client web

Leggere come testo ogni file TypeScript di produzione sotto `src/`, tolti i commenti, ed estrarre con un'espressione regolare gli specificatori di `import … from '…'`, `export … from '…'`, `import '…'` e `import('…')` letterali, dopo aver controllato l'estrazione su un file di esempio; cercare nello stesso testo, tolte anche le stringhe, i riferimenti alle API globali del browser; esaminare inoltre i nomi dei file di `src/` e la struttura di `test/`.

#### Details
La prova passa se le parti `model/` e il codice di `src/shared/` esterno a `src/shared/ui/` sono file `.ts` che non importano React, parti `ui/` né `src/app/` e non nominano `document`, `window`, `navigator`, `localStorage`, `sessionStorage` o `crypto` se non come proprietà o chiave di un oggetto, né costruiscono `new WebSocket`; nessuna funzionalità importa un'altra funzionalità; soltanto i file di `src/app/` importano più funzionalità; i file TypeScript non React hanno nomi in kebab-case e i componenti in PascalCase, con l'eccezione di `src/app/main.tsx`; i file di test si chiamano `<nome>.test.ts` o `<nome>.test.tsx` e ogni cartella di `test/`, tranne `test/support/` e `test/repository/`, corrisponde a una cartella di `src/`. Fallisce se una di queste regole è violata, se l'estrazione sul file di esempio non restituisce esattamente gli specificatori attesi o se non vengono letti tutti i file TypeScript di `src/`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [architecture.test.ts](../../test/repository/architecture.test.ts)
  * verify: [Separazione del nucleo dall'interfaccia](../Requirements/WebConversation.md#separazione-del-nucleo-dallinterfaccia)
---

### Prova delle versioni fissate dello stack

Leggere `package.json`, `tsconfig.json`, `vite.config.ts` e `Dockerfile` e confrontarli con i contratti «Stack e build del client web» e «Profilo di installazione delle dipendenze del client web» letti dal modello.

#### Details
La prova passa se ogni dipendenza di `package.json` è fissata a una versione esatta `MAJOR.MINOR.PATCH`; `typescript` e `vitest` hanno le versioni indicate nel contratto dello stack e `react` e `react-dom` la versione principale indicata; `react-markdown`, `remark-gfm` e `vite` sono dipendenze del progetto; `packageManager` vale `pnpm@` seguito dalla versione del profilo di installazione; `engines.node` richiede la versione di Node.js del contratto, la stessa della fase di build del `Dockerfile`; TypeScript è in modalità `strict`; lo script `build` è `vite build` con uscita in `dist`; la fase finale del `Dockerfile` parte da `nginxinc/nginx-unprivileged`, copia soltanto `dist` e la configurazione nginx e non dichiara `CMD` né `ENTRYPOINT` propri. Fallisce se una versione non è esatta o differisce dal contratto o se l'esecuzione richiede un processo server proprio.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [stack-versions.test.ts](../../test/repository/stack-versions.test.ts)
  * verify: [Stack del client web](../Requirements/WebConversation.md#stack-del-client-web)
---

### Prova di integrazione della chat web con il backend affiancato

Con il checkout di `ambrogio-backend` affiancato nella cartella di lavoro, oppure indicato da `AMBROGIO_BACKEND_REPO`, compilato, avviare il server conversazionale tramite l'ingresso di prova pubblico del backend, con un produttore di risposte deterministico e il componente HTTP configurato con un'origine di esempio autorizzata. Usare il nucleo del client web per inviare turni, con esito completato, errore dopo frammenti e interruzione, e per leggere elenco e storico; aprire il canale e leggere l'elenco con l'origine autorizzata e con un'origine non autorizzata.

#### Details
La prova passa se il client conversa e consulta tramite le sole interfacce pubbliche, il backend valida i messaggi con lo schema, l'origine autorizzata apre la sessione e riceve gli header CORS e quella non autorizzata viene respinta. Fallisce se il checkout del backend manca o non è compilato, con un messaggio che lo indica, se un messaggio è rifiutato dallo schema o se la prova o il client importano dal backend moduli diversi dall'ingresso di prova pubblico. La prova riporta il commit del backend usato e gira nella CI dopo il checkout affiancato.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [backend.test.ts](../../integration/backend.test.ts)
  * satisfiedBy: [vitest.backend.config.ts](../../vitest.backend.config.ts)
  * verify: [Client conversazionale nel browser](../Requirements/WebConversation.md#client-conversazionale-nel-browser)
  * verify: [Uso delle sole interfacce pubbliche del backend nella chat web](../Requirements/WebConversation.md#uso-delle-sole-interfacce-pubbliche-del-backend-nella-chat-web)
---

### Prova dei controlli del modello nell'hook pre-commit della chat web

In una cartella temporanea, creare un repository Git con l'hook `.githooks/pre-commit` del repository attivato tramite `core.hooksPath` e, accanto, una cartella `ambrogio-model` con uno script `scripts/model-checks` fittizio che registra la propria esecuzione e termina con esito riuscito oppure con un messaggio e un esito non riuscito; tentare un commit senza segreti con lo script che riesce, con lo script che fallisce, senza la cartella `ambrogio-model` affiancata e con un file che contiene un token fittizio costruito durante la prova.

#### Details
La prova passa se con lo script che riesce il commit viene creato e lo script risulta eseguito; se con lo script che fallisce il commit viene rifiutato e l'output riporta il messaggio dello script; se senza `ambrogio-model` affiancato il commit viene rifiutato con il messaggio del contratto «Controlli del modello nell'hook pre-commit»; e se il commit con il token viene rifiutato senza eseguire lo script. Fallisce se uno di questi esiti differisce. I controlli reali del modello non vengono eseguiti dalla prova: li esegue la CI con `model-checks`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [pre-commit-hook.test.ts](../../test/repository/pre-commit-hook.test.ts)
  * verify: [Controlli del modello prima del commit della chat web](../Requirements/WebConversation.md#controlli-del-modello-prima-del-commit-della-chat-web)
---

### Prova dell'audit delle dipendenze della chat web

Leggere come testo `.github/workflows/ci.yml` e `pnpm-workspace.yaml` ed esaminare il passo dell'audit e le eccezioni dichiarate.

#### Details
La prova passa se il job `checks` esegue `pnpm audit --audit-level high` nella cartella `workspace/ambrogio-web`, dopo `pnpm install --frozen-lockfile` della chat web e prima di `pnpm typecheck`; se nessun passo usa `--ignore`, `--ignore-unfixable`, `--ignore-registry-errors`, `--prod` o `--dev`; e se ogni voce di `auditConfig.ignoreGhsas` di `pnpm-workspace.yaml`, quando presente, è un singolo identificativo GHSA, senza altre chiavi di `auditConfig`. Fallisce se il passo manca, è in un'altra posizione o usa un livello diverso, o se un'eccezione non nomina un singolo avviso. L'esito dell'audit sugli avvisi del registro si osserva nella CI, perché richiede il registro npm.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [ci-workflow.test.ts](../../test/repository/ci-workflow.test.ts)
  * verify: [Audit delle dipendenze nella CI della chat web](../Requirements/WebConversation.md#audit-delle-dipendenze-nella-ci-della-chat-web)
---

### Prova del comando di verifica completo della chat web

Leggere lo script `verify` di `package.json` e i comandi del job `checks` di `.github/workflows/ci.yml`.

#### Details
La prova passa se lo script esegue, uniti da `&&`, `../ambrogio-model/scripts/model-checks`, `pnpm install --frozen-lockfile`, `pnpm audit --audit-level high`, `(cd ../ambrogio-backend && pnpm install --frozen-lockfile && pnpm build)` e poi gli stessi comandi `pnpm` che il job esegue nella cartella della chat web dopo l'audit, nello stesso ordine; e se `AGENTS.md` cita `pnpm verify`. Fallisce se un controllo della CI manca dallo script, se l'ordine differisce o se i comandi non sono uniti da `&&`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client web](#verifica-del-client-web)
  * satisfiedBy: [verify-command.test.ts](../../test/repository/verify-command.test.ts)
  * verify: [Comando di verifica completo della chat web](../Requirements/WebConversation.md#comando-di-verifica-completo-della-chat-web)
---
