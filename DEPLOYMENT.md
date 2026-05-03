# Deployment su Vercel

## 🔧 Prerequisiti

- Account Vercel
- GitHub repo (sia backend che frontend)
- API Keys (TMDB_API_KEY, WATCHMODE_API_KEY)

---

## 📦 Passo 1: Preparare i repo

### Backend
1. Crea un nuovo repo GitHub per il backend (es: `cinefinder-backend`)
2. Sposta i file:
   ```bash
   cp -r backend/* cinefinder-backend/
   ```
3. Commit e push

### Frontend
1. Crea un nuovo repo GitHub per il frontend (es: `cinefinder-frontend`)
2. Sposta i file:
   ```bash
   cp -r frontend/* cinefinder-frontend/
   ```
3. Commit e push

---

## 🚀 Passo 2: Deployare il Backend su Railway ⭐ CONSIGLIATO

Railway supporta FastAPI nativamente ed è molto più semplice di Vercel per Python.

1. Vai su [railway.app](https://railway.app)
2. Clicca **New Project**
3. Seleziona **Deploy from GitHub** e scegli il repo `cinefinder-backend`
4. Railway rileva automaticamente che è un progetto Python
5. **Environment** → Aggiungi le variabili:
   ```
   TMDB_API_KEY=your_key_here
   WATCHMODE_API_KEY=your_key_here
   ```
6. Railway deploy automaticamente!

**Copia l'URL del backend** dal Railway dashboard (es: `https://cinefinder-backend-production-xxxx.railway.app`)

### Alternativa: Render

Se preferisci Render invece di Railway:
1. Vai su [render.com](https://render.com)
2. **New** → **Web Service**
3. Collega il repo `cinefinder-backend`
4. Configurazione:
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.index:app --host 0.0.0.0 --port 8000`
5. Aggiungi le environment variables
6. Deploy!

### ❌ Vercel (NON consigliato per Python)
Vercel supporta Python ma con limitazioni significative. FastAPI funziona meglio su Railway o Render.

---

## 🎨 Passo 3: Deployare il Frontend su Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca **New Project**
3. Seleziona il repo `cinefinder-frontend`
4. Configurazione:
   - **Framework**: Next.js
   - **Root Directory**: `/` (lascia di default)
   
5. **Environment Variables** → Aggiungi:
   ```
   NEXT_PUBLIC_API_URL=https://cinefinder-backend-abc123.vercel.app
   ```
   *(Sostituisci con l'URL del tuo backend)*

6. Deploy!

---

## ✅ Testing

1. Vai su `https://tuo-frontend.vercel.app`
2. Prova una ricerca
3. Controlla che i dati arrivino dal backend

---

## 🔧 Troubleshooting

### "API not responding"
- Verifica che il backend sia deployato e funzionante
- Controlla che le API keys siano corrette
- Vedi i log: Vercel Dashboard → Deployments → Logs

### "CORS Error"
- Il backend ha CORS già configurato per tutti gli origin
- Se continua, aggiungi il dominio specifico nel backend

### Cache non funziona
- Il cache è in-memory (24h)
- Le Serverless Functions su Vercel non hanno filesystem persistente
- Questo è normale e per ora va bene

---

## 📝 Note

- Backend memory: 3008 MB (aumentabile se necessario)
- Backend timeout: 60 secondi (aumentabile con upgrade a pagamento)
- Frontend: Next.js ottimizzato automaticamente da Vercel

Buon deploy! 🎉
