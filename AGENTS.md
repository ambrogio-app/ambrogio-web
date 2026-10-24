# Istruzioni per gli agenti

Questo repository contiene esclusivamente il client conversazionale web di Ambrogio, distribuito come immagine container facoltativa. Le regole comuni a tutti i repository sono in `ambrogio-model/AGENTS.md` e valgono anche qui; questo file aggiunge soltanto le indicazioni proprie della chat web.

## Un solo modello

- La cartella `system-model/` di questo repository è una parte del modello Reqvire unico di Ambrogio, insieme a quelle di `ambrogio-model`, `ambrogio-backend`, `ambrogio-satellite` e `ambrogio-cli`, affiancati nella stessa cartella di lavoro. Il modello si legge, si modifica e si valida da quella cartella, con la versione di Reqvire scritta in `ambrogio-model/.reqvire-version`, come descritto in `ambrogio-model/AGENTS.md`; i controlli dell'intero modello sono `ambrogio-model/scripts/model-checks`.
- Il backend possiede il protocollo `ambrogio.v1` e le API HTTP pubbliche. I requisiti della chat web si collegano direttamente ai contratti del backend con Contract References, senza fissarne una revisione, e raffinano con `derivedFrom` le decisioni comuni di `ambrogio-model` e le regole del protocollo per i client registrate nel backend. La configurazione di backend e satellite non appartiene a questo client.
- Prima di lavorare, controllare `git rev-parse --show-toplevel`, il branch di ciascun repository della cartella di lavoro e i sottomodelli con `submodels`. Un cambiamento che tocca più repository usa lo stesso nome di branch in ciascuno.

## Metodo

- Prima di introdurre una scelta tecnica o architetturale nuova, presentare alternative e conseguenze, concordare la decisione con la persona e registrarla nel modello prima del codice. Le decisioni già prese non richiedono nuova conferma.
- Per nuove capacità o modifiche funzionali seguire l'ordine di `ambrogio-model/AGENTS.md`: capability, concetti e ontologie se utili, requisiti, contratti, contratti semantici se necessari, verifiche, test e implementazione, validazione e revisione. Leggere requisiti, contratti e verifiche, anche quelli del backend da cui la chat web dipende, prima di cambiare il comportamento pubblico.
- Quando un contratto pubblico del backend cambia, l'analisi d'impatto composita (`ambrogio-model/scripts/change-impact-composite`) segnala i requisiti e le verifiche della chat web da rivedere; la prova di integrazione con il backend affiancato (`pnpm test:backend`) ne esercita il comportamento. Valutare l'impatto sulla documentazione utente in `ambrogio-docs`. Al termine, riportare modifiche, controlli e attività ancora aperte.

## Verifica locale

- `pnpm verify` esegue in locale, nell'ordine della CI, i controlli dell'intero modello, l'installazione congelata, l'audit delle dipendenze, la preparazione del backend affiancato, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:backend`; richiede `ambrogio-model` e `ambrogio-backend` affiancati e `gitleaks` nel `PATH`, e si ferma al primo controllo fallito. Eseguirlo prima di ogni push.
- pnpm è alla versione di `packageManager` di `package.json`, attivato con Corepack nella CI e nell'immagine.

## Segreti e dati di installazione

- Il repository usa gitleaks secondo `ambrogio-model/AGENTS.md`: in CI su tutta la storia (`.github/workflows/secret-scan.yml`, richiesto anche dalla pubblicazione dell'immagine) e in locale con l'hook `.githooks/pre-commit`, da attivare in ogni clone con `git config core.hooksPath .githooks` e con `gitleaks` nel `PATH`. Dopo la scansione l'hook esegue i controlli dell'intero modello con `../ambrogio-model/scripts/model-checks` e blocca il commit se falliscono o se `ambrogio-model` non è affiancato. Non aggirare l'hook con `--no-verify`. Esempi e test usano solo valori segnaposto.
- Modello, codice, test, commit e documentazione non riportano dati di una specifica installazione, secondo `ambrogio-model/AGENTS.md`; `config.example.json` usa soltanto indirizzi di esempio.
