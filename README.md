# 📱 nextcloud-mobile-app-installer

**App para Nextcloud que mostra, na tela de login, um botão com o passo a passo para instalar o aplicativo de chat no celular (Android e iPhone).**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Nextcloud](https://img.shields.io/badge/Nextcloud-35--40-0082C9?logo=nextcloud&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?logo=php&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

Reduza o suporte do dia a dia: em vez de explicar como instalar o app no celular, deixe o próprio Nextcloud guiar o usuário.

## ✨ Funcionalidades

- **Botão de instalação** exibido na tela de login do Nextcloud
- **Passo a passo** separado para Android e iPhone
- **Atalhos na tela inicial** e abertura de nova conversa a partir do app
- **Sem dependências extras**: PHP + JavaScript puro, no padrão de apps do Nextcloud
- Inclui `config/config.example.php`, um **modelo de configuração do Nextcloud sem valores sensíveis** (campos marcados `CHANGE_ME`)

## 🧰 Tecnologias

![PHP](https://img.shields.io/badge/PHP-777BB4?logo=php&logoColor=white)
![Nextcloud](https://img.shields.io/badge/Nextcloud-0082C9?logo=nextcloud&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)

PHP · API de apps do Nextcloud · JavaScript puro · CSS

## 📋 Requisitos

- Nextcloud 35 a 40 (conforme `appinfo/info.xml`)
- Acesso de administrador ao servidor (para copiar o app e usar o `occ`)
- Para o teste em Docker: Docker e Docker Compose v2

## 🚀 Instalação

### Com Docker (para experimentar)

```bash
git clone https://github.com/alexandrosakai/nextcloud-mobile-app-installer.git
cd nextcloud-mobile-app-installer
cp .env.example .env        # defina NEXTCLOUD_ADMIN_PASSWORD
docker compose up -d
```

Aguarde cerca de um minuto (instalação automática com SQLite) e habilite o app:

```bash
docker compose exec -u www-data nextcloud php occ app:enable mobile_installer
```

Abra `http://127.0.0.1:8080/login` (porta definida por `NEXTCLOUD_PORT`).

### Em um Nextcloud existente (sem Docker)

```bash
sudo cp -r apps/mobile_installer /var/www/nextcloud/apps/
sudo chown -R www-data:www-data /var/www/nextcloud/apps/mobile_installer
sudo -u www-data php /var/www/nextcloud/occ app:enable mobile_installer
```

## ⚙️ Configuração

- **Logo**: não há imagens neste repositório. Coloque a sua em `apps/mobile_installer/img/` com o nome `PLACEHOLDER-LOGO.png` (veja `IMAGENS-LEIA-ME.txt`).
- **Textos e links** de instalação: ajuste em `apps/mobile_installer/js/` e `apps/mobile_installer/lib/Controller/` (os nomes e endereços `Empresa Exemplo` e `example.com` são exemplos).
- **`config/config.example.php`** é só uma referência para comparar com o seu `config/config.php`. Não o substitua diretamente: gere senhas e chaves próprias com o instalador do Nextcloud.

## 🧭 Como usar

Depois de habilitado, o botão aparece automaticamente na tela de login. O usuário toca nele e segue as instruções para Android ou iPhone.

## 📁 Estrutura de pastas

```
nextcloud-mobile-app-installer/
├── apps/mobile_installer/
│   ├── appinfo/           # info.xml e rotas
│   ├── lib/               # controladores PHP
│   ├── js/  css/  img/    # interface
├── config/config.example.php
├── docker-compose.yml     # Nextcloud de teste com o app montado
└── .env.example
```

## 🗺️ Roadmap

- [ ] Textos traduzidos pelo sistema de tradução do Nextcloud
- [ ] Página de configuração para o administrador (sem editar código)
- [ ] Publicação na loja de apps do Nextcloud
- [ ] Testes automatizados

## 🤝 Como contribuir

1. Faça um fork e crie uma branch: `git checkout -b minha-melhoria`
2. Teste em um Nextcloud de desenvolvimento (o `docker-compose.yml` já serve)
3. Abra um Pull Request descrevendo a mudança

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
