/* Empresa Exemplo Chat: gravação da PRÓPRIA voz durante as chamadas, para transcrição no servidor.
 * Como cada pessoa grava só a sua voz, o servidor sempre sabe quem falou.
 * - Liga sozinho ao entrar numa chamada; mostra aviso na tela e deixa a pessoa desligar.
 * - Usa o microfone que o Talk já abriu (não abre um segundo, para não atrapalhar a chamada).
 * - Só grava com o microfone ligado no Talk.
 * - Cada trecho vai para uma fila guardada no aparelho e é reenviado até o servidor confirmar.
 */
(function () {
	'use strict'

	const URL_AUDIO = OC.generateUrl('/apps/mobile_installer/api/audio')
	const URL_PRESENCA = OC.generateUrl('/apps/mobile_installer/api/presenca')
	const CHAVE_DESLIGADA = 'exemplo_transcricao_desligada'
	const TROCA_MIN = 30000 // troca de arquivo após 30 s, esperando uma pausa na fala
	const TROCA_MAX = 75000 // troca obrigatória após 75 s
	const PAUSA_MS = 500

	const trilhasVistas = []
	let token = null
	let gravador = null
	let tempoInicioTrecho = 0
	let ultimoSom = 0
	let analisador = null
	let dadosAnalise = null
	let ctxAudio = null
	let origemAnalise = null
	let aviso = null
	let ultimoBatimento = 0
	let ocupado = false
	const filaMemoria = []

	// ---- guarda o microfone que o Talk abrir (precisa rodar antes da chamada) ----
	try {
		const md = navigator.mediaDevices
		const original = md.getUserMedia.bind(md)
		md.getUserMedia = async function (restricoes) {
			const fluxo = await original(restricoes)
			try { fluxo.getAudioTracks().forEach((t) => trilhasVistas.push(t)) } catch (e) { /* ok */ }
			return fluxo
		}
	} catch (e) { /* sem mediaDevices */ }

	function trilhaAtual() {
		for (let i = trilhasVistas.length - 1; i >= 0; i--) {
			if (trilhasVistas[i].readyState === 'live') return trilhasVistas[i]
		}
		return null
	}

	function guarda(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (e) { /* ok */ } }
	function le(k) { try { return localStorage.getItem(k) } catch (e) { return null } }

	function store() {
		try { return window.OCA.Talk.instance.$store } catch (e) { return null }
	}

	// Código da conversa: a rota do Talk (/call/<código>); a URL serve de reserva.
	function tokenDaConversa() {
		try {
			const t = window.OCA.Talk.instance.$route.params.token
			if (t) return t
		} catch (e) { /* tenta pela URL */ }
		const m = location.pathname.match(/\/(?:call|spreed)\/([a-z0-9]{4,32})/)
		return m ? m[1] : null
	}

	function tokenDaChamada() {
		const s = store()
		if (!s) return null
		try {
			const t = tokenDaConversa()
			if (t && s.getters.isInCall(t)) return t
		} catch (e) { /* sem chamada */ }
		return null
	}

	// Botão de microfone do Talk: "Desativar microfone" = ligado; "Ativar microfone" = no mudo.
	function microfoneLigado() {
		for (const b of document.querySelectorAll('button[aria-label]')) {
			const t = (b.getAttribute('aria-label') || '').toLowerCase()
			if (t.startsWith('desativar microfone')) return true
			if (t.startsWith('ativar microfone')) return false
		}
		return false
	}

	// ---- aviso na tela ----
	function mostrarAviso(msg, botao) {
		if (!aviso) {
			aviso = document.createElement('div')
			// Faixa no alto, no centro: fica no espaço livre entre o cabeçalho e a barra da chamada,
			// não cobre os botões do Talk e não bloqueia cliques (só o botão dela recebe clique).
			aviso.style.cssText = 'position:fixed;top:48px;left:34%;transform:translateX(-50%);z-index:2000;max-width:92vw;display:flex;align-items:center;gap:8px;padding:3px 10px;border-radius:14px;background:rgba(34,34,34,.92);color:#fff;font:12px/1.3 sans-serif;pointer-events:none'
			document.body.appendChild(aviso)
		}
		if (aviso.dataset.msg === msg) return
		aviso.dataset.msg = msg
		aviso.textContent = ''
		const t = document.createElement('span')
		t.textContent = msg
		aviso.appendChild(t)
		if (botao) {
			const b = document.createElement('button')
			b.textContent = botao.texto
			b.style.cssText = 'flex:none;padding:2px 8px;border:0;border-radius:10px;background:#2563eb;color:#000;font:bold 11px sans-serif;cursor:pointer;pointer-events:auto'
			b.onclick = botao.acao
			aviso.appendChild(b)
		}
	}

	function esconderAviso() {
		if (aviso) { aviso.remove(); aviso = null }
	}

	// ---- fila de envio (IndexedDB, com cópia em memória se o navegador não deixar) ----
	let bancoPromessa = null
	function banco() {
		if (!bancoPromessa) {
			bancoPromessa = new Promise((resolve) => {
				try {
					const r = indexedDB.open('exemplo_transcricao', 1)
					r.onupgradeneeded = () => r.result.createObjectStore('fila', { keyPath: 'id', autoIncrement: true })
					r.onsuccess = () => resolve(r.result)
					r.onerror = () => resolve(null)
				} catch (e) { resolve(null) }
			})
		}
		return bancoPromessa
	}

	async function guardarNaFila(item) {
		const db = await banco()
		if (!db) { filaMemoria.push(item); return }
		await new Promise((resolve) => {
			const tx = db.transaction('fila', 'readwrite')
			tx.objectStore('fila').add(item)
			tx.oncomplete = resolve
			tx.onerror = () => { filaMemoria.push(item); resolve() }
		})
	}

	async function lerFila() {
		const db = await banco()
		const daMemoria = filaMemoria.map((i, n) => ({ ...i, id: 'm' + n }))
		if (!db) return daMemoria
		const itens = await new Promise((resolve) => {
			const req = db.transaction('fila', 'readonly').objectStore('fila').getAll()
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => resolve([])
		})
		return itens.concat(daMemoria)
	}

	async function removerDaFila(id) {
		if (typeof id === 'string') { filaMemoria.splice(Number(id.slice(1)), 1); return }
		const db = await banco()
		if (!db) return
		await new Promise((resolve) => {
			const tx = db.transaction('fila', 'readwrite')
			tx.objectStore('fila').delete(id)
			tx.oncomplete = resolve
			tx.onerror = resolve
		})
	}

	async function enviarFila() {
		if (ocupado) return
		ocupado = true
		try {
			for (const item of await lerFila()) {
				const form = new FormData()
				form.append('token', item.token)
				form.append('inicio', String(item.inicio))
				form.append('agora', String(Date.now()))
				form.append('duracao', String(item.duracao))
				form.append('audio', item.blob, 'trecho.' + (item.blob.type.includes('mp4') ? 'm4a' : 'webm'))
				const r = await fetch(URL_AUDIO, { method: 'POST', headers: { requesttoken: OC.requestToken }, body: form, credentials: 'same-origin' })
				if (r.ok || r.status === 400 || r.status === 403) {
					await removerDaFila(item.id) // aceito (ou recusado de vez: não adianta reenviar)
				} else {
					break // servidor com problema: tenta tudo de novo no próximo ciclo
				}
			}
		} catch (e) { /* sem internet: tenta depois */ }
		ocupado = false
	}

	// ---- gravação ----
	function tipoSuportado() {
		if (typeof MediaRecorder === 'undefined') return null
		for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
			if (MediaRecorder.isTypeSupported(t)) return t
		}
		return ''
	}

	function prepararAnalise(trilha) {
		try {
			ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)()
			if (ctxAudio.state === 'suspended') ctxAudio.resume()
			if (origemAnalise) origemAnalise.disconnect()
			origemAnalise = ctxAudio.createMediaStreamSource(new MediaStream([trilha]))
			analisador = ctxAudio.createAnalyser()
			analisador.fftSize = 1024
			dadosAnalise = new Uint8Array(analisador.fftSize)
			origemAnalise.connect(analisador)
		} catch (e) { analisador = null }
	}

	function haSom() {
		if (!analisador) return true
		analisador.getByteTimeDomainData(dadosAnalise)
		let maior = 0
		for (let i = 0; i < dadosAnalise.length; i++) maior = Math.max(maior, Math.abs(dadosAnalise[i] - 128))
		return maior > 6
	}

	function iniciarTrecho(trilha) {
		const tipo = tipoSuportado()
		const rec = new MediaRecorder(new MediaStream([trilha]), tipo ? { mimeType: tipo, audioBitsPerSecond: 32000 } : undefined)
		const partes = []
		const inicio = Date.now()
		const tokenDoTrecho = token
		rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data) }
		rec.onstop = () => {
			const duracao = Date.now() - inicio
			if (duracao < 1500 || !partes.length) return
			const blob = new Blob(partes, { type: rec.mimeType || tipo || 'audio/webm' })
			guardarNaFila({ token: tokenDoTrecho, inicio, duracao, blob }).then(enviarFila)
		}
		rec.start()
		gravador = rec
		tempoInicioTrecho = inicio
		ultimoSom = inicio
	}

	function fecharTrecho() {
		const r = gravador
		gravador = null
		if (r && r.state !== 'inactive') { try { r.stop() } catch (e) { /* ok */ } }
	}

	function batimento(estado) {
		const agora = Date.now()
		if (agora - ultimoBatimento < 20000 || !token) return
		ultimoBatimento = agora
		fetch(URL_PRESENCA, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', requesttoken: OC.requestToken },
			body: JSON.stringify({ token, estado }),
			credentials: 'same-origin',
		}).catch(() => { /* ok */ })
	}

	function avisoLigado() {
		mostrarAviso('🔴 Transcrevendo (só a sua voz)', { texto: 'Desligar', acao: desligar })
	}

	function avisoDesligado() {
		mostrarAviso('Transcrição desligada para você.', { texto: 'Ligar de novo', acao: () => { guarda(CHAVE_DESLIGADA, null); ciclo() } })
	}

	function desligar() {
		guarda(CHAVE_DESLIGADA, '1')
		fecharTrecho()
		avisoDesligado()
		batimento('desligado')
	}

	function ciclo() {
		const novo = tokenDaChamada()
		if (novo !== token) {
			fecharTrecho()
			token = novo
			ultimoBatimento = 0
			if (!token) { esconderAviso(); return }
		}
		if (!token) return

		if (!tipoSuportado()) {
			mostrarAviso('Este navegador não consegue gravar para a transcrição. Use o Google Chrome, o Microsoft Edge ou o Safari atualizado.')
			batimento('sem-suporte')
			return
		}
		if (le(CHAVE_DESLIGADA) === '1') {
			avisoDesligado()
			batimento('desligado')
			return
		}
		avisoLigado()

		if (!microfoneLigado()) {
			fecharTrecho()
			batimento('mudo')
			return
		}
		const trilha = trilhaAtual()
		if (!trilha) {
			fecharTrecho()
			batimento('sem-microfone')
			return
		}

		if (!gravador || gravador.state === 'inactive') {
			prepararAnalise(trilha)
			iniciarTrecho(trilha)
		} else {
			const agora = Date.now()
			if (haSom()) ultimoSom = agora
			const duracao = agora - tempoInicioTrecho
			const naPausa = agora - ultimoSom >= PAUSA_MS
			if ((duracao >= TROCA_MIN && naPausa) || duracao >= TROCA_MAX) {
				fecharTrecho()
				iniciarTrecho(trilha)
			}
		}
		batimento('gravando')
	}

	setInterval(ciclo, 250)
	setInterval(enviarFila, 10000)
	window.addEventListener('online', enviarFila)
	window.addEventListener('pagehide', fecharTrecho)
	enviarFila() // manda o que sobrou de uma chamada anterior
})()
