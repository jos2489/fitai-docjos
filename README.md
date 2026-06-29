# FitAi by Doc Jos — App di allenamento intelligente 💪

Web App / PWA installabile su **iPhone e Android** (un solo codice) che genera e
aggiorna programmi di allenamento seguendo principi di programmazione basati
sulle evidenze. Nessun account, nessun server: ogni utente fa il proprio
onboarding personale e tutti i dati restano sul suo dispositivo.

## Cosa fa
- **Onboarding personale**: FitAi si presenta come assistente di Doc Jos e
  raccoglie nome, sesso, età, **peso, altezza**, obiettivo (ipertrofia / forza /
  dimagrimento / ricomposizione), esperienza, attrezzatura, giorni a settimana e
  durata del mesociclo per creare il piano più preciso.
- **Generatore "AI" basato su evidenze** ([`src/engine.js`](src/engine.js)):
  sceglie lo split in base alla frequenza (Full Body, PPL, Upper/Lower…),
  imposta volume (zona MEV→MAV) in base all'esperienza, rep range / RIR /
  recuperi in base all'obiettivo, applica **sovraccarico progressivo**
  settimanale e inserisce una **settimana di scarico (deload)** nei mesocicli
  lunghi.
- **Programmazione completa** divisa per settimane e giornate.
- **Tracciamento pesi e ripetizioni** per ogni serie, salvati e **ri-proposti
  la volta successiva** come base per la progressione.
- **Note per ogni seduta**.
- **Timer di recupero** tra le serie, con beep sonoro (Web Audio) e vibrazione.
- **Link ai video di esecuzione** per ogni esercizio (ricerca YouTube in
  italiano).
- **Storico** di tutti gli allenamenti completati, con data, carichi, volume e
  note.
- **Grafici dei progressi**: volume per seduta, serie per gruppo muscolare,
  andamento del peso corporeo.
- **Adattamento del piano**: dai un feedback (facile / giusto / duro) e l'app
  ricalibra il volume.
- **Grafica accattivante**, dark theme, ottimizzata per mobile.

## Avvio in locale
```bash
npm install
npm run dev      # apri http://localhost:5173
```

Per provarla **dal telefono** (stessa rete Wi-Fi): avvia `npm run dev` e apri
sullo smartphone l'indirizzo "Network" mostrato nel terminale
(es. `http://192.168.1.42:5173`).

## Pubblicare online (modo più semplice — Netlify Drop)
1. Esegui `npm run build` (crea la cartella `dist/`). È già pronto anche lo zip
   `FitAi-DocJos-dist.zip`.
2. Vai su **https://app.netlify.com/drop**.
3. Trascina la **cartella `dist`** (o lo zip) nella pagina: in pochi secondi
   ottieni un indirizzo pubblico HTTPS tipo `https://nome-a-caso.netlify.app`.
4. Crea un account gratuito (con Google) per rendere il sito permanente e poter
   rinominare il dominio (es. `fitai-docjos.netlify.app`).

Ogni volta che aggiorni l'app, rifai `npm run build` e ri-trascina `dist`.
In alternativa puoi collegare un repo Git a Netlify/Vercel: il file
[`netlify.toml`](netlify.toml) è già configurato per build automatiche.

## Installare come app sul telefono (PWA)
Dopo aver pubblicato (passi sopra), apri l'indirizzo sul telefono:
- **iPhone**: in Safari → Condividi → *Aggiungi alla schermata Home*.
- **Android**: in Chrome → menu ⋮ → *Installa app / Aggiungi a schermata Home*.

L'app si apre a tutto schermo come una nativa e funziona anche offline. Ogni
persona che la installa fa il proprio onboarding personale (nome, peso, altezza,
obiettivo…) e i suoi dati restano solo sul suo dispositivo.

## Struttura
```
src/
  engine.js              # motore di programmazione (libreria esercizi + logica)
  storage.js             # persistenza su localStorage
  App.jsx                # navigazione e stato
  components/
    Onboarding.jsx       # wizard di profilazione
    Home.jsx             # piano: settimane + giornate
    Workout.jsx          # logging + timer di recupero + link video
    Stats.jsx            # grafici dei progressi
    History.jsx          # storico allenamenti completati
    Profile.jsx          # profilo + adattamento del piano
public/
  manifest.webmanifest   # configurazione PWA
  sw.js                  # service worker (offline)
  icon.svg               # icona app
```

## Note
- Il generatore è **offline e deterministico** (regole basate su evidenze),
  quindi funziona subito senza chiavi API né costi. È predisposto per essere in
  futuro affiancato a un modello (es. Claude API) per rifiniture in linguaggio
  naturale.
- Per la massima compatibilità delle icone su tutti i dispositivi puoi
  aggiungere `icon-192.png` e `icon-512.png` in `public/` e re-inserirle nel
  manifest.
- Non è un consiglio medico: consulta un professionista prima di iniziare un
  programma di allenamento.
