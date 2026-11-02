/* Empresa Exemplo Chat: tela inicial do Conversas.
 * - destaca o botão "Nova conversa" (conversa direta com um colega)
 * - tira os botões antigos (Iniciar reunião agora, Nova conversa/Novo grupo, Entrar na conversa, Verificar dispositivos)
 * - mostra a logo do Empresa Exemplo e os atalhos dos aplicativos
 */
(function () {
	'use strict'

	const URL_APPS = OC.generateUrl('/apps/mobile_installer/api/apps')
	let apps = null
	let buscando = false

	function el(tag, cls, texto) {
		const e = document.createElement(tag)
		if (cls) e.className = cls
		if (texto) e.textContent = texto
		return e
	}

	async function carregarApps() {
		if (apps || buscando) return
		buscando = true
		try {
			const r = await fetch(URL_APPS, { headers: { 'OCS-APIRequest': 'true', Accept: 'application/json' }, credentials: 'same-origin' })
			apps = await r.json()
		} catch (e) { apps = null }
		buscando = false
	}

	function blocoAtalhos(bloco) {
		const grade = bloco.querySelector('.app-atalhos')
		grade.textContent = ''
		;(apps || []).forEach((a) => {
			const link = el('a', 'app-atalho')
			link.href = a.href
			const icone = el('span', 'app-atalho__icone')
			const marca = el('span', 'app-atalho__marca')
			marca.style.webkitMaskImage = marca.style.maskImage = 'url("' + a.icone + '")'
			icone.appendChild(marca)
			link.append(icone, el('span', 'app-atalho__nome', a.nome))
			grade.appendChild(link)
		})
	}

	function montar() {
		// ícone "+" da lista de conversas (reserva para navegadores sem :has no CSS)
		document.querySelectorAll('.chat-plus-outline-icon').forEach((i) => {
			const a = i.closest('.action-item')
			if (a) a.style.display = 'none'
		})
		const wrapper = document.querySelector('.talk-dashboard-wrapper')
		if (!wrapper) return
		const menu = wrapper.querySelector('.talk-dashboard__menu')

		if (menu) {
			if (!menu.querySelector('#app-nova-conversa')) {
				const botao = el('button', 'app-nova-conversa', '✉  Nova conversa')
				botao.id = 'app-nova-conversa'
				botao.type = 'button'
				botao.onclick = () => window.dispatchEvent(new Event('app:nova-conversa'))
				const titulo = menu.querySelector('.talk-dashboard__header')
				titulo ? titulo.after(botao) : menu.prepend(botao)
			}
		}

		if (!wrapper.querySelector('#app-inicio')) {
			const bloco = el('div', 'app-inicio')
			bloco.id = 'app-inicio'
			bloco.append(el('div', 'app-logo'), el('div', 'app-atalhos'))
			wrapper.appendChild(bloco)
			if (apps) blocoAtalhos(bloco)
		}
		const bloco = wrapper.querySelector('#app-inicio')
		if (apps === null) {
			carregarApps().then(() => { if (apps) blocoAtalhos(bloco) })
		}
	}

	setInterval(montar, 700)
})()
