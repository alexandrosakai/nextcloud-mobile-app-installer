/* Empresa Exemplo Chat: avisos de mensagem nova.
 * - toca um som curto a cada notificação nova do Conversas (Talk)
 * - pisca o título da aba enquanto houver mensagem não vista
 * - mostra o número de mensagens no ícone do app instalado (badge)
 */
(function () {
	'use strict'

	const INTERVALO = 15000
	const URL = OC.generateUrl('/ocs/v2.php/apps/notifications/api/v2/notifications').replace('/index.php', '') + '?format=json'
	const vistas = new Set()
	let primeira = true
	let etag = null
	let pendentes = 0
	let tituloBase = document.title
	let piscando = null
	let ctx = null

	// Navegadores só liberam som depois de um clique/toque da pessoa.
	function liberarSom() {
		try {
			ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
			if (ctx.state === 'suspended') ctx.resume()
		} catch (e) { /* sem som */ }
	}
	['click', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, liberarSom, { passive: true }))

	function bip() {
		if (!ctx || ctx.state !== 'running') return
		const t = ctx.currentTime
		;[[880, 0], [1175, 0.16]].forEach(([freq, atraso]) => {
			const osc = ctx.createOscillator()
			const ganho = ctx.createGain()
			osc.type = 'sine'
			osc.frequency.value = freq
			ganho.gain.setValueAtTime(0.0001, t + atraso)
			ganho.gain.exponentialRampToValueAtTime(0.25, t + atraso + 0.02)
			ganho.gain.exponentialRampToValueAtTime(0.0001, t + atraso + 0.22)
			osc.connect(ganho).connect(ctx.destination)
			osc.start(t + atraso)
			osc.stop(t + atraso + 0.25)
		})
	}

	function ativa() {
		return !document.hidden && document.hasFocus()
	}

	function atualizaBadge() {
		try {
			if (pendentes > 0 && navigator.setAppBadge) navigator.setAppBadge(pendentes)
			else if (navigator.clearAppBadge) navigator.clearAppBadge()
		} catch (e) { /* sem suporte */ }
	}

	function pararPiscar() {
		if (piscando) {
			clearInterval(piscando)
			piscando = null
			if (document.title.startsWith('💬')) document.title = tituloBase
		}
	}

	function piscar() {
		if (piscando || pendentes === 0 || ativa()) return
		let ligado = false
		piscando = setInterval(() => {
			if (pendentes === 0 || ativa()) {
				pararPiscar()
				return
			}
			ligado = !ligado
			if (ligado) {
				if (!document.title.startsWith('💬')) tituloBase = document.title
				document.title = '💬 (' + pendentes + ') Nova mensagem!'
			} else {
				document.title = tituloBase
			}
		}, 1000)
	}

	async function verificar() {
		try {
			const cabecalhos = { 'OCS-APIRequest': 'true', Accept: 'application/json' }
			if (etag) cabecalhos['If-None-Match'] = etag
			const r = await fetch(URL, { headers: cabecalhos, credentials: 'same-origin' })
			if (r.status === 304) return
			if (!r.ok) return
			etag = r.headers.get('ETag')
			const dados = await r.json()
			const lista = (dados.ocs && dados.ocs.data ? dados.ocs.data : []).filter((n) => n.app === 'spreed')
			let novas = 0
			lista.forEach((n) => {
				if (!vistas.has(n.notification_id)) {
					vistas.add(n.notification_id)
					novas++
				}
			})
			pendentes = lista.length
			atualizaBadge()
			if (novas > 0 && !primeira) bip()
			if (pendentes > 0) piscar()
			else pararPiscar()
			primeira = false
		} catch (e) { /* tenta de novo no próximo ciclo */ }
	}

	// Ao voltar para a aba, para de piscar; o Talk dispensa o aviso ao ler a conversa.
	window.addEventListener('focus', () => { pararPiscar(); setTimeout(verificar, 1500) })
	document.addEventListener('visibilitychange', () => { if (ativa()) { pararPiscar(); setTimeout(verificar, 1500) } })

	// Pede permissão para avisos do navegador (barra de tarefas) no primeiro clique.
	document.addEventListener('click', function pedir() {
		document.removeEventListener('click', pedir)
		if ('Notification' in window && Notification.permission === 'default') {
			try { Notification.requestPermission() } catch (e) { /* ignora */ }
		}
	}, { once: true })

	verificar()
	setInterval(verificar, INTERVALO)
})()
