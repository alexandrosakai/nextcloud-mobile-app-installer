/* Empresa Exemplo Chat — botão e instruções de instalação do app na tela de login */
(function () {
	'use strict'

	// Já está aberto como app instalado: não mostra nada
	const instalado = window.matchMedia('(display-mode: standalone)').matches
		|| window.matchMedia('(display-mode: minimal-ui)').matches
		|| window.navigator.standalone === true
	if (instalado) {
		return
	}

	const ua = navigator.userAgent
	const ehIphone = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	const ehAndroid = /Android/.test(ua)

	let promptInstalacao = null
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault()
		promptInstalacao = e
		const botaoAgora = document.getElementById('app-instalar-agora')
		if (botaoAgora) {
			botaoAgora.hidden = false
		}
	})

	const passosAndroid = `
		<li>Abra o <strong>Chrome</strong> e entre em <strong>chat.example.com</strong></li>
		<li>Toque nos <strong>3 pontinhos ⋮</strong> no canto superior direito</li>
		<li>Toque em <strong>“Instalar app”</strong> ou <strong>“Adicionar à tela inicial”</strong></li>
		<li>Confirme. O ícone verde <strong>Empresa Exemplo Chat</strong> aparece na tela do celular</li>`

	const passosIphone = `
		<li>Abra o <strong>Safari</strong> (precisa ser o Safari) e entre em <strong>chat.example.com</strong></li>
		<li>Toque no botão <strong>Compartilhar</strong> (quadrado com a seta para cima ⬆️)</li>
		<li>Role e toque em <strong>“Adicionar à Tela de Início”</strong> e depois em <strong>“Adicionar”</strong></li>
		<li>Abra o app pelo <strong>ícone novo</strong> e faça o login lá dentro</li>`

	function secao(id, titulo, passos, aberta) {
		return `<details class="app-instalar__sistema" id="${id}"${aberta ? ' open' : ''}>
			<summary>${titulo}</summary>
			<ol>${passos}</ol>
		</details>`
	}

	function montar() {
		// Fica logo abaixo da caixa de login (fora do componente Vue do login)
		const conteudo = document.querySelector('.guest-content')
		const rodape = document.querySelector('footer.guest-box')
		if ((!conteudo && !rodape) || document.getElementById('app-instalar')) {
			return
		}

		const caixa = document.createElement('div')
		caixa.id = 'app-instalar'
		caixa.className = 'guest-box app-instalar'
		caixa.innerHTML = `
			<button type="button" class="app-instalar__abrir" aria-expanded="false" aria-controls="app-instalar-painel">
				📲 Instalar o app Empresa Exemplo Chat no celular
			</button>
			<div class="app-instalar__painel" id="app-instalar-painel" hidden>
				<button type="button" class="app-instalar__agora" id="app-instalar-agora" hidden>
					Instalar agora
				</button>
				${secao('app-android', '🤖 Android', passosAndroid, ehAndroid || !ehIphone)}
				${secao('app-iphone', '🍎 iPhone', passosIphone, ehIphone || !ehAndroid)}
				<p class="app-instalar__dica">
					🔔 Depois de instalar, entre no app, toque no <strong>sininho</strong> e permita as notificações
					para receber as mensagens mesmo com o app fechado.
				</p>
			</div>`
		if (conteudo) {
			conteudo.appendChild(caixa)
		} else {
			rodape.parentNode.insertBefore(caixa, rodape)
		}

		const abrir = caixa.querySelector('.app-instalar__abrir')
		const painel = caixa.querySelector('.app-instalar__painel')
		abrir.addEventListener('click', () => {
			painel.hidden = !painel.hidden
			abrir.setAttribute('aria-expanded', String(!painel.hidden))
		})

		const agora = caixa.querySelector('#app-instalar-agora')
		agora.hidden = promptInstalacao === null
		agora.addEventListener('click', async () => {
			if (!promptInstalacao) {
				return
			}
			promptInstalacao.prompt()
			await promptInstalacao.userChoice
			promptInstalacao = null
			agora.hidden = true
		})
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', montar)
	} else {
		montar()
	}
})()
