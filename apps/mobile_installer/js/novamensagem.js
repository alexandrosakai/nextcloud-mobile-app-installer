/* Empresa Exemplo Chat: botão "Nova mensagem".
 * Abre a lista dos colegas; ao clicar num nome, abre a conversa direta com a pessoa.
 * O Talk guarda UMA só conversa direta por par de pessoas (se já existe, abre a mesma),
 * e só o administrador cria grupos.
 */
(function () {
	'use strict'

	const URL_COLEGAS = OC.generateUrl('/apps/mobile_installer/api/colegas')
	const URL_SALA = OC.generateUrl('/ocs/v2.php/apps/spreed/api/v4/room').replace('/index.php', '')
	let botao = null
	let painel = null
	let colegas = null

	function noTalk() {
		return /^\/(apps\/spreed|call)(\/|$)/.test(location.pathname)
	}

	function el(tag, css, texto) {
		const e = document.createElement(tag)
		if (css) e.style.cssText = css
		if (texto) e.textContent = texto
		return e
	}

	function fechar() {
		if (painel) { painel.remove(); painel = null }
	}

	async function abrirConversa(uid, linha) {
		linha.style.opacity = '.5'
		try {
			const r = await fetch(URL_SALA, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'OCS-APIRequest': 'true', Accept: 'application/json', requesttoken: OC.requestToken },
				body: JSON.stringify({ roomType: 1, invite: uid }),
				credentials: 'same-origin',
			})
			const j = await r.json()
			const token = j.ocs && j.ocs.data && j.ocs.data.token
			if (!token) throw new Error('sem token')
			fechar()
			try {
				window.OCA.Talk.instance.$router.push({ name: 'conversation', params: { token } })
			} catch (e) {
				location.href = OC.generateUrl('/call/' + token)
			}
		} catch (e) {
			linha.style.opacity = '1'
			alert('Não foi possível abrir a conversa agora. Tente de novo.')
		}
	}

	function desenharLista(lista, termo) {
		lista.textContent = ''
		const t = termo.trim().toLowerCase()
		const achados = (colegas || []).filter((c) => !t || c.nome.toLowerCase().includes(t) || c.setor.toLowerCase().includes(t))
		if (!achados.length) {
			lista.appendChild(el('div', 'padding:16px;color:#777;text-align:center', colegas ? 'Ninguém encontrado.' : 'Carregando…'))
			return
		}
		achados.forEach((c) => {
			const linha = el('div', 'display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;cursor:pointer')
			linha.onmouseenter = () => { linha.style.background = 'rgba(0,235,89,.18)' }
			linha.onmouseleave = () => { linha.style.background = '' }
			const foto = el('img', 'width:40px;height:40px;border-radius:50%;flex:none;background:#ccc')
			foto.src = OC.generateUrl('/avatar/' + encodeURIComponent(c.uid) + '/64')
			foto.alt = ''
			const textos = el('div', 'min-width:0')
			textos.appendChild(el('div', 'font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', c.nome))
			if (c.setor) textos.appendChild(el('div', 'font-size:12px;opacity:.65', c.setor))
			linha.append(foto, textos)
			linha.onclick = () => abrirConversa(c.uid, linha)
			lista.appendChild(linha)
		})
	}

	async function abrir() {
		fechar()
		painel = el('div', 'position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:12px')
		painel.onclick = (ev) => { if (ev.target === painel) fechar() }
		const caixa = el('div', 'width:min(420px,100%);max-height:80vh;display:flex;flex-direction:column;background:var(--color-main-background,#fff);color:var(--color-main-text,#222);border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.4);overflow:hidden')
		const topo = el('div', 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px')
		topo.appendChild(el('div', 'font-size:18px;font-weight:700', 'Nova conversa'))
		const x = el('button', 'border:0;background:transparent;font-size:22px;cursor:pointer;color:inherit', '✕')
		x.setAttribute('aria-label', 'Fechar')
		x.onclick = fechar
		topo.appendChild(x)
		const busca = el('input', 'box-sizing:border-box;width:calc(100% - 32px);margin:6px 16px 10px;padding:10px 12px;border:2px solid #2563eb;border-radius:10px;font-size:15px;background:transparent;color:inherit')
		busca.type = 'search'
		busca.placeholder = 'Digite o nome da pessoa'
		const lista = el('div', 'overflow-y:auto;padding:0 8px 12px')
		caixa.append(topo, busca, lista)
		painel.appendChild(caixa)
		document.body.appendChild(painel)
		busca.focus()
		busca.oninput = () => desenharLista(lista, busca.value)
		document.addEventListener('keydown', function esc(ev) {
			if (ev.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc) }
		})
		desenharLista(lista, '')
		if (!colegas) {
			try {
				const r = await fetch(URL_COLEGAS, { headers: { 'OCS-APIRequest': 'true', Accept: 'application/json' }, credentials: 'same-origin' })
				colegas = await r.json()
			} catch (e) { colegas = [] }
			if (painel) desenharLista(lista, busca.value)
		}
	}

	function atualizaBotao() {
		if (!noTalk()) {
			if (botao) { botao.remove(); botao = null }
			return
		}
		if (botao) return
		const pequeno = window.innerWidth < 900
		botao = el('button', 'position:fixed;z-index:2000;border:0;cursor:pointer;background:#2563eb;color:#000;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3)')
		botao.title = 'Começar uma conversa com um colega'
		if (pequeno) {
			botao.style.cssText += ';right:14px;bottom:88px;width:52px;height:52px;border-radius:50%;font-size:22px'
			botao.textContent = '✉'
		} else {
			botao.style.cssText += ';left:215px;top:9px;height:32px;padding:0 14px;border-radius:16px;font-size:14px'
			botao.textContent = '✉ Nova conversa'
		}
		botao.onclick = abrir
		document.body.appendChild(botao)
	}

	window.addEventListener('app:nova-conversa', abrir)
	setInterval(atualizaBotao, 1000)
	window.addEventListener('resize', () => { if (botao) { botao.remove(); botao = null } })
})()
